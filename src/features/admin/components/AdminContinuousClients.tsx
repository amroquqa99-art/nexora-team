import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, Target, Activity, CheckCircle2,
    User, Building, Search, Plus, MoreVertical,
    Calendar, Clock, LayoutGrid, Briefcase, MessageSquare, ArrowLeft,
    GripVertical, ShieldCheck, Zap, Rocket, Globe, Loader2
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    useDroppable,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Project = Database["public"]["Tables"]["client_projects"]["Row"];

const projectPhases = [
    { key: "waiting", label: { ar: "قيد الانتظار", en: "Deployment" }, color: "orange", icon: Rocket },
    { key: "planning", label: { ar: "التخطيط", en: "Concept & Plan" }, color: "amber", icon: Target },
    { key: "working", label: { ar: "تحت العمل", en: "Operations" }, color: "orange", icon: Activity },
    { key: "completed", label: { ar: "منجز", en: "Mission Success" }, color: "emerald", icon: CheckCircle2 }
] as const;

import { memo, useMemo } from "react";

const normalizeRetainerPhase = (phase: string): string => {
    if (!phase) return "waiting";
    if (phase === "queued" || phase === "waiting" || phase === "request") return "waiting";
    if (phase === "production" || phase === "working") return "working";
    if (phase === "planning") return "planning";
    if (phase === "delivery" || phase === "completed") return "completed";
    return "waiting";
};

const toDbRetainerPhase = (uiPhase: string): string => {
    const map: Record<string, string> = {
        waiting: "queued",
        planning: "planning",
        working: "production",
        completed: "delivery",
    };
    return map[uiPhase] || uiPhase;
};

