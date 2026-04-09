import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { User, Mail, Phone, Building, ArrowLeft, MessageSquareMore } from "lucide-react";
import DirectCommunication from "@/features/shared/components/DirectCommunication";
import { useState } from "react";

const TeamMyClients = ({ userId, teamMemberId }: { userId: string; teamMemberId: string }) => {
  const { lang } = useLanguage();
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const userRole = localStorage.getItem("userRole");
  const isSupervisor = userRole === "supervisor" || userRole === "admin";

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["team_clients", teamMemberId, isSupervisor],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*");
      if (isSupervisor) return data || [];
      return (data || []).filter((c: any) => {
        const teamStr = JSON.stringify(c.assigned_team || []);
        return teamStr.includes(teamMemberId) || teamStr.includes(userId);
      });
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["team_projects_for_clients", teamMemberId],
    queryFn: async () => {
      const { data } = await supabase.from("client_projects").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const getClientProjects = (clientId: string) => projects.filter((p: any) => p.client_id === clientId);

  if (isLoading) return <div className="py-20 text-center"><div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto" /></div>;

  if (selectedClient) {
    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        <button onClick={() => setSelectedClient(null)} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-sm font-bold uppercase tracking-widest bg-white/5 py-2 px-4 rounded-xl">
          <ArrowLeft className="w-4 h-4" />
          {lang === "ar" ? "العودة للجدول" : "Back to Registry"}
        </button>

        <div className="flex items-center gap-4 bg-orange-500/10 border border-orange-500/20 p-5 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
            <User className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground uppercase">{selectedClient.full_name}</h2>
            <p className="text-xs text-muted-foreground font-bold tracking-widest">{selectedClient.company || "عميل مستقل"}</p>
          </div>
        </div>

        <DirectCommunication
          clientId={selectedClient.id}
          senderId={teamMemberId}
          senderName="عضو فريق"
          senderRole="team"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-foreground uppercase tracking-widest">{lang === "ar" ? "إدارة العملاء" : "Clients Directory"}</h2>
        {isSupervisor && (
          <span className="px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest rounded-lg">وضع المشرف (وصول كامل)</span>
        )}
      </div>

      {clients.length === 0 && <p className="text-muted-foreground text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">{lang === "ar" ? "لا يوجد عملاء مخصصين لك حالياً" : "No clients assigned yet"}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clients.map((c: any) => {
          const cProjects = getClientProjects(c.id);
          const activeProjects = cProjects.filter((p: any) => p.phase !== "completed");
          const completedProjects = cProjects.filter((p: any) => p.phase === "completed");
          return (
            <div key={c.id} className="glass-card p-6 bg-white/[0.01] hover:bg-white/[0.03] transition-all border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center backdrop-blur-md">
                  <User className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-lg">{c.full_name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground font-medium bg-black/40 w-fit px-2 py-0.5 rounded-full border border-white/5">
                    <Building className="w-3 h-3 text-orange-400" />
                    <span>{c.company || "عميل مستقل"}</span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                    {c.email && (
                      <div className="flex items-center gap-2 bg-white/5 px-2 py-1.5 rounded-lg border border-white/5">
                        <Mail className="w-3.5 h-3.5 text-orange-500/70" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-2 bg-white/5 px-2 py-1.5 rounded-lg border border-white/5">
                        <Phone className="w-3.5 h-3.5 text-orange-500/70" />
                        <span className="truncate">{c.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">مشاريع نشطة</span>
                      <span className="font-bold text-orange-500 text-sm">{activeProjects.length}</span>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">مكتملة</span>
                      <span className="font-bold text-emerald-400 text-sm">{completedProjects.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamMyClients;
