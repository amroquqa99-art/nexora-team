import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Users, UserPlus, Star } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import JoinTeamForm from "@/features/crm/components/JoinTeamForm";
import { toDirectImageUrl } from "@/lib/gdrive";
import { getIcon } from "@/lib/icons";

interface TeamSectionProps {
  teamVisible?: boolean;
  joinVisible?: boolean;
}

const TeamSection = ({ teamVisible = true, joinVisible = true }: TeamSectionProps) => {
  const { t, lang } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [showJoinForm, setShowJoinForm] = useState(false);

  const { data: members = [] } = useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) return [];
      return data || [];
    },
    enabled: teamVisible
  });

  const { data: allSocial = [] } = useQuery({
    queryKey: ["public_social_links"],
    queryFn: async () => {
      const { data } = await supabase.from("social_links").select("*").order("display_order");
      return data || [];
    }
  });

  const { data: designs } = useQuery({
    queryKey: ["section_designs"],
    queryFn: async () => {
      const { data } = await supabase.from("site_content").select("value_en").eq("key", "section_designs").maybeSingle();
      if (!data?.value_en) return null;
      try { return JSON.parse(data.value_en); } catch (e) { return null; }
    }
  });

  const teamDesign = designs?.team || { columnsDesktop: "4", columnsTablet: "2", columnsMobile: "1", gap: "gap-8" };

  const getGridClass = () => {
    return `grid grid-cols-${teamDesign.columnsMobile} sm:grid-cols-${teamDesign.columnsTablet} lg:grid-cols-${teamDesign.columnsDesktop} xl:grid-cols-${teamDesign.columnsDesktop} ${teamDesign.gap} mb-20`;
  };

  if (!teamVisible && !joinVisible) return null;

  return (
    <section id="team" className="relative py-32 px-6" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center mb-24 space-y-6"
        >
          <div className="flex items-center gap-3 text-orange-500">
            <Users className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-[0.4em]">{lang === 'ar' ? 'فريق القيادة' : 'Operational Leads'}</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter">
            {t.team.title}
          </h2>
          {teamVisible && members.length > 0 && (
            <p className="text-xl text-white/40 font-bold italic max-w-3xl">
              {t.team.subtitle}
            </p>
          )}
        </motion.div>

        {teamVisible && (
          members.length > 0 ? (
            <div className={getGridClass()}>
              {members.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
                  className="glass-card-2 p-10 text-center group border-white/5 hover:bg-orange-500/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-20 transition-opacity">
                    <Star className="w-12 h-12 text-orange-500" />
                  </div>

                  <div className="w-40 h-40 mx-auto mb-8 rounded-[3rem] overflow-hidden border border-white/10 group-hover:border-orange-500/50 transition-all duration-700 shadow-2xl relative">
                    <img
                      src={toDirectImageUrl(member.image_url)}
                      alt={lang === "ar" ? member.name_ar : member.name_en}
                      className="w-full h-full object-cover grayscale-[0.8] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent mix-blend-multiply group-hover:opacity-0 transition-opacity" />
                  </div>

                  <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2 group-hover:text-orange-500 transition-colors">
                    {lang === "ar" ? member.name_ar : member.name_en}
                  </h3>
                  <p className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-8 bg-white/5 py-2.5 px-6 rounded-full w-fit mx-auto transition-all group-hover:bg-orange-500/10 group-hover:text-orange-500">
                    {lang === "ar" ? member.role_ar : member.role_en}
                  </p>

                  <div className="flex items-center justify-center gap-4">
                    {allSocial
                      .filter(s => s.icon === `member:${member.id}`)
                      .map(link => {
                        const Icon = getIcon(link.platform);
                        return (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-500 transition-all active:scale-90"
                          >
                            <Icon className="w-4 h-4" />
                          </a>
                        );
                      })
                    }
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center mb-12 py-32 glass-card-2 border-white/5 bg-white/5">
              <Users className="w-20 h-20 mx-auto text-white/10 mb-6" />
              <p className="text-white/20 font-black uppercase tracking-widest">{lang === "ar" ? "سيتم إضافة أعضاء الفريق قريباً" : "Intel Coming Soon"}</p>
            </div>
          )
        )}

        {joinVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mt-10"
          >
            <button
              onClick={() => setShowJoinForm(true)}
              className="group relative flex items-center gap-4 mx-auto px-12 py-6 rounded-[2.5rem] bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.3em] overflow-hidden transition-all duration-500 hover:border-orange-500/50"
            >
              <UserPlus className="w-5 h-5 text-orange-500" />
              <span className="text-xs">{t.team.joinUs}</span>
              <div className="absolute inset-0 bg-orange-500/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
            </button>
          </motion.div>
        )}
      </div>

      <JoinTeamForm open={showJoinForm} onClose={() => setShowJoinForm(false)} />
    </section>
  );
};

export default TeamSection;
