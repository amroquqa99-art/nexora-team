import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, Star, Upload, Loader2, Users, Shield, Link as LinkIcon, Check, BadgeCheck, UsersRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toDirectImageUrl } from "@/lib/gdrive";
import { type Database } from "@/integrations/supabase/types";

type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];

const emptyMember: Partial<TeamMember> = {
    name_ar: "", name_en: "", role_ar: "", role_en: "", image_url: "",
    display_order: 0, rating: 0, rating_notes: "", is_active: true,
    user_id: null
};

const AdminTeam = () => {
    const qc = useQueryClient();
    const { toast } = useToast();
    const [editing, setEditing] = useState<Partial<TeamMember> | null>(null);
    const [uploading, setUploading] = useState(false);

    const { data: members = [], isLoading } = useQuery<TeamMember[]>({
        queryKey: ["admin_team"],
        queryFn: async () => {
            const { data, error } = await supabase.from("team_members").select("*").order("display_order");
            if (error) throw error;
            return data || [];
        },
    });

    const saveMutation = useMutation({
        mutationFn: async (m: Partial<TeamMember>) => {
            const { id, created_at, updated_at, ...rest } = m;
            if (id) {
                const { error } = await supabase.from("team_members").update(rest).eq("id", id);
                if (error) throw error;
            }
            else {
                const { error } = await supabase.from("team_members").insert(rest);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin_team"] });
            qc.invalidateQueries({ queryKey: ["team_members"] });
            setEditing(null);
            toast({ title: "✓ SYNCED", description: "Team personnel record successfully updated." });
        },
        onError: (e: Error) => toast({ title: "SYNC_ERROR", description: e.message, variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("team_members").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin_team"] });
            qc.invalidateQueries({ queryKey: ["team_members"] });
            toast({ title: "✓ SCRUBBED", description: "Personnel removed from active roster." });
        },
    });

    const handleImageUpload = async (file: File) => {
        setUploading(true);
        const path = `team/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from("uploads").upload(path, file);
        if (error) {
            toast({ title: "UPLOAD_FAILURE", description: error.message, variant: "destructive" });
            setUploading(false);
            return;
        }
        const { data } = supabase.storage.from("uploads").getPublicUrl(path);
        setEditing((prev: any) => ({ ...prev, image_url: data.publicUrl }));
        setUploading(false);
    };

    if (isLoading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8  duration-100">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 text-orange-500">
                        <UsersRound className="w-5 h-5 fill-current" />
                        <span className="text-xs font-black uppercase tracking-[0.5em]">Operational Roster</span>
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Personnel Management Terminal</h2>
                    <p className="text-xs text-muted-foreground italic font-medium">Manage the core talent and operational roster of NEXORA.</p>
                </div>
                {!editing && (
                    <button
                        onClick={() => setEditing({ ...emptyMember })}
                        className="group flex items-center gap-2 px-6 py-2.5 bg-white text-black font-black text-[10px] tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all uppercase"
                    >
                        <Plus className="w-4 h-4" /> Recruit New Member
                    </button>
                )}
            </div>

            {editing && (
                <div className="bg-[#0a0a0a] border border-white/5 p-8 border-orange-500/20 bg-white/[0.02] space-y-8 relative overflow-hidden">
                    <div className={`absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-orange-500 to-amber-600 opacity-[0.03] blur-[80px] pointer-events-none`} />

                    <div className="flex justify-between items-center border-b border-white/5 pb-4 relative z-10">
                        <h3 className="text-xs font-black text-orange-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <div className="w-1.5 h-3 bg-orange-500" />
                            {editing.id ? "Alter Personnel Record" : "Formalize Recruitment"}
                        </h3>
                        <button onClick={() => setEditing(null)} className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50">Personnel Identity (EN)</label>
                                <input
                                    placeholder="AMR AL-DOSARI"
                                    value={editing.name_en || ""}
                                    onChange={e => setEditing({ ...editing, name_en: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-foreground text-sm font-bold focus:outline-none focus:border-orange-500/50 transition-all  uppercase tracking-wider"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50">Operational Role (EN)</label>
                                <input
                                    placeholder="CHIEF STRATEGIST"
                                    value={editing.role_en || ""}
                                    onChange={e => setEditing({ ...editing, role_en: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-foreground text-sm font-bold focus:outline-none focus:border-orange-500/50 transition-all  uppercase tracking-widest"
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50 text-right">هوية العضو (AR)</label>
                                <input
                                    dir="rtl"
                                    placeholder="عمرو الدوسري"
                                    value={editing.name_ar || ""}
                                    onChange={e => setEditing({ ...editing, name_ar: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-foreground text-sm font-bold focus:outline-none focus:border-orange-500/50 transition-all  text-right"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50 text-right">الدور التشغيلي (AR)</label>
                                <input
                                    dir="rtl"
                                    placeholder="رئيس الإستراتيجية"
                                    value={editing.role_ar || ""}
                                    onChange={e => setEditing({ ...editing, role_ar: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-foreground text-sm font-bold focus:outline-none focus:border-orange-500/50 transition-all  text-right"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-6 items-start">
                                <div className="flex-1 space-y-4 w-full">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50">Personnel Verification Image</label>
                                    <div className="flex gap-2">
                                        <label className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 text-muted-foreground rounded-xl cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all group flex-1">
                                            <Upload className={`w-4 h-4 group-hover:text-orange-500 transition-colors ${uploading ? 'animate-bounce text-orange-500' : ''}`} />
                                            <span className="text-xs font-black tracking-widest uppercase">
                                                {uploading ? "SYNCING ASSET..." : "ATTACH BIOMETRIC"}
                                            </span>
                                            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                                        </label>
                                    </div>
                                    <input
                                        placeholder="Paste Image URL or Drive Link here"
                                        value={editing.image_url || ""}
                                        onChange={e => setEditing({ ...editing, image_url: e.target.value })}
                                        className="w-full px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-muted-foreground text-xs font-mono focus:outline-none focus:border-orange-500/30 transition-all"
                                    />
                                </div>

                                {editing.image_url && (
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-orange-500/20 bg-[#0a0a0a] p-1 group relative">
                                        <img src={toDirectImageUrl(editing.image_url)} alt="preview" className="w-full h-full object-cover rounded-full" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 md:col-span-2">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50">Performance Rating</label>
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-black/20 rounded-xl border border-white/5">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setEditing({ ...editing, rating: s })}
                                            className="p-1 hover:scale-110 transition-transform"
                                        >
                                            <Star className={`w-5 h-5 transition-all ${((editing.rating || 0) >= s) ? "text-amber-500 fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "text-muted-foreground/20"}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50">Sequence Order</label>
                                <input
                                    type="number"
                                    value={editing.display_order ?? 0}
                                    onChange={e => setEditing({ ...editing, display_order: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-foreground text-sm font-bold focus:outline-none focus:border-orange-500/50 transition-all  tabular-nums"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-10">
                            <div className="space-y-4">
                                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50">Internal Performance Dossier</label>
                                <textarea
                                    placeholder="Performance audit notes..."
                                    value={editing.rating_notes || ""}
                                    onChange={e => setEditing({ ...editing, rating_notes: e.target.value })}
                                    className="w-full px-4 py-4 bg-[#0a0a0a] border border-white/10 rounded-2xl text-foreground text-sm focus:outline-none focus:border-orange-500/50 transition-all  resize-none min-h-[100px] italic leading-relaxed"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                                <div className={`p-4 rounded-2xl border transition-all duration-100 flex items-center gap-4 cursor-pointer select-none ${editing.is_active ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-rose-500/10 border-rose-500/40 text-rose-400'}`} onClick={() => setEditing({ ...editing, is_active: !editing.is_active })}>
                                    <div className={`w-10 h-6 rounded-full relative transition-all duration-100 ${editing.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-100 ${editing.is_active ? 'right-1' : 'left-1'}`} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest leading-none">
                                        Operational Status: {editing.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-8 border-t border-white/5 relative z-10">
                        <button type="button" onClick={() => setEditing(null)} className="px-6 py-2.5 rounded-xl text-xs font-black tracking-widest text-muted-foreground hover:text-white transition-all uppercase">
                            ABORT
                        </button>
                        <button
                            onClick={() => saveMutation.mutate(editing)}
                            disabled={saveMutation.isPending}
                            className="flex items-center gap-2 px-10 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black text-xs tracking-widest rounded-xl hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all uppercase active:scale-95 disabled:opacity-50"
                        >
                            {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            COMMIT Dossier
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((m) => (
                    <div key={m.id} className={`bg-[#0a0a0a] border border-white/5 p-6 border-white/5 group transition-all duration-100 relative overflow-hidden ${!m.is_active ? "opacity-30 grayscale" : "hover:bg-white/[0.01] hover:border-white/10"}`}>

                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-100">
                            <button onClick={() => setEditing({ ...m })} className="p-2.5 bg-white/5 hover:bg-orange-500/20 text-muted-foreground hover:text-orange-500 rounded-xl border border-white/5 transition-all ">
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { if (confirm("Terminate personnel record from current mission?")) deleteMutation.mutate(m.id); }} className="p-2.5 bg-white/5 hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 rounded-xl border border-white/5 transition-all ">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="flex items-start gap-5 mb-6">
                            <div className="relative flex-shrink-0">
                                <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-orange-500 to-amber-600 relative z-10 overflow-hidden ">
                                    {m.image_url ? (
                                        <img src={toDirectImageUrl(m.image_url)} alt="" className="w-full h-full rounded-full object-cover bg-black" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-muted-foreground/20">
                                            <Users size={20} />
                                        </div>
                                    )}
                                </div>
                                {m.is_active && <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-black z-20 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3 className="font-black text-foreground tracking-tight uppercase truncate group-hover:text-orange-500 transition-colors duration-100">{m.name_en}</h3>
                                <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-widest truncate">{m.role_en}</p>

                                <div className="flex gap-0.5 mt-3">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className={`w-2.5 h-2.5 ${m.rating >= s ? "text-amber-500 fill-amber-500 shadow-[0_0_5px_currentColor]" : "text-muted-foreground/10"}`} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                            <div className="space-y-1">
                                <p className="font-bold text-foreground/40 text-xs text-right" dir="rtl">{m.name_ar}</p>
                                <p className="text-xs text-muted-foreground/30 text-right opacity-0 group-hover:opacity-100 transition-opacity" dir="rtl">{m.role_ar}</p>
                            </div>
                            {m.user_id && (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/5 text-orange-500 text-xs font-black uppercase tracking-widest rounded border border-orange-500/10">
                                    <BadgeCheck size={10} /> LINKED
                                </div>
                            )}
                        </div>

                        <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-orange-500 to-amber-600 transition-all duration-100 ${m.is_active ? 'opacity-10' : 'opacity-0'}`} style={{ width: `${(m.display_order / (members.length || 1)) * 100}%` }} />
                    </div>
                ))}
            </div>

            {members.length === 0 && !isLoading && (
                <div className="py-24 text-center bg-[#0a0a0a] border border-white/5 border-dashed border-2 border-white/5 bg-transparent ">
                    <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-xs">Personnel Void Detected</p>
                    <p className="text-[10px] text-muted-foreground/40 mt-2 font-mono italic">No members found in active roster.</p>
                </div>
            )}
        </div>
    );
};

export default AdminTeam;

