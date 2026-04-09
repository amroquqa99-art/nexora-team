import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, Sparkles, Link as LinkIcon, Globe, Loader2, Users, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getIcon, getPlatformFromUrl } from "@/lib/icons";

interface SocialLink {
    id?: string;
    platform: string;
    url: string;
    icon: string;
    display_order: number;
    created_at?: string;
}

interface TeamMember {
    id: string;
    name_en: string;
    name_ar: string;
}

const emptySocial: SocialLink = { platform: "", url: "", icon: "", display_order: 0 };

const AdminSocialLinks = () => {
    const qc = useQueryClient();
    const { toast } = useToast();
    const [editing, setEditing] = useState<SocialLink | null>(null);

    const handleUrlChange = (url: string) => {
        if (!editing) return;
        
        const detectedPlatform = getPlatformFromUrl(url);
        const newEditing = { ...editing, url };
        
        // If we detected a platform and the user hasn't manually set one yet
        // or if it's a new link, auto-populate the platform name.
        if (detectedPlatform && (!editing.platform || editing.platform.trim() === "")) {
            newEditing.platform = detectedPlatform.charAt(0).toUpperCase() + detectedPlatform.slice(1);
        }
        
        setEditing(newEditing);
    };

    const { data: teamMembers = [] } = useQuery<TeamMember[]>({
        queryKey: ["admin_team_members_social"],
        queryFn: async () => {
            const { data } = await supabase.from("team_members").select("id, name_en, name_ar").order("name_en");
            return data || [];
        }
    });

    const { data: links = [], isLoading } = useQuery<SocialLink[]>({
        queryKey: ["admin_social"],
        queryFn: async () => {
            const { data, error } = await supabase.from("social_links").select("*").order("display_order");
            if (error) throw error;
            return data as SocialLink[];
        },
    });

    const saveMutation = useMutation({
        mutationFn: async (l: SocialLink) => {
            if (!l.platform || !l.url) {
                throw new Error("Platform and URL are mandatory.");
            }
            const { id, created_at, ...rest } = l;
            if (id) {
                const { error } = await supabase.from("social_links").update(rest).eq("id", id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("social_links").insert(rest);
                if (error) throw error;
            }
        },

        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin_social"] });
            qc.invalidateQueries({ queryKey: ["public_social_links"] });
            setEditing(null);
            toast({ title: "Portal Updated", description: "Network nodes synchronized." });
        },
        onError: (e: Error) => toast({ title: "Sync Error", description: e.message, variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("social_links").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin_social"] });
            qc.invalidateQueries({ queryKey: ["public_social_links"] });
            toast({ title: "Link Severed", description: "Resource decommissioned successfully." });
        },
    });

    if (isLoading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8  duration-100">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-foreground tracking-tight uppercase flex items-center gap-3">
                        <Globe className="w-6 h-6 text-orange-500" />
                        Network Nodes
                    </h2>
                    <p className="text-xs text-muted-foreground italic font-medium">Manage external social and professional touchpoints for the site and team.</p>
                </div>
                {!editing && (
                    <button
                        onClick={() => setEditing({ ...emptySocial })}
                        className="group flex items-center gap-2 px-6 py-2.5 bg-white text-black font-black text-[10px] tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all uppercase"
                    >
                        <Plus className="w-4 h-4" /> Initialize Link
                    </button>
                )}
            </div>

            {editing && (
                <div className="bg-[#0a0a0a] border border-white/5 p-8 border-orange-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4">
                        <button onClick={() => setEditing(null)} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-6 md:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Universal Resource Locator (URL)</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            placeholder="https://..."
                                            value={editing.url || ""}
                                            onChange={e => handleUrlChange(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-orange-500/50 transition-all font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Platform Identity</label>
                                    <input
                                        placeholder="Auto-detected or enter manually"
                                        value={editing.platform || ""}
                                        onChange={e => setEditing({ ...editing, platform: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-orange-500/50 transition-all font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Link Destination</label>
                                    <select
                                        value={editing.icon?.startsWith("member:") ? editing.icon : "global"}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setEditing({ ...editing, icon: val === "global" ? "" : val });
                                        }}
                                        className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-orange-500/50 transition-all font-bold appearance-none cursor-pointer"
                                    >
                                        <option value="global">Global (Footer)</option>
                                        <optgroup label="Team Personnel">
                                            {teamMembers.map((m: TeamMember) => (
                                                <option key={m.id} value={`member:${m.id}`}>{m.name_en}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Sequence Order</label>
                                    <input
                                        type="number"
                                        value={editing.display_order ?? 0}
                                        onChange={e => setEditing({ ...editing, display_order: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-orange-500/50 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center space-y-4 bg-white/[0.02] rounded-3xl border border-white/5 p-6">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Visual Feedback</label>
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-600/20 flex items-center justify-center border border-white/10 shadow-2xl group-hover:scale-110 transition-transform duration-100">
                                {(() => {
                                    const Icon = getIcon(editing.platform || editing.icon);
                                    return <Icon className="w-10 h-10 text-orange-500" />;
                                })()}
                            </div>
                            <p className="text-[9px] text-muted-foreground italic text-center">
                                {editing.icon?.startsWith("member:") ? "Linked to Personnel" : "Platform Icon Detected"}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex gap-3">
                        <button
                            onClick={() => saveMutation.mutate(editing)}
                            disabled={saveMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black text-[10px] tracking-widest py-3 rounded-xl hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all uppercase disabled:opacity-50"
                        >
                            {saveMutation.isPending ? "Transfusing..." : editing.id ? "Alter Node" : "Finalize Node"}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {links.map((l) => {
                    const isMemberLink = l.icon?.startsWith("member:");
                    const memberId = isMemberLink ? l.icon.split(":")[1] : null;
                    const member = memberId ? teamMembers.find((m: TeamMember) => m.id === memberId) : null;
                    const Icon = getIcon(l.platform || l.icon);

                    return (
                        <div key={l.id} className="bg-[#0a0a0a] border border-white/5 p-5 group hover:border-orange-500/30 transition-all flex items-center justify-between">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-orange-500/50 transition-colors shrink-0">
                                    <Icon className={`w-5 h-5 transition-colors ${isMemberLink ? "text-amber-500" : "text-muted-foreground group-hover:text-orange-500"}`} />
                                </div>
                                <div className="space-y-0.5 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-black text-[11px] tracking-wider uppercase text-foreground truncate">{l.platform}</p>
                                        {isMemberLink && <Users className="w-3 h-3 text-amber-500" />}
                                    </div>
                                    <p className="text-[9px] text-muted-foreground truncate font-mono italic">{l.url}</p>
                                    {isMemberLink && member && (
                                        <p className="text-[8px] text-amber-500/60 font-black uppercase tracking-widest truncate">Personnel: {member.name_en}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditing({ ...l })} className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-colors">
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { if (confirm("Terminate link node?")) deleteMutation.mutate(l.id); }} className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-500 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {links.length === 0 && (
                    <div className="md:col-span-3 py-20 text-center bg-[#0a0a0a] border border-white/5 border-dashed border-white/10">
                        <Globe className="w-12 h-12 text-white/5 mx-auto mb-4" />
                        <p className="text-muted-foreground text-xs italic">No active network nodes detected.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSocialLinks;


