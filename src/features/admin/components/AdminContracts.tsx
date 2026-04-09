import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, FileText, Shield, Clock, CheckCircle, AlertOctagon, FileSignature } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Database } from "@/integrations/supabase/types";
import { type Database } from "@/integrations/supabase/types";

const AdminContracts = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Database["public"]["Tables"]["contracts"]["Row"] | any | null>(null);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["admin_contracts"],
    queryFn: async () => {
      const { data } = await supabase.from("contracts").select("*, profiles(full_name, email), client_projects(title)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["admin_clients_for_contracts"],
    queryFn: async () => { const { data } = await supabase.from("profiles").select("id, full_name").order("full_name"); return data || []; },
  });

  const { data: clientProjects = [] } = useQuery({
    queryKey: ["admin_client_projects_for_contracts"],
    queryFn: async () => { const { data } = await supabase.from("client_projects").select("id, title, client_id").order("title"); return data || []; },
  });

  const saveMutation = useMutation({
    mutationFn: async (c: any) => {
      const { id, profiles, client_projects, ...rest } = c;
      if (id) {
        const { error } = await supabase.from("contracts").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contracts").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_contracts"] }); setEditing(null); toast({ title: "âœ“ FRAMEWORK_SYNCED" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("contracts").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_contracts"] }); toast({ title: "âœ“ RECORD_SCRUBBED" }); },
  });

  const statusColors: Record<string, any> = {
    draft: { label: "Draft Protocol", color: "text-white/20 bg-white/5", icon: Clock },
    sent: { label: "Transmitted", color: "text-amber-500 bg-amber-500/10", icon: FileText },
    active: { label: "Binding Roster", color: "text-emerald-500 bg-emerald-500/10", icon: CheckCircle },
    expired: { label: "Deactivated", color: "text-rose-500 bg-rose-500/10", icon: AlertOctagon },
  };

  return (
    <div className="space-y-8  duration-100 font-outfit">
      <div className="flex flex-col gap-4 mb-10">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-orange-500">
              <Shield className="w-5 h-5 fill-current" />
              <span className="text-xs font-black uppercase tracking-[0.5em]">Legal Framework Terminal</span>
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Contractual Agreement Archive</h2>
          </div>
          {!editing && (
            <button onClick={() => setEditing({ client_id: "", project_id: null, title: "", content: "", status: "draft" })}
              className="group flex items-center gap-2 px-8 py-3 bg-white text-black font-black text-xs tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all uppercase active:scale-95">
              <Plus className="w-4 h-4" /> New Contract
            </button>
          )}
        </div>
        <p className="text-white/30 font-bold italic border-l-2 border-orange-500/20 pl-4">Define operational boundaries, service-level agreements, and binding engagement protocols.</p>
      </div>

      {editing && (
        <div className="bg-[#0a0a0a] border border-white/5 p-10 border-orange-500/20 bg-orange-500/[0.02] relative overflow-hidden mb-12">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <div className="w-1.5 h-6 bg-orange-500" />
              {editing.id ? "Alter Framework" : "Initiate Agreement"}
            </h3>
            <button onClick={() => setEditing(null)} className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all"><X className="w-6 h-6" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-white/20 uppercase tracking-widest ml-1">Counterparty Entity</label>
              <select value={editing.client_id || ""} onChange={e => setEditing({ ...editing, client_id: e.target.value })} className="w-full px-4 py-4 rounded-xl bg-[#0a0a0a] border border-white/10 text-white text-sm font-black focus:outline-none focus:border-orange-500/50 appearance-none transition-all uppercase">
                <option value="" className="bg-midnight-950">SELECT ENTITY</option>
                {clients.map((c: any) => <option key={c.id} value={c.id} className="bg-midnight-950">{c.full_name?.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-white/20 uppercase tracking-widest ml-1">Mission Context</label>
              <select value={editing.project_id || ""} onChange={e => setEditing({ ...editing, project_id: e.target.value || null })} className="w-full px-4 py-4 rounded-xl bg-[#0a0a0a] border border-white/10 text-white text-sm font-black focus:outline-none focus:border-orange-500/50 appearance-none transition-all uppercase">
                <option value="" className="bg-midnight-950">NO ATTACHED PROJECT</option>
                {clientProjects.filter((cp: any) => !editing.client_id || cp.client_id === editing.client_id).map((cp: any) => <option key={cp.id} value={cp.id} className="bg-midnight-950">{cp.title?.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black text-white/20 uppercase tracking-widest ml-1">Agreement Designation</label>
              <input placeholder="E.G., MASTER SERVICES AGREEMENT - TIER 01" value={editing.title || ""} onChange={e => setEditing({ ...editing, title: e.target.value })} className="w-full px-4 py-4 rounded-xl bg-[#0a0a0a] border border-white/10 text-white text-sm font-black focus:outline-none focus:border-orange-500/50 transition-all uppercase tracking-widest" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-white/20 uppercase tracking-widest ml-1">Lifecycle Status</label>
              <select value={editing.status || "draft"} onChange={e => setEditing({ ...editing, status: e.target.value })} className="w-full px-4 py-4 rounded-xl bg-[#0a0a0a] border border-white/10 text-white text-sm font-black focus:outline-none focus:border-orange-500/50 appearance-none transition-all uppercase">
                <option value="draft">DRAFT PROTOCOL</option><option value="sent">TRANSMITTED</option><option value="active">BINDING ROSTER</option><option value="expired">DEACTIVATED</option>
              </select>
            </div>
          </div>
          <div className="mt-8 space-y-2">
            <label className="text-xs font-black text-white/20 uppercase tracking-widest ml-1">Contractual Clauses</label>
            <textarea placeholder="DEFINE TERMS, LIABILITIES, AND MILESTONES..." value={editing.content || ""} onChange={e => setEditing({ ...editing, content: e.target.value })}
              className="w-full px-8 py-8 rounded-[2rem] bg-[#0a0a0a] border border-white/10 text-white text-sm font-bold italic focus:outline-none focus:border-orange-500/50 transition-all resize-none  leading-relaxed" rows={10} />
          </div>
          <div className="mt-10 flex justify-end gap-4">
            <button onClick={() => setEditing(null)} className="px-8 py-3 rounded-xl text-xs font-black tracking-widest text-white/20 hover:text-white uppercase transition-all">Abort</button>
            <button onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending} className="px-12 py-3 bg-orange-500 text-white rounded-xl text-xs font-black tracking-widest hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all uppercase disabled:opacity-50 active:scale-95">Lock Agreement</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {contracts.map((c: any) => {
          const cfg = statusColors[c.status] || statusColors.draft;
          const StatusIcon = cfg.icon;

          return (
            <div key={c.id} className="bg-[#0a0a0a] border border-white/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-100 group rounded-3xl">
              <div className="flex items-center gap-6 flex-1 w-full md:w-auto">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-orange-500/50 transition-all ">
                  <FileSignature className="w-7 h-7 text-white/20 group-hover:text-orange-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4">
                    <p className="font-black text-white text-xl tracking-tighter uppercase group-hover: transition-all truncate">{c.title}</p>
                    <span className={`hidden sm:flex text-xs px-3 py-1 rounded-full font-black uppercase tracking-widest items-center gap-1.5 border border-current/20 ${cfg.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 mt-1">
                    <p className="text-xs text-white/30 font-bold uppercase tracking-widest">{c.profiles?.full_name}</p>
                    <div className="h-3 w-px bg-white/5 hidden sm:block" />
                    <p className="text-xs text-white/20 italic font-medium">{c.client_projects?.title || "Master Framework"}</p>
                    {c.signed_at && (
                      <>
                        <div className="h-3 w-px bg-white/5 hidden sm:block" />
                        <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest">Signed: {new Date(c.signed_at).toLocaleDateString()}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 md:mt-0 self-end md:self-auto">
                <button onClick={() => setEditing({ ...c })} className="p-3 bg-white/5 hover:bg-white/10 text-white/20 hover:text-white rounded-xl border border-white/5 transition-all">
                  <Pencil className="w-5 h-5" />
                </button>
                <button onClick={() => { if (confirm("SCRUB FRAMEWORK?")) deleteMutation.mutate(c.id); }} className="p-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500/50 hover:text-white rounded-xl border border-rose-500/10 transition-all">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
        {contracts.length === 0 && !isLoading && (
          <div className="py-40 text-center bg-[#0a0a0a] border border-white/5 border-white/5 bg-white/5 rounded-[4rem]">
            <FileSignature className="w-16 h-16 text-white/5 mx-auto mb-8" />
            <p className="text-white/20 font-black uppercase tracking-[0.5em] text-sm italic">Protocol Silence</p>
            <p className="text-xs text-white/10 mt-4 font-mono uppercase tracking-widest">No contractual frameworks detected in legal archive.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContracts;

