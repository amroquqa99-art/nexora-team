import { motion } from "framer-motion";
import { ArrowDown, CheckCircle2, ShieldCheck, Zap, ArrowRight, Play } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const scrollToAbout = () => {
    const el = document.querySelector("#about");
    if (el) {
      const navHeight = 100;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - navHeight;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <section id="home" className="relative min-h-[110vh] flex flex-col items-center justify-center pt-20 overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center max-w-4xl mx-auto mt-10">
            {/* Center Content */}
            <div className="text-center space-y-10 flex flex-col items-center">
              
              {/* 1. Name Tag */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="flex items-center justify-center gap-3 bg-orange-500/10 border border-orange-500/20 px-6 py-2.5 rounded-full w-fit group z-20"
              >
                <Zap className="w-4 h-4 text-orange-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-[0.3em] text-orange-400 group-hover:text-orange-300 transition-colors">
                  {lang === "ar" ? "وكالة نكسورا الرقمية الفائقة" : "Nexora Ultra-Digital Agency"}
                </span>
              </motion.div>

              {/* 2. Main Title, Subtitle, and Overlapping Logo */}
              <div className="relative z-20 flex flex-col items-center justify-center py-10 md:py-20 w-full mb-8">
                
                {/* Large Center Logo (Background Layer) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
                >
                  <div className="absolute inset-0 bg-orange-500/10 blur-[100px] rounded-full animate-pulse max-w-lg mx-auto aspect-square scale-150" />
                  <img 
                    src="/logo.png" 
                    alt="Nexora Logo" 
                    className="h-64 sm:h-80 md:h-[28rem] lg:h-[32rem] w-auto object-contain filter drop-shadow-[0_0_50px_rgba(249,115,22,0.5)] opacity-[0.15] md:opacity-[0.20]" 
                  />
                </motion.div>

                {/* Text Content (Foreground Layer) */}
                <div className="space-y-8 relative z-10 w-full px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                  >
                    <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-[7rem] font-black gradient-text-nexora leading-[0.9] tracking-tighter text-glow drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                      {t.hero.title}
                    </h1>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-xl md:text-3xl text-white/80 font-bold max-w-3xl mx-auto leading-relaxed italic drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
                  >
                    {t.hero.subtitle}
                  </motion.p>
                </div>
              </div>

              {/* 4. Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-wrap items-center justify-center gap-6 pt-4 w-full relative z-20"
              >
                <button
                  onClick={() => navigate("/request")}
                  className="group relative px-12 py-6 rounded-[2rem] bg-orange-500 text-white font-black uppercase tracking-widest overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(249,115,22,0.5)]"
                >
                  <span className="relative z-10 flex items-center gap-3 text-lg">
                    {lang === "ar" ? "تواصل معنا الآن" : "Start Deployment"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </button>

                <button
                  onClick={() => navigate("/projects")}
                  className="group px-10 py-6 rounded-[2rem] glass-2 border-white/5 text-white/70 font-black uppercase tracking-widest hover:text-white transition-all hover:bg-white/10"
                >
                  <div className="flex items-center gap-3 text-lg">
                    <Play className="w-5 h-5 text-orange-500 fill-orange-500" />
                    {lang === "ar" ? "شاهد أعمالنا" : "View Portfolio"}
                  </div>
                </button>
              </motion.div>
            </div>

          </div>
        </div>
      </div>

      {/* Trust Bar */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="w-full mt-20 py-10 bg-black/40 backdrop-blur-md border-y border-white/5"
      >
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-10 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
            <TrustBadge icon={ShieldCheck} text={lang === 'ar' ? 'حماية فائقة' : 'Secure Ops'} />
            <TrustBadge icon={CheckCircle2} text={lang === 'ar' ? 'جودة معتمدة' : 'Verified Quality'} />
            <TrustBadge icon={Zap} text={lang === 'ar' ? 'تنفيذ صاعق' : 'Lightning Speed'} />
            <TrustBadge icon={CheckCircle2} text={lang === 'ar' ? 'إبداع بلا حدود' : 'Unlimited Creative'} />
          </div>
        </div>
      </motion.div>

      <motion.button
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        onClick={scrollToAbout}
        className="mt-10 mb-20 p-4 bg-white/5 border border-white/10 rounded-full text-white/30 hover:text-orange-500 hover:border-orange-500/50 transition-all"
      >
        <ArrowDown className="w-5 h-5" />
      </motion.button>
    </section>
  );
};

const TrustBadge = ({ icon: Icon, text }: { icon: React.ElementType, text: string }) => (
  <div className="flex items-center gap-3">
    <Icon className="w-6 h-6 text-white" />
    <span className="text-xs font-black uppercase tracking-[0.3em] text-white">{text}</span>
  </div>
);

export default HeroSection;
