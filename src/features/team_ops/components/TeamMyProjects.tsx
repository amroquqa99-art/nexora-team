import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { ArrowLeft, Send, Upload, FileText, Download, MessageSquare, Briefcase, Users, User, Clock, Trash2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TeamTaskManager from "./TeamTaskManager";

const TeamMyProjects = ({ userId, teamMemberId }: { userId: string; teamMemberId: string }) => {
  const { lang, t } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [msgText, setMsgText] = useState("");
  const [activeTab, setActiveTab] = useState<"messages" | "files" | "tasks">("messages");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user role to handle Supervisor "See All"
  const userRole = localStorage.getItem("userRole");
  const isSupervisor = userRole === "supervisor" || userRole === "admin";

  // Fetch clients
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["team_assigned_clients", teamMemberId, isSupervisor],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;

      if (isSupervisor) return data || [];

      // Filter clients assigned to this member
      return (data || []).filter((c: any) => {
        // Only return clients (those with company or client_type, or not team members)
        const team = c.assigned_team || [];
        const isClient = c.client_type || c.company || !c.assigned_team; // Basic heuristic
        return (team.includes(teamMemberId) || team.includes(userId)) && isClient;
      });
    },
  });

  const selectedClient = clients.find((c: any) => c.id === selectedClientId);

  // Messages using direct_messages table
  const { data: messages = [] } = useQuery({
    queryKey: ["direct_messages", selectedClientId],
    enabled: !!selectedClientId,
    queryFn: async () => {
      const { data } = await supabase.from("direct_messages" as any)
        .select("*")
        .eq("client_id", selectedClientId)
        .order("created_at");
      return data || [];
    },
    refetchInterval: 3000
  });

  // Files from direct_messages table
  const { data: files = [] } = useQuery({
    queryKey: ["client_portal_files", selectedClientId],
    enabled: !!selectedClientId,
    queryFn: async () => {
      const { data } = await supabase.from("direct_messages" as any)
        .select("*")
        .not("file_url", "is", null)
        .eq("client_id", selectedClientId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    refetchInterval: 5000
  });

  const { data: teamMember } = useQuery({
    queryKey: ["my_team_member_profile", teamMemberId],
    queryFn: async () => {
      const { data } = await supabase.from("team_members").select("name_ar, name_en, id").eq("id", teamMemberId).maybeSingle();
      return data;
    },
  });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMsg = useMutation({
    mutationFn: async () => {
      if (!msgText.trim() || !selectedClientId) return;
      const { error } = await supabase.from("direct_messages" as any).insert({
        client_id: selectedClientId,
        sender_id: teamMemberId || userId,
        sender_role: "team",
        message: msgText.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => { setMsgText(""); qc.invalidateQueries({ queryKey: ["direct_messages", selectedClientId] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });

  const uploadFile = async (file: File) => {
    if (!selectedClientId) return;
    const path = `dms/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("uploads").upload(path, file);
    if (uploadErr) { toast({ title: "Error", description: uploadErr.message, variant: "destructive" }); return; }
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);

    await supabase.from("direct_messages" as any).insert({
      client_id: selectedClientId,
      sender_id: teamMemberId || userId,
      sender_role: "team",
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    });
    qc.invalidateQueries({ queryKey: ["client_portal_files", selectedClientId] });
    qc.invalidateQueries({ queryKey: ["direct_messages", selectedClientId] });
    toast({ title: "Success" });
  };

  if (selectedClientId && selectedClient) {
    return (
      <div className="h-full flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedClientId(null)}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-orange-500/20 hover:border-orange-500/50 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <User className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground">{selectedClient.full_name}</h2>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">{selectedClient.company || (lang === 'ar' ? 'عميل فردي' : 'Personal Client')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-b border-white/5 pb-4">
          <button onClick={() => setActiveTab("messages")} className={`px-6 py-3 rounded-xl text-xs font-black tracking-widest transition-all uppercase flex items-center gap-2 ${activeTab === "messages" ? "bg-orange-500 text-white" : "bg-white/5 text-muted-foreground hover:text-white"}`}>
            <MessageSquare className="w-4 h-4" /> {lang === 'ar' ? 'المحادثة' : 'Chat'}
          </button>
          <button onClick={() => setActiveTab("files")} className={`px-6 py-3 rounded-xl text-xs font-black tracking-widest transition-all uppercase flex items-center gap-2 ${activeTab === "files" ? "bg-orange-500 text-white" : "bg-white/5 text-muted-foreground hover:text-white"}`}>
            <FileText className="w-4 h-4" /> {lang === 'ar' ? 'الملفات' : 'Files'}
          </button>
          <button onClick={() => setActiveTab("tasks")} className={`px-6 py-3 rounded-xl text-xs font-black tracking-widest transition-all uppercase flex items-center gap-2 ${activeTab === "tasks" ? "bg-orange-500 text-white" : "bg-white/5 text-muted-foreground hover:text-white"}`}>
            <Briefcase className="w-4 h-4" /> {lang === 'ar' ? 'المهام' : 'Tasks'}
          </button>
        </div>

        <div className="flex-1 min-h-0">
          {activeTab === "messages" && (
            <div className="glass-card flex flex-col h-full bg-black/20 border-white/5">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((m: any) => {
                  const isMe = m.sender_id === teamMemberId || m.sender_id === userId;
                  return (
                    <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-5 py-3 ${isMe ? "bg-orange-500 text-white rounded-tr-sm" : "bg-white/10 text-foreground rounded-tl-sm"}`}>
                        {m.message && <p className="text-sm leading-relaxed">{m.message}</p>}
                        {m.file_url && (
                          <a href={m.file_url} target="_blank" className="flex items-center gap-2 bg-black/20 p-2 rounded-lg mt-2 text-xs font-bold hover:bg-black/40">
                            <FileText className="w-4 h-4" /> {m.file_name} <Download className="w-3 h-3 ml-auto" />
                          </a>
                        )}
                        <p className={`text-[9px] mt-2 opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>{new Date(m.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-white/5 bg-black/40 flex gap-2">
                <input
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMsg.mutate()}
                  placeholder={lang === 'ar' ? 'ارسل رسالة...' : 'Send message...'}
                  className="flex-1 px-5 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-orange-500 outline-none transition-all text-sm"
                />
                <label className="p-3 rounded-xl bg-white/5 border border-white/10 text-muted-foreground cursor-pointer hover:bg-white/10 hover:text-white transition-all">
                  <Upload className="w-5 h-5" />
                  <input type="file" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
                </label>
                <button
                  onClick={() => sendMsg.mutate()}
                  disabled={!msgText.trim()}
                  className="p-3 rounded-xl bg-orange-500 text-white hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <div className="glass-card p-6 bg-black/20 border-white/5 h-full overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {files.map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-orange-500/40 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground truncate max-w-[150px]">{f.file_name}</p>
                        <p className="text-[10px] text-muted-foreground">{(f.file_size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <a href={f.file_url} target="_blank" className="p-2 text-muted-foreground hover:text-white"><Download className="w-4 h-4" /></a>
                  </div>
                ))}
                {files.length === 0 && <p className="col-span-2 text-center py-10 text-muted-foreground">{lang === 'ar' ? 'لا توجد ملفات' : 'No files found'}</p>}
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="h-full bg-black/20 border border-white/5 rounded-3xl overflow-hidden">
              <TeamTaskManager teamMemberId={teamMemberId} isSupervisor={isSupervisor} overrideClientId={selectedClientId} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col pt-4">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.3)]">
          <Users className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-widest">{lang === 'ar' ? 'عملائي ومشاريعي' : 'Clients Portal'}</h2>
          <p className="text-sm text-muted-foreground font-black uppercase opacity-60 tracking-widest mt-1">Direct Access Gateway</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : clients.length === 0 ? (
        <div className="glass-card p-20 text-center border-dashed border-2 bg-transparent opacity-50">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-bold">{lang === 'ar' ? 'لا يوجد عملاء مخصصين لك حالياً' : 'No assigned clients yet.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((c: any) => (
            <button
              key={c.id}
              onClick={() => setSelectedClientId(c.id)}
              className="glass-card p-6 text-start flex flex-col gap-4 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group relative overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform bg-black/40">
                  <User className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{c.full_name}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">{c.company || 'Private User'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mt-4 pt-4 border-t border-white/5">
                <span>Access Portal</span>
                <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamMyProjects;
