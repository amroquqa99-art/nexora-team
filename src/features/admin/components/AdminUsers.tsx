import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Clock, UserPlus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthFiles } from "@/lib/secureAuth";

const roleLabels: Record<string, string> = {
  owner: "Owner (المالك)",
  admin: "Admin (مدير)",
};

const AdminUsers = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [creating, setCreating] = useState(false);

  // Fetch from the Encrypted File
  const { data: roles = [], isLoading } = useQuery<any[]>({
    queryKey: ["admin_custom_auth_file"],
    queryFn: async () => {
      return await AuthFiles.getAdminFile();
    },
  });

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleCreateAdmin = async () => {
    if (!newEmail || !newPassword) {
      toast({ title: "برجاء ملء جميع الحقول", variant: "destructive" });
      return;
    }

    if (!validateEmail(newEmail)) {
      toast({
        title: "تنسيق البريد الإلكتروني غير صحيح",
        description: "يجب أن يكون البريد بصيغة صحيحة (مثال: name@nexus.com)",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const currentAdmins = [...roles];

      // Check if exists
      if (currentAdmins.find(u => u.email === newEmail)) {
        throw new Error("هذا المستخدم مسجل بالفعل في النظام.");
      }

      currentAdmins.push({
        id: Date.now().toString(),
        email: newEmail,
        password: newPassword, // stored directly in the custom encrypted payload
        role: newRole,
        created_at: new Date().toISOString()
      });

      await AuthFiles.saveAdminFile(currentAdmins);

      qc.invalidateQueries({ queryKey: ["admin_custom_auth_file"] });
      toast({ title: "✓ تم إنشاء الحساب المشفر بنجاح" });
      setShowCreate(false);
      setNewEmail("");
      setNewPassword("");
    } catch (err: any) {
      toast({
        title: "خطأ في العملية",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const currentAdmins = roles.filter(u => u.id !== id);
      await AuthFiles.saveAdminFile(currentAdmins);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_custom_auth_file"] });
      toast({ title: "تم حذف الصلاحية من السجل" });
    }
  });

  return (
    <div className="space-y-10  duration-100 text-right" dir="rtl">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase flex items-center gap-3">
            <Shield className="w-10 h-10 text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
            إدارة الصلاحيات
          </h2>
          <p className="text-muted-foreground text-sm font-medium">إدارة حسابات الأدمن في ملف التشفير المحلي المخصص (Custom Auth System).</p>
          <div className="h-1 w-12 bg-orange-500 rounded-full" />
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-700 text-white font-black text-xs tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all uppercase"
        >
          <UserPlus className="w-4 h-4" /> إضافة مسؤول
        </button>
      </div>

      {showCreate && (
        <div className="bg-[#0a0a0a] border border-white/5 p-8 bg-white/[0.01] border-white/5 space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest">البريد الإلكتروني</label>
              <input
                type="email" placeholder="admin@nexus.com" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border text-foreground text-sm focus:outline-none transition-all ${newEmail && !validateEmail(newEmail) ? 'border-rose-500/50' : 'border-white/5 focus:border-orange-500'}`}
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest">كلمة المرور (سيتم تشفيرها)</label>
              <input
                type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/5 text-foreground text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest">الدور (Role)</label>
              <select
                value={newRole} onChange={e => setNewRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/5 text-foreground text-sm focus:outline-none focus:border-orange-500"
              >
                {Object.entries(roleLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-start pt-4 border-t border-white/5">
            <button
              onClick={handleCreateAdmin}
              disabled={creating}
              className="px-8 py-2.5 rounded-xl bg-orange-500 text-white font-black text-xs tracking-widest hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all uppercase disabled:opacity-50"
            >
              {creating ? "جاري التشفير..." : "تشفير وحفظ الحساب"}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-8 py-2.5 rounded-xl glass text-xs font-black tracking-widest text-muted-foreground uppercase hover:text-white transition-all">إلغاء</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 py-20 flex justify-center"><div className="w-8 h-8 animate-spin border-2 border-orange-500 border-t-transparent rounded-full" /></div>
        ) : roles.map((r, idx) => (
          <div key={r.id || idx} className="bg-[#0a0a0a] border border-white/5 p-6 bg-white/[0.01] border-white/5 hover:border-white/10 transition-all flex items-center justify-between group text-right">
            <div className="space-y-1">
              <p className="text-xs font-mono text-muted-foreground select-all">{r.email}</p>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-[0.2em] ${r.role === 'owner' ? 'bg-rose-500/10 text-rose-500' : 'bg-orange-500/10 text-orange-500'}`}>
                  {roleLabels[r.role] || r.role}
                </span>
                <span className="text-[9px] text-emerald-500/50 uppercase tracking-widest border border-emerald-500/20 px-2 rounded-md">Encrypted</span>
              </div>
            </div>
            <button
              onClick={() => deleteRoleMutation.mutate(r.id)}
              className="p-2.5 rounded-lg bg-white/5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {roles.length === 0 && !isLoading && (
          <div className="col-span-2 py-20 text-center bg-[#0a0a0a] border border-white/5 bg-transparent border-dashed border-white/5">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">No admin accounts found in local file</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;

