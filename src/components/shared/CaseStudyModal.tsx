import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Target, Lightbulb, TrendingUp, Cpu, Calendar, User } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

type CaseStudyProps = {
  project: {
    id?: string;
    title: string;
    description: string;
    thumbnail: string;
    videoUrl?: string;
    problem_ar?: string;
    problem_en?: string;
    solution_ar?: string;
    solution_en?: string;
    results_ar?: string;
    results_en?: string;
    tools?: string[];
    client?: string;
    year?: string;
  };
  onClose: () => void;
};

const CaseStudyModal = ({ project, onClose }: CaseStudyProps) => {
  const { lang } = useLanguage();
  
  const getEmbedUrl = (url?: string) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    return url;
  };

  const embedUrl = getEmbedUrl(project.videoUrl);

  const sections = [
    { 
        icon: Target, 
        title: lang === "ar" ? "المشكلة" : "The Problem", 
        content: lang === "ar" ? project.problem_ar : project.problem_en,
        color: "text-rose-500"
    },
    { 
        icon: Lightbulb, 
        title: lang === "ar" ? "الحل" : "The Solution", 
        content: lang === "ar" ? project.solution_ar : project.solution_en,
        color: "text-neon-cyan"
    },
    { 
        icon: TrendingUp, 
        title: lang === "ar" ? "النتائج" : "Final Results", 
        content: lang === "ar" ? project.results_ar : project.results_en,
        color: "text-green-500"
    },
  ].filter(s => s.content);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center sm:p-6 lg:p-10 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-6xl min-h-[80vh] bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative"
          dir={lang === "ar" ? "rtl" : "ltr"}
        >
          {/* Close Button */}
          <button 
             onClick={onClose}
             className="absolute top-6 right-6 z-[110] p-3 rounded-2xl bg-white/5 text-white hover:bg-rose-500 transition-all hover:rotate-90 group"
          >
              <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col lg:flex-row h-full">
              {/* Media Section (Left/Top) */}
              <div className="lg:w-3/5 relative bg-black aspect-video lg:aspect-auto flex items-center justify-center group/media border-b lg:border-b-0 lg:border-r border-white/5">
                  {embedUrl ? (
                      <iframe src={embedUrl} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
                  ) : (
                      <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover opacity-60 group-hover/media:opacity-100 transition-opacity duration-1000" />
                  )}
                  {!embedUrl && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="p-8 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 backdrop-blur-md">
                              <Play className="w-12 h-12 text-neon-cyan fill-neon-cyan/20" />
                          </div>
                      </div>
                  )}
              </div>

              {/* Content Section (Right/Bottom) */}
              <div className="lg:w-2/5 p-8 lg:p-12 overflow-y-auto max-h-[80vh] space-y-12 custom-scrollbar text-right">
                  <div className="space-y-4">
                      <div className="flex items-center gap-3">
                          <span className="text-[10px] px-3 py-1 rounded-full border border-neon-cyan/30 text-neon-cyan font-black uppercase tracking-widest">Case Study</span>
                          {project.year && <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">{project.year}</span>}
                      </div>
                      <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
                          {project.title}
                      </h2>
                      <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {project.description}
                      </p>
                  </div>

                  {/* Dynamic Sections */}
                  {sections.length > 0 && (
                      <div className="space-y-8">
                          {sections.map((s, i) => (
                              <motion.div 
                                  key={i}
                                  initial={{ opacity: 0, x: lang === 'ar' ? 20 : -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.3 + (i * 0.1) }}
                                  className="space-y-3"
                              >
                                  <div className="flex items-center gap-3">
                                      <s.icon className={`w-5 h-5 ${s.color}`} />
                                      <h4 className="text-sm font-black text-white uppercase tracking-widest">{s.title}</h4>
                                  </div>
                                  <p className="text-sm text-muted-foreground/80 leading-relaxed border-r-2 border-white/5 pr-4 group-hover:border-neon-cyan transition-colors">
                                      {s.content}
                                  </p>
                              </motion.div>
                          ))}
                      </div>
                  )}

                  {/* Project Meta */}
                  <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/5">
                      <div className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground/40 mb-1">
                              <User className="w-3 h-3" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Client</span>
                          </div>
                          <p className="text-xs font-bold text-white uppercase tracking-wider">{project.client || "Nexus Partner"}</p>
                      </div>
                      <div className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground/40 mb-1">
                              <Cpu className="w-3 h-3" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Execution</span>
                          </div>
                          <p className="text-xs font-bold text-white uppercase tracking-wider">Nexora Team</p>
                      </div>
                  </div>

                  {/* Tools */}
                  {project.tools && project.tools.length > 0 && (
                      <div className="pt-6">
                        <div className="flex flex-wrap gap-2">
                             {project.tools.map((t, idx) => (
                                 <span key={idx} className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black text-muted-foreground uppercase tracking-widest hover:border-neon-cyan transition-colors">
                                     {t}
                                 </span>
                             ))}
                        </div>
                      </div>
                  )}
              </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CaseStudyModal;
