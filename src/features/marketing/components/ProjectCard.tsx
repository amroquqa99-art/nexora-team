import { useState } from "react";
import { motion } from "framer-motion";
import { Play, ArrowUpRight } from "lucide-react";
import { toDirectImageUrl } from "@/lib/gdrive";

interface ProjectCardProps {
  project: any;
  index: number;
  lang: string;
  isInView: boolean;
  onSelect: () => void;
}

const ProjectCard = ({ project, index, lang, isInView, onSelect }: ProjectCardProps) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -20;
    setTilt({ x, y });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: 0.1 * index, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      onClick={onSelect}
      className="glass-card-2 overflow-hidden cursor-pointer group h-full border-white/5 bg-midnight-900/40 hover:bg-orange-500/5"
      style={{ transform: `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`, transition: "transform 0.1s ease-out" }}
    >
      <div className="relative overflow-hidden aspect-[16/10] m-3 rounded-2xl">
        <img
          src={toDirectImageUrl(project.thumbnail_url)}
          alt={lang === "ar" ? project.title_ar : project.title_en}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[0.5] group-hover:grayscale-0 shadow-2xl"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
          <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.6)]">
            <Play className="w-6 h-6 text-white fill-current" />
          </div>
        </div>

        <div className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-y-4 group-hover:translate-y-0">
          <ArrowUpRight className="w-4 h-4 text-orange-500" />
        </div>
      </div>

      <div className="p-8 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-orange-500 px-2 py-1 bg-orange-500/10 rounded-full">
            {project.category || 'Visual'}
          </span>
        </div>
        <h3 className="text-xl font-black text-white leading-tight uppercase tracking-widest group-hover:text-orange-500 transition-colors uppercase tracking-widest">
          {lang === "ar" ? project.title_ar : project.title_en}
        </h3>
        <p className="text-xs text-white/40 font-bold leading-relaxed line-clamp-2 italic">
          {lang === "ar" ? project.description_ar : project.description_en}
        </p>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
