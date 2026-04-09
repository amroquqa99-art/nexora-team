import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Zap, Rocket } from "lucide-react";

const ContactCTA = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  return (
    <section className="relative py-40 px-6 overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.08)_0%,transparent_60%)]" />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="glass-card-2 p-12 md:p-24 border-white/5 bg-gradient-to-br from-midnight-900/60 to-orange-500/5 relative overflow-hidden text-center group"
        >
          {/* Floating Elements */}
          <div className="absolute top-10 left-10 opacity-10 group-hover:opacity-30 transition-opacity duration-1000 rotate-12">
            <Rocket className="w-32 h-32 text-orange-500" />
          </div>
          <div className="absolute bottom-10 right-10 opacity-10 group-hover:opacity-30 transition-opacity duration-1000 -rotate-12">
            <Zap className="w-32 h-32 text-orange-500" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto space-y-10">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-black uppercase tracking-[0.4em] text-orange-400 mb-4"
            >
              <Sparkles className="w-4 h-4" />
              {lang === "ar" ? "ابدأ رحلة التفوق الرقمي" : "Initiate Elite Operations"}
            </motion.div>

            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9] text-glow">
              {t.indexCta?.title || (lang === "ar" ? "هل أنت مستعد لنقل علامتك لمستوى آخر؟" : "Ready to Ascend Beyond the Cloud?")}
            </h2>

            <p className="text-xl md:text-2xl text-white/40 font-bold italic leading-relaxed">
              {lang === "ar"
                ? "نحن لا نبني مجرد تصاميم، نحن نبني إمبراطوريات رقمية تدوم وتتألق."
                : "We don't just build designs—we engineer digital empires that dominate and endure."}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <button
                onClick={() => navigate("/request")}
                className="group relative px-14 py-6 rounded-[2.5rem] bg-orange-500 text-white font-black uppercase tracking-widest text-sm overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(249,115,22,0.4)]"
              >
                <span className="relative z-10 flex items-center gap-4">
                  {t.indexCta?.requestBtn || (lang === "ar" ? "أطلق مشروعك الآن" : "Launch Mission")}
                  <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-2 ${lang === "ar" ? "rotate-180 group-hover:-translate-x-2" : ""}`} />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </button>

              <button
                onClick={() => navigate("/request?type=suggestion")}
                className="group px-12 py-6 rounded-[2.5rem] glass-2 border-white/5 text-white/50 font-black uppercase tracking-widest text-xs hover:text-white transition-all hover:bg-white/10"
              >
                {t.indexCta?.suggestionBtn || (lang === "ar" ? "مشاورة استراتيجية" : "Strategic Consult")}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactCTA;
