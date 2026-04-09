import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Palette, Layers, Zap, Star } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useServices } from "@/hooks/useDynamicContent";
import { getIcon } from "@/lib/icons";
import { toDirectImageUrl } from "@/lib/gdrive";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AboutSection = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { data: dbServices } = useServices();
  const { data: designs } = useQuery({
    queryKey: ["section_designs"],
    queryFn: async () => {
      const { data } = await supabase.from("site_content").select("value_en").eq("key", "section_designs").maybeSingle();
      if (!data?.value_en) return null;
      try { return JSON.parse(data.value_en); } catch (e) { return null; }
    }
  });

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const aboutDesign = designs?.about || { columnsDesktop: "6", columnsTablet: "4", columnsMobile: "2", gap: "gap-6", iconSize: "w-16 h-16" };

  const getGridClass = () => {
    return `grid grid-cols-${aboutDesign.columnsMobile} sm:grid-cols-${aboutDesign.columnsTablet} lg:grid-cols-${aboutDesign.columnsDesktop} ${aboutDesign.gap}`;
  };

  const fallbackServices = [
    { key: "branding", icon: Palette, title: lang === "ar" ? "بناء العلامة التجارية" : "Branding", desc: "Digital Identity", color: "from-orange-500 to-orange-700", icon_url: null },
    { key: "motion", icon: Layers, title: lang === "ar" ? "الموشن جرافيك" : "Motion Graphics", desc: "Visual Motion", color: "from-orange-600 to-orange-800", icon_url: null },
    { key: "montage", icon: Zap, title: lang === "ar" ? "المونتاج الاحترافي" : "Video Editing", desc: "Post-Production", color: "from-orange-400 to-orange-600", icon_url: null },
  ];

  const services = dbServices && dbServices.length > 0
    ? dbServices.map(s => ({
      key: s.key,
      id: s.id,
      icon: getIcon(s.icon),
      title: lang === 'ar' ? s.title_ar : s.title_en,
      desc: lang === 'ar' ? s.description_ar : s.description_en,
      color: s.color || "from-orange-500 to-orange-600",
      icon_url: s.icon_url
    }))
    : fallbackServices.map(s => ({ ...s, id: "" }));

  const handleServiceClick = (id: string, key: string) => {
    navigate(`/services/${id || key}`);
  };

  return (
    <section id="about" className="relative py-32 px-6 overflow-hidden" ref={ref}>
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start mb-24">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="flex items-center gap-3 text-orange-500">
              <Star className="w-5 h-5 fill-current" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">{lang === 'ar' ? 'من نحن' : 'Who We Are'}</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight uppercase tracking-tighter">
              {t.about.title}
            </h2>
            <div className="w-20 h-2 bg-orange-500 rounded-full" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-7 space-y-8"
          >
            <p className="text-2xl md:text-3xl font-bold text-white/80 leading-relaxed italic">
              {t.about.subtitle}
            </p>
            <p className="text-lg text-white/40 leading-relaxed max-w-3xl">
              {t.about.description}
            </p>
          </motion.div>
        </div>

        <div className={getGridClass()}>
          {services.map((service, i) => {
            const Icon = service.icon || Zap;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 * i }}
                onClick={() => handleServiceClick(service.id, service.key)}
                className="glass-card-2 p-8 group cursor-pointer flex flex-col h-full border-white/5 hover:bg-orange-500/5"
              >
                <div className={`${aboutDesign.iconSize} rounded-[2rem] bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center p-4 mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative shadow-2xl overflow-hidden`}>
                  {service.icon_url ? (
                    <img
                      src={toDirectImageUrl(service.icon_url)}
                      alt={service.title}
                      className="w-full h-full object-contain relative z-10 brightness-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Icon className="w-full h-full text-white relative z-10" />
                  )}
                  <div className="absolute inset-0 bg-white/20 md:animate-pulse" />
                </div>
                <h4 className="text-xl font-black text-white tracking-tight uppercase mb-4 group-hover:text-orange-500 transition-colors uppercase tracking-widest">{service.title}</h4>
                <p className="text-xs text-white/40 leading-relaxed line-clamp-3 font-bold group-hover:text-white/60 transition-colors">
                  {service.desc}
                </p>

                <div className="mt-auto pt-8 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-orange-500 opacity-0 group-hover:opacity-100 transition-all">
                  {lang === 'ar' ? 'استكشف المزيد' : 'Deploy Service'}
                  <Zap className="w-3.5 h-3.5 fill-current" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Background Texture */}
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-y-1/2" />
    </section>
  );
};

export default AboutSection;
