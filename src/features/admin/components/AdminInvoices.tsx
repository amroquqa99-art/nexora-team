import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, FileText, Loader2, DollarSign, Clock, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Database } from "@/integrations/supabase/types";

const AdminInvoices = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Database["public"]["Tables"]["invoices"]["Row"] | any | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["admin_invoices"],
    queryFn: async () => {
      const { data } = await supabase.from("invoices").select("*, profiles(full_name, email), client_projects(title)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["admin_clients_for_inv"],
    queryFn: async () => { const { data } = await supabase.from("profiles").select("id, full_name, email").order("full_name"); return data || []; },
  });

  const { data: clientProjects = [] } = useQuery({
    queryKey: ["admin_client_projects_for_inv"],
    queryFn: async () => { const { data } = await supabase.from("client_projects").select("id, title, client_id").order("title"); return data || []; },
  });

  const saveMutation = useMutation({
    mutationFn: async (inv: any) => {
      const { id, profiles, client_projects, ...rest } = inv;
      if (id) {
        const { error } = await supabase.from("invoices").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("invoices").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_invoices"] }); setEditing(null); toast({ title: "âœ“ TRANSACTION_COMMITTED" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("invoices").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_invoices"] }); toast({ title: "âœ“ RECORD_PURGED" }); },
  });

  const statusColors: Record<string, any> = {
    draft: { label: "Awaiting Ops", color: "text-white/20 bg-white/5", icon: Clock },
    sent: { label: "Transmitted", color: "text-amber-500 bg-amber-500/10", icon: DollarSign },
    paid: { label: "Authorized", color: "text-emerald-500 bg-emerald-500/10", icon: CheckCircle },
    overdue: { label: "Fiscal Breach", color: "text-rose-500 bg-rose-500/10", icon: AlertCircle },
    cancelled: { label: "Decommissioned", color: "text-white/20 bg-white/5", icon: X },
  };

  return (
    <div className="space-y-8  duration-100 font-outfit">
      <div className="flex flex-col gap-4 mb-10">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-orange-500">
              <DollarSign className="w-5 h-5 fill-current" />
              <span className="text-xs font-black uppercase tracking-[0.5em]">Fiscal Operations Command</span>
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Financial Settlement Manifest</h2>
          </div>
          {!editing && (
            <button onClick={() => setEditing({ client_id: "", project_id: null, invoice_number: "", amount: 0, currency: "USD", status: "draft", due_date: "", notes: "", items: [] })}
              className="group flex items-center gap-2 px-8 py-3 bg-white text-black font-black text-xs tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all uppercase active:scale-95">
              <Plus className="w-4 h-4" /> New Invoice
            </button>
          )}
        </div>
        <p className="text-white/30 font-bold italic border-l-2 border-orange-500/20 pl-4">Manage fiscal transfers, generate authorizations, and monitor liquidity flow across all sectors.</p>
      </div>

      {editing && (
        <div className="bg-[#0a0a0a] border border-white/5 p-10 border-orange-500/20 bg-orange-500/[0.02] relative overflow-hidden mb-12">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <div className="w-1.5 h-6 bg-orange-500" />
              {editing.id ? "Alter Fiscal Record" : "Initiate Authorization"}
            </h3>
            <button onClick={() => setEditing(null)} className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all"><X className="w-6 h-6" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-white/20 uppercase tracking-widest ml-1">Assigned Client</label>
              <select value={editing.client_id || ""} onChange={e => setEditing({ ...editing, client_id: e.target.value })} className="w-full px-4 py-4 rounded-xl bg-[#0a0a0a] border border-white/10 text-white text-sm font-black focus:outline-none focus:border-orange-500/50 appearance-none transition-all uppercase">
                <option value="" className="bg-midnight-950">SELECT ENTITY</option>
                {clients.map((c: any) => <option key={c.id} value={c.id} className="bg-midnight-950">{c.full_name?.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-white/20 uppercase tracking-widest ml-1">Operational Sector</label>
              <select value={editing.project_id || ""} onChange={e => setEditing({ ...editing, project_id: e.target.value || null })} className="w-full px-4 py-4 rounded-xl bg-[#0a0a0a] border border-white/10 text-white text-sm font-black focus:outline-none focus:border-orange-500/50 appearance-none transition-all uppercase">
                <option value="" className="bg-midnight-950">NO ATTACHED PROJECT</option>
                {clientProjects.filter((cp: any) => !editing.client_id || cp.client_id === editing.client_id).map((cp: any) => <option key={cp.id} value={cp.id} className="bg-midnight-950">{cp.title?.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-white/20 uppercase tracking-widest ml-1">Protocol Identifier</label>
              <input placeholder="INV-00X-TACTICAL" value={editing.invoice_number || ""} onChange={e => setEditing({ ...editing, invoice_number: e.target.value })} className="w-full px-4 py-4 rounded-xl bg-[#0a0a0a] border border-white/10 text-white text-sm font-black focus:outline-none focus:border-orange-500/50 transition-all uppercase tracking-widest" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-white/20 uppercase tracking-widest ml-1">Asset Value</label>
                <input type="number" placeholder="0.00" value={editing.amount || ""} onChange={e => setEditing({ ...editing, amount: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-4 rounded-xl bg-[#0a0a0a] border border-white/10 text-white text-sm font-black focus:outline-none focus:border-orange-500/50 transition-all tabular-nums" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-white/20 uppercase tracking-widest ml-1">Currency Unit</label>
                <select value={editing.currency || "USD"} onChange={e => setEditing({ ...editing, currency: e.target.value })} className="w-full px-4 py-4 rounded-xl bg-[#0a0a0a] border border-white/10 text-white text-sm font-black focus:outline-none focus:border-orange-500/50 appearance-none transition-all">
                  <option value="USD">USD</option><option value="SAR">SAR</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-white/20 uppercase tracking-widest ml-1">Verification Status</label>
              <select value={editing.status || "draft"} onChange={e => setEditing({ ...editing, status: e.target.value })} className="w-full px-4 py-4 rounded-xl bg-[#0a0a0a] border border-white/10 text-white text-sm font-black focus:outline-none focus:border-orange-500/50 appearance-none transition-all uppercase">
                <option value="draft">AWAITING OPS</option><option value="sent">TRANSMITTED</option><option value="paid">AUTHORIZED</option><option value="overdue">FISCAL BREACH</option><option value="cancelled">DECOMMISSIONED</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-white/20 uppercase tracking-widest ml-1">Deadline Date</label>
              <input type="date" value={editing.due_date?.split("T")[0] || ""} onChange={e => setEditing({ ...editing, due_date: e.target.value ? new Date(e.target.value).toISOString() : null })} className="w-full px-4 py-4 rounded-xl bg-[#0a0a0a] border border-white/10 text-white text-sm font-black focus:outline-none focus:border-orange-500/50 transition-all invert brightness-110" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black text-white/20 uppercase tracking-widest ml-1">Mission Notes</label>
              <textarea placeholder="LOG TRANSACTION PARAMETERS OR TERMS..." value={editing.notes || ""} onChange={e => setEditing({ ...editing, notes: e.target.value })} className="w-full px-4 py-4 rounded-2xl bg-[#0a0a0a] border border-white/10 text-white text-sm italic font-bold focus:outline-none focus:border-orange-500/50 transition-all resize-none leading-relaxed" rows={3} />
            </div>
          </div>
          <div className="mt-10 flex justify-end gap-4">
            <button onClick={() => setEditing(null)} className="px-8 py-3 rounded-xl text-xs font-black tracking-widest text-white/20 hover:text-white uppercase transition-all">Abort</button>
            <button onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending} className="px-12 py-3 bg-orange-500 text-white rounded-xl text-xs font-black tracking-widest hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all uppercase disabled:opacity-50 active:scale-95">Commit Authorization</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {invoices.map((inv: any) => {
          const cfg = statusColors[inv.status] || statusColors.draft;
          const StatusIcon = cfg.icon;

          return (
            <div key={inv.id} className="bg-[#0a0a0a] border border-white/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-100 group rounded-3xl">
              <div className="flex items-center gap-6 flex-1 w-full md:w-auto">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-orange-500/50 transition-all ">
                  <FileText className="w-7 h-7 text-white/20 group-hover:text-orange-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4">
                    <p className="font-black text-white text-xl tracking-tighter uppercase group-hover: transition-all">{inv.invoice_number || `INV-${inv.id.slice(0, 8).toUpperCase()}`}</p>
                    <span className={`text-xs px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5 border border-current/20 ${cfg.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 mt-1">
                    <p className="text-xs text-white/30 font-bold uppercase tracking-widest">{inv.profiles?.full_name}</p>
                    <div className="h-3 w-px bg-white/5 hidden sm:block" />
                    <p className="text-xs text-orange-500 font-black tabular-nums tracking-widest">{inv.currency} {Number(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 md:mt-0 self-end md:self-auto">
                <button onClick={() => setEditing({ ...inv })} className="p-3 bg-white/5 hover:bg-white/10 text-white/20 hover:text-white rounded-xl border border-white/5 transition-all">
                  <Pencil className="w-5 h-5" />
                </button>
                <button onClick={() => { if (confirm("TERMINATE FISCAL RECORD?")) deleteMutation.mutate(inv.id); }} className="p-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500/50 hover:text-white rounded-xl border border-rose-500/10 transition-all">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
        {invoices.length === 0 && !isLoading && (
          <div className="py-40 text-center bg-[#0a0a0a] border border-white/5 border-white/5 bg-white/5 rounded-[4rem]">
            <ShieldCheck className="w-16 h-16 text-white/5 mx-auto mb-8" />
            <p className="text-white/20 font-black uppercase tracking-[0.5em] text-sm italic">Fiscal Silence</p>
            <p className="text-xs text-white/10 mt-4 font-mono uppercase tracking-widest">No active financial settlements detect in processing buffers.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInvoices;

