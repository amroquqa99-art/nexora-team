import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Database, RefreshCw, Loader2, Power, Users, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminContent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const { data: content = [], isLoading } = useQuery({
    queryKey: ["admin_site_content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("*").order("key");
      if (error) throw error;
      return data;
    }
  });

  const teamVisible = content.find(c => c.key === "team_section_visible")?.value_en !== "false";
  const joinVisible = content.find(c => c.key === "join_team_visible")?.value_en !== "false";

  const toggleMutation = useMutation({
    mutationFn: async ({ key, current }: { key: string, current: boolean }) => {
      const newValue = (!current).toString();
      const { data: existing } = await supabase.from("site_content").select("id").eq("key", key).maybeSingle();

      if (existing) {
        const { error } = await supabase.from("site_content").update({ value_en: newValue, value_ar: newValue }).eq("key", key);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_content").insert({ key, value_en: newValue, value_ar: newValue });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_site_content"] });
      queryClient.invalidateQueries({ queryKey: ["team_section_visible"] });
      queryClient.invalidateQueries({ queryKey: ["join_team_visible"] });
      toast({ title: "Update Applied", description: "Visibility status committed to production." });
    },
    onError: (e: any) => toast({ title: "Policy Error", description: e.message, variant: "destructive" })
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      setSyncing(true);
      const response = await fetch('/src/i18n/translations.ts');
      const text = await response.text();

      const keys = [
        { k: 'common.siteName', ar: 'NEXORA', en: 'NEXORA' },
        { k: 'hero.title', ar: 'NEXORA', en: 'NEXORA' },
        { k: 'hero.subtitle', ar: 'نصنع الإبداع الذي يُحدث الفرق', en: 'Crafting Creativity That Makes a Difference' },
        { k: 'hero.description', ar: 'فريق تسويقي إبداعي متخصص في بناء الهويات البصرية، إنتاج المحتوى، وإدارة الحملات الرقمية. نحوّل رؤيتك إلى واقع مؤثر.', en: 'A creative marketing team specializing in brand identity, content production, and digital campaign management. We turn your vision into impactful reality.' },
        { k: 'hero.cta', ar: 'اكتشف خدماتنا', en: 'Discover Our Services' },
        { k: 'about.title', ar: 'من نحن', en: 'About Us' },
        { k: 'about.subtitle', ar: 'فريق تسويقي إبداعي يبني العلامات التجارية', en: 'A creative marketing team building brands' },
        { k: 'indexCta.title', ar: 'هل أنت مستعد لمشروعك القادم؟', en: 'Ready for Your Next Project?' },
        { k: 'indexCta.requestBtn', ar: 'اطلب خدمتك الآن', en: 'Request Now' },
        { k: 'indexCta.suggestionBtn', ar: 'تقديم اقتراح', en: 'Submit Suggestion' }
      ];

      for (const item of keys) {
        const { data: existing } = await supabase.from("site_content").select("id").eq("key", item.k).maybeSingle();
        if (existing) {
          await supabase.from("site_content").update({ value_ar: item.ar, value_en: item.en }).eq("key", item.k);
        } else {
          await supabase.from("site_content").insert({ key: item.k, value_ar: item.ar, value_en: item.en });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_site_content"] });
      toast({ title: "✓ Sync Complete", description: "Core site strings updated from translations file." });
      setSyncing(false);
    },
    onError: (e: any) => {
      toast({ title: "Sync failed", description: e.message, variant: "destructive" });
      setSyncing(false);
    }
  });

  const updateContentMutation = useMutation({
    mutationFn: async ({ id, ar, en }: { id: string, ar: string, en: string }) => {
      const { error } = await supabase.from("site_content").update({ value_ar: ar, value_en: en }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_site_content"] });
      toast({ title: "Saved", description: "Content updated successfully." });
    }
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
    </div>
  );

  return (
    <div className="space-y-10  duration-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/5">

        {/* Team Visibility Toggle */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-black text-xs tracking-widest uppercase flex items-center gap-2 group-hover:text-orange-500 transition-colors">
                <Users className="w-4 h-4" />
                إظهار / إخفاء صفحة الفريق
              </h3>
              <p className="text-[10px] text-muted-foreground/60 italic">التحكم بظهور قسم الفريق في الصفحة الرئيسية والقائمة</p>
            </div>
            <button
              onClick={() => toggleMutation.mutate({ key: "team_section_visible", current: teamVisible })}
              className={`relative w-14 h-7 rounded-full transition-all duration-100 overflow-hidden border ${teamVisible ? 'bg-orange-500/20 border-orange-500/40' : 'bg-white/5 border-white/10'}`}
            >
              <div className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full transition-all duration-100 flex items-center justify-center ${teamVisible ? 'left-8 bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)]' : 'left-1 bg-muted-foreground/40'}`}>
                <Power className={`w-2.5 h-2.5 ${teamVisible ? 'text-black' : 'text-white/20'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Join Team Toggle (NEW) */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-black text-xs tracking-widest uppercase flex items-center gap-2 group-hover:text-amber-500 transition-colors">
                <UserPlus className="w-4 h-4" />
                فتح / إغلاق باب الانضمام
              </h3>
              <p className="text-[10px] text-muted-foreground/60 italic">التحكم بظهور زر "انضم للفريق" للزوار</p>
            </div>
            <button
              onClick={() => toggleMutation.mutate({ key: "join_team_visible", current: joinVisible })}
              className={`relative w-14 h-7 rounded-full transition-all duration-100 overflow-hidden border ${joinVisible ? 'bg-amber-500/20 border-amber-500/40' : 'bg-white/5 border-white/10'}`}
            >
              <div className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full transition-all duration-100 flex items-center justify-center ${joinVisible ? 'left-8 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 'left-1 bg-muted-foreground/40'}`}>
                <Power className={`w-2.5 h-2.5 ${joinVisible ? 'text-black' : 'text-white/20'}`} />
              </div>
            </button>
          </div>
        </div>

      </div>

      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase flex items-center gap-3">
            Site Content
          </h2>
          <div className="h-1 w-12 bg-orange-500 rounded-full" />
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncing}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-neon-cyan to-neon-violet text-white font-black text-[10px] tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all uppercase disabled:opacity-50"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <RefreshCw className="w-4 h-4" />}
          جلب النصوص الأساسية
          <Database className="w-3.5 h-3.5 opacity-40" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {content.filter(c => !c.key.includes("_visible")).map((item) => (
          <div key={item.id} className="bg-[#0a0a0a] border border-white/5 p-6 bg-white/[0.01] border-white/5 hover:border-white/10 transition-all space-y-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono text-orange-500/60 uppercase tracking-widest bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/10">
                {item.key}
              </span>
              <button
                onClick={() => updateContentMutation.mutate({ id: item.id, ar: item.value_ar, en: item.value_en })}
                className="text-xs font-black text-muted-foreground hover:text-orange-500 uppercase tracking-widest transition-colors"
                disabled={updateContentMutation.isPending}
              >
                {updateContentMutation.isPending ? "SYSTEM_SYNC..." : "Save Changes"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-wider ml-1">Arabic Data</label>
                <textarea
                  dir="rtl"
                  className="w-full h-24 px-4 py-3 bg-[#0a0a0a] border border-white/5 rounded-xl text-foreground text-sm focus:outline-none focus:border-orange-500/40 transition-all resize-none leading-relaxed"
                  value={item.value_ar}
                  onChange={(e) => {
                    const newData = [...content];
                    const idx = newData.findIndex(c => c.id === item.id);
                    newData[idx].value_ar = e.target.value;
                    queryClient.setQueryData(["admin_site_content"], newData);
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-wider ml-1">English Data</label>
                <textarea
                  className="w-full h-24 px-4 py-3 bg-[#0a0a0a] border border-white/5 rounded-xl text-foreground text-sm focus:outline-none focus:border-orange-500/40 transition-all resize-none leading-relaxed"
                  value={item.value_en}
                  onChange={(e) => {
                    const newData = [...content];
                    const idx = newData.findIndex(c => c.id === item.id);
                    newData[idx].value_en = e.target.value;
                    queryClient.setQueryData(["admin_site_content"], newData);
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        {content.length === 0 && !isLoading && (
          <div className="py-20 text-center bg-[#0a0a0a] border border-white/5 border-dashed border-2 border-white/5 bg-transparent">
            <Database className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground text-xs font-black uppercase tracking-[0.3em]">No content entries yet. Run SQL repair script if you see table errors.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContent;

