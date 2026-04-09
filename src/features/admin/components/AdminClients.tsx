import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, AlertTriangle, Lightbulb,
  ChevronDown, ChevronRight, Loader2, Clock,
  CheckCircle, XCircle, Eye, Zap, Building, Mail, Phone,
  Rocket, Target, Activity, CheckCircle2, GripVertical, MessageCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragEndEvent,
  useDroppable
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  message_type: string;
  service_type: string | null;
  status: string;
  created_at: string;
  company: string | null;
  phone: string | null;
}

interface ClientProject {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  phase: string;
  progress: number;
  service_type: string | null;
  created_at: string;
}

// â”€â”€â”€ Pipeline phases â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const pipelinePhases = [
  { key: "waiting", dbKey: "queued", label: "Deployment", icon: Rocket },
  { key: "planning", dbKey: "planning", label: "Planning", icon: Target },
  { key: "working", dbKey: "production", label: "Operations", icon: Activity },
  { key: "completed", dbKey: "delivery", label: "Mission Success", icon: CheckCircle2 },
] as const;

const normalizePhase = (phase: string): string => {
  if (phase === "queued" || phase === "waiting" || phase === "request") return "waiting";
  if (phase === "production" || phase === "working") return "working";
  if (phase === "delivery" || phase === "completed") return "completed";
  return phase || "waiting";
};

const toDbPhase = (uiPhase: string): string => {
  const map: Record<string, string> = {
    waiting: "queued", planning: "planning", working: "production", completed: "delivery"
  };
  return map[uiPhase] || uiPhase;
};

// â”€â”€â”€ Droppable column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DroppableColumn = ({ phaseKey, children }: { phaseKey: string; children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `droppable-${phaseKey}` });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-4 min-h-[120px] p-3 rounded-2xl border border-dashed transition-all duration-100 ${isOver ? "border-orange-500/50 bg-orange-500/5" : "border-white/5 bg-white/[0.01]"}`}
    >
      {children}
    </div>
  );
};

// â”€â”€â”€ Sortable Mini Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MiniProjectCard = ({ project }: { project: ClientProject }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={`bg-[#0a0a0a] border border-white/5 p-4 rounded-2xl border-white/5 bg-white/[0.03] hover:border-orange-500/30 transition-all duration-100 group ${isDragging ? "ring-1 ring-orange-500" : ""}`}>
      <div className="flex items-start gap-2">
        <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-1 text-white/20 hover:text-orange-500 transition-colors mt-0.5">
          <GripVertical className="w-3 h-3" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-white uppercase tracking-tight leading-tight truncate group-hover:text-orange-500 transition-colors">{project.title}</p>
          {project.service_type && (
            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">{project.service_type.replace(/_/g, " ")}</p>
          )}
          <div className="mt-2 w-full bg-white/5 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${project.progress || 0}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// â”€â”€â”€ Client Pipeline (embedded) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ClientPipeline = ({ clientId }: { clientId: string }) => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery<ClientProject[]>({
    queryKey: ["client_mini_pipeline", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_projects")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const phaseMutation = useMutation({
    mutationFn: async ({ id, phase }: { id: string; phase: string }) => {
      const { error } = await supabase.from("client_projects").update({ phase: toDbPhase(phase) }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, phase }) => {
      await qc.cancelQueries({ queryKey: ["client_mini_pipeline", clientId] });
      const previous = qc.getQueryData<ClientProject[]>(["client_mini_pipeline", clientId]);
      qc.setQueryData(["client_mini_pipeline", clientId], (old: ClientProject[] | undefined) =>
        old?.map(p => p.id === id ? { ...p, phase } : p)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      qc.setQueryData(["client_mini_pipeline", clientId], context?.previous);
      toast({ title: "Failed to update phase", variant: "destructive" });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["client_mini_pipeline", clientId] }),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const projectId = active.id as string;
    let newPhase = (over.id as string).replace("droppable-", "");

    // If over a card, find its phase
    if (!pipelinePhases.some(p => p.key === newPhase)) {
      const overProject = projects.find(p => p.id === over.id);
      if (overProject) newPhase = normalizePhase(overProject.phase);
    }

    if (pipelinePhases.some(p => p.key === newPhase)) {
      const project = projects.find(p => p.id === projectId);
      if (project && normalizePhase(project.phase) !== newPhase) {
        phaseMutation.mutate({ id: projectId, phase: newPhase });
        toast({ title: `âœ“ Moved to ${newPhase}` });
      }
    }
  };

  if (isLoading) return <div className="py-6 flex justify-center"><Loader2 className="w-5 h-5 text-orange-500/40 animate-spin" /></div>;
  if (projects.length === 0) return (
    <div className="py-6 text-center opacity-30">
      <Zap className="w-6 h-6 mx-auto mb-2 text-orange-500/40" />
      <p className="text-xs font-black uppercase tracking-widest">No Projects Yet</p>
    </div>
  );

  const groups = pipelinePhases.reduce<Record<string, ClientProject[]>>((acc, p) => {
    acc[p.key] = projects.filter(proj => normalizePhase(proj.phase) === p.key);
    return acc;
  }, { waiting: [], planning: [], working: [], completed: [] });

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {pipelinePhases.map(phase => {
          const cols = groups[phase.key] || [];
          return (
            <div key={phase.key}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <phase.icon className="w-3 h-3 text-orange-500/60" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{phase.label}</span>
                <span className="text-[10px] text-white/20 ml-auto">{cols.length}</span>
              </div>
              <SortableContext id={phase.key} items={cols.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <DroppableColumn phaseKey={phase.key}>
                  {cols.map(project => (
                    <MiniProjectCard key={project.id} project={project} />
                  ))}
                  {cols.length === 0 && (
                    <div className="flex items-center justify-center py-4 opacity-20">
                      <phase.icon className="w-5 h-5" />
                    </div>
                  )}
                </DroppableColumn>
              </SortableContext>
            </div>
          );
        })}
      </div>
    </DndContext>
  );
};

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type TabKey = "requests" | "complaints" | "suggestions";

