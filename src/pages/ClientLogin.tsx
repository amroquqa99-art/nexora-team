import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthLogin } from "@/hooks/useAuthLogin";
import ParticlesBackground from "@/components/shared/ParticlesBackground";
import { supabase } from "@/integrations/supabase/client";
import { AuthFiles, encryptData } from "@/lib/secureAuth";

const clientLoginSchema = z.object({
  email: z.string().min(1, "Username or Email is required"),
  password: z.string().min(1, "Password is required"),
  fullName: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
});

type ClientLoginFormValues = z.infer<typeof clientLoginSchema>;

const ClientLogin = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const {
    setEmail,
    setPassword,
    loading, setLoading, handleLogin,
    conflictRoles, setConflictRoles,
    lang, toast, navigate
  } = useAuthLogin({ role: "unified" });

  const { register, handleSubmit, formState: { errors } } = useForm<ClientLoginFormValues>({
    resolver: zodResolver(clientLoginSchema),
  });

  const onSubmit = async (data: ClientLoginFormValues) => {
    setEmail(data.email);
    setPassword(data.password);

    if (!isSignUp) {
      setTimeout(() => {
        handleLogin({ preventDefault: () => { } } as FormEvent, { email: data.email, password: data.password });
      }, 0);
      return;
    }

    // Custom Client Signup Flow
    if (!data.fullName) {
      toast({ title: lang === "ar" ? "الاسم مطلوب" : "Name is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1. Check if email already exists in custom auth
      const currentAuths = await AuthFiles.getClientFile();
      if (currentAuths.find((c: { email: string }) => c.email === data.email)) {
        throw new Error(lang === "ar" ? "هذا البريد مسجل كعميل مسبقاً" : "Email already registered as client");
      }

      // 2. Insert to profiles so they have a public identity
      const newProfileId = crypto.randomUUID();
      const { error: profileError } = await supabase.from("profiles").insert({
        id: newProfileId,
        full_name: data.fullName,
        company: data.company || null,
        phone: data.phone || null,
        email: data.email,
        client_type: "one_time"
      });

      // Profiles failure might mean user already exists in auth.users, but we ignore auth.users now
      if (profileError && profileError.code !== '23505') throw profileError;

      // 3. Save purely to Custom Encrypted DB
      currentAuths.push({
        id: newProfileId,
        email: data.email,
        password: data.password,
        created_at: new Date().toISOString()
      });

      await AuthFiles.saveClientFile(currentAuths);

      toast({ title: lang === "ar" ? "تم إنشاء حسابك المشفر! سجل دخولك الآن" : "Account created securely! You can sign in now" });
      setIsSignUp(false);

    } catch (err: unknown) {
      const error = err as Error;
      toast({ title: lang === "ar" ? "خطأ" : "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div
      className="min-h-screen bg-transparent flex items-center justify-center p-4 overflow-hidden relative"
      onClick={(e) => {
        if (e.target === e.currentTarget) navigate("/");
      }}
    >
      <ParticlesBackground />

      <div className="w-full max-w-md glass-card p-8" dir={lang === "ar" ? "rtl" : "ltr"}>
        {conflictRoles && conflictRoles.length > 0 ? (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold gradient-text mb-2">تطابق متعدد</h1>
              <p className="text-muted-foreground text-sm">تم العثور على حسابك كعميل وكعضو في الفريق. يرجى اختيار واجهة الدخول:</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {conflictRoles.map((roleOpt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLogin({ preventDefault: () => { } } as FormEvent, undefined, roleOpt.role)}
                  className="w-full py-4 rounded-xl border border-primary text-primary font-bold hover:bg-primary/10 transition-colors"
                >
                  {roleOpt.label}
                </button>
              ))}
              <button onClick={() => setConflictRoles([])} className="text-sm text-muted-foreground mt-4 hover:text-white">إلغاء</button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold gradient-text mb-2">NEXORA</h1>
              <p className="text-muted-foreground text-sm">
                {isSignUp
                  ? (lang === "ar" ? "إنشاء حساب عميل جديد" : "Create new client account")
                  : (lang === "ar" ? "تسجيل الدخول الموحد" : "Unified Login")}
              </p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {isSignUp && (
                <>
                  <div>
                    <input type="text" {...register("fullName")} placeholder={lang === "ar" ? "الاسم الكامل" : "Full Name"}
                      className={`w-full px-4 py-3 rounded-lg bg-muted border ${errors.fullName ? "border-destructive focus:ring-destructive/50" : "border-border focus:ring-primary/50"} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2`} />
                    {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
                  </div>
                  <input type="text" {...register("company")} placeholder={lang === "ar" ? "اسم الشركة (اختياري)" : "Company (optional)"}
                    className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <input type="tel" {...register("phone")} placeholder={lang === "ar" ? "رقم الهاتف (اختياري)" : "Phone (optional)"}
                    className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </>
              )}
              <div>
                <input type="text" {...register("email")} placeholder={lang === "ar" ? "اسم المستخدم أو البريد" : "Username or Email"}
                  className={`w-full px-4 py-3 rounded-lg bg-muted border ${errors.email ? "border-destructive focus:ring-destructive/50" : "border-border focus:ring-primary/50"} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2`} />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <input type="password" {...register("password")} placeholder={lang === "ar" ? "كلمة المرور" : "Password"}
                  className={`w-full px-4 py-3 rounded-lg bg-muted border ${errors.password ? "border-destructive focus:ring-destructive/50" : "border-border focus:ring-primary/50"} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2`} />
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {loading ? "..." : isSignUp ? (lang === "ar" ? "إنشاء حساب واعتماد" : "Sign up") : (lang === "ar" ? "تسجيل الدخول" : "Sign In")}
              </button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isSignUp ? (
                <p>
                  {lang === "ar" ? "لديك حساب بالفعل؟ " : "Already have an account? "}
                  <button type="button" onClick={toggleSignUp} className="text-primary hover:underline font-bold">
                    {lang === "ar" ? "سجل الدخول" : "Sign in"}
                  </button>
                </p>
              ) : (
                <p>
                  {lang === "ar" ? "ليس لديك حساب؟ " : "Don't have an account? "}
                  <button type="button" onClick={toggleSignUp} className="text-primary hover:underline font-bold">
                    {lang === "ar" ? "أنشئ حساباً كعميل" : "Sign up"}
                  </button>
                </p>
              )}
            </div>
            <div className="text-center mt-4 border-t border-border/20 pt-4">
              <Link to="/" className="text-xs text-muted-foreground hover:text-primary">{lang === "ar" ? "العودة للرئيسية" : "Back to Home"}</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClientLogin;
