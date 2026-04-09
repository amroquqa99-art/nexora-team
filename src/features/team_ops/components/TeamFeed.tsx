import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Heart, Share2, Send, Copy, Loader2, Image as ImageIcon, AtSign, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";

const TeamFeed = ({ userId }: { userId: string }) => {
    const { toast } = useToast();
    const { lang } = useLanguage();
    const queryClient = useQueryClient();
    const [newPost, setNewPost] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const [isUploadingImg, setIsUploadingImg] = useState(false);
    const [likedPosts, setLikedPosts] = useState<string[]>([]);
    const [mentionSearch, setMentionSearch] = useState<string | null>(null);
    const [showMentionSelector, setShowMentionSelector] = useState(false);

    // Comments State
    const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
    const [commentText, setCommentText] = useState("");

    const { data: members = [] } = useQuery({
        queryKey: ["team_members_list_feed"],
        queryFn: async () => {
            const { data } = await supabase.from("team_members").select("id, name_ar, name_en");
            return data || [];
        }
    });

    const { data: currentMember } = useQuery({
        queryKey: ["current_team_member_feed", userId],
        queryFn: async () => {
            const { data } = await supabase.from("team_members").select("*").eq("id", userId).maybeSingle();
            return data || { can_post_feed: true, full_name: "عضو" };
        }
    });

    const { data: posts = [], isLoading } = useQuery({
        queryKey: ["team_posts"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("team_posts" as any)
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Feed error:", error);
                return [];
            }
            return data || [];
        }
    });

    const createPostMutation = useMutation({
        mutationFn: async (content: string) => {
            // Find a valid profile ID to satisfy the FK constraint if any
            const { data: profs } = await supabase.from("profiles").select("id").limit(1);
            const validId = profs?.[0]?.id || "7eb8b15d-0000-0000-0000-000000000000";

            const { error } = await supabase.from("team_posts" as any).insert({
                user_id: validId,
                content: content,
                image_url: attachedImage,
                author_name: currentMember?.name_ar || currentMember?.name_en || currentMember?.full_name || "عضو فريق",
                likes_count: 0,
                comments_array: [],
                likes_array: []
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team_posts"] });
            setNewPost("");
            setAttachedImage(null);
            toast({ title: "تم النشر بنجاح" });
        },
        onError: (e: any) => {
            toast({ title: "خطأ", description: e.message || "حدث خطأ أثناء النشر", variant: "destructive" });
        }
    });

    const likeMutation = useMutation({
        mutationFn: async ({ postId, currentLikes, likedBy }: { postId: string, currentLikes: number, likedBy: string[] }) => {
            const isLiked = likedBy.includes(userId);
            const updatedLikes = isLiked ? likedBy.filter(id => id !== userId) : [...likedBy, userId];
            const { error } = await supabase.from("team_posts" as any)
                .update({
                    likes_count: updatedLikes.length,
                    likes_array: updatedLikes
                })
                .eq("id", postId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team_posts"] });
        }
    });

    const commentMutation = useMutation({
        mutationFn: async ({ postId, currentComments }: { postId: string, currentComments: any[] }) => {
            const newComment = {
                id: Date.now().toString(),
                text: commentText,
                author: currentMember?.name_ar || currentMember?.full_name || "عضو",
                date: new Date().toISOString()
            };
            const updated = [...(currentComments || []), newComment];
            const { error } = await supabase.from("team_posts" as any).update({ comments_array: updated }).eq("id", postId);
            if (error) throw error;
        },
        onSuccess: () => {
            setCommentText("");
            setActiveCommentPost(null);
            queryClient.invalidateQueries({ queryKey: ["team_posts"] });
            toast({ title: "تم إضافة التعليق" });
        }
    });

    const handlePost = async () => {
        if (!newPost.trim() && !attachedImage) return;
        setIsPosting(true);
        try {
            await createPostMutation.mutateAsync(newPost);
        } catch (e) {
            // Already handled via onError in mutation
        } finally {
            setIsPosting(false);
        }
    };

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingImg(true);
        try {
            const path = `feed/${Date.now()}_${file.name}`;
            const { error } = await supabase.storage.from("uploads").upload(path, file);
            if (error) throw error;
            const { data } = supabase.storage.from("uploads").getPublicUrl(path);
            setAttachedImage(data.publicUrl);
            toast({ title: "تم إرفاق الصورة" });
        } catch (err: any) {
            toast({ title: "خطأ بالرفع", description: err.message, variant: "destructive" });
        } finally {
            setIsUploadingImg(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "تم نسخ النص!" });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            {currentMember?.can_post_feed !== false && (
                <div className="glass-card p-6 bg-white/[0.01] border-orange-500/10 space-y-4 shadow-xl">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/20 to-rose-500/20 flex-shrink-0 flex items-center justify-center border border-orange-500/20">
                            <span className="font-black text-orange-500">{currentMember?.name_ar?.[0] || 'N'}</span>
                        </div>
                        <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder="ماذا يدور في ذهنك اليوم؟ للمشاركة مع الفريق..."
                            className="w-full bg-transparent border-none focus:ring-0 text-foreground resize-none pt-3 text-sm min-h-[100px] outline-none"
                        />
                    </div>
                    {attachedImage && (
                        <div className="relative w-max mb-4">
                            <img src={attachedImage} alt="Attachment" className="max-h-32 rounded-xl object-contain border border-white/10" />
                            <button onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                        </div>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 relative">
                            <label className="p-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-orange-500 transition-all cursor-pointer">
                                {isUploadingImg ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                                <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
                            </label>

                            <div className="relative">
                                <button
                                    className={`p-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-orange-500 transition-all font-mono font-bold ${showMentionSelector ? 'text-orange-500 bg-white/5' : ''}`}
                                    onClick={() => setShowMentionSelector(!showMentionSelector)}
                                >
                                    <AtSign className="w-5 h-5" />
                                </button>

                                {showMentionSelector && (
                                    <div className="absolute top-10 right-0 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-in zoom-in duration-200">
                                        <p className="px-3 py-1 text-[8px] font-black uppercase text-muted-foreground/50 tracking-widest border-b border-white/5 mb-1">{lang === "ar" ? "أشر إلى عضو" : "Mention Member"}</p>
                                        <div className="max-h-40 overflow-y-auto scrollbar-hide">
                                            {members.map((m: any) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => {
                                                        setNewPost(prev => prev + ` @${lang === "ar" ? m.name_ar : m.name_en}`);
                                                        setShowMentionSelector(false);
                                                    }}
                                                    className="w-full text-start px-3 py-2 text-[10px] font-bold hover:bg-orange-500/10 hover:text-orange-500 transition-colors"
                                                >
                                                    {lang === "ar" ? m.name_ar : m.name_en}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handlePost}
                            disabled={isPosting || (!newPost.trim() && !attachedImage)}
                            className="px-6 py-2 rounded-xl bg-orange-600 font-bold text-xs tracking-widest text-white uppercase hover:shadow-[0_0_15px_rgba(234,88,12,0.4)] transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            نشر التحديث
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
                    ) : posts.map((post: any) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-6 bg-white/[0.01] border-white/5 group hover:border-orange-500/10 transition-all space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                        <span className="text-muted-foreground text-xs font-black">{post.author_name ? post.author_name[0] : 'T'}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground">{post.author_name || "عضو فريق"}</h4>
                                        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">{new Date(post.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm leading-relaxed text-foreground/90 group-hover:text-foreground transition-colors whitespace-pre-wrap">
                                {post.content}
                            </p>

                            {post.image_url && (
                                <div className="mt-4">
                                    <img src={post.image_url} alt="Post image" className="max-h-80 rounded-2xl object-contain border border-white/5 mx-auto" />
                                </div>
                            )}

                            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                                <button
                                    onClick={() => {
                                        const likedBy = (post.likes_array as string[]) || [];
                                        likeMutation.mutate({ postId: post.id, currentLikes: post.likes_count || 0, likedBy });
                                    }}
                                    className={`flex items-center gap-2 text-xs font-black transition-colors ${(post.likes_array as string[] || []).includes(userId) ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500'}`}
                                >
                                    <Heart className={`w-4 h-4 ${(post.likes_array as string[] || []).includes(userId) ? 'fill-rose-500' : ''}`} />
                                    <span>{post.likes_count || 0}</span>
                                </button>

                                <button
                                    onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                                    className="flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-orange-500 transition-colors"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>{(post.comments_array || []).length}</span>
                                </button>

                                <button
                                    onClick={() => handleCopy(post.content)}
                                    className="flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-white transition-colors"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={() => handleCopy(window.location.href)}
                                    className="flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-orange-500 transition-colors ml-auto"
                                >
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>

                            {activeCommentPost === post.id && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-4 border-t border-white/5 space-y-4">
                                    {(post.comments_array || []).map((cmt: any, idx: number) => (
                                        <div key={idx} className="bg-black/30 p-3 rounded-xl flex gap-3">
                                            <div className="w-6 h-6 shrink-0 rounded-full bg-orange-500/20 flex items-center justify-center mt-1">
                                                <span className="text-[8px] font-black text-orange-500">{cmt.author?.[0]}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold">{cmt.author}</span>
                                                    <span className="text-[8px] text-muted-foreground">{new Date(cmt.date).toLocaleTimeString()}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{cmt.text}</p>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex gap-2 pt-2">
                                        <input
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') commentMutation.mutate({ postId: post.id, currentComments: post.comments_array }); }}
                                            placeholder="أضف تعليقاً..."
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-orange-500/50"
                                        />
                                        <button
                                            onClick={() => commentMutation.mutate({ postId: post.id, currentComments: post.comments_array })}
                                            disabled={!commentText.trim()}
                                            className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                                        >
                                            إرسال
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TeamFeed;
