import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, MessageSquare, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const AdminNotifications = () => {
    const [isOpen, setIsOpen] = useState(false);

    const { data: messages = [] } = useQuery({
        queryKey: ["unread_messages_notifications"],
        queryFn: async () => {
            const { data } = await supabase
                .from("contact_messages")
                .select("id, name, message_type, created_at")
                .eq("status", "new")
                .order("created_at", { ascending: false })
                .limit(5);
            return data || [];
        },
        refetchInterval: 15000, 
    });

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 bg-white/5 rounded-xl border border-white/10 text-muted-foreground hover:text-white transition-all group overflow-hidden"
            >
                <div className="absolute inset-0 bg-neon-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Bell className="w-5 h-5 relative z-10" />
                {messages.length > 0 && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)] " />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute left-0 top-full mt-2 w-80 bg-black/80  p-4 rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden"
                            dir="rtl"
                        >
                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3 border-b border-white/10 pb-2">
                                الإشعارات السريعة
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide text-right">
                                {messages.length === 0 ? (
                                    <p className="text-xs text-muted-foreground/60 text-center py-4 uppercase tracking-widest font-bold">لا توجد إشعارات جديدة</p>
                                ) : (
                                    messages.map((msg: any) => (
                                        <div key={msg.id} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer border-r-2 border-neon-cyan">
                                            <div className="flex items-center gap-2 mb-1">
                                                {msg.message_type === 'request' ? <MessageSquare className="w-3 h-3 text-neon-cyan" /> : <AlertCircle className="w-3 h-3 text-rose-500" />}
                                                <span className="text-xs font-bold text-white uppercase tracking-wider">{msg.name}</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">نوع الرسالة: {msg.message_type || "طلب تواصل"}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

