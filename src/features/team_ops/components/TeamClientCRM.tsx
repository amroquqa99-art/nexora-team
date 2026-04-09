import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { User, Building, Search, UserCheck, Users } from "lucide-react";
import { useState } from "react";

const clientPhases = {
    new: { ar: "عملاء جدد", en: "New Leads", color: "border-l-orange-500 bg-orange-500/5 text-orange-400" },
    contacted: { ar: "تم التواصل", en: "Contacted", color: "border-l-amber-500 bg-amber-500/5 text-amber-400" },
    active: { ar: "عملاء نشطون", en: "Active Partners", color: "border-l-orange-400 bg-orange-500/5 text-orange-400" },
    lost: { ar: "عملاء ضائعون", en: "Terminated", color: "border-l-rose-500 bg-rose-500/5 text-rose-400" }
};

const TeamClientCRM = ({ teamMemberId }: { teamMemberId: string }) => {
    const { lang } = useLanguage();
    const [searchTerm, setSearchTerm] = useState("");
    const userRole = localStorage.getItem("userRole");
    const isSupervisor = userRole === "supervisor" || userRole === "admin";

    const { data: clients = [], isLoading } = useQuery({
        queryKey: ["team_clients_crm", teamMemberId, isSupervisor],
        queryFn: async () => {
            const { data } = await supabase.from("profiles").select("*");
            let list = data || [];
            if (!isSupervisor) {
                list = list.filter((c: any) => {
                    const team = c.assigned_team || [];
                    return Array.isArray(team) && team.includes(teamMemberId);
                });
            }
            return list;
        },
    });

    const { data: projects = [] } = useQuery({
        queryKey: ["all_projects_for_crm"],
        queryFn: async () => {
            const { data } = await supabase.from("client_projects").select("*");
            return data || [];
        },
    });

    const getClientStatus = (clientId: string) => {
        const cp = projects.filter((p: any) => p.client_id === clientId);
        if (cp.length === 0) return "new";
        if (cp.some((p: any) => p.phase === "completed")) {
            if (cp.some((p: any) => p.phase !== "completed")) return "ongoing";
            return "completed";
        }
        // Simple heuristic: if they have many projects, they are continuous
        if (cp.length > 2) return "continuous";
        return "ongoing";
    };

    const filteredClients = clients.filter(c =>
        c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <div className="py-20 text-center"><div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-700 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                    <Users className="w-6 h-6 text-orange-500" />
                    {lang === "ar" ? "رادار العملاء" : "Client Radar"}
                </h2>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder={lang === "ar" ? "بحث عن عميل..." : "Search clients..."}
                        className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-orange-500/50 w-64 transition-all"
                    />
                </div>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 flex-1 items-start min-h-[500px]">
                {Object.entries(clientPhases).map(([phaseKey, phaseInfo]) => {
                    const colClients = filteredClients.filter(c => getClientStatus(c.id) === phaseKey);
                    return (
                        <div key={phaseKey} className="w-80 shrink-0 bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden flex flex-col h-full max-h-[80vh]">
                            <div className="p-4 bg-black/40 border-b border-white/5 sticky top-0 z-10 flex items-center justify-between">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-l-2 ${phaseInfo.color}`}>
                                    {lang === "ar" ? phaseInfo.ar : phaseInfo.en}
                                </span>
                                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-muted-foreground">{colClients.length}</span>
                            </div>

                            <div className="p-4 space-y-4 overflow-y-auto flex-1 scrollbar-hide">
                                {colClients.map((client: any) => {
                                    const clientProjects = projects.filter(p => p.client_id === client.id);
                                    return (
                                        <div key={client.id} className="bg-black/60 border border-white/5 rounded-2xl p-5 hover:border-orange-500/30 transition-colors group relative cursor-pointer shadow-lg">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                                    <User className="w-5 h-5 text-orange-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-sm text-foreground truncate">{client.full_name}</h4>
                                                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground italic truncate">
                                                        <Building className="w-2.5 h-2.5" />
                                                        {client.company || (lang === "ar" ? "عميل مستقل" : "Individual")}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] uppercase font-black tracking-widest text-muted-foreground/50">{lang === "ar" ? "المشاريع" : "Projects"}</span>
                                                    <span className="font-bold text-foreground text-xs">{clientProjects.length}</span>
                                                </div>
                                                <button className="ml-auto p-2 rounded-lg bg-orange-500/10 text-orange-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-orange-500 hover:text-white">
                                                    <UserCheck className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TeamClientCRM;
