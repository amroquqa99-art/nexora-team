import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Plus, Pencil, Trash2, X, Check, Loader2, Sparkles, Layers, Upload, Image as ImageIcon, Link as LinkIcon, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Database } from "@/integrations/supabase/types";
import { toDirectImageUrl } from "@/lib/gdrive";

const AdminServices = () => {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    key: "",
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    icon: "Briefcase",
    color: "from-orange-500 to-amber-600",
    display_order: 0,
    image_url: "",
    icon_url: ""
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ["admin_services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("display_order");
      if (error) throw error;
      return data;
    }
  });

  const handleFileUpload = async (file: File, field: "image_url" | "icon_url") => {
    setUploading(field);
    const path = `services/${Date.now()}_${file.name}`;
    try {
      const { error } = await supabase.storage.from("uploads").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      setFormData(prev => ({ ...prev, [field]: data.publicUrl }));
      toast({ title: "Asset Uploaded" });
    } catch (e: any) {
      toast({ title: "Upload Error", description: e.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const addMutation = useMutation({
    mutationFn: async (newService: Database["public"]["Tables"]["services"]["Insert"]) => {
      const { error } = await supabase.from("services").insert([newService]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_services"] });
      queryClient.invalidateQueries({ queryKey: ["public_services"] });
      setIsAdding(false);
      toast({ title: "âœ“ Service Added", description: "Global service registry updated." });
    },
    onError: (error) => toast({ title: "Command Failed", description: error.message, variant: "destructive" })
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedService: Database["public"]["Tables"]["services"]["Update"]) => {
      if (!editingId) return;
      const { error } = await supabase.from("services").update(updatedService).eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_services"] });
      queryClient.invalidateQueries({ queryKey: ["public_services"] });
      setEditingId(null);
      toast({ title: "âœ“ Service Updated", description: "Changes propagated successfully." });
    },
    onError: (error) => toast({ title: "Update Error", description: error.message, variant: "destructive" })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_services"] });
      queryClient.invalidateQueries({ queryKey: ["public_services"] });
      toast({ title: "âœ“ Deleted", description: "Service removed from registry." });
    },
    onError: (error) => toast({ title: "Delete Error", description: error.message, variant: "destructive" })
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData
      });
    } else {
      addMutation.mutate(formData);
    }
  };

  const handleEdit = (service: any) => {
    setFormData({
      key: service.key,
      title_ar: service.title_ar,
      title_en: service.title_en,
      description_ar: service.description_ar,
      description_en: service.description_en,
      icon: service.icon,
      color: service.color || "from-neon-cyan to-neon-violet",
      display_order: service.display_order,
      image_url: service.image_url || "",
      icon_url: service.icon_url || ""
    });
    setEditingId(service.id);
    setIsAdding(false);
  };

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
            <Sparkles className="w-6 h-6 text-orange-500" />
            Service Registry
          </h2>
          <p className="text-xs text-muted-foreground italic font-medium">Define and manage the core offerings of NEXORA.</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            setFormData({ key: "", title_ar: "", title_en: "", description_ar: "", description_en: "", icon: "Briefcase", color: "from-orange-500 to-amber-600", display_order: 0, image_url: "", icon_url: "" });
          }}
          className="group flex items-center gap-2 px-6 py-2.5 bg-white text-black font-black text-xs tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all uppercase active:scale-95"
        >
          <Plus className="w-4 h-4" /> Register New Service
        </button>
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="bg-[#0a0a0a] border border-white/5 p-8 space-y-8 border-orange-500/20 bg-white/[0.02] relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-orange-500 to-amber-600 opacity-[0.03] blur-[80px] pointer-events-none" />

          <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
            <h3 className="text-sm font-black text-orange-500 uppercase tracking-[0.2em]">
              {editingId ? "Modify Existing Service" : "Register New Core Service"}
            </h3>
            <div className="p-2 bg-white/5 rounded-lg text-muted-foreground/50 text-xs font-mono select-none">
              FORM_MODE: {editingId ? "UPDATE" : "CREATE"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Registry Key</label>
              <input
                type="text"
                placeholder="e.g. branding_design"
                required
                value={formData.key}
                onChange={e => setFormData({ ...formData, key: e.target.value })}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-foreground text-sm focus:outline-none focus:border-orange-500/50 font-bold transition-all "
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground hover:text-orange-500 uppercase tracking-widest transition-colors">Icon Script (Lucide)</label>
              <input
                type="text"
                required
                value={formData.icon}
                onChange={e => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-orange-500 font-mono text-xs focus:outline-none focus:border-orange-500/50 transition-all "
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Sequence Priority</label>
              <input
                type="number"
                required
                value={formData.display_order}
                onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-foreground text-sm focus:outline-none focus:border-orange-500/50 font-bold transition-all "
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Localized Title (AR)</label>
              <input
                type="text"
                required
                value={formData.title_ar}
                onChange={e => setFormData({ ...formData, title_ar: e.target.value })}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-foreground text-sm text-right focus:outline-none focus:border-orange-500/50 font-bold transition-all "
                dir="rtl"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Localized Title (EN)</label>
              <input
                type="text"
                required
                value={formData.title_en}
                onChange={e => setFormData({ ...formData, title_en: e.target.value })}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-foreground text-sm focus:outline-none focus:border-orange-500/50 font-bold transition-all "
              />
            </div>

            <div className="md:col-span-3 space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Marketing Copy (AR)</label>
              <textarea
                required
                rows={3}
                value={formData.description_ar}
                onChange={e => setFormData({ ...formData, description_ar: e.target.value })}
                className="w-full px-4 py-4 bg-[#0a0a0a] border border-white/10 rounded-2xl text-foreground text-sm text-right focus:outline-none focus:border-orange-500/50 transition-all  leading-relaxed"
                dir="rtl"
              />
            </div>
            <div className="md:col-span-3 space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Marketing Copy (EN)</label>
              <textarea
                required
                rows={3}
                value={formData.description_en}
                onChange={e => setFormData({ ...formData, description_en: e.target.value })}
                className="w-full px-4 py-4 bg-[#0a0a0a] border border-white/10 rounded-2xl text-foreground text-sm focus:outline-none focus:border-orange-500/50 transition-all  leading-relaxed"
              />
            </div>

            {/* Card Icon & Banner Assets */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-y border-white/5">
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Custom Icon (URL/Drive)</label>
                <input
                  placeholder="Paste Image URL or Drive Link"
                  value={formData.icon_url}
                  onChange={e => setFormData({ ...formData, icon_url: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/5 rounded-lg text-sm"
                />
                {formData.icon_url && (
                  <div className="relative w-14 h-7 rounded-full transition-all duration-100 overflow-hidden border bg-white/5 border-white/10 p-2">
                    <img src={toDirectImageUrl(formData.icon_url)} alt="icon preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Page Banner (URL/Drive)</label>
                <input
                  placeholder="Paste Image URL or Drive Link"
                  value={formData.image_url}
                  onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/5 rounded-lg text-sm"
                />
                {formData.image_url && (
                  <div className="relative w-14 h-7 rounded-full transition-all duration-100 overflow-hidden border bg-white/5 border-white/10">
                    <img src={toDirectImageUrl(formData.image_url)} alt="banner preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-3 space-y-3">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Visual Identity Gradient</label>
              <div className="flex gap-4 items-center">
                <input
                  type="text"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-muted-foreground font-mono text-xs focus:outline-none focus:border-orange-500/50 transition-all "
                />
                <div className={`h-12 w-32 rounded-xl bg-gradient-to-r ${formData.color} border border-white/20 `} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-white/5 relative z-10">
            <button
              type="button"
              onClick={() => { setIsAdding(false); setEditingId(null); }}
              className="px-6 py-2.5 rounded-xl text-xs font-black tracking-widest text-muted-foreground hover:text-white transition-all uppercase"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending || !!uploading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black text-xs tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all uppercase disabled:opacity-50"
            >
              {addMutation.isPending || updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Commit to Registry
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services?.map((service) => (
          <div key={service.id} className="bg-[#0a0a0a] border border-white/5 p-6 border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all duration-100 overflow-hidden relative group">
            <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${service.color || "from-orange-500 to-amber-600"} opacity-[0.03] blur-3xl group-hover:opacity-[0.08] transition-opacity duration-100`} />

            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-100">
              <button onClick={() => handleEdit(service)} className="p-2 bg-white/5 hover:bg-orange-500/20 text-muted-foreground hover:text-orange-500 rounded-lg  border border-white/10 transition-all">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => { if (window.confirm("Permanently deregister this service and all associated project links?")) deleteMutation.mutate(service.id) }} className="p-2 bg-white/5 hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 rounded-lg  border border-white/10 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 px-2 py-1 bg-white/5 text-muted-foreground/60 text-xs font-black uppercase tracking-widest rounded border border-white/5">
                <Layers className="w-3 h-3" />
                {service.key}
              </span>
              {service.icon_url ? (
                <div className="w-8 h-8 rounded-lg bg-white/5 p-1.5 border border-white/10">
                  <img src={toDirectImageUrl(service.icon_url)} alt="icon" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>

            <h3 className="font-black text-xs tracking-widest uppercase flex items-center gap-2 group-hover:text-orange-500 transition-colors duration-100">
              {lang === 'ar' ? service.title_ar : service.title_en}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity duration-100 italic">
              {lang === 'ar' ? service.description_ar : service.description_en}
            </p>

            <div className="mt-6 flex items-center justify-between opacity-30 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-100">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-3 rounded-full bg-orange-500" />
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Order: {service.display_order}</span>
              </div>
              {service.image_url && <ImageIcon className="w-3 h-3 text-amber-500 " />}
              <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${service.color || "from-orange-500 to-amber-500"}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminServices;

