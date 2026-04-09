import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Send, Upload, FileText, Download, UserCircle, RefreshCcw } from "lucide-react";

const DirectCommunication = ({ clientId, senderId, senderName, senderRole }: { clientId: string, senderId: string, senderName: string, senderRole: string }) => {
    const { lang } = useLanguage();
    const { toast } = useToast();
    const qc = useQueryClient();
    const [msgText, setMsgText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ["direct_messages", clientId],
        queryFn: async () => {
            const { data } = await supabase.from("direct_messages" as any).select("*").eq("client_id", clientId).order("created_at");
            return data || [];
        },
        refetchInterval: 3000 // Quick sync
    });

    const sendMsg = useMutation({
        mutationFn: async ({ messageText, fileUrl = null, fileName = null }: { messageText: string | null, fileUrl?: string | null, fileName?: string | null }) => {
            if (!messageText?.trim() && !fileUrl) return;

            const { error } = await supabase.from("direct_messages" as any).insert({
                client_id: clientId,
                sender_id: senderId,
                sender_role: senderRole,
                message: messageText || null,
                file_url: fileUrl,
                file_name: fileName
            });
            if (error) throw error;
        },
        onSuccess: () => {
            setMsgText("");
            qc.invalidateQueries({ queryKey: ["direct_messages", clientId] });
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        },
        onError: (e: any) => {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    });

    const uploadFile = async (file: File) => {
        toast({ title: lang === "ar" ? "جاري الرفع..." : "Uploading..." });
        const path = `direct_messages/${clientId}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("uploads").upload(path, file);
        if (uploadErr) { toast({ title: "Error", description: uploadErr.message, variant: "destructive" }); return; }
        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);

        await sendMsg.mutateAsync({ messageText: null, fileUrl: urlData.publicUrl, fileName: file.name });
        toast({ title: lang === "ar" ? "تم مشاركة الملف" : "File shared" });
    };

    useEffect(() => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    }, [messages]);

    return (
        <div className="flex flex-col h-[500px] bg-black/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                {isLoading && <div className="flex justify-center items-center py-20"><RefreshCcw className="w-6 h-6 animate-spin text-orange-500" /></div>}

                {messages.length === 0 && !isLoading && (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <UserCircle className="w-16 h-16 mb-4 text-orange-500" />
                        <p className="text-sm font-bold uppercase tracking-widest">{lang === "ar" ? "ابدأ المحادثة الآن" : "Start Conversation"}</p>
                    </div>
                )}

                {messages.map((m: any) => {
                    const isMe = m.sender_id === senderId;
                    const isClient = m.sender_role === "client";
                    return (
                        <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded-2xl p-4 relative group ${isMe ? "bg-gradient-to-br from-orange-600 to-orange-800 text-white rounded-br-none" : "bg-white/5 border border-white/10 text-foreground rounded-bl-none"}`}>
                                {!isMe && <p className="text-[10px] font-black uppercase tracking-widest text-orange-500/80 mb-2">{isClient ? (lang === "ar" ? "العميل" : "Client") : (lang === "ar" ? "فريق نكسورا" : "Nexora Team")}</p>}

                                {m.message && <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{m.message}</p>}

                                {m.file_url && (
                                    <a href={m.file_url} target="_blank" className="flex items-center gap-3 mt-2 bg-black/30 p-3 rounded-xl hover:bg-black/50 transition-colors">
                                        <FileText className="w-5 h-5 text-orange-400" />
                                        <span className="text-xs font-bold truncate max-w-[200px]">{m.file_name}</span>
                                        <Download className="w-4 h-4 ml-auto text-white/50" />
                                    </a>
                                )}

                                <span className="text-[9px] opacity-40 flex justify-end mt-2 font-mono">
                                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white/5 border-t border-white/5 flex items-end gap-3 backdrop-blur-xl">
                <label className="shrink-0 p-3 rounded-xl bg-white/5 hover:bg-orange-500/20 text-muted-foreground hover:text-orange-500 cursor-pointer transition-all">
                    <Upload className="w-5 h-5" />
                    <input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]) }} />
                </label>

                <textarea
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg.mutate({ messageText: msgText }); } }}
                    placeholder={lang === "ar" ? "اكتب رسالتك للمزامنة..." : "Type to sync message..."}
                    className="flex-1 bg-black/40 border-none outline-none text-sm px-5 py-3.5 rounded-xl resize-none max-h-32 text-foreground focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-muted-foreground/30 font-medium"
                    rows={1}
                />

                <button
                    onClick={() => sendMsg.mutate({ messageText: msgText })}
                    disabled={!msgText.trim() || sendMsg.isPending}
                    className="shrink-0 p-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:shadow-[0_0_25px_rgba(234,88,12,0.5)]"
                >
                    <Send className={`w-5 h-5 ${sendMsg.isPending ? 'animate-pulse' : ''}`} />
                </button>
            </div>
        </div>
    );
};

export default DirectCommunication;
