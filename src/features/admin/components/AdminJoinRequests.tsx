import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Eye, Clock, CheckCircle, XCircle, UserPlus, Loader2, Mail, Phone, ExternalLink, MessageCircle, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminJoinRequests = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin_join_requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("join_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("join_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_join_requests"] }); toast({ title: "âœ“ STATUS_UPDATED" }); },
  });

  const acceptAndAddToTeam = useMutation({
    mutationFn: async (request: { id: string; name: string; specialty: string }) => {
      const { error: updateError } = await supabase.from("join_requests").update({ status: "accepted" }).eq("id", request.id);
      if (updateError) throw updateError;

      const { error: insertError } = await supabase.from("team_members").insert({
        name_ar: request.name,
        name_en: request.name,
        role_ar: request.specialty,
        role_en: request.specialty,
        is_active: true,
        display_order: 0,
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_join_requests"] });
      qc.invalidateQueries({ queryKey: ["admin_team"] });
      qc.invalidateQueries({ queryKey: ["team_members"] });
      toast({ title: "âœ“ RECRUITMENT_FINALIZED", description: "Member added to active roster." });
    },
    onError: (e: Error) => toast({ title: "SYNC_ERROR", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("join_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_join_requests"] }); toast({ title: "âœ“ SCRUBBED" }); },
  });

  const statusColors: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "Pending", color: "text-amber-500 bg-amber-500/10", icon: Clock },
    reviewed: { label: "Reviewed", color: "text-orange-500 bg-orange-500/10", icon: Eye },
    accepted: { label: "Inducted", color: "text-emerald-500 bg-emerald-500/10", icon: CheckCircle },
    rejected: { label: "Terminated", color: "text-rose-500 bg-rose-500/10", icon: XCircle },
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8  duration-100 font-outfit">
      <div className="flex flex-col gap-4 mb-10">
        <div className="flex items-center gap-3 text-orange-500">
          <UserPlus className="w-5 h-5 fill-current" />
          <span className="text-xs font-black uppercase tracking-[0.5em]">Recruitment Protocols</span>
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Candidate Evaluation Center</h2>
        <p className="text-white/30 font-bold italic border-l-2 border-orange-500/20 pl-4">Review and authorize background transmissions from prospective operatives.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {requests.map((r) => {
          const cfg = statusColors[r.status] || statusColors.pending;
          const StatusIcon = cfg.icon;

          return (
            <div key={r.id} className="bg-[#0a0a0a] border border-white/5 p-8 transition-all duration-100 group relative overflow-hidden border-white/5 bg-white/[0.01] hover:bg-white/[0.03]">
              <div className="flex flex-col lg:flex-row items-start justify-between gap-8 relative z-10">
                <div className="flex-1 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-orange-500/50 transition-all shadow-2xl">
                      <UserPlus className="w-8 h-8 text-white/20 group-hover:text-orange-500 transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tighter uppercase group-hover: transition-all">{r.name}</h3>
                      <div className="flex flex-wrap items-center gap-6 mt-2">
                        <a 
                            href={`mailto:${r.email}`}
                            className="flex items-center gap-2 text-xs text-white/30 font-bold uppercase tracking-widest hover:text-orange-500 transition-colors group/link"
                        >
                          <Mail size={14} className="text-orange-500 group-hover/link:scale-110 transition-transform" />
                          {r.email}
                        </a>
                        {r.phone && (
                            <a 
                                href={`https://wa.me/${r.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-white/30 font-bold uppercase tracking-widest hover:text-emerald-500 transition-colors group/link"
                            >
                              <MessageCircle size={14} className="text-emerald-500 group-hover/link:scale-110 transition-transform" />
                              {r.phone}
                            </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/5 ">
                      <p className="text-xs font-black text-white/20 uppercase tracking-widest mb-2 italic">Applicant Specialty</p>
                      <p className="text-lg font-black text-white uppercase tracking-tight">{r.specialty}</p>
                    </div>
                    {r.portfolio_url && (
                      <div className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/5 ">
                        <p className="text-xs font-black text-white/20 uppercase tracking-widest mb-2 italic">Asset Portfolio</p>
                        <a href={r.portfolio_url} target="_blank" className="text-sm font-black text-orange-500 hover:text-amber-500 transition-colors flex items-center gap-2 uppercase tracking-widest">
                          REVIEW EXTERNAL <ExternalLink size={14} />
                        </a>
                      </div>
                    )}
                  </div>

                  {r.message && (
                    <div className="relative">
                      <MessageCircle size={16} className="absolute -left-6 top-1 text-orange-500/20" />
                      <p className="text-base text-white/60 leading-relaxed italic border-l-2 border-orange-500/20 pl-6 ml-1 bg-white/[0.02] p-4 rounded-r-2xl">"{r.message}"</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-[10px] text-white/20 font-black uppercase tracking-widest font-mono">
                    <Clock size={12} />
                    TRANSMISSION_LOGGED: {new Date(r.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:w-72">
                  <div className="hidden lg:flex justify-end mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-lg border border-current  ${cfg.color}`}>
                      <StatusIcon className="w-3.5 h-3.5 mr-2 inline" />
                      {cfg.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => updateStatus.mutate({ id: r.id, status: "reviewed" })}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-white/5 hover:bg-orange-500/10 text-white/40 hover:text-orange-500 text-xs font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all active:scale-95"
                    >
                      <Eye size={16} /> Mark Reviewed
                    </button>
                    <button
                      onClick={() => acceptAndAddToTeam.mutate(r)}
                      disabled={r.status === "accepted"}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all disabled:opacity-30 disabled:grayscale active:scale-95 "
                    >
                      <UserPlus size={16} /> Finalize Recruitment
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateStatus.mutate({ id: r.id, status: "pending" })}
                      className="flex-1 px-4 py-2 bg-black/20 hover:bg-white/5 text-white/20 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                    >
                      Reset Protocol
                    </button>
                    <button
                      onClick={() => { if (confirm("SCRUB APPLICATION RECORD?")) deleteMutation.mutate(r.id); }}
                      className="p-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500/50 hover:text-white rounded-xl border border-rose-500/10 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-orange-500 to-amber-600 opacity-20 transition-all duration-100 w-0 group-hover:w-full`} />
            </div>
          );
        })}

        {requests.length === 0 && !isLoading && (
          <div className="py-40 text-center bg-[#0a0a0a] border border-white/5 border-white/5 bg-white/5 rounded-[4rem]">
            <ShieldCheck className="w-16 h-16 text-white/5 mx-auto mb-8" />
            <p className="text-white/20 font-black uppercase tracking-[0.5em] text-sm italic">Application Buffer Empty</p>
            <p className="text-xs text-white/10 mt-4 font-mono uppercase tracking-widest">No recruitment transmissions detected in processing buffers.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminJoinRequests;

