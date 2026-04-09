import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Briefcase, UserPlus, FileText, Share2, LogOut, Shield, BarChart3, FolderOpen,
  Receipt, Star, UsersRound, Settings, Menu, X, Bell, Search
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import AdminDashboardHome from "@/features/admin/components/AdminDashboardHome";
import AdminProjects from "@/features/admin/components/AdminProjects";
import AdminTeam from "@/features/admin/components/AdminTeam";
import AdminJoinRequests from "@/features/admin/components/AdminJoinRequests";
import AdminContent from "@/features/admin/components/AdminContent";
import AdminServices from "@/features/admin/components/AdminServices";
import AdminSocialLinks from "@/features/admin/components/AdminSocialLinks";
import AdminUsers from "@/features/admin/components/AdminUsers";
import AdminInvoices from "@/features/admin/components/AdminInvoices";
import AdminContracts from "@/features/admin/components/AdminContracts";
import AdminReviews from "@/features/admin/components/AdminReviews";
import AdminClients from "@/features/admin/components/AdminClients";
import ParticlesBackground from "@/components/shared/ParticlesBackground";
import { AdminNotifications } from "@/features/admin/components/AdminNotifications";
import AdminSectionDesign from "@/features/admin/components/AdminSectionDesign";
import AdminContinuousClients from "@/features/admin/components/AdminContinuousClients";

// Nexora Operational Midnight Command Terminal

type Tab = "overview" | "clients" | "continuous_clients" | "invoices" | "contracts" | "reviews" | "projects" | "services" | "team" | "join" | "content" | "social" | "admin" | "design";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated");
    if (auth !== "true") {
      navigate("/admin/login");
    }
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/admin/login");
  };

  const tabs = [
    {
      group: "Operations", items: [
        { key: "overview" as Tab, label: t.admin.overview, icon: BarChart3 },
        { key: "team" as Tab, label: "Staff", icon: UsersRound },
        { key: "join" as Tab, label: "Join Requests", icon: UserPlus },
      ]
    },
    {
      group: "Client Operations", items: [
        { key: "clients" as Tab, label: "Clients & Pipeline", icon: UsersRound },
        { key: "continuous_clients" as Tab, label: "Monthly Retainers", icon: Briefcase },
        { key: "invoices" as Tab, label: "Economy Hub", icon: Receipt },
      ]
    },
    {
      group: "Site Management", items: [
        { key: "projects" as Tab, label: "Archive", icon: FolderOpen },
        { key: "services" as Tab, label: "Services", icon: Settings },
        { key: "content" as Tab, label: t.admin.siteContent, icon: FileText },
        { key: "design" as Tab, label: "Design", icon: LayoutDashboard },
        { key: "reviews" as Tab, label: "Reviews", icon: Star },
        { key: "social" as Tab, label: t.admin.socialLinks, icon: Share2 },
        { key: "admin" as Tab, label: t.admin.adminManagement, icon: Shield },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return <AdminDashboardHome />;
      case "clients": return <AdminClients />;
      case "continuous_clients": return <AdminContinuousClients />;
      case "invoices": return <AdminInvoices />;
      case "contracts": return <AdminContracts />;
      case "reviews": return <AdminReviews />;
      case "projects": return <AdminProjects />;
      case "services": return <AdminServices />;
      case "team": return <AdminTeam />;
      case "join": return <AdminJoinRequests />;
      case "content": return <AdminContent />;
      case "design": return <AdminSectionDesign />;
      case "social": return <AdminSocialLinks />;
      case "admin": return <AdminUsers />;
      default: return <AdminDashboardHome />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-foreground flex overflow-hidden" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Background container removed to lighten dashboard */}

      {/* Sidebar */}
      <aside className={`relative z-50 h-screen transition-all duration-100 border-x border-white/5 bg-[#0a0a0a]  flex flex-col ${isSidebarOpen ? "w-72" : "w-20"}`}>
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tighter bg-gradient-to-r from-orange-500 to-orange-700 bg-clip-text text-transparent">NEXORA</h1>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none">Command Center</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground hover:text-white">
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 mx-auto" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide space-y-8">
          {tabs.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              {isSidebarOpen && (
                <h3 className="px-4 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-4">{group.group}</h3>
              )}
              <div className="space-y-1">
                {group.items.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-100 relative group ${activeTab === tab.key ? "text-orange-500" : "text-muted-foreground/60 hover:text-white hover:bg-white/[0.03]"}`}
                  >
                    {activeTab === tab.key && (
                      <motion.div layoutId="sidebarTab" className="absolute inset-0 bg-orange-500/5 border-orange-500 rounded-xl" style={{ borderLeftWidth: lang === 'ar' ? 0 : 0, borderRightWidth: lang === 'ar' ? 2 : 0, borderInlineStartWidth: 2 }} />
                    )}
                    <tab.icon className={`w-5 h-5 transition-all duration-100 z-10 ${activeTab === tab.key ? "text-orange-500 scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "group-hover:text-orange-500 group-hover:scale-110"}`} />
                    <AnimatePresence>
                      {isSidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -5 }}
                          className="relative z-10 whitespace-nowrap overflow-hidden"
                        >
                          {tab.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {!isSidebarOpen && activeTab === tab.key && (
                      <div className="absolute right-0 w-1 h-6 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-[10px] font-black tracking-widest text-rose-400 group hover:bg-rose-500/10 transition-all uppercase">
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            {isSidebarOpen && "Terminate Session"}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className={`h-20 flex items-center justify-between px-8 z-40 transition-all duration-100 border-b border-white/5 ${scrolled ? "bg-black/80 " : "bg-transparent"}`}>
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/5 rounded-lg text-muted-foreground/50 border border-white/10 hidden sm:block">
              <Search className="w-4 h-4" />
            </div>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <p className="text-[10px] font-black text-muted-foreground tracking-[0.2em] uppercase">
              Path: <span className="text-orange-500">Admin</span> / <span className="text-white">{activeTab.replace("_", " ")}</span>
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-gradient-to-br from-orange-500/20 to-orange-700/20" />
                ))}
              </div>
              <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Team Active</span>
            </div>

            <AdminNotifications />
          </div>
        </header>

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 scrollbar-hide relative z-30">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>

          <footer className="mt-20 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 opacity-30 select-none">
            <p className="text-[9px] font-black tracking-[0.3em] uppercase">NEXORA PRO SYSTEMS v2.4.0</p>
            <div className="flex items-center gap-6 text-[9px] font-black tracking-[0.3em] uppercase">
              <span className="hover:text-orange-500 transition-colors cursor-pointer tracking-widest">Security Audit</span>
              <span className="hover:text-orange-700 transition-colors cursor-pointer tracking-widest">Network Status</span>
              <span className="text-emerald-500 font-mono italic tracking-tight">System Online</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

