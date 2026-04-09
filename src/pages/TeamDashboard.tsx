import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { AuthFiles } from "@/lib/secureAuth";
import { LayoutDashboard, FolderOpen, LogOut, Users, MessageSquare, Briefcase, ShieldCheck } from "lucide-react";
import TeamMyProjects from "@/features/team_ops/components/TeamMyProjects";
import TeamFeed from "@/features/team_ops/components/TeamFeed";
import TeamTaskManager from "@/features/team_ops/components/TeamTaskManager";
import TeamClientCRM from "@/features/team_ops/components/TeamClientCRM";
import AdminTeamAccounts from "@/features/admin/components/AdminTeamAccounts";
import AdminClients from "@/features/admin/components/AdminClients";

type Tab = "tasks" | "clients" | "feed" | "all_projects" | "team_management" | "all_clients" | "client_crm";

const TeamDashboard = () => {
  const [tab, setTab] = useState<Tab>("tasks");
  const [userId, setUserId] = useState<string | null>(null);
  const [teamMemberId, setTeamMemberId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { lang } = useLanguage();

  useEffect(() => {
    const checkAuth = async () => {
      const email = localStorage.getItem("userEmail");
      const role = localStorage.getItem("userRole");
      setUserRole(role);

      if (email) {
        const authFile = await AuthFiles.getTeamFile();
        const memberAuth = authFile.find((m: any) => m.email === email);
        if (memberAuth && memberAuth.teamMemberId) {
          setTeamMemberId(memberAuth.teamMemberId);
          setUserId(memberAuth.teamMemberId);

          const newRole = memberAuth.isSupervisor ? "supervisor" : "team";
          if (role !== newRole) {
            localStorage.setItem("userRole", newRole);
            setUserRole(newRole);
          }
        }
      }
    };
    checkAuth();
  }, []);

  const { data: teamMember } = useQuery({
    queryKey: ["team_member_profile", teamMemberId],
    enabled: !!teamMemberId,
    queryFn: async () => {
      const { data } = await supabase.from("team_members").select("*").eq("id", teamMemberId!).single();
      return data;
    },
  });

  const handleLogout = async () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  if (!teamMemberId && userRole !== "admin") return <div className="min-h-screen bg-transparent flex items-center justify-center"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  const tabs: { key: Tab, label: string, icon: any }[] = [
    { key: "tasks", label: lang === "ar" ? "عملائي ومشاريعي" : "My Projects & Clients", icon: Users },
  ];

  if ((teamMember as any)?.can_post_feed !== false) {
    tabs.push({ key: "feed", label: lang === "ar" ? "المنشورات" : "Team Hub", icon: MessageSquare });
  }

  const isSup = userRole === "supervisor" || userRole === "admin" || userRole?.toUpperCase().includes("SUPERVISOR");
  const canViewAllClients = isSup || (teamMember as any)?.can_view_all_clients;
  const canManageTasks = isSup || (teamMember as any)?.can_manage_tasks;

  if (canViewAllClients) {
    tabs.push({ key: "all_clients", label: lang === "ar" ? "جميع العملاء" : "All Clients", icon: Users });
    tabs.push({ key: "client_crm", label: lang === "ar" ? "رادار العملاء (Kanban)" : "Client Radar", icon: LayoutDashboard });
  }
  if (canManageTasks) {
    tabs.push({ key: "all_projects", label: lang === "ar" ? "توزيع المهام والمشاريع" : "Task Management", icon: Briefcase });
  }
  if (isSup) {
    tabs.push({ key: "team_management", label: lang === "ar" ? "إدارة الصلاحيات" : "Role Management", icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen bg-transparent flex" dir={lang === "ar" ? "rtl" : "ltr"}>
      <aside className="w-64 bg-black/40 backdrop-blur-2xl border-x border-white/5 flex flex-col min-h-screen sticky top-0 z-50">
        <div className="p-8 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center mb-4">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-black tracking-tighter bg-gradient-to-r from-orange-500 to-orange-700 bg-clip-text text-transparent uppercase">NEXORA</h1>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em] mt-1 font-bold">{teamMember ? (lang === "ar" ? teamMember.name_ar : teamMember.name_en) : "Supervisor"}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">{isSup ? 'Supervisor Ops' : 'Active Ops'}</span>
          </div>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-500 relative group ${tab === t.key ? "text-orange-500" : "text-muted-foreground/50 hover:text-white hover:bg-white/[0.03]"}`}
            >
              {tab === t.key && (
                <motion.div layoutId="activeTabTeam" className="absolute inset-0 bg-orange-500/5 border-r-2 border-orange-500" />
              )}
              <t.icon className={`w-5 h-5 transition-all duration-500 relative z-10 ${tab === t.key ? "text-orange-500 scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "group-hover:text-orange-500"}`} />
              <span className="relative z-10 text-start">{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5 mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-[10px] font-black tracking-widest text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 transition-all uppercase">
            <LogOut className="w-5 h-5" /> {lang === "ar" ? "خروج" : "Exit System"}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-10 relative z-10 h-screen overflow-y-auto scrollbar-hide">
        <div className="max-w-5xl mx-auto">
          {tab === "tasks" && <TeamMyProjects userId={userId!} teamMemberId={teamMemberId!} />}
          {tab === "feed" && <TeamFeed userId={userId!} />}

          {/* Supervisor & Permission Tabs */}
          {tab === "client_crm" && <TeamClientCRM teamMemberId={teamMemberId!} />}
          {tab === "all_clients" && <AdminClients />}
          {tab === "all_projects" && <TeamTaskManager isSupervisor={true} teamMemberId={teamMemberId!} />}
          {tab === "team_management" && <AdminTeamAccounts />}
        </div>
      </main>
    </div>
  );
};

export default TeamDashboard;
