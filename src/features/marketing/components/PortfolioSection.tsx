import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import CaseStudyModal from "@/components/shared/CaseStudyModal";
import { toDirectImageUrl } from "@/lib/gdrive";
import { useNavigate } from "react-router-dom";
import ProjectCard from "./ProjectCard";

const PortfolioSection = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const { data: dbProjects = [] } = useQuery({
    queryKey: ["featured_projects"],
    queryFn: async () => {
      // Try to filter by is_featured if column exists, otherwise just get top 6
      const { data, error } = await supabase.from("projects").select("*").order("display_order");
      if (error) return [];
      
      // If matches featured criteria (or just limited for home)
      const featured = data.filter((p: any) => p.is_featured === true);
      return featured.length > 0 ? featured : data.slice(0, 6);
    },
  });

  const projects = dbProjects;

  const filters = [
    { key: "all", label: t.portfolio.all },
    { key: "montage", label: t.portfolio.montage },
    { key: "motion", label: t.portfolio.motion },
    { key: "design", label: t.portfolio.design },
  ];

  const filteredProjects = activeFilter === "all" ? projects : projects.filter(p => p.category === activeFilter);

  const { data: designs } = useQuery({
    queryKey: ["section_designs"],
    queryFn: async () => {
      const { data } = await supabase.from("site_content").select("value_en").eq("key", "section_designs").maybeSingle();
      if (!data?.value_en) return null;
      try { return JSON.parse(data.value_en); } catch (e) { return null; }
    }
  });

  const portfolioDesign = designs?.portfolio || { columnsDesktop: "3", columnsTablet: "2", columnsMobile: "1", gap: "gap-6" };

  const getGridClass = () => {
    return `grid grid-cols-${portfolioDesign.columnsMobile} sm:grid-cols-${portfolioDesign.columnsTablet} lg:grid-cols-${portfolioDesign.columnsDesktop} ${portfolioDesign.gap}`;
  };

  return (
    <section id="portfolio" className="relative py-24 px-4" ref={ref}>
      <div className="container mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-3">{t.portfolio.title}</h2>
          <p className="text-muted-foreground text-lg">{t.portfolio.subtitle}</p>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={isInView ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.5, delay: 0.2 }} 
            className="flex items-center gap-4 bg-white/5 p-2 rounded-[2rem] border border-white/5 w-fit mx-auto mb-12 overflow-hidden flex-wrap md:flex-nowrap"
        >
            <div className="flex flex-wrap items-center gap-2">
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
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            </div>
        </motion.div>

        <div className={getGridClass()}>
          {filteredProjects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} lang={lang} isInView={isInView} onSelect={() => setSelectedProject(project)} />
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.8 }} className="mt-16 text-center">
            <button 
                onClick={() => navigate("/projects")}
                className="group flex items-center gap-2 mx-auto px-8 py-3 rounded-full glass hover:bg-orange-500/10 transition-all font-bold text-orange-500 border-orange-500/20"
            >
                {lang === "ar" ? "عرض جميع الأعمال" : "View All Projects"}
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${lang === "ar" ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
            </button>
        </motion.div>
      </div>

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
    </section>
  );
};

export default PortfolioSection;
