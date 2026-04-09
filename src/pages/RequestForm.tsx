import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import ParticlesBackground from "@/components/shared/ParticlesBackground";
import { Send, AlertTriangle, Lightbulb, ChevronLeft, ChevronRight, ChevronDown, Briefcase, Users, UserPlus, MessageSquare, TrendingUp, Clock, Eye, CheckCircle, XCircle, Loader2, ArrowRight, Zap, Target, Activity, MessageCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const RequestPage = () => {
    const { t, lang } = useLanguage();
    const { toast } = useToast();
    const navigate = useNavigate();
    const { teamVisible } = useSiteSettings();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
    const serviceDropdownRef = useRef<HTMLDivElement>(null);

    const initialService = searchParams.get("service") || "";
    const initialType = searchParams.get("type") || "request";

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        service_type: initialService,
        message_type: initialType,
        subject: "",
        order_id: "",
        message: ""
    });

    useEffect(() => {
        if (searchParams.get("type")) {
            setFormData(prev => ({ ...prev, message_type: searchParams.get("type") || "request" }));
        }
    }, [searchParams]);

    // Close service dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(e.target as Node)) {
                setServiceDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const { data: dbServices = [] } = useQuery({
        queryKey: ["services_for_form"],
        queryFn: async () => {
            const { data } = await supabase.from("services").select("*").order("display_order");
            return data || [];
        }
    });

    const fallbackServices = [
        { key: "branding", title_ar: "بناء العلامة التجارية", title_en: "Branding" },
        { key: "graphic_design", title_ar: "التصميم الجرافيكي", title_en: "Graphic Design" },
        { key: "video_production", title_ar: "صناعة الفيديو", title_en: "Video Production" },
        { key: "social_media", title_ar: "إدارة السوشيال ميديا", title_en: "Social Media" },
        { key: "digital_marketing", title_ar: "التسويق الرقمي", title_en: "Digital Marketing" },
        { key: "web_design", title_ar: "تطوير المواقع", title_en: "Web Development" },
        { key: "content_creation", title_ar: "إنتاج المحتوى", title_en: "Content Creation" },
        { key: "consulting", title_ar: "الاستشارات", title_en: "Consulting" },
    ];

    const services = dbServices.length > 0 ? dbServices : fallbackServices;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const contactHeader = `📞 Phone: ${formData.phone || 'N/A'}\n✉️ Email: ${formData.email}\n\n`;
            
            const msgPayload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || null,
                company: formData.company || null,
                service_type: formData.message_type === "request" ? formData.service_type : null,
                message_type: formData.message_type,
                message: contactHeader + (formData.message_type === "request"
                    ? `${formData.message}${formData.subject ? ` [Budget: ${formData.subject}]` : ""}`
                    : `[${formData.subject || formData.order_id}] ${formData.message}`),
                status: "pending",
            } as Database["public"]["Tables"]["contact_messages"]["Insert"];

            const { error: msgError } = await supabase.from("contact_messages").insert([msgPayload]);
            if (msgError) throw msgError;

            // If it's a service request, also create a pipeline project
            if (formData.message_type === "request") {
                // Check if profile already exists (repeat client detection)
                const { data: existingProfiles } = await supabase
                    .from("profiles")
                    .select("id, client_type")
                    .eq("email", formData.email);

                const existingProfile = existingProfiles && existingProfiles[0];
                let profileId = existingProfile?.id;
                const isRepeatClient = !!existingProfile;

                if (!profileId) {
                    // Create new profile
                    const newId = crypto.randomUUID();
                    const { data: newProfile } = await supabase
                        .from("profiles")
                        .insert([{
                            id: newId,
                            full_name: formData.name,
                            email: formData.email,
                            company: formData.company || null,
                            phone: formData.phone || null,
                            client_type: "one_time"
                        }])
                        .select("id")
                        .single();
                    profileId = newProfile?.id ?? newId;
                } else if (isRepeatClient && existingProfile.client_type !== "contract") {
                    // Auto-upgrade repeat clients to continuous (monthly retainer)
                    await supabase.from("profiles").update({ client_type: "contract" }).eq("id", profileId);
                }

                if (profileId) {
                    // Determine phase: repeat clients go to production queue for retainers
                    const phase = isRepeatClient ? "production" : "queued";

                    await supabase.from("client_projects").insert([{
                        client_id: profileId,
                        title: `${formData.service_type ? formData.service_type.replace(/_/g, " ").toUpperCase() : "SERVICE"} — ${formData.name}`,
                        description: formData.message,
                        service_type: formData.service_type || null,
                        phase,
                        progress: 0,
                    }]);
                }
            }

            toast({
                title: lang === "ar" ? "✓ تم الإرسال بنجاح" : "✓ Sent successfully",
                description: lang === "ar"
                    ? "سنتواصل معك في أقرب وقت ممكن."
                    : "We will get back to you as soon as possible.",
            });

            setFormData({ name: "", email: "", phone: "", company: "", service_type: "", message_type: "request", subject: "", order_id: "", message: "" });
            setTimeout(() => navigate("/"), 2000);

        } catch (error: unknown) {
            const err = error as Error;
            toast({
                title: lang === "ar" ? "خطأ في الإرسال" : "Send error",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const typeOptions = [
        { key: "request", label: lang === "ar" ? "طلب خدمة" : "Service Request", icon: Send },
        { key: "complaint", label: lang === "ar" ? "تقديم شكوى" : "File a Complaint", icon: AlertTriangle },
        { key: "suggestion", label: lang === "ar" ? "اقتراح فكرة" : "Submit Suggestion", icon: Lightbulb },
    ];

    const currentType = typeOptions.find(o => o.key === formData.message_type) || typeOptions[0];

    const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition-colors text-white placeholder:text-white/30";

    return (
        <div className="min-h-screen bg-transparent text-foreground overflow-x-hidden selection:bg-orange-500/30 font-outfit">
            <Navbar teamVisible={teamVisible} />

            <main className="pt-32 pb-24 px-4 relative z-10">
                <div className="container mx-auto max-w-4xl">
                    <div className="mb-8 flex justify-start">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-white/40 hover:text-orange-500 transition-colors font-bold"
                        >
                            {lang === "ar" ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                            {lang === "ar" ? "العودة للسابق" : "Go Back"}
                        </button>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-black gradient-text-nexora mb-4">
                            {currentType.label}
                        </h1>
                        <p className="text-white/40 text-lg">
                            {formData.message_type === "request" && (lang === "ar" ? "أخبرنا عن مشروعك القادم لنبدأ العمل معاً." : "Tell us about your next project to start working together.")}
                            {formData.message_type === "complaint" && (lang === "ar" ? "نأسف لأي تجربة غير مرضية. نحن هنا لحل مشكلتك." : "We're sorry for any unsatisfactory experience. We're here to solve it.")}
                            {formData.message_type === "suggestion" && (lang === "ar" ? "أفكارك تهمنا! ساهم في تطوير خدماتنا." : "Your ideas matter! Help us improve our services.")}
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="md:col-span-1 space-y-4">
                            {typeOptions.map((opt) => (
                                <button
                                    key={opt.key}
                                    onClick={() => setFormData({ ...formData, message_type: opt.key })}
                                    className={`w-full p-4 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 border ${formData.message_type === opt.key
                                        ? "bg-orange-500/10 border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.1)]"
                                        : "glass-card-2 border-white/5 hover:border-orange-500/20"
                                        }`}
                                >
                                    <opt.icon className={`w-6 h-6 ${formData.message_type === opt.key ? "text-orange-500" : "text-white/30"}`} />
                                    <span className={`text-xs font-black text-center uppercase tracking-widest ${formData.message_type === opt.key ? "text-orange-500" : "text-white/30"}`}>
                                        {opt.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="md:col-span-3 glass-card-2 p-8 md:p-10"
                        >
                            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-white/40 uppercase tracking-widest px-1">{lang === "ar" ? "الاسم" : "Name"}</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className={inputClass}
                                            placeholder={lang === "ar" ? "أدخل اسمك" : "Enter your name"}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-white/40 uppercase tracking-widest px-1">{lang === "ar" ? "البريد الإلكتروني" : "Email"}</label>
                                        <input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className={inputClass}
                                            placeholder="example@mail.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-white/40 uppercase tracking-widest px-1">{lang === "ar" ? "رقم الهاتف (اختياري)" : "Phone (Optional)"}</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className={inputClass}
                                            placeholder="+966 5xx xxx xxxx"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-white/40 uppercase tracking-widest px-1">{lang === "ar" ? "الشركة (اختياري)" : "Company (Optional)"}</label>
                                        <input
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                            className={inputClass}
                                            placeholder={lang === "ar" ? "اسم شركتك" : "Your company name"}
                                        />
                                    </div>
                                </div>

                                {formData.message_type === "request" && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2" ref={serviceDropdownRef}>
                                            <label className="text-xs font-black text-white/40 uppercase tracking-widest px-1">{lang === "ar" ? "نوع الخدمة" : "Service Type"}</label>
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setServiceDropdownOpen(o => !o)}
                                                    className={`${inputClass} flex items-center justify-between text-start ${!formData.service_type ? "text-white/30" : "text-white"}`}
                                                >
                                                    <span>
                                                        {formData.service_type
                                                            ? (services as Array<{ key: string; id?: string; title_ar: string; title_en: string }>).find(s => s.key === formData.service_type)?.[lang === "ar" ? "title_ar" : "title_en"] || formData.service_type
                                                            : (lang === "ar" ? "اختر الخدمة" : "Select Service")
                                                        }
                                                    </span>
                                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${serviceDropdownOpen ? "rotate-180" : ""}`} />
                                                </button>

                                                {/* Hidden native input for form validation */}
                                                <input
                                                    type="text"
                                                    required
                                                    readOnly
                                                    value={formData.service_type}
                                                    className="absolute opacity-0 w-0 h-0 pointer-events-none"
                                                    tabIndex={-1}
                                                />

                                                {serviceDropdownOpen && (
                                                    <div className="absolute z-50 top-full mt-2 w-full rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl overflow-hidden">
                                                        <div className="max-h-64 overflow-y-auto py-2 scrollbar-hide">
                                                            {(services as Array<{ key: string; id?: string; title_ar: string; title_en: string }>).map((s) => (
                                                                <button
                                                                    key={s.id || s.key}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setFormData({ ...formData, service_type: s.key });
                                                                        setServiceDropdownOpen(false);
                                                                    }}
                                                                    className={`w-full text-start px-5 py-3 text-sm font-bold transition-all duration-200 ${formData.service_type === s.key
                                                                        ? "bg-orange-500/10 text-orange-500"
                                                                        : "text-white/60 hover:bg-white/5 hover:text-white"
                                                                        }`}
                                                                >
                                                                    {lang === "ar" ? s.title_ar : s.title_en}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-white/40 uppercase tracking-widest px-1">{lang === "ar" ? "الميزانية المتوقعة" : "Expected Budget"}</label>
                                            <input
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                className={inputClass}
                                                placeholder="e.g. 500$ - 1000$"
                                            />
                                        </div>
                                    </div>
                                )}

                                {formData.message_type === "complaint" && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-white/40 uppercase tracking-widest px-1">{lang === "ar" ? "رقم الطلب أو المشروع (اختياري)" : "Order/Project ID (Optional)"}</label>
                                        <input
                                            value={formData.order_id}
                                            onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                                            className={inputClass}
                                            placeholder={lang === "ar" ? "رقم المشروع" : "Project Reference"}
                                        />
                                    </div>
                                )}

                                {formData.message_type === "suggestion" && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-white/40 uppercase tracking-widest px-1">{lang === "ar" ? "عنوان الفكرة" : "Idea Title"}</label>
                                        <input
                                            required
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className={inputClass}
                                            placeholder={lang === "ar" ? "ما هو عنوان اقتراحك؟" : "What is your suggestion title?"}
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-white/40 uppercase tracking-widest px-1">
                                        {formData.message_type === "request" ? (lang === "ar" ? "تفاصيل المشروع" : "Project Details") : (lang === "ar" ? "التفاصيل" : "Details")}
                                    </label>
                                    <textarea
                                        required
                                        rows={5}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className={inputClass + " resize-none"}
                                        placeholder={lang === "ar" ? "اكتب التفاصيل هنا..." : "Write details here..."}
                                    />
                                </div>

                                <div className="flex justify-center pt-4">
                                    <button
                                        disabled={loading}
                                        type="submit"
                                        className="group relative px-10 py-5 rounded-[2rem] bg-orange-500 text-white font-black uppercase tracking-widest overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(249,115,22,0.4)] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center min-w-[200px]"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                        <span className="relative z-10 flex items-center gap-3">
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                                                    {lang === "ar" ? "إرسال الآن" : "Send Now"}
                                                </>
                                            )}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default RequestPage;
