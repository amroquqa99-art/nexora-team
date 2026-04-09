import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Clock, CheckCircle, XCircle, Search } from "lucide-react";

const ClientRequests = ({ email }: { email: string }) => {
    const { lang } = useLanguage();

    const { data: requests = [], isLoading } = useQuery({
        queryKey: ["client_requests", email],
        enabled: !!email,
        queryFn: async () => {
            const { data } = await supabase.from("contact_messages").select("*").eq("email", email).order("created_at", { ascending: false });
            return data || [];
        }
    });

    if (isLoading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-foreground uppercase tracking-widest flex items-center gap-4">
                        <Search className="w-8 h-8 text-neon-cyan" />
                        {lang === "ar" ? "تتبع طلباتي" : "Request Tracker"}
                    </h2>
                    <p className="text-muted-foreground mt-2 font-medium">{lang === "ar" ? "هنا يمكنك متابعة حالة جميع الطلبات التي قدمتها عبر الموقع" : "Follow up on all your submissions and their current status"}</p>
                </div>
            </div>

            <div className="grid gap-4">
                {requests.length === 0 && (
                    <div className="py-20 bg-white/[0.02] border border-white/5 rounded-3xl flex flex-col items-center justify-center opacity-40">
                        <Search className="w-12 h-12 mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest">{lang === "ar" ? "لا توجد طلبات سابقة لهذا البريد الإلكتروني" : "No requests found for this email"}</p>
                    </div>
                )}

                {requests.map((r: any) => (
                    <div key={r.id} className="glass-card p-6 border-white/5 hover:border-white/10 transition-all group">
                        <div className="flex items-start justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-white/5 rounded-full text-muted-foreground">
                                        {r.service_type || (lang === "ar" ? "طلب عام" : "General Request")}
                                    </span>
                                    <span className="text-[10px] font-mono opacity-40">{new Date(r.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 className="text-xl font-bold group-hover:text-neon-cyan transition-colors">{lang === "ar" ? "تفاصيل الطلب" : "Request Details"}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed italic border-r-2 border-neon-cyan/20 pr-4">"{r.message}"</p>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                                {r.status === 'pending' && (
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                        <Clock className="w-4 h-4 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{lang === "ar" ? "قيد المراجعة" : "In Review"}</span>
                                    </div>
                                )}
                                {r.status === 'approved' && (
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{lang === "ar" ? "تم التحويل لمشروع" : "Project Active"}</span>
                                    </div>
                                )}
                                {r.status === 'spam' && (
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                        <XCircle className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{lang === "ar" ? "مرفوض / سبام" : "Rejected"}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientRequests;
