import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ClientRequestService = ({ userId }: { userId: string }) => {
    const { lang } = useLanguage();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [serviceId, setServiceId] = useState("");

    const { data: dbServices = [] } = useQuery({
        queryKey: ["services_for_form"],
        queryFn: async () => {
            const { data } = await supabase.from("services").select("id, key, title_ar, title_en").order("display_order");
            return data || [];
        }
    });

    const requestMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.from("client_projects").insert({
                client_id: userId,
                title: title || (lang === "ar" ? "طلب خدمة جديد" : "New Service Request"),
                description: `[Service Requested: ${serviceId}] \n\n${description}`,
                status: "pending",
                phase: "planning" // Initial phase is planning
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client_projects", userId] });
            toast({ title: lang === "ar" ? "تم تسجيل طلبك بنجاح!" : "Request submitted successfully!" });
            setTitle("");
            setDescription("");
            setServiceId("");
        },
        onError: (e: any) => {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    });

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-700">
            <div className="glass-card p-8 border-orange-500/10 shadow-[0_0_50px_rgba(249,115,22,0.05)] rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 blur-3xl rounded-full" />
                <h2 className="text-2xl font-black text-foreground mb-2 relative z-10">{lang === "ar" ? "ماهو مشروعك القادم؟" : "What is your next project?"}</h2>
                <p className="text-sm text-muted-foreground mb-8 relative z-10">{lang === "ar" ? "أخبرنا بتفاصيل طلبك لنبدأ العمل معاً، وسيتم إضافته فوراً لسجل مشاريعك." : "Tell us the details to start working together. It will be added to your projects immediately."}</p>

                <form onSubmit={(e) => { e.preventDefault(); requestMutation.mutate(); }} className="space-y-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground px-1 uppercase tracking-widest">{lang === "ar" ? "عنوان المشروع أو الطلب" : "Project Title"}</label>
                        <input
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 focus:border-orange-500 focus:outline-none transition-all placeholder:text-muted-foreground/30 text-sm"
                            placeholder={lang === "ar" ? "مثال: تصميم شعار أندلسية" : "e.g. Andalusia Logo Design"}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground px-1 uppercase tracking-widest">{lang === "ar" ? "الخدمة المطلوبة" : "Requested Service"}</label>
                        <select
                            required
                            value={serviceId}
                            onChange={e => setServiceId(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 focus:border-orange-500 focus:outline-none transition-all text-sm appearance-none"
                        >
                            <option value="">{lang === "ar" ? "اختر الخدمة من القائمة..." : "Select from list..."}</option>
                            {dbServices.map((s: any) => (
                                <option key={s.id || s.key} value={s.title_ar}>{lang === "ar" ? s.title_ar : s.title_en}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground px-1 uppercase tracking-widest">{lang === "ar" ? "التفاصيل أو الميزانية المتوقعة" : "Details or Budget"}</label>
                        <textarea
                            required
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={5}
                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 focus:border-orange-500 focus:outline-none transition-all placeholder:text-muted-foreground/30 text-sm resize-none"
                            placeholder={lang === "ar" ? "اذكر تفاصيلك هنا..." : "Mention your details here..."}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={requestMutation.isPending}
                        className="w-full py-4 rounded-xl font-black text-white flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-700 hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all duration-300 disabled:opacity-50 active:scale-95 text-xs tracking-widest uppercase"
                    >
                        {requestMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {lang === "ar" ? "إرسال الطلب وإضافته למشريعي" : "Send Request & Add to Space"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ClientRequestService;
