import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LayoutTemplate, MonitorSmartphone, Smartphone, Tablet, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const defaultSettings = {
    about: { columnsDesktop: "6", columnsTablet: "4", columnsMobile: "1", gap: "gap-4", iconSize: "w-12 h-12" },
    portfolio: { columnsDesktop: "3", columnsTablet: "2", columnsMobile: "1", gap: "gap-6" },
    team: { columnsDesktop: "4", columnsTablet: "2", columnsMobile: "1", gap: "gap-8" },
    form_order: ["request", "complaint", "suggestion"]
};

const AdminSectionDesign = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeDevice, setActiveDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
    const [localSettings, setLocalSettings] = useState<any>(null);

    const { data: dbSettings, isLoading } = useQuery({
        queryKey: ["section_designs"],
        queryFn: async () => {
            const { data, error } = await supabase.from("site_content").select("value_en").eq("key", "section_designs").maybeSingle();
            if (error) return defaultSettings;

            try {
                return data?.value_en ? JSON.parse(data.value_en) : defaultSettings;
            } catch (e) {
                return defaultSettings;
            }
        }
    });

    // Initialize local settings when dbSettings loads
    if (dbSettings && !localSettings) {
        setLocalSettings(dbSettings);
    }

    const saveMutation = useMutation({
        mutationFn: async (settings: any) => {
            const jsonStr = JSON.stringify(settings);
            const { data: existing } = await supabase.from("site_content").select("id").eq("key", "section_designs").maybeSingle();

            if (existing) {
                const { error } = await supabase.from("site_content").update({ value_en: jsonStr, value_ar: jsonStr }).eq("key", "section_designs");
                if (error) throw error;
            } else {
                const { error } = await supabase.from("site_content").insert({ key: "section_designs", value_en: jsonStr, value_ar: jsonStr });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["section_designs"] });
            toast({ title: "تم الحفظ", description: "تم تحديث إعدادات التصميم بنجاح." });
        },
        onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" })
    });

    if (isLoading || !localSettings) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
    }

    const handleUpdate = (section: string, field: string, value: string) => {
        setLocalSettings((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const sections = [
        { id: "about", title: "قسم الخدمات", hasIconSize: true },
        { id: "portfolio", title: "قسم الأعمال" },
        { id: "team", title: "قسم الفريق" }
    ];

    return (
        <div className="space-y-10  duration-100">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-orange-500">
                        <LayoutTemplate className="w-5 h-5 fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em]">UX Configuration</span>
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Section Design Terminal</h2>
                </div>

                <button
                    onClick={() => saveMutation.mutate(localSettings)}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black text-xs tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all uppercase disabled:opacity-50"
                >
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    حفظ التعديلات
                </button>
            </div>

            <div className="flex bg-[#0a0a0a] rounded-xl border border-white/5 p-1 w-max">
                <button onClick={() => setActiveDevice("desktop")} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black tracking-widest uppercase transition-all ${activeDevice === "desktop" ? "bg-white/10 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" : "text-muted-foreground hover:text-white"}`}>
                    <MonitorSmartphone className="w-4 h-4" /> كمبيوتر
                </button>
                <button onClick={() => setActiveDevice("tablet")} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black tracking-widest uppercase transition-all ${activeDevice === "tablet" ? "bg-white/10 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" : "text-muted-foreground hover:text-white"}`}>
                    <Tablet className="w-4 h-4" /> تابلت
                </button>
                <button onClick={() => setActiveDevice("mobile")} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black tracking-widest uppercase transition-all ${activeDevice === "mobile" ? "bg-white/10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "text-muted-foreground hover:text-white"}`}>
                    <Smartphone className="w-4 h-4" /> جوال
                </button>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 p-6 border-white/5 bg-white/[0.01] mb-6">
                <h3 className="text-xl font-bold mb-6 text-foreground border-b border-white/5 pb-4">ترتيب خيارات نموذج التواصل</h3>
                <div className="flex flex-col gap-2 max-w-sm">
                    {(localSettings.form_order || defaultSettings.form_order).map((key: string, idx: number) => {
                        const currentOrder = localSettings.form_order || defaultSettings.form_order;
                        const up = () => {
                            if (idx === 0) return;
                            const newOrder = [...currentOrder];
                            [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
                            setLocalSettings((prev: any) => ({ ...prev, form_order: newOrder }));
                        };
                        const down = () => {
                            if (idx === currentOrder.length - 1) return;
                            const newOrder = [...currentOrder];
                            [newOrder[idx + 1], newOrder[idx]] = [newOrder[idx], newOrder[idx + 1]];
                            setLocalSettings((prev: any) => ({ ...prev, form_order: newOrder }));
                        };

                        const labels: any = {
                            request: "طلب خدمة",
                            complaint: "تقديم شكوى",
                            suggestion: "اقتراح فكرة"
                        };

                        return (
                            <div key={key} className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-white/10 rounded-xl">
                                <span className="text-xs font-bold text-foreground">{labels[key]}</span>
                                <div className="flex gap-1">
                                    <button onClick={up} disabled={idx === 0} className="px-2 py-1 bg-white/5 rounded text-xs hover:bg-white/10 disabled:opacity-30">↑</button>
                                    <button onClick={down} disabled={idx === currentOrder.length - 1} className="px-2 py-1 bg-white/5 rounded text-xs hover:bg-white/10 disabled:opacity-30">↓</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-6">
                {sections.map((section) => (
                    <div key={section.id} className="bg-[#0a0a0a] border border-white/5 p-6 border-white/5 bg-white/[0.01]">
                        <h3 className="text-xl font-bold mb-6 text-foreground border-b border-white/5 pb-4">{section.title}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="space-y-3">
                                <label className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest">عدد الأعمدة</label>
                                <select
                                    value={localSettings[section.id]?.[`columns${activeDevice.charAt(0).toUpperCase() + activeDevice.slice(1)}` as "columnsDesktop" | "columnsTablet" | "columnsMobile"] || "1"}
                                    onChange={(e) => handleUpdate(section.id, `columns${activeDevice.charAt(0).toUpperCase() + activeDevice.slice(1)}`, e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                                >
                                    {[1, 2, 3, 4, 5, 6].map(num => (
                                        <option key={num} value={num.toString()}>{num} عمود</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest">المسافات (Gap)</label>
                                <select
                                    value={localSettings[section.id]?.gap || "gap-4"}
                                    onChange={(e) => handleUpdate(section.id, "gap", e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                                >
                                    <option value="gap-2">صغير (8px)</option>
                                    <option value="gap-4">متوسط (16px)</option>
                                    <option value="gap-6">كبير (24px)</option>
                                    <option value="gap-8">كبير جداً (32px)</option>
                                </select>
                            </div>

                            {section.hasIconSize && (
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest">حجم الأيقونة</label>
                                    <select
                                        value={localSettings[section.id]?.iconSize || "w-12 h-12"}
                                        onChange={(e) => handleUpdate(section.id, "iconSize", e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                                    >
                                        <option value="w-8 h-8">صغير</option>
                                        <option value="w-12 h-12">متوسط</option>
                                        <option value="w-16 h-16">كبير</option>
                                        <option value="w-20 h-20">كبير جداً</option>
                                    </select>
                                </div>
                            )}

                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminSectionDesign;

