import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, XCircle, Upload, GripVertical, Loader2, Sparkles, ExternalLink, Image as ImageIcon, Video, Briefcase, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toDirectImageUrl } from "@/lib/gdrive";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Project = {
  id: string; title_ar: string; title_en: string; description_ar: string; description_en: string;
  category: string; thumbnail_url: string | null; video_url: string | null; display_order: number | null;
  is_featured?: boolean;
};

const emptyProject = { title_ar: "", title_en: "", description_ar: "", description_en: "", category: "other", thumbnail_url: "", video_url: "", display_order: 0, is_featured: false };

const SortableProjectItem = ({ project, onEdit, onDelete }: { project: Project; onEdit: () => void; onDelete: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} className={`bg-[#0a0a0a] border border-white/5 p-4 flex items-center justify-between group transition-all duration-100 ${isDragging ? "border-amber-500 ring-2 ring-amber-500/20 ring-offset-black ring-offset-2" : "border-white/5 hover:border-white/10"}`}>
      <div className="flex items-center gap-6 overflow-hidden">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 hover:bg-white/5 rounded-lg transition-colors group/drag">
          <GripVertical className="w-5 h-5 text-muted-foreground/30 group-hover/drag:text-amber-500 transition-colors" />
        </button>

        <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-white/5 bg-[#0a0a0a] flex-shrink-0">
          {project.thumbnail_url ? (
            <img src={toDirectImageUrl(project.thumbnail_url)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-100" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground opacity-20">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}
          {project.is_featured && (
            <div className="absolute top-1 left-1 bg-amber-500 text-black p-0.5 rounded ">
              <Sparkles className="w-2.5 h-2.5" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-black text-foreground text-sm tracking-tight uppercase truncate">{project.title_en}</p>
            <span className="text-xs text-muted-foreground/40 font-mono hidden sm:inline">|</span>
            <p className="font-bold text-foreground/60 text-sm truncate" dir="rtl">{project.title_ar}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-black uppercase tracking-widest border border-amber-500/10">
              {project.category.replace("_", " ")}
            </span>
            <span className="text-xs text-muted-foreground/40 font-black uppercase tracking-tighter">ORDER: {project.display_order}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onEdit} className="p-2.5 bg-white/5 hover:bg-amber-500/20 text-muted-foreground hover:text-amber-500 rounded-xl border border-white/5 transition-all">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-2.5 bg-white/5 hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 rounded-xl border border-white/5 transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const AdminProjects = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partial<Project> | null>(null);
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 5 } })
  );

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["admin_projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ["admin_services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (p: Partial<Project>) => {
      const { id, ...rest } = p;
      if (id) {
        const { error } = await supabase.from("projects").update(rest).eq("id", id);
        if (error) throw error;
      }
      else {
        const { error } = await supabase.from("projects").insert(rest as Database["public"]["Tables"]["projects"]["Insert"]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_projects"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      setEditing(null);
      toast({ title: "✓ SYNCED", description: "Portfolio data successfully committed." });
    },
    onError: (e: Error) => toast({ title: "SYNC_ERROR", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_projects"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "✓ SCRUBBED", description: "Record removed from portfolio lifecycle." });
    },
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(projects, oldIndex, newIndex);

    // Update all display_order values
    const updates = reordered.map((p, i) =>
      supabase.from("projects").update({ display_order: i }).eq("id", p.id)
    );
    await Promise.all(updates);
    qc.invalidateQueries({ queryKey: ["admin_projects"] });
    qc.invalidateQueries({ queryKey: ["projects"] });
  };

  const handleThumbnailUpload = async (file: File) => {
    setUploading(true);
    const path = `projects/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (error) {
      toast({ title: "UPLOAD_FAILURE", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    setEditing((prev) => ({ ...prev, thumbnail_url: data.publicUrl }));
    setUploading(false);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8  duration-100">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-orange-500">
            <Briefcase className="w-5 h-5 fill-current" />
            <span className="text-xs font-black uppercase tracking-[0.5em]">CRM Operational Terminal</span>
          </div>
          <h2 className="text-xl font-black text-foreground tracking-tighter uppercase">Portfolio Ops Registry</h2>
          <p className="text-xs text-muted-foreground italic font-medium">Manage and sequence public-facing casework.</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(emptyProject)}
            className="group flex items-center gap-2 px-6 py-2.5 bg-white text-black font-black text-xs tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all uppercase active:scale-95"
          >
            <Plus className="w-4 h-4" /> Register New Project
          </button>
        )}
      </div>

      {editing && (
        <div className="bg-[#0a0a0a] border border-white/5 p-8 border-amber-500/20 bg-white/[0.02] space-y-8 relative overflow-hidden">
          <div className={`absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-amber-500 to-orange-500 opacity-[0.03] blur-[80px] pointer-events-none`} />

          <div className="flex justify-between items-center border-b border-white/5 pb-4 relative z-10">
            <h3 className="text-sm font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1 h-3 bg-amber-500" />
              {editing.id ? "Alter Project Profile" : "Initiate Project Record"}
            </h3>
            <button onClick={() => setEditing(null)} className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50">Title English</label>
                <input
                  placeholder="NEXORA REBRAND"
                  value={editing.title_en || ""}
                  onChange={e => setEditing({ ...editing, title_en: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-foreground text-sm font-bold focus:outline-none focus:border-orange-500/50 transition-all  uppercase tracking-wider"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50">Description English</label>
                <textarea
                  placeholder="Advanced strategic rebranding for Nexora..."
                  value={editing.description_en || ""}
                  onChange={e => setEditing({ ...editing, description_en: e.target.value })}
                  className="w-full px-4 py-4 bg-[#0a0a0a] border border-white/10 rounded-2xl text-foreground text-sm focus:outline-none focus:border-orange-500/50 transition-all  resize-none min-h-[100px] leading-relaxed"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50">العنوان بالعربية</label>
                <input
                  dir="rtl"
                  placeholder="مشروع إعادة الهوية"
                  value={editing.title_ar || ""}
                  onChange={e => setEditing({ ...editing, title_ar: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-foreground text-sm font-bold focus:outline-none focus:border-orange-500/50 transition-all  text-right"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50">الوصف بالعربية</label>
                <textarea
                  dir="rtl"
                  placeholder="وصف تفصيلي للمشروع..."
                  value={editing.description_ar || ""}
                  onChange={e => setEditing({ ...editing, description_ar: e.target.value })}
                  className="w-full px-4 py-4 bg-[#0a0a0a] border border-white/10 rounded-2xl text-foreground text-sm focus:outline-none focus:border-orange-500/50 transition-all  resize-none min-h-[100px] leading-relaxed text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50">Service Allocation</label>
                <select
                  value={editing.category || "other"}
                  onChange={e => setEditing({ ...editing, category: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-foreground text-sm font-bold focus:outline-none focus:border-orange-500/50 appearance-none transition-all  uppercase tracking-widest"
                >
                  {services.map(s => (
                    <option key={s.key} value={s.key} className="bg-background">{s.title_en}</option>
                  ))}
                  <option value="other" className="bg-background">General / Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50">Display Priority</label>
                <input
                  type="number"
                  value={editing.display_order ?? 0}
                  onChange={e => setEditing({ ...editing, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-foreground text-sm font-bold focus:outline-none focus:border-orange-500/50 transition-all  tabular-nums"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-1 space-y-4 w-full">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50">Asset Ingestion (Thumbnail)</label>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 text-muted-foreground rounded-xl cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all group flex-1">
                      <Upload className={`w-4 h-4 group-hover:text-orange-500 transition-colors ${uploading ? 'animate-bounce text-orange-500' : ''}`} />
                      <span className="text-xs font-black tracking-widest uppercase">
                        {uploading ? "UPLOADING SYSTEM..." : "SELECT ASSET"}
                      </span>
                      <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])} />
                    </label>
                  </div>
                  <div className="space-y-2">
                    <input
                      placeholder="Paste Image URL or Drive Link here"
                      value={editing.thumbnail_url || ""}
                      onChange={e => setEditing({ ...editing, thumbnail_url: e.target.value })}
                      className="w-full px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-muted-foreground text-xs font-mono focus:outline-none focus:border-orange-500/30 transition-all"
                    />
                  </div>
                </div>

                {editing.thumbnail_url && (
                  <div className="w-32 h-32 rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] group relative">
                    <img src={toDirectImageUrl(editing.thumbnail_url)} alt="preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-[#0a0a0a] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-6 h-6 text-white/50" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50">Video Content Vector (URL)</label>
              <div className="relative group/vec">
                <Video className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 group-focus-within/vec:text-orange-500 transition-colors" />
                <input
                  placeholder="https://gdrive.com/file/123... or YouTube link"
                  value={editing.video_url || ""}
                  onChange={e => setEditing({ ...editing, video_url: e.target.value })}
                  className="w-full pl-12 pr-6 py-3.5 bg-[#0a0a0a] border border-white/10 rounded-2xl text-foreground text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all "
                />
              </div>
            </div>

            <div className="md:col-span-2 flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
              <input
                type="checkbox"
                id="is_featured"
                checked={editing.is_featured || false}
                onChange={e => setEditing({ ...editing, is_featured: e.target.checked })}
                className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 bg-[#0a0a0a] border-white/10"
              />
              <label htmlFor="is_featured" className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2 cursor-pointer">
                <Sparkles className={`w-3.5 h-3.5 ${editing.is_featured ? 'text-orange-500 ' : 'text-muted-foreground/30'}`} />
                Elevate to Featured Work
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-8 border-t border-white/5 relative z-10">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-6 py-2.5 rounded-xl text-xs font-black tracking-widest text-muted-foreground hover:text-white transition-all uppercase"
            >
              Deselect
            </button>
            <button
              onClick={() => saveMutation.mutate(editing)}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-10 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black text-xs tracking-widest rounded-xl hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all uppercase active:scale-95 disabled:opacity-50"
            >
              {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Commit Record
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
        <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase italic flex items-center gap-2">
          <GripVertical className="w-3 h-3" />
          Active Sequence Control (Drag to reorder)
        </p>
        <div className="flex items-center gap-4 text-xs font-black tracking-widest text-muted-foreground/40 bg-black/20 px-4 py-2 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> PUBLIC RECORDS: {projects.length}</div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> FEATURED: {projects.filter(p => p.is_featured).length}</div>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {projects.map((p) => (
              <SortableProjectItem
                key={p.id}
                project={p}
                onEdit={() => setEditing({ ...p })}
                onDelete={() => { if (confirm("Permanently scrub this record from the portfolio?")) deleteMutation.mutate(p.id); }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {projects.length === 0 && !isLoading && (
        <div className="py-24 text-center bg-[#0a0a0a] border border-white/5 border-dashed border-2 border-white/5 bg-transparent ">
          <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <p className="text-xs text-white/30 font-black uppercase tracking-widest group-hover:text-white transition-colors leading-none">Global</p>
          <p className="text-xs text-muted-foreground/40 mt-2 font-mono italic">No projects registered in the sequence protocol.</p>
        </div>
      )}
    </div>
  );
};

export default AdminProjects;

