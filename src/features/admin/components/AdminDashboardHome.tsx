import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Users, UserPlus, MessageSquare, TrendingUp, Clock, Eye, CheckCircle, XCircle, Loader2, ArrowRight, Zap, Target, Activity, MessageCircle } from "lucide-react";

interface StatusConfig {
  label: string;
  color: string;
  icon: React.ElementType;
}

const statusConfig: Record<string, StatusConfig> = {
  pending: { label: "Awaiting Action", color: "text-orange-500 bg-orange-500/10", icon: Clock },
  in_review: { label: "Operational Review", color: "text-orange-400 bg-orange-500/10", icon: Eye },
  approved: { label: "Verified", color: "text-emerald-400 bg-emerald-500/10", icon: CheckCircle },
  rejected: { label: "Terminated", color: "text-rose-400 bg-rose-500/10", icon: XCircle },
  in_progress: { label: "Active Execution", color: "text-orange-500 bg-orange-500/10", icon: Loader2 },
  completed: { label: "Mission Success", color: "text-emerald-400 bg-emerald-500/10", icon: ArrowRight },
};

const typeConfig: Record<string, { label: string; color: string }> = {
  request: { label: "Deployment", color: "bg-orange-500/10 text-orange-500" },
  complaint: { label: "Critical", color: "bg-rose-500/10 text-rose-500" },
  suggestion: { label: "Optimization", color: "bg-orange-500/10 text-orange-500" },
};

