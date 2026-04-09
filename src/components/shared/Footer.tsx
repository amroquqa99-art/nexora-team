import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getIcon } from "@/lib/icons";
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";

const Footer = () => {
    const { t, lang } = useLanguage();
    const siteName = t.common.siteName;

    const { data: socialLinks = [] } = useQuery({
        queryKey: ["public_social_links"],
        queryFn: async () => {
            const { data } = await supabase.from("social_links").select("*").order("display_order");
            return (data || []).filter(link => !link.icon?.startsWith("member:"));
        }
    });

    return (
        <footer className="relative pt-24 pb-12 px-6 overflow-hidden border-t border-white/5">
            {/* Ambient Base */}
            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent z-0" />

            <div className="container mx-auto relative z-10">
                <div className="flex flex-col items-center gap-12 text-center">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400 }}
                        className="glass-card-2 p-4 rounded-[2rem] border-white/5 bg-white/5"
                    >
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <img 
                                src="/logo.png" 
                                alt="Logo" 
                                className="h-12 w-auto object-contain filter drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] relative z-10" 
                            />
                            <span className="text-3xl font-black tracking-tighter text-white group-hover:text-orange-500 transition-colors">NEXORA</span>
                        </div>
                    </motion.div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-500">
                            {lang === 'ar' ? 'ابقَ متصلاً' : 'Operational Connectivity'}
                        </h4>
                        {socialLinks.length > 0 && (
                            <div className="flex items-center justify-center gap-4">
                                {socialLinks.map((link) => {
                                    const Icon = getIcon(link.platform || link.icon);
                                    return (
                                        <a
                                            key={link.id}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-4 rounded-2xl glass-2 border-white/5 text-white/40 hover:text-orange-500 hover:border-orange-500/50 hover:bg-orange-500/10 transition-all duration-500 group"
                                            title={link.platform}
                                        >
                                            <Icon className="w-5 h-5 transition-transform group-hover:scale-110 group-hover:rotate-6" />
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                    <div className="flex flex-col md:flex-row items-center justify-between w-full gap-8">
                        <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">
                            © {new Date().getFullYear()} <span className="text-white/60">{siteName}</span> — {t.footer.rights}.
                        </p>

                        <div className="flex items-center gap-8">
                            <Link
                                to="/admin/login"
                                className="group flex items-center gap-3 text-[9px] uppercase font-black tracking-[0.3em] text-white/20 hover:text-orange-500 transition-colors"
                            >
                                <ShieldAlert className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                                {t.footer.adminLogin}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
