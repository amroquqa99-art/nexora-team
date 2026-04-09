import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { AuthFiles } from "@/lib/secureAuth";

type Role = "admin" | "team" | "client" | "unified" | "supervisor" | "conflict";

interface UseAuthLoginProps {
  role?: Role;
  redirectPath?: string;
}

export const useAuthLogin = ({ role, redirectPath }: UseAuthLoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Handling conflicts (same credentials in client and team)
  const [conflictRoles, setConflictRoles] = useState<any[]>([]);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { lang, t } = useLanguage();

  const proceedWithLogin = (targetRole: string, loginEmail: string, explicitPath?: string) => {
    // Setup pseudo-session for immediate UI redirect
    localStorage.setItem("userRole", targetRole);
    localStorage.setItem("userEmail", loginEmail);
    localStorage.setItem("isAuthenticated", "true");

    let targetPath = explicitPath || redirectPath;
    if (!targetPath || role === "unified") {
      if (targetRole === "admin") targetPath = "/admin";
      else if (targetRole === "team" || targetRole === "supervisor") targetPath = "/team";
      else targetPath = "/client";
    }

    toast({
      title: lang === "ar" ? "تم تسجيل الدخول بنجاح" : "Login Successful",
      description: lang === "ar" ? `مرحباً بك في واجهة النظام` : `Welcome to the system`,
    });

    navigate(targetPath || "/");
  };

  const handleLogin = async (e: FormEvent, credentials?: { email?: string; password?: string }, forceRole?: string) => {
    e?.preventDefault();
    setLoading(true);

    const loginEmail = credentials?.email || email;
    const loginPassword = credentials?.password || password;

    try {
      if (forceRole) {
        proceedWithLogin(forceRole, loginEmail);
        return;
      }

      // Step 1: Check Admin File (Highest Priority)
      const admins = await AuthFiles.getAdminFile();
      const adminMatch = admins.find((u: any) => u.email === loginEmail && u.password === loginPassword);

      if (adminMatch) {
        proceedWithLogin("admin", loginEmail);
        return;
      }

      // Step 2 & 3: Check Clients & Team in parallel
      const [clients, teams] = await Promise.all([
        AuthFiles.getClientFile(),
        AuthFiles.getTeamFile()
      ]);

      const clientMatch = clients.find((u: any) => u.email === loginEmail && u.password === loginPassword);
      const teamMatch = teams.find((u: any) => u.email === loginEmail && u.password === loginPassword);

      if (clientMatch && teamMatch) {
        // Conflict: User exists in both files with exact same credentials
        setConflictRoles([
          { role: 'client', label: lang === 'ar' ? 'واجهة العميل' : 'Client Area' },
          { role: teamMatch.isSupervisor ? 'supervisor' : 'team', label: lang === 'ar' ? 'واجهة فريق العمل' : 'Team Area' }
        ]);
        toast({ title: lang === "ar" ? "تطابق مزدوج" : "Dual Match", description: lang === "ar" ? "يرجى تحديد صفة الدخول" : "Please select login mode" });
        setLoading(false);
        return;
      }

      if (clientMatch) {
        proceedWithLogin("client", loginEmail);
        return;
      }

      if (teamMatch) {
        proceedWithLogin(teamMatch.isSupervisor ? "supervisor" : "team", loginEmail);
        return;
      }

      // Master Fallback Backup Admin (Main Requested Account)
      if (loginEmail === "Amro.Nexora.Team.123" && loginPassword === "AmroQuqa.NexoraTeam.Online") {
        proceedWithLogin("admin", loginEmail);
        return;
      }

      throw new Error(lang === "ar" ? "بيانات الدخول غير صحيحة أو الحساب غير مسجل" : "Invalid credentials or account does not exist");

    } catch (err: any) {
      toast({
        title: lang === "ar" ? "خطأ في الدخول" : "Auth Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    setLoading,
    handleLogin,
    conflictRoles,
    setConflictRoles,
    lang,
    t,
    toast,
    navigate
  };
};