const DroppableColumn = ({ phaseKey, children }: { phaseKey: string; children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({ id: `droppable-${phaseKey}` });
    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col gap-6 p-4 rounded-[3.5rem] border border-dashed min-h-[450px] transition-all duration-100 ${isOver ? "bg-orange-500/5 border-orange-500/30" : "bg-white/[0.01] border-white/5"
                }`}
        >
            {children}
        </div>
    );
};

const ProjectCard = memo(({ project }: { project: Project }) => {
    const { lang } = useLanguage();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: project.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        scale: isDragging ? 1.02 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="group/card relative z-10">
            <div className={`bg-[#0a0a0a] border border-white/5 p-6 transition-all duration-100 border-white/5 bg-white/[0.03] hover:bg-white/[0.08] hover:border-orange-500/30  rounded-[2rem] ${isDragging ? "ring-2 ring-orange-500 " : ""}`}>
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-start gap-3">
                        <div {...listeners} {...attributes} className="mt-1 cursor-grab active:cursor-grabbing p-1.5 hover:bg-white/5 rounded-lg text-white/20 hover:text-orange-500 transition-all">
                            <GripVertical className="w-4 h-4" />
                        </div>
                        <h4 className="font-black text-sm text-white uppercase tracking-tighter leading-tight group-hover/card: transition-all">{project.title}</h4>
                    </div>
                </div>

                <div className="mb-6 space-y-2">
                    <div className="flex justify-between text-xs font-black text-white/20 uppercase tracking-[0.2em]">
                        <span>Progression</span>
                        <span className="text-orange-500">{Math.floor(project.progress || 0)}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${project.progress || 0}%` }}
                            className="bg-gradient-to-r from-orange-500 to-orange-700 h-full rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs font-black uppercase tracking-widest text-white/10">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-orange-500/40" />
                        {new Date(project.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Zap className="w-2.5 h-2.5 text-amber-500" />
                        ACTIVE
                    </div>
                </div>
            </div>
        </div>
    );
});

ProjectCard.displayName = "ProjectCard";

const AdminContinuousClients = () => {
    const { lang } = useLanguage();
    const { toast } = useToast();
    const qc = useQueryClient();
    const [selectedClient, setSelectedClient] = useState<string | null>(null);

    const { data: clients = [], isLoading: clientsLoading } = useQuery<Profile[]>({
        queryKey: ["admin_continuous_clients"],
        queryFn: async () => {
            const { data, error } = await supabase.from("profiles").select("*").eq("client_type", "contract").order("created_at", { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
        queryKey: ["admin_retainer_projects", selectedClient],
        enabled: !!selectedClient,
        queryFn: async () => {
            const { data, error } = await supabase.from("client_projects").select("*").eq("client_id", selectedClient!).order("created_at", { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const groups = useMemo(() => {
        const acc: Record<string, Project[]> = { waiting: [], planning: [], working: [], completed: [] };
        projects.forEach(p => {
            const phase = normalizeRetainerPhase(p.phase);
            if (acc[phase]) acc[phase].push(p);
        });
        return acc;
    }, [projects]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const phaseMutation = useMutation({
        mutationFn: async ({ id, phase }: { id: string, phase: string }) => {
            const dbPhase = toDbRetainerPhase(phase);
            const { error } = await supabase.from("client_projects").update({ phase: dbPhase }).eq("id", id);
            if (error) throw error;
        },
        onMutate: async ({ id, phase }: { id: string, phase: string }) => {
            await qc.cancelQueries({ queryKey: ["admin_retainer_projects", selectedClient] });
            const previous = qc.getQueryData<Project[]>(["admin_retainer_projects", selectedClient]);
            qc.setQueryData(["admin_retainer_projects", selectedClient], (old: Project[] | undefined) => {
                return old?.map((p) => p.id === id ? { ...p, phase } : p);
            });
            return { previous };
        },
        onError: (err, variables, context) => {
            qc.setQueryData(["admin_retainer_projects", selectedClient], context?.previous);
            toast({ title: "Sync Interrupted", description: "Operational shift failed to commit.", variant: "destructive" });
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ["admin_retainer_projects", selectedClient] });
        }
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const projectId = active.id as string;
        // Strip the droppable- prefix from column droppables
        const overId = over.id as string;
        let newPhase = overId.startsWith("droppable-") ? overId.replace("droppable-", "") : overId;

        // If dropping over a card (not a column), resolve its phase
        if (!projectPhases.some(p => p.key === newPhase)) {
            const overProject = projects.find(p => p.id === overId);
            if (overProject) {
                newPhase = normalizeRetainerPhase(overProject.phase);
            }
        }

        if (projectPhases.some(p => p.key === newPhase)) {
            const project = projects.find(p => p.id === projectId);
            const currentNormalized = normalizeRetainerPhase(project?.phase || "");
            if (project && currentNormalized !== newPhase) {
                phaseMutation.mutate({ id: projectId, phase: newPhase });
                toast({ title: "✓ Vector Aligned", description: `Mission moved to ${newPhase.toUpperCase()}` });
            }
        }
    };

    if (clientsLoading) return (
        <div className="py-40 flex flex-col items-center justify-center gap-6">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
            <p className="text-xs font-black uppercase tracking-[0.5em] text-white/20">Accessing Partner Registry...</p>
        </div>
    );

    if (selectedClient) {
        const client = clients.find(c => c.id === selectedClient);
        return (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-100 min-h-screen font-outfit">
                <div className="flex items-center justify-between border-b border-white/5 pb-8">
                    <button
                        onClick={() => setSelectedClient(null)}
                        className="flex items-center gap-3 text-white/30 hover:text-white transition-all text-xs font-black uppercase tracking-[0.3em] bg-white/5 px-6 py-3 rounded-2xl border border-white/5 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Partner Registry
                    </button>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em] bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 " />
                            Tactical Integrity: Stable
                        </span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/[0.02] blur-[100px] pointer-events-none" />
                    <div className="w-28 h-28 rounded-[2rem] bg-orange-500/10 flex items-center justify-center border border-orange-500/20  relative z-10  group-hover:scale-105 transition-transform duration-100">
                        <Building className="w-12 h-12 text-orange-500" />
                    </div>
                    <div className="relative z-10 flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                            <span className="text-xs font-black text-orange-500 uppercase tracking-[0.5em]">Command Hub</span>
                            <div className="h-px w-8 bg-orange-500/20" />
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">{client?.full_name}</h2>
                        <div className="flex items-center justify-center md:justify-start gap-4">
                            <span className="text-xs text-white/40 font-bold italic">{client?.company || "Strategic Global Partner"}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                            <span className="text-xs font-black text-white/60 uppercase tracking-widest">{client?.email}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="text-right">
                            <p className="text-xs font-black text-white/20 uppercase tracking-widest">Active Objectives</p>
                            <p className="text-2xl font-black text-white">{projects.length}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                            <Globe className="w-6 h-6 text-white/20" />
                        </div>
                    </div>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
                        {projectPhases.map((phase) => {
                            const colProjects = groups[phase.key] || [];

                            return (
                                <div key={phase.key} className="flex flex-col gap-6 group/col">
                                    <div className="flex items-center justify-between px-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover/col:border-orange-500/30 group-hover/col:bg-orange-500/5 transition-all duration-100`}>
                                                <phase.icon className="w-5 h-5 text-white/20 group-hover/col:text-orange-500 transition-colors" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-xs uppercase tracking-tighter text-white/80 group-hover/col:text-white transition-colors">{phase.label.en}</h3>
                                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">{phase.label.ar}</p>
                                            </div>
                                        </div>
                                        <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                                            <span className="text-[10px] font-black text-white/30 tabular-nums">{colProjects.length}</span>
                                        </div>
                                    </div>

                                    <SortableContext id={phase.key} items={colProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                                        <DroppableColumn phaseKey={phase.key}>
                                            <AnimatePresence mode="popLayout">
                                                {colProjects.map(p => (
                                                    <motion.div
                                                        key={p.id}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        transition={{ duration: 0.5 }}
                                                    >
                                                        <ProjectCard project={p} />
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>

                                            {colProjects.length === 0 && (
                                                <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-5 grayscale group-hover/col:opacity-20 group-hover/col:grayscale-0 transition-all duration-100">
                                                    <phase.icon className="w-12 h-12 mb-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">Standby</span>
                                                </div>
                                            )}
                                        </DroppableColumn>
                                    </SortableContext>
                                </div>
                            );
                        })}
                    </div>
                </DndContext>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-100 font-outfit">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-orange-500">
                        <Briefcase className="w-5 h-5 fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em]">Active Retainer Grid</span>
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        Strategy Hub
                    </h2>
                    <p className="text-white/30 font-bold italic border-l-2 border-orange-500/20 pl-4">Advanced portfolio management for continuous high-value partnerships.</p>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/20 bg-white/5 border border-white/10 px-8 py-4 rounded-[2rem]">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" /> PARTNERS: {clients.length}</div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> HEALTH: OPTIMAL</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {clients.map((client) => (
                    <div
                        key={client.id}
                        onClick={() => setSelectedClient(client.id)}
                        className="bg-[#0a0a0a] border border-white/5 p-10 bg-white/[0.02] hover:bg-orange-500/[0.03] border-white/5 hover:border-orange-500/20 transition-all duration-100 cursor-pointer group relative overflow-hidden rounded-[3rem] shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-100 scale-150 group-hover:scale-[1.75] group-hover:rotate-12 transition-transform">
                            <Building className="w-32 h-32" />
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:border-orange-500/40 group-hover:scale-110 transition-all duration-100 ">
                                <Building className="w-8 h-8 text-orange-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter group-hover: transition-all duration-100">{client.full_name}</h3>
                                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest leading-none mt-1">{client.company || "Strategic Client"}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-6 py-4 px-6 rounded-3xl bg-[#0a0a0a] border border-white/5 text-xs font-black text-white/40 uppercase tracking-[0.2em] group-hover:text-orange-500 group-hover:border-orange-500/20 transition-all duration-100 ">
                                <LayoutGrid className="w-4 h-4" />
                                Portfolio Access
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">
                                <span className="group-hover:text-white/20 transition-colors">EST. RETAINER 2024</span>
                                <div className="h-px flex-1 mx-4 bg-white/5" />
                                <ArrowLeft className="w-3 h-3 rotate-180 group-hover:translate-x-2 transition-transform duration-100" />
                            </div>
                        </div>
                    </div>
                ))}

                {clients.length === 0 && (
                    <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-[4rem] bg-white/[0.01] flex flex-col items-center justify-center gap-6 ">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                            <Briefcase className="w-10 h-10 text-white/10" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-white/20 font-black uppercase tracking-[0.5em] text-xs leading-none">{lang === "ar" ? "لا ينوجد شركاء حاليين" : "Registry Null State"}</p>
                            <p className="text-xs text-white/10 font-bold italic">Awaiting strategic partner onboarding protocol.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminContinuousClients;