const AdminClients = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("requests");
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null);

  // Fetch all contact messages
  const { data: messages = [], isLoading } = useQuery<ContactMessage[]>({
    queryKey: ["admin_all_messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch profiles to get pipeline data per client
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin_profiles_for_clients"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, email, full_name, client_type, phone, company");
      return data || [];
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_all_messages"] });
      toast({ title: "âœ“ Status updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Group requests by email (for requests tab)
  const clientGroups = useMemo(() => {
    const requests = messages.filter(m => m.message_type === "request");
    const map = new Map<string, { messages: ContactMessage[]; profile: typeof profiles[0] | undefined }>();
    requests.forEach(msg => {
      if (!map.has(msg.email)) {
        map.set(msg.email, {
          messages: [],
          profile: profiles.find(p => p.email === msg.email),
        });
      }
      map.get(msg.email)!.messages.push(msg);
    });
    return Array.from(map.entries()).map(([email, data]) => ({ email, ...data }));
  }, [messages, profiles]);

  const complaints = messages.filter(m => m.message_type === "complaint");
  const suggestions = messages.filter(m => m.message_type === "suggestion");

  const tabs = [
    { key: "requests" as TabKey, label: "Requests", icon: Users, count: clientGroups.length },
    { key: "complaints" as TabKey, label: "Complaints", icon: AlertTriangle, count: complaints.length },
    { key: "suggestions" as TabKey, label: "Suggestions", icon: Lightbulb, count: suggestions.length },
  ];

  const statusColors: Record<string, string> = {
    pending: "text-orange-400 bg-orange-500/10",
    in_review: "text-amber-400 bg-amber-500/10",
    approved: "text-emerald-400 bg-emerald-500/10",
    rejected: "text-rose-400 bg-rose-500/10",
    completed: "text-emerald-400 bg-emerald-500/10",
  };

  const statusIcons: Record<string, React.ElementType> = {
    pending: Clock, in_review: Eye, approved: CheckCircle, rejected: XCircle, completed: CheckCircle,
  };

  if (isLoading) return (
    <div className="flex justify-center py-40">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
    </div>
  );

  return (
    <div className="space-y-10  duration-100 font-outfit">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/5 pb-10">
        <div className="flex items-center gap-3 text-orange-500">
          <Users className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-[0.5em]">Client Intelligence Hub</span>
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Clients & Pipeline</h2>
        <p className="text-white/30 font-bold italic border-s-2 border-orange-500/20 ps-4">
          All client requests, organized by submission. Drag project cards to update their phase.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-3 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-100 border ${activeTab === tab.key
              ? "bg-orange-500/10 border-orange-500/40 text-orange-500"
              : "border-white/5 bg-white/[0.02] text-white/40 hover:text-white hover:border-white/10"
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.key ? "bg-orange-500/20" : "bg-white/5"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* â”€â”€ REQUESTS TAB â”€â”€ */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          {clientGroups.length === 0 && (
            <div className="text-center py-24 opacity-20">
              <Users className="w-16 h-16 mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest">No Requests Yet</p>
            </div>
          )}
          {clientGroups.map(({ email, messages: clientMsgs, profile }) => {
            const isExpanded = expandedEmail === email;
            const isPipelineExpanded = expandedPipeline === email;
            const isRepeat = clientMsgs.length > 1 || profile?.client_type === "contract";
            const latestMsg = clientMsgs[0];

            return (
              <div key={email} className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden border-white/5 bg-white/[0.02]">
                {/* Client Header */}
                <div
                  className="flex flex-col md:flex-row md:items-center justify-between p-8 gap-6 cursor-pointer group hover:bg-white/[0.02] transition-all"
                  onClick={() => setExpandedEmail(isExpanded ? null : email)}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-black text-white uppercase tracking-tight">{latestMsg.name}</h3>
                        {isRepeat && (
                          <span className="text-[9px] bg-orange-500/20 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                            Monthly Retainer
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-white/30 font-bold">
                        <a href={`mailto:${email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 hover:text-orange-500 transition-colors relative z-10"><Mail className="w-3 h-3 text-orange-500" />{email}</a>
                        {latestMsg.phone && latestMsg.phone !== 'N/A' && (
                            <a 
                                href={`https://wa.me/${latestMsg.phone.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 hover:text-emerald-500 transition-colors relative z-10"
                            >
                                <MessageCircle className="w-3 h-3 text-emerald-500" />{latestMsg.phone}
                            </a>
                        )}
                        {latestMsg.company && <span className="flex items-center gap-1"><Building className="w-3 h-3 text-white/20" />{latestMsg.company}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ms-auto md:ms-0">
                    <span className="text-xs bg-white/5 px-3 py-1.5 rounded-full font-black text-white/30 uppercase tracking-widest">
                      {clientMsgs.length} {clientMsgs.length === 1 ? "Request" : "Requests"}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-white/20 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-8 space-y-4 border-t border-white/5 pt-6">
                        {/* Requests list */}
                        {clientMsgs.map(msg => {
                          const StatusIcon = statusIcons[msg.status] || Clock;
                          const statusColor = statusColors[msg.status] || statusColors.pending;
                          return (
                            <div key={msg.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-orange-500/20 transition-all group">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    {msg.service_type && (
                                      <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-orange-500/20">
                                        {msg.service_type.replace(/_/g, " ")}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">
                                      {new Date(msg.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-white/60 leading-relaxed italic">"{msg.message}"</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${statusColor}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {msg.status}
                                  </span>
                                  <select
                                    value={msg.status}
                                    onChange={e => statusMutation.mutate({ id: msg.id, status: e.target.value })}
                                    className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/10 text-white/40 focus:outline-none focus:border-orange-500"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="in_review">In Review</option>
                                    <option value="approved">Approved</option>
                                    <option value="completed">Completed</option>
                                    <option value="rejected">Rejected</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Pipeline toggle */}
                        {profile?.id && (
                          <div className="pt-4 border-t border-white/5">
                            <button
                              onClick={() => setExpandedPipeline(isPipelineExpanded ? null : email)}
                              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-500/60 hover:text-orange-500 transition-colors"
                            >
                              <Rocket className="w-4 h-4" />
                              Project Pipeline
                              <ChevronRight className={`w-4 h-4 transition-transform ${isPipelineExpanded ? "rotate-90" : ""}`} />
                            </button>
                            <AnimatePresence>
                              {isPipelineExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <ClientPipeline clientId={profile.id} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* â”€â”€ COMPLAINTS TAB â”€â”€ */}
      {activeTab === "complaints" && (
        <div className="space-y-4">
          {complaints.length === 0 && (
            <div className="text-center py-24 opacity-20">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest">No Complaints</p>
            </div>
          )}
          {complaints.map(msg => {
            const StatusIcon = statusIcons[msg.status] || Clock;
            const statusColor = statusColors[msg.status] || statusColors.pending;
            return (
              <div key={msg.id} className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] border-white/5 bg-white/[0.02] hover:border-rose-500/20 transition-all">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      </span>
                      <div>
                        <p className="font-black text-white text-sm uppercase tracking-tight">{msg.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                            <a href={`mailto:${msg.email}`} onClick={(e) => e.stopPropagation()} className="text-[10px] text-white/30 font-bold hover:text-orange-500 transition-colors flex items-center gap-1 relative z-10"><Mail size={10}/> {msg.email}</a>
                            {msg.phone && msg.phone !== 'N/A' && (
                                <a 
                                    href={`https://wa.me/${msg.phone.replace(/\D/g, '')}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[10px] text-white/30 font-bold hover:text-emerald-500 transition-colors flex items-center gap-1 relative z-10"
                                >
                                    <MessageCircle size={10}/> {msg.phone}
                                </a>
                            )}
                        </div>
                      </div>
                      <span className="ms-auto text-[10px] text-white/20 font-black uppercase tracking-widest">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed italic border-s-2 border-rose-500/20 ps-4">"{msg.message}"</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${statusColor}`}>
                      <StatusIcon className="w-3 h-3" />
                      {msg.status}
                    </span>
                    <select
                      value={msg.status}
                      onChange={e => statusMutation.mutate({ id: msg.id, status: e.target.value })}
                      className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/10 text-white/40 focus:outline-none focus:border-orange-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_review">In Review</option>
                      <option value="approved">Resolved</option>
                      <option value="rejected">Dismissed</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* â”€â”€ SUGGESTIONS TAB â”€â”€ */}
      {activeTab === "suggestions" && (
        <div className="space-y-4">
          {suggestions.length === 0 && (
            <div className="text-center py-24 opacity-20">
              <Lightbulb className="w-16 h-16 mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest">No Suggestions</p>
            </div>
          )}
          {suggestions.map(msg => {
            const StatusIcon = statusIcons[msg.status] || Clock;
            const statusColor = statusColors[msg.status] || statusColors.pending;
            return (
              <div key={msg.id} className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] border-white/5 bg-white/[0.02] hover:border-orange-500/20 transition-all">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-orange-400" />
                      </span>
                      <div>
                        <p className="font-black text-white text-sm uppercase tracking-tight">{msg.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                            <a href={`mailto:${msg.email}`} onClick={(e) => e.stopPropagation()} className="text-[10px] text-white/30 font-bold hover:text-orange-500 transition-colors flex items-center gap-1 relative z-10"><Mail size={10}/> {msg.email}</a>
                            {msg.phone && msg.phone !== 'N/A' && (
                                <a 
                                    href={`https://wa.me/${msg.phone.replace(/\D/g, '')}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[10px] text-white/30 font-bold hover:text-emerald-500 transition-colors flex items-center gap-1 relative z-10"
                                >
                                    <MessageCircle size={10}/> {msg.phone}
                                </a>
                            )}
                        </div>
                      </div>
                      <span className="ms-auto text-[10px] text-white/20 font-black uppercase tracking-widest">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed italic border-s-2 border-orange-500/20 ps-4">"{msg.message}"</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${statusColor}`}>
                      <StatusIcon className="w-3 h-3" />
                      {msg.status}
                    </span>
                    <select
                      value={msg.status}
                      onChange={e => statusMutation.mutate({ id: msg.id, status: e.target.value })}
                      className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/10 text-white/40 focus:outline-none focus:border-orange-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_review">In Review</option>
                      <option value="approved">Acknowledged</option>
                      <option value="rejected">Dismissed</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminClients;

