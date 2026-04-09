import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, Globe } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";

const Navbar = ({ teamVisible = true, joinVisible = true }: { teamVisible?: boolean, joinVisible?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { t, toggleLanguage, lang } = useLanguage();
  const navigate = useNavigate();

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    
    // Always show at the very top
    if (latest < 50) {
      setHidden(false);
      return;
    }

    // Hide if scrolling down, show if scrolling up
    if (latest > previous) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  const navItems = [
    { label: t.nav.home, href: "#home" },
    { label: t.nav.services, href: "#about" },
    { label: t.nav.portfolio, href: "#portfolio" },
    ...((teamVisible || joinVisible) ? [{ label: t.nav.team, href: "#team" }] : []),
    { label: t.nav.contact, href: "/request" },
  ];

  const handleNavClick = (href: string) => {
    if (href.startsWith("#")) {
      if (window.location.pathname !== "/") {
        navigate("/" + href);
      } else {
        const el = document.querySelector(href);
        if (el) {
          const navHeight = 80;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - navHeight;
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      }
    } else {
      navigate(href);
    }
    setIsOpen(false);
  };

  return (
    <motion.nav
      variants={{
        visible: { y: 0 },
        hidden: { y: "-110%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      className="fixed top-4 left-0 right-0 mx-auto z-[100] w-fit max-w-[95%] rounded-full glass-2 border-white/5 shadow-2xl transition-all duration-500"
    >
      <div className="px-6 md:px-8">
        <div className="flex items-center justify-center gap-8 md:gap-16 h-16 md:h-20">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="cursor-pointer relative group flex items-center gap-2 flex-shrink-0"
            onClick={() => handleNavClick("#home")}
          >
            <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => handleNavClick("#home")}>
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-10 md:h-12 w-auto object-contain filter drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] relative z-10" 
              />
              <span className="text-2xl md:text-3xl font-black tracking-tighter text-white group-hover:text-orange-500 transition-colors">NEXORA</span>
            </div>
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 flex-shrink-0">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className="text-white/50 hover:text-white transition-all duration-300 text-xs font-black uppercase tracking-[0.15em] relative group py-1.5"
              >
                {item.label}
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-orange-500 rounded-full group-hover:w-full transition-all duration-500" />
              </button>
            ))}

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-black text-white/50 hover:text-white hover:bg-orange-500 hover:border-orange-500 transition-all uppercase tracking-widest ms-4 shadow-xl active:scale-95"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === "ar" ? "EN" : "AR"}
            </button>
          </div>

          {/* Mobile Shell */}
          <div className="md:hidden flex items-center gap-3">
            <button onClick={toggleLanguage} className="p-1.5 text-white/30 hover:text-white bg-white/5 rounded-lg border border-white/5 transition-colors">
              <Globe className="w-4 h-4" />
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 text-orange-500 bg-orange-500/10 rounded-lg border border-orange-500/20 transition-all active:scale-90">
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 bg-midnight-950/90 backdrop-blur-3xl overflow-hidden"
          >
            <div className="px-6 py-8 space-y-6">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="block w-full text-start text-white/40 hover:text-orange-500 font-black uppercase tracking-[0.2em] text-xs transition-colors py-2"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
