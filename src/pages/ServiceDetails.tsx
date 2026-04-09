import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import ProjectCard from "@/features/marketing/components/ProjectCard";
import CaseStudyModal from "@/components/shared/CaseStudyModal";
import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Zap, MessageSquare, Star, ArrowRight } from "lucide-react";
import { toDirectImageUrl } from "@/lib/gdrive";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface Service {
    id: string;
    key: string;
    title_ar: string;
    title_en: string;
    description_ar: string;
    description_en: string;
    image_url: string;
}

const ServiceDetailsPage = () => {
    const { id } = useParams();
    const { lang } = useLanguage();
    const navigate = useNavigate();
    const { teamVisible } = useSiteSettings();
    const [selectedProject, setSelectedProject] = useState<any | null>(null);

    const { data: dbService, isLoading: serviceLoading } = useQuery({
        queryKey: ["service", id],
        queryFn: async () => {
            const { data } = await supabase.from("services").select("*").eq("id", id).maybeSingle();
            if (data) return data;
            const { data: byKey } = await supabase.from("services").select("*").eq("key", id).maybeSingle();
            return byKey;
        }
    });

    const service = dbService as Service;

    const { data: projects = [] } = useQuery({
        queryKey: ["service_projects", service?.key],
        enabled: !!service,
        queryFn: async () => {
            const { data } = await supabase.from("projects").select("*").eq("category", service.key).order("display_order");
            return data || [];
        }
    });

    if (serviceLoading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin shadow-[0_0_20px_rgba(249,115,22,0.4)]" />
        </div>
    );

    if (!service) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4 text-center relative z-10">
            <div className="glass-card-2 p-16 max-w-lg border-red-500/20 bg-midnight-900/60">
                <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-8 animate-pulse" />
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-6">
                    {lang === "ar" ? "الخدمة غير موجودة" : "Operation Not Found"}
                </h1>
                <button
                    onClick={() => navigate("/")}
                    className="group relative px-10 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-orange-500 transition-all duration-500 overflow-hidden"
                >
                    <span className="relative z-10">{lang === "ar" ? "العودة للقاعدة" : "Return to Base"}</span>
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-transparent text-white overflow-x-hidden selection:bg-orange-500/30">
            <Navbar teamVisible={teamVisible} />

            <main className="pt-40 pb-32 px-6 relative z-10">
                <div className="container mx-auto max-w-7xl">
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate("/")}
                        className="flex items-center gap-3 text-white/30 hover:text-orange-500 transition-all mb-12 group"
                    >
                        <div className="p-2 rounded-full glass-2 border-white/5 group-hover:border-orange-500/50">
                            {lang === "ar" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">{lang === "ar" ? "العودة للرئيسية" : "Operational Hub"}</span>
                    </motion.button>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start mb-32">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="lg:col-span-7 relative group"
                        >
                            <div className="absolute -inset-4 bg-orange-500/10 blur-[100px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                            <div className="glass-card-2 aspect-video rounded-[3rem] overflow-hidden relative border-white/5 shadow-2xl">
                                {service.image_url ? (
                                    <img
                                        src={toDirectImageUrl(service.image_url)}
                                        className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                                        alt="service banner"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-midnight-900 to-midnight-950 flex items-center justify-center">
                                        <Star className="w-40 h-40 text-white/5 animate-pulse" />
                                    </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-black via-black/20 to-transparent">
                                    <div className="flex items-center gap-4 text-orange-500 mb-4">
                                        <Zap className="w-6 h-6 fill-current" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.5em]">{lang === 'ar' ? 'نطاق الخدمة' : 'Mission Scope'}</span>
                                    </div>
                                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] group-hover:text-glow transition-all">
                                        {lang === "ar" ? service.title_ar : service.title_en}
                                    </h1>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="lg:col-span-5 space-y-10 py-10"
                        >
                            <div className="space-y-6">
                                <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-4">
                                    <span className="w-10 h-1 bg-orange-500 rounded-full" />
                                    {lang === 'ar' ? 'الرؤية الاستراتيجية' : 'Strategic Vision'}
                                </h2>
                                <p className="text-xl md:text-2xl text-white/40 italic font-bold leading-relaxed border-l-4 border-orange-500/20 pl-6">
                                    {lang === "ar" ? service.description_ar : service.description_en}
                                </p>
                            </div>

                            <button
                                onClick={() => navigate(`/request?service=${service.key}`)}
                                className="group relative w-full flex items-center justify-between px-10 py-8 rounded-[2rem] bg-orange-500 text-white font-black uppercase tracking-widest text-sm shadow-2xl hover:scale-105 transition-all duration-500"
                            >
                                <div className="flex items-center gap-6">
                                    <MessageSquare className="w-6 h-6" />
                                    <span>{lang === "ar" ? "ابدأ التنفيذ الآن" : "Initiate Protocol"}</span>
                                </div>
                                <ArrowRight className={`w-6 h-6 transition-transform group-hover:translate-x-2 ${lang === 'ar' ? 'rotate-180 group-hover:-translate-x-2' : ''}`} />
                            </button>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="glass-card-2 p-6 border-white/5 bg-white/5 space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500/60">Status</span>
                                    <p className="text-sm font-black uppercase tracking-widest text-white">Active</p>
                                </div>
                                <div className="glass-card-2 p-6 border-white/5 bg-white/5 space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500/60">Department</span>
                                    <p className="text-sm font-black uppercase tracking-widest text-white">{service.key || 'Core'}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {projects.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center justify-between mb-12">
                                <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-6 group">
                                    <Star className="w-8 h-8 text-orange-500 fill-current animate-pulse" />
                                    {lang === "ar" ? "أرشيف العمليات المشابهة" : "Operational Records"}
                                </h2>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent ml-12 hidden md:block" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {projects.map((project: any, index: number) => (
                                    <ProjectCard key={project.id} project={project} index={index} lang={lang} isInView={true} onSelect={() => setSelectedProject(project)} />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>

            <Footer />

            {selectedProject && (
                <CaseStudyModal
                    project={{
                        id: selectedProject.id,
                        title: lang === "ar" ? selectedProject.title_ar : selectedProject.title_en,
                        description: lang === "ar" ? selectedProject.description_ar : selectedProject.description_en,
                        thumbnail: toDirectImageUrl(selectedProject.thumbnail_url),
                        videoUrl: selectedProject.video_url || undefined,
                        problem_ar: (selectedProject as any).problem_ar,
                        problem_en: (selectedProject as any).problem_en,
                        solution_ar: (selectedProject as any).solution_ar,
                        solution_en: (selectedProject as any).solution_en,
                        results_ar: (selectedProject as any).results_ar,
                        results_en: (selectedProject as any).results_en,
                        tools: (selectedProject as any).tools,
                        client: (selectedProject as any).client,
                        year: (selectedProject as any).year
                    }}
                    onClose={() => setSelectedProject(null)}
                />
            )}
        </div>
    );
};

export default ServiceDetailsPage;
