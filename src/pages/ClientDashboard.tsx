import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { LayoutDashboard, FolderOpen, FileText, Bell, LogOut, PlusCircle, MessageSquare, ClipboardList } from "lucide-react";
import ClientProjects from "@/features/clients/components/ClientProjects";
import ClientInvoices from "@/features/clients/components/ClientInvoices";
import ClientNotifications from "@/features/clients/components/ClientNotifications";
import ClientRequestService from "@/features/clients/components/ClientRequestService";
import DirectCommunication from "@/features/shared/components/DirectCommunication";
import ClientRequests from "@/features/clients/components/ClientRequests";

type Tab = "projects" | "invoices" | "notifications" | "request_service" | "chat" | "requests";

const ClientDashboard = () => {
  const [tab, setTab] = useState<Tab>("projects");
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { lang } = useLanguage();

  useEffect(() => {
    const checkCustomAuth = async () => {
      const email = localStorage.getItem("userEmail");
      if (email) {
        const { data } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
        if (data) setUserId(data.id);
      }
    };
    checkCustomAuth();
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["client_profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId!).single();
      return data;
    },
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread_notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId!).eq("is_read", false);
      return count || 0;
    },
  });

  const handleLogout = async () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  if (!userId) return <div className="min-h-screen bg-transparent flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const tabs = [
    { key: "projects" as Tab, label: lang === "ar" ? "مشاريعي" : "Active Space", icon: FolderOpen },
    { key: "requests" as Tab, label: lang === "ar" ? "طلباتي السابقة" : "My Requests", icon: ClipboardList },
    { key: "chat" as Tab, label: lang === "ar" ? "الرسائل والتواصل" : "Messages", icon: MessageSquare },
    { key: "invoices" as Tab, label: lang === "ar" ? "الفواتير" : "Financials", icon: FileText },
    { key: "request_service" as Tab, label: lang === "ar" ? "طلب خدمة جديدة" : "Request Service", icon: PlusCircle },
    { key: "notifications" as Tab, label: lang === "ar" ? "الإشعارات" : "Briefings", icon: Bell, badge: unreadCount },
  ];

  return (
    <div className="min-h-screen bg-transparent flex" dir={lang === "ar" ? "rtl" : "ltr"}>
      <aside className="w-64 bg-black/40 backdrop-blur-2xl border-x border-white/5 flex flex-col min-h-screen sticky top-0 z-50">
        <div className="p-8 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,242,255,0.2)]">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-black tracking-tighter bg-gradient-to-r from-neon-cyan to-neon-violet bg-clip-text text-transparent uppercase">NEXORA HUB</h1>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em] mt-1 font-bold">{profile?.full_name || "Partner"}</p>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-500 relative group ${tab === t.key ? "text-neon-cyan" : "text-muted-foreground/50 hover:text-white hover:bg-white/[0.03]"}`}
            >
              {tab === t.key && (
                <motion.div layoutId="activeTabClient" className="absolute inset-0 bg-neon-cyan/5 border-r-2 border-neon-cyan" />
              )}
              <t.icon className={`w-5 h-5 transition-all duration-500 relative z-10 ${tab === t.key ? "text-neon-cyan scale-110 drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]" : "group-hover:text-neon-cyan"}`} />
              <span className="relative z-10">{t.label}</span>
              {t.badge ? (
                <span className="relative z-20 mr-auto bg-neon-violet text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(180,0,255,0.3)]">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5 mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-[10px] font-black tracking-widest text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 transition-all uppercase">
            <LogOut className="w-5 h-5" /> {lang === "ar" ? "خروج من الواجهة" : "Logout Interface"}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-10 relative z-10 h-screen overflow-y-auto scrollbar-hide">
        <div className="max-w-6xl mx-auto">
          {tab === "projects" && <ClientProjects userId={userId} />}
          {tab === "requests" && <ClientRequests email={profile?.email || ""} />}
          {tab === "chat" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-foreground uppercase tracking-widest">{lang === "ar" ? "مساحة التواصل المباشرة" : "Communication Space"}</h2>
              <DirectCommunication clientId={userId} senderId={userId} senderName={profile?.full_name || "Client"} senderRole="client" />
            </div>
          )}
          {tab === "request_service" && <ClientRequestService userId={userId} />}
          {tab === "invoices" && <ClientInvoices userId={userId} />}
          {tab === "notifications" && <ClientNotifications userId={userId} />}
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
