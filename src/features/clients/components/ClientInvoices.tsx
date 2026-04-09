import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { FileText } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "text-muted-foreground bg-muted", sent: "text-orange-400 bg-orange-500/10",
  paid: "text-emerald-400 bg-emerald-500/10", overdue: "text-rose-400 bg-rose-500/10", cancelled: "text-muted-foreground bg-muted",
};

const ClientInvoices = ({ userId }: { userId: string }) => {
  const { lang } = useLanguage();
  const { data: invoices = [] } = useQuery({
    queryKey: ["client_invoices", userId],
    queryFn: async () => { const { data } = await supabase.from("invoices").select("*").eq("client_id", userId).order("created_at", { ascending: false }); return data || []; },
  });

  return (
    <div>
      <div className="flex items-center gap-3 text-orange-500 mb-2">
        <FileText className="w-4 h-4 fill-current" />
        <span className="text-[10px] font-black uppercase tracking-[0.5em]">Financial Records</span>
      </div>
      <h2 className="text-xl font-black text-foreground tracking-tighter uppercase mb-6">{lang === "ar" ? "الفواتير" : "Invoices Terminal"}</h2>
      {invoices.length === 0 && <p className="text-muted-foreground text-center py-12">{lang === "ar" ? "لا توجد فواتير" : "No invoices yet"}</p>}
      <div className="space-y-3">
        {invoices.map((inv: any) => (
          <div key={inv.id} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-orange-500" /><div><p className="font-semibold text-foreground">{inv.invoice_number || `INV-${inv.id.slice(0, 8)}`}</p><p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</p></div></div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[inv.status] || ""}`}>{inv.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-foreground">{inv.currency} {Number(inv.amount).toFixed(2)}</p>
              {inv.due_date && <p className="text-xs text-muted-foreground">{lang === "ar" ? "الاستحقاق:" : "Due:"} {new Date(inv.due_date).toLocaleDateString()}</p>}
            </div>
            {inv.notes && <p className="text-sm text-muted-foreground mt-2">{inv.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientInvoices;