const AdminDashboardHome = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const [projects, team, joins, messages] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("team_members").select("id", { count: "exact", head: true }),
        supabase.from("join_requests").select("id", { count: "exact", head: true }),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }),
      ]);
      return {
        projects: projects.count ?? 0,
        team: team.count ?? 0,
        joins: joins.count ?? 0,
        messages: messages.count ?? 0,
      };
    },
  });

  const { data: pendingMessages = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["admin_pending_messages"],
    queryFn: async () => {
      const { data } = await supabase.from("contact_messages")
        .select("*")
        .in("status", ["pending", "new"])
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const { data: recentJoins = [], isLoading: joinsLoading } = useQuery({
    queryKey: ["admin_recent_joins"],
    queryFn: async () => {
      const { data } = await supabase
        .from("join_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const cards = [
    { label: "Total Operations", value: stats?.projects ?? 0, icon: Target, color: "text-orange-500", trend: "+12%" },
    { label: "Active Personel", value: stats?.team ?? 0, icon: Users, color: "text-white", trend: "Stable" },
    { label: "Recruitment Queue", value: stats?.joins ?? 0, icon: UserPlus, color: "text-orange-500", trend: "High" },
    { label: "System Requests", value: stats?.messages ?? 0, icon: Activity, color: "text-white", trend: "Active" },
  ];

  const isLoading = statsLoading || pendingLoading || joinsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
      </div>
    );
  }

  return (
    <div className="space-y-12  duration-100 font-outfit">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 text-orange-500">
          <Zap className="w-5 h-5 fill-current" />
          <span className="text-[10px] font-black uppercase tracking-[0.5em]">Command Clearance Confirmed</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter">
          Operational Status: <span className="">Elite</span>
        </h2>
        <p className="text-white/30 font-bold italic border-l-2 border-orange-500/20 pl-4">NEXORA PRO Operating System v2.4.0 â€” All systems nominal.</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-[#0a0a0a] border border-white/5 p-8 flex flex-col justify-between group hover:border-orange-500/30 transition-all duration-100 bg-white/5 border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <card.icon className="w-24 h-24" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className={`${card.color} bg-white/5 p-3 rounded-2xl`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 font-mono italic">{card.trend}</span>
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.2em] mb-1">{card.label}</p>
                <p className="text-4xl font-black text-white tabular-nums tracking-tighter">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Recent Pending Messages */}
        <div className="bg-[#0a0a0a] border border-white/5 p-10 border-white/5 bg-white/5 rounded-[3rem]">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h3 className="text-xl font-black flex items-center gap-3 text-white uppercase tracking-tighter">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-orange-500" />
                </div>
                Operational Inbound
              </h3>
              <p className="text-xs text-white/30 font-black uppercase tracking-widest pl-12">Client Communication Protocol</p>
            </div>
            <span className="text-xs bg-orange-500/10 text-orange-500 px-3 py-1.5 rounded-full font-black uppercase tracking-widest ">Action Required</span>
          </div>
          <div className="space-y-6">
            {pendingMessages.map((msg) => (
              <div key={msg.id} className="p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-orange-500/30 transition-all duration-100 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex items-center justify-between mb-3">
                  <p className="font-black text-white text-base group-hover:text-orange-500 transition-colors uppercase tracking-tight">{msg.name}</p>
                  <span className={`text-xs uppercase font-black px-3 py-1 rounded-full ${typeConfig[msg.message_type]?.color || typeConfig.request.color} border border-current/20`}>
                    {typeConfig[msg.message_type]?.label || "Deployment"}
                  </span>
                </div>
                <p className="relative z-10 text-sm text-white/40 line-clamp-2 leading-relaxed italic font-bold mb-4">"{msg.message}"</p>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between pt-4 border-t border-white/5 gap-4">
                  <span className="text-[10px] text-white/20 font-black uppercase tracking-widest order-2 md:order-1">
                    Timestamp: {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  <div className="flex items-center gap-3 order-1 md:order-2">
                    {(() => {
                        const m = msg as { phone?: string | null; email: string };
                        if (m.phone && m.phone !== 'N/A') {
                            return (
                                <a 
                                    href={`https://wa.me/${m.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-all flex items-center gap-2 group/wa border border-emerald-500/20"
                                    title="Direct WhatsApp"
                                >
                                    <MessageCircle className="w-3.5 h-3.5 group-hover/wa:scale-110 transition-transform" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter">WhatsApp</span>
                                </a>
                            );
                        }
                        return null;
                    })()}
                    
                    <a 
                        href={`mailto:${msg.email}`}
                        className="p-2 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500/20 transition-all flex items-center gap-2 group/mail border border-orange-500/20"
                        title="Send Email"
                    >
                        <MessageSquare className="w-3.5 h-3.5 group-hover/mail:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Email</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
            {pendingMessages.length === 0 && (
              <div className="text-center py-20 opacity-20">
                <CheckCircle className="w-16 h-16 mx-auto mb-6 text-emerald-500" />
                <p className="text-lg font-black uppercase tracking-widest italic">All Data Channels Clear</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Join Requests */}
        <div className="bg-[#0a0a0a] border border-white/5 p-10 border-white/5 bg-white/5 rounded-[3rem]">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h3 className="text-xl font-black flex items-center gap-3 text-white uppercase tracking-tighter">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <UserPlus className="w-5 h-5 text-orange-500" />
                </div>
                Asset Induction
              </h3>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest pl-12">Personnel Expansion Queue</p>
            </div>
            <span className="text-[9px] bg-orange-500/10 text-orange-500 px-3 py-1.5 rounded-full font-black uppercase tracking-widest">Global Reach</span>
          </div>
          <div className="space-y-6">
            {recentJoins.map((join) => (
              <div key={join.id} className="p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-orange-500/30 transition-all duration-100 group relative">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-black text-white text-base group-hover:text-orange-500 transition-colors uppercase tracking-tight">{join.name}</p>
                  <p className="text-xs text-white/20 font-black uppercase tracking-widest">{join.email}</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-orange-500/20">
                    Sector: {join.specialty || "Tactical"}
                  </span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between pt-4 border-t border-white/5 gap-4">
                  <span className="text-[10px] text-white/20 font-black uppercase tracking-widest order-2 md:order-1">
                    Recruited: {new Date(join.created_at).toLocaleDateString()}
                  </span>
                  
                  <div className="flex items-center gap-3 order-1 md:order-2">
                    {join.phone && (
                        <a 
                            href={`https://wa.me/${join.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-all flex items-center gap-2 border border-emerald-500/20"
                        >
                            <MessageCircle className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-tighter">WhatsApp</span>
                        </a>
                    )}
                    <a 
                        href={`mailto:${join.email}`}
                        className="p-1.5 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500/20 transition-all flex items-center gap-2 border border-orange-500/20"
                    >
                        <MessageSquare className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Email</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
            {recentJoins.length === 0 && (
              <div className="text-center py-20 opacity-20 whitespace-normal">
                <Activity className="w-16 h-16 mx-auto mb-6 text-orange-500/40" />
                <p className="text-lg font-black uppercase tracking-widest italic leading-tight">Expansion Protocol Idle</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHome;

