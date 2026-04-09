import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, Check, X, Trash2, MessageSquare, ShieldCheck, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminReviews = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin_reviews"],
    queryFn: async () => {
      const { data } = await supabase.from("client_reviews").select("*, profiles(full_name, email), client_projects(title)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, is_approved }: { id: string; is_approved: boolean }) => {
      const { error } = await supabase.from("client_reviews").update({ is_approved }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_reviews"] }); toast({ title: "Protocol Updated", description: "Verification status committed." }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("client_reviews").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_reviews"] }); toast({ title: "Record Purged" }); },
  });

  return (
    <div className="space-y-8  duration-100 font-outfit">
      <div className="flex flex-col gap-4 mb-10">
        <div className="flex items-center gap-3 text-orange-500">
          <Star className="w-5 h-5 fill-current" />
          <span className="text-xs font-black uppercase tracking-[0.5em]">Reputation Management Protocol</span>
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Client Testimony Archive</h2>
        <p className="text-white/30 font-bold italic border-l-2 border-orange-500/20 pl-4">Validate and authorize public-facing endorsements and project feedback.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reviews.map((r: any) => (
          <div key={r.id} className={`bg-[#0a0a0a] border border-white/5 p-8 transition-all duration-100 group relative overflow-hidden ${r.is_approved ? "border-emerald-500/20 bg-emerald-500/[0.02]" : "border-amber-500/20 bg-amber-500/[0.02]"}`}>
            <div className="flex flex-col md:flex-row items-start justify-between gap-8">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${r.is_approved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    <ShieldCheck className="w-6 h-6" />
                    <button
                      onClick={() => { }}
                      className="group flex items-center gap-2 px-6 py-2.5 bg-white text-black font-black text-xs tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all uppercase"
                    >
                    </button>
                    <p className="text-xs text-white/30 font-bold uppercase tracking-widest">{r.client_projects?.title || "Operational Feedback"}</p>
                  </div>
                </div>

                <div className="flex gap-1 py-1">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-4 h-4 ${r.rating >= s ? "text-orange-500 fill-orange-500" : "text-white/10"}`} />)}
                </div>

                <p className="text-lg text-white/70 italic font-medium leading-relaxed bg-black/20 p-6 rounded-2xl border border-white/5 ">
                  "{r.review_text}"
                </p>

                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-2 text-white/20">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Universal Resource Locator (URL)</label>
                      <span className="text-xs font-mono">{new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Platform Identity</label>
                    </div>
                  </div>
                  <span className={`text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest flex items-center gap-2 border border-current/20 ${r.is_approved ? "text-emerald-500 bg-emerald-500/10" : "text-amber-500 bg-amber-500/10"}`}>
                    {r.is_approved ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {r.is_approved ? "VALIDATED & LIVE" : "AWAITING AUTHORIZATION"}
                  </span>
                </div>
              </div>

              <div className="flex md:flex-col gap-2">
                {!r.is_approved ? (
                  <button onClick={() => updateMutation.mutate({ id: r.id, is_approved: true })} className="p-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-2xl border border-emerald-500/20 transition-all duration-100 group/btn" title="Validate">
                    <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                ) : (
                  <button onClick={() => updateMutation.mutate({ id: r.id, is_approved: false })} className="p-4 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white rounded-2xl border border-amber-500/20 transition-all duration-100 group/btn" title="Revoke">
                    <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                )}
                <button onClick={() => { if (confirm("DECOMMISSION RECORD? This action is permanent.")) deleteMutation.mutate(r.id); }} className="p-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500/50 hover:text-white rounded-2xl border border-rose-500/20 transition-all duration-100 group/btn">
                  <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && !isLoading && (
          <div className="py-40 text-center bg-[#0a0a0a] border border-white/5 border-white/5 bg-white/5 rounded-[4rem]">
            <MessageSquare className="w-16 h-16 text-white/5 mx-auto mb-8" />
            <p className="text-white/20 font-black uppercase tracking-[0.5em] text-sm italic">Transmission Silence</p>
            <p className="text-[10px] text-white/10 mt-4 font-mono uppercase tracking-widest">No client testimonies currently registered in the database.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;

