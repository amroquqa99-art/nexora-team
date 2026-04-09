import { useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthLogin } from "@/hooks/useAuthLogin";
import { useLanguage } from "@/i18n/LanguageContext";

const loginSchema = z.object({
  email: z.string().min(1, "Username or Email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const AdminLogin = () => {
  const { lang } = useLanguage();
  const {
    loading, handleLogin,
    navigate
  } = useAuthLogin({ role: "admin", redirectPath: "/admin" });

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const formRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate("/");
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [navigate]);

  const onSubmit = (data: LoginFormValues) => {
    handleLogin({ preventDefault: () => { } } as React.FormEvent, { email: data.email, password: data.password });
  };

  return (
    <div
      className="min-h-screen bg-[#050505] relative flex items-center justify-center px-4 overflow-hidden selection:bg-orange-500/30 font-outfit"
      onClick={(e) => {
        if (e.target === e.currentTarget) navigate("/");
      }}
    >

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-orange-500 transition-colors font-bold z-20"
      >
        {lang === "ar" ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        {lang === "ar" ? "العودة للرئيسية" : "Home"}
      </button>

      <div ref={formRef} className="bg-[#0a0a0a] border border-white/5 p-10 w-full max-w-md relative z-10 border-white/10 ">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-700 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold gradient-text tracking-tighter uppercase italic">NEXORA Admin</h1>
          <p className="text-muted-foreground mt-2 text-sm">Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground px-1 uppercase tracking-widest">Email Address</label>
            <input
              type="text" {...register("email")}
              className={`w-full px-5 py-4 rounded-xl bg-white/5 border ${errors.email ? "border-red-500/50" : "border-white/10"} focus:border-orange-500/50 focus:outline-none transition-all placeholder:text-muted-foreground/30`}
              placeholder={lang === "ar" ? "اسم المستخدم أو البريد" : "Username or Email"}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground px-1 uppercase tracking-widest">Security Password</label>
            <input
              type="password" {...register("password")}
              className={`w-full px-5 py-4 rounded-xl bg-white/5 border ${errors.password ? "border-red-500/50" : "border-white/10"} focus:border-orange-500/50 focus:outline-none transition-all placeholder:text-muted-foreground/30`}
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-4 rounded-xl font-black text-white flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-700 hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all duration-100 disabled:opacity-50 mt-4 active:scale-95"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "ACCESS SYSTEM"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

