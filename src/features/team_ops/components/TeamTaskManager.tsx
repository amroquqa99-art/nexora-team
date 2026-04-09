import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, LayoutGrid } from "lucide-react";

const phaseLabels = {
    request: { ar: "طلبات جديدة", en: "New Requests", color: "border-l-orange-500 bg-orange-500/5 text-orange-400" },
    planning: { ar: "قيد التخطيط", en: "Planning", color: "border-l-amber-500 bg-amber-500/5 text-amber-400" },
    production: { ar: "قيد التنفيذ", en: "Operations", color: "border-l-orange-400 bg-orange-500/5 text-orange-400" },
    review: { ar: "تم الإنجاز", en: "Mission Success", color: "border-l-emerald-500 bg-emerald-500/5 text-emerald-400" },
    completed: { ar: "مكتمل", en: "Completed", color: "border-l-emerald-500 bg-emerald-500/5 text-emerald-400" }
};

interface TeamTaskManagerProps {
    teamMemberId: string;
    isSupervisor: boolean;
    overrideClientId?: string | null;
}

const TeamTaskManager = ({ teamMemberId, isSupervisor, overrideClientId }: TeamTaskManagerProps) => {
    const { lang } = useLanguage();
    const { toast } = useToast();
    const qc = useQueryClient();

    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDesc, setNewTaskDesc] = useState("");
    const [assignedClientId, setAssignedClientId] = useState<string | null>(null);
    const [assignedMemberId, setAssignedMemberId] = useState<string>(teamMemberId);

    const { data: members = [] } = useQuery({
        queryKey: ["team_members_list_kanban"],
        queryFn: async () => {
            const { data } = await supabase.from("team_members").select("id, user_id, name_ar, name_en");
            return data || [];
        }
    });

    const { data: clients = [] } = useQuery({
        queryKey: ["all_clients_list_kanban"],
        queryFn: async () => {
            const { data } = await (supabase as any).from("profiles").select("id, full_name, company");
            return data || [];
        }
    });

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ["kanban_projects", isSupervisor, teamMemberId, overrideClientId],
        queryFn: async () => {
            let query = supabase.from("client_projects").select("*, client:profiles(full_name, company)").order("created_at", { ascending: false });
            if (overrideClientId) {
                query = query.eq("client_id", overrideClientId);
            }
            const { data } = await query;
            const mapped = (data || []).map((p: any) => ({
                ...p,
                assigned_team: (p.assigned_team as any[]) || []
            }));

            if (overrideClientId) return mapped;
            if (isSupervisor) return mapped;

            return mapped.filter((p: any) => {
                return p.assigned_team.includes(teamMemberId) || p.client_id === teamMemberId;
            });
        }
    });

    const assignMutation = useMutation({
        mutationFn: async ({ projectId, memberIds }: { projectId: string, memberIds: string[] }) => {
            const { error } = await supabase.from("client_projects").update({ assigned_team: memberIds }).eq("id", projectId);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["kanban_projects"] });
            toast({ title: "تم تحديث الأعضاء" });
        }
    });

    const phaseMutation = useMutation({
        mutationFn: async ({ projectId, phase }: { projectId: string, phase: string }) => {
            const { error } = await supabase.from("client_projects").update({ phase }).eq("id", projectId);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["kanban_projects"] });
        }
    });

    const createTaskMutation = useMutation({
        mutationFn: async () => {
            const finalClientId = overrideClientId || assignedClientId;
            if (!finalClientId && !isSupervisor) {
                toast({ title: lang === "ar" ? "برجاء اختيار عميل" : "Specify Client", variant: "destructive" });
                return;
            }

            const { error } = await supabase.from("client_projects").insert({
                title: newTaskTitle,
                description: newTaskDesc,
                phase: "planning",
                status: "pending",
                client_id: finalClientId || "00000000-0000-0000-0000-000000000000",
                assigned_team: [assignedMemberId],
            });
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["kanban_projects"] });
            toast({ title: "تم إنشاء المهمة بنجاح" });
            setIsAddingTask(false);
            setNewTaskTitle("");
            setNewTaskDesc("");
            setAssignedClientId(null);
            setAssignedMemberId(teamMemberId);
        }
    });

    if (isLoading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" /></div>;

    return (
        <div className="space-y-6 h-full flex flex-col pt-2 animate-in fade-in duration-700">
            <div className="flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                    <LayoutGrid className="w-6 h-6 text-orange-500" />
                    {lang === "ar" ? "لوحة المهام (Kanban)" : "Mission Control"}
                </h2>

                <div className="flex items-center gap-3">
                    {!isAddingTask && (
                        <button onClick={() => setIsAddingTask(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest border border-orange-500/20">
                            <Plus className="w-4 h-4" />
                            {isSupervisor ? (lang === "ar" ? "مشروع / مهمة جديدة" : "New Project/Task") : (lang === "ar" ? "مهمة شخصية جديدة" : "New Personal Task")}
                        </button>
                    )}
                </div>
            </div>

            {isAddingTask && (
                <div className="glass-card p-6 border-orange-500/30">
                    <input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="عنوان المهمة" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 mb-3 outline-none text-sm focus:border-orange-500/50" />
                    <textarea value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} rows={2} placeholder="وصف المهمة" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 mb-3 outline-none text-sm resize-none focus:border-orange-500/50" />

                    {isSupervisor && !overrideClientId && (
                        <select
                            value={assignedClientId || ""}
                            onChange={(e) => setAssignedClientId(e.target.value || null)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-3 outline-none text-sm focus:border-orange-500/50 cursor-pointer text-muted-foreground"
                        >
                            <option value="">-- {lang === 'ar' ? 'مهام داخلية (بدون عميل)' : 'Internal / No Client'} --</option>
                            {clients.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.full_name} ({c.company || 'فردي'})</option>
                            ))}
                        </select>
                    )}

                    {isSupervisor && (
                        <select
                            value={assignedMemberId}
                            onChange={(e) => setAssignedMemberId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4 outline-none text-sm focus:border-orange-500/50 cursor-pointer text-muted-foreground"
                        >
                            <option value={teamMemberId}>-- {lang === 'ar' ? 'إسناد لنفسي' : 'Assign to Me'} --</option>
                            {members.filter(m => m.id !== teamMemberId).map((m: any) => (
                                <option key={m.id} value={m.id}>{lang === 'ar' ? m.name_ar : m.name_en}</option>
                            ))}
                        </select>
                    )}

                    <div className="flex gap-2 justify-end">
                        <button onClick={() => setIsAddingTask(false)} className="px-4 py-2 rounded-lg text-xs font-bold bg-white/5">إلغاء</button>
                        <button onClick={() => createTaskMutation.mutate()} disabled={!newTaskTitle} className="px-4 py-2 rounded-lg text-xs font-bold bg-orange-500 text-white disabled:opacity-50">إنشاء مهمة</button>
                    </div>
                </div>
            )}

            <div className="flex gap-6 overflow-x-auto pb-4 flex-1 items-start min-h-[500px]">
                {Object.entries(phaseLabels).map(([phaseKey, phaseInfo]) => {
                    const colProjects = projects.filter((p: any) => p.phase === phaseKey);
                    return (
                        <div key={phaseKey} className="w-80 shrink-0 bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden flex flex-col h-full max-h-[80vh]">
                            <div className="p-4 bg-black/40 border-b border-white/5 sticky top-0 z-10 flex items-center justify-between">
                                <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border-l-2 ${phaseInfo.color}`}>
                                    {lang === "ar" ? phaseInfo.ar : phaseInfo.en}
                                </span>
                                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-muted-foreground">{colProjects.length}</span>
                            </div>

                            <div className="p-4 space-y-4 overflow-y-auto flex-1 scrollbar-hide">
                                {colProjects.map((project: any) => (
                                    <div key={project.id} className="bg-black/60 border border-white/5 rounded-2xl p-5 hover:border-orange-500/30 transition-colors group relative cursor-pointer shadow-lg">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                                                <span className="text-[8px] font-black text-orange-500">C</span>
                                            </div>
                                            <span className="text-xs font-bold text-muted-foreground">{project.client?.full_name || (lang === "ar" ? "مهمة داخلية" : "Internal")}</span>
                                        </div>

                                        <h4 className="font-bold text-sm text-foreground mb-2 leading-tight group-hover:text-orange-400 transition-colors">{project.title}</h4>
                                        {project.description && <p className="text-[10px] text-muted-foreground/80 line-clamp-2 mb-4 leading-relaxed">{project.description}</p>}

                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div className="flex -space-x-2">
                                                {project.assigned_team.slice(0, 3).map((tid: string, i: number) => {
                                                    const m = members.find(mx => mx.id === tid);
                                                    return (
                                                        <div key={tid} className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-black flex items-center justify-center z-10" title={m?.name_ar || "عضو"} style={{ zIndex: 10 - i }}>
                                                            <span className="text-[8px] font-black text-white">{(m?.name_ar || m?.name_en || "M")[0]}</span>
                                                        </div>
                                                    )
                                                })}
                                                {project.assigned_team.length === 0 && (
                                                    <span className="text-[10px] text-muted-foreground/50 italic px-2">غير مسندة</span>
                                                )}
                                            </div>

                                            {isSupervisor && (
                                                <div className="flex items-center gap-2 relative z-20">
                                                    <select
                                                        className="appearance-none bg-orange-500/10 text-orange-500 text-[10px] font-bold px-2 py-1 rounded-md border border-orange-500/20 cursor-pointer outline-none"
                                                        onChange={(e) => {
                                                            if (e.target.value === "") return;
                                                            const current = project.assigned_team || [];
                                                            const target = e.target.value;
                                                            let updated = [];
                                                            if (current.includes(target)) updated = current.filter((id: string) => id !== target);
                                                            else updated = [...current, target];
                                                            assignMutation.mutate({ projectId: project.id, memberIds: updated });
                                                            e.target.value = "";
                                                        }}
                                                    >
                                                        <option value="">⚙️ إسناد</option>
                                                        {members.map(m => (
                                                            <option key={m.id} value={m.id}>{project.assigned_team.includes(m.id) ? "✓ " : ""}{m.name_ar}</option>
                                                        ))}
                                                    </select>
                                                    <select
                                                        className="appearance-none bg-white/5 text-muted-foreground hover:text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/10 cursor-pointer outline-none"
                                                        value={project.phase}
                                                        onChange={(e) => phaseMutation.mutate({ projectId: project.id, phase: e.target.value })}
                                                    >
                                                        {Object.keys(phaseLabels).map(k => <option key={k} value={k}>{phaseLabels[k as keyof typeof phaseLabels].ar}</option>)}
                                                    </select>
                                                </div>
                                            )}

                                            {!isSupervisor && (
                                                <select
                                                    className="appearance-none bg-white/5 text-muted-foreground hover:text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/10 cursor-pointer outline-none"
                                                    value={project.phase}
                                                    onChange={(e) => phaseMutation.mutate({ projectId: project.id, phase: e.target.value })}
                                                >
                                                    {Object.keys(phaseLabels).map(k => <option key={k} value={k}>{phaseLabels[k as keyof typeof phaseLabels].ar}</option>)}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default TeamTaskManager;
