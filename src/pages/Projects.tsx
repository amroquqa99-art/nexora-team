import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Briefcase, Filter, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import ProjectCard from "@/features/marketing/components/ProjectCard";
import CaseStudyModal from "@/components/shared/CaseStudyModal";
import { toDirectImageUrl } from "@/lib/gdrive";

import { useSiteSettings } from "@/hooks/useSiteSettings";

const ProjectsPage = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { teamVisible } = useSiteSettings();
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  const { data: projects = [] } = useQuery({
    queryKey: ["all_projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").order("display_order");
      return data || [];
    },
  });

  const { data: dbServicesFetched = [] } = useQuery({
    queryKey: ["services-for-filters"],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("key, title_ar, title_en").order("display_order");
      return data || [];
    }
  });

  const fallbackServices = [
    { key: "branding", title_ar: "بناء العلامة التجارية", title_en: "Branding" },
    { key: "montage", title_ar: "المونتاج", title_en: "Montage" },
    { key: "motion", title_ar: "الموشن جرافيك", title_en: "Motion" },
  ];

  const dbServices = dbServicesFetched.length > 0 ? dbServicesFetched : fallbackServices;

  const filters = [
    { key: "all", label: lang === "ar" ? "الكل" : "All Operations" },
    ...dbServices.map((s: { key: string; title_ar: string; title_en: string }) => ({
      key: s.key,
      label: lang === "ar" ? s.title_ar : s.title_en
    }))
  ];

  const filteredProjects = activeFilter === "all" ? projects : projects.filter(p => p.category === activeFilter);

  return (
    <div className="min-h-screen bg-transparent text-white overflow-x-hidden selection:bg-orange-500/30">
      <Navbar teamVisible={teamVisible} />

      <main className="pt-40 pb-32 px-6 relative z-10">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-12 flex justify-start"
          >
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-3 text-white/30 hover:text-orange-500 transition-all group"
            >
              <div className="p-2 rounded-full glass-2 border-white/5 group-hover:border-orange-500/50">
                {lang === "ar" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">{lang === "ar" ? "العودة للقاعدة" : "Operational Hub"}</span>
            </button>
          </motion.div>

          <div className="flex flex-col items-center justify-center text-center gap-12 mb-20 max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 flex flex-col items-center">
              <div className="flex items-center justify-center gap-4 text-orange-500">
                <Briefcase className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em]">{lang === 'ar' ? 'سجل العمليات' : 'Mission Archive'}</span>
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-[0.9] text-glow">
                {lang === "ar" ? "معرض أعمالنا الكامل" : "Elite Project Gallery"}
              </h1>
              <p className="text-xl md:text-2xl text-white/40 italic font-bold leading-relaxed max-w-3xl">
                {lang === "ar" ? "استعرض أرشيف مشاريعنا وإبداعاتنا التي شكلت ملامح النجاح لعملائنا." : "Declassify our history of high-performance creative interventions across global sectors."}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 bg-white/5 p-2 rounded-[2rem] border border-white/5 w-fit overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-center gap-2">
                {filters.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`px-6 py-2.5 rounded-full text-[12px] font-black uppercase tracking-widest transition-all duration-500 ${activeFilter === f.key ? "bg-orange-500 text-white shadow-xl" : "text-white/40 hover:text-white"}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="p-3 bg-white/5 rounded-full text-white/40 hidden sm:flex items-center justify-center ms-2 flex-shrink-0">
                <Filter className="w-4 h-4" />
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} lang={lang} isInView={true} onSelect={() => setSelectedProject(project)} />
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="py-40 text-center glass-card-2 border-white/5 bg-white/5 rounded-[4rem]">
              <Briefcase className="w-20 h-20 mx-auto text-white/5 mb-8" />
              <p className="text-2xl font-black text-white/20 uppercase tracking-widest italic">No Data found in this Sector</p>
            </div>
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

export default ProjectsPage;
