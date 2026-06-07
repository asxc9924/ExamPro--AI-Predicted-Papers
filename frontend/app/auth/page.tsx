"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Phone, User, Lock, Loader2, BookOpen } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

type AuthTab = "login" | "register" | "otp";

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setAccessToken, isAuthenticated } = useAuth();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const defaultTab = (searchParams.get("tab") as AuthTab) || "login";

  const [tab, setTab] = useState<AuthTab>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpStep, setOtpStep] = useState<"login" | "register" | null>(null);
  const [otpTimer, setOtpTimer] = useState(0);

  // Form state
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", otp: "" });

  useEffect(() => { if (isAuthenticated) router.replace(redirect); }, [isAuthenticated, redirect, router]);

  useEffect(() => {
    if (otpTimer > 0) { const t = setTimeout(() => setOtpTimer(t => t - 1), 1000); return () => clearTimeout(t); }
  }, [otpTimer]);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error("Fill all fields");
    setLoading(true);
    try {
      const { data } = await authApi.login(form.email, form.password);
      if (data.data) {
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
        toast.success(`Welcome back, ${data.data.user.name.split(" ")[0]}!`);
        router.replace(redirect);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Login failed";
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) return toast.error("Fill all fields");
    if (form.password !== form.confirmPassword) return toast.error("Passwords don't match");
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    try {
      await authApi.register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      await authApi.sendOTP(form.email, "register");
      setOtpStep("register");
      setTab("otp");
      setOtpTimer(60);
      toast.success("OTP sent to your email!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Registration failed";
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleLoginOTP = async () => {
    if (!form.email) return toast.error("Enter your email first");
    setLoading(true);
    try {
      await authApi.sendOTP(form.email, "login");
      setOtpStep("login");
      setTab("otp");
      setOtpTimer(60);
      toast.success("OTP sent to your email!");
    } catch { toast.error("Failed to send OTP"); } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.otp.length !== 6) return toast.error("Enter 6-digit OTP");
    setLoading(true);
    try {
      const { data } = await authApi.verifyOTP(form.email, form.otp, otpStep || "login");
      if (data.data) {
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
        toast.success("Verified! Welcome to ExamEdge 🎉");
        router.replace(redirect);
      }
    } catch { toast.error("Invalid or expired OTP"); } finally { setLoading(false); }
  };

  const handleGoogleLogin = () => authApi.googleLogin();

  const resendOTP = async () => {
    if (otpTimer > 0) return;
    try {
      await authApi.sendOTP(form.email, otpStep || "login");
      setOtpTimer(60);
      toast.success("OTP resent!");
    } catch { toast.error("Failed to resend OTP"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-12">
      <div className="absolute inset-0 bg-gradient-hero bg-grid" />
      <div className="orb orb-brand w-96 h-96 -top-20 left-0 opacity-15" />
      <div className="orb orb-accent w-64 h-64 bottom-20 right-10 opacity-10" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">Exam<span className="text-brand-400">Edge</span></span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-white">
            {tab === "login" ? "Welcome Back" : tab === "register" ? "Create Account" : "Verify OTP"}
          </h1>
          <p className="text-secondary text-sm mt-1">
            {tab === "login" ? "Sign in to access your papers" : tab === "register" ? "Join 2L+ students on ExamEdge" : `Code sent to ${form.email}`}
          </p>
        </div>

        <div className="card p-8">
          {/* Tab Switch */}
          {tab !== "otp" && (
            <div className="flex gap-1 p-1 bg-surface rounded-xl mb-6">
              {(["login", "register"] as AuthTab[]).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${tab === t ? "bg-brand-600 text-white" : "text-secondary hover:text-white"}`}>
                  {t === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* LOGIN */}
            {tab === "login" && (
              <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-sm text-secondary mb-1.5 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-custom" />
                    <input type="email" placeholder="your@email.com" value={form.email} onChange={update("email")}
                      className="input-base pl-10" required />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-secondary mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-custom" />
                    <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password}
                      onChange={update("password")} className="input-base pl-10 pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-custom hover:text-white transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Link href="/auth/forgot-password" className="text-xs text-brand-400 hover:text-brand-300">Forgot password?</Link>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? "Signing in..." : "Sign In"}
                </button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-border" /></div>
                  <div className="relative flex justify-center text-xs text-muted-custom bg-surface-card px-2">or</div>
                </div>
                <button type="button" onClick={handleLoginOTP} disabled={loading}
                  className="btn-ghost w-full flex items-center justify-center gap-2 text-sm">
                  <Mail className="w-4 h-4" /> Sign in with OTP
                </button>
                <button type="button" onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-all">
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </button>
              </motion.form>
            )}

            {/* REGISTER */}
            {tab === "register" && (
              <motion.form key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister} className="space-y-4">
                {[
                  { icon: User, label: "Full Name", field: "name", type: "text", placeholder: "Rahul Sharma" },
                  { icon: Mail, label: "Email Address", field: "email", type: "email", placeholder: "rahul@email.com" },
                  { icon: Phone, label: "Mobile Number", field: "phone", type: "tel", placeholder: "+91 98765 43210" },
                ].map(({ icon: Icon, label, field, type, placeholder }) => (
                  <div key={field}>
                    <label className="text-sm text-secondary mb-1.5 block">{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-custom" />
                      <input type={type} placeholder={placeholder} value={form[field as keyof typeof form]}
                        onChange={update(field)} className="input-base pl-10" required />
                    </div>
                  </div>
                ))}
                <div>
                  <label className="text-sm text-secondary mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-custom" />
                    <input type={showPassword ? "text" : "password"} placeholder="Min 8 characters" value={form.password}
                      onChange={update("password")} className="input-base pl-10 pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-custom">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-secondary mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-custom" />
                    <input type="password" placeholder="Re-enter password" value={form.confirmPassword}
                      onChange={update("confirmPassword")} className="input-base pl-10" required />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? "Creating account..." : "Create Account"}
                </button>
                <button type="button" onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-all">
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </button>
              </motion.form>
            )}

            {/* OTP */}
            {tab === "otp" && (
              <motion.form key="otp" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleVerifyOTP} className="space-y-5">
                <div className="text-center py-2">
                  <div className="text-4xl mb-3">📬</div>
                  <p className="text-secondary text-sm">We sent a 6-digit code to</p>
                  <p className="text-white font-semibold">{form.email}</p>
                </div>
                <div>
                  <label className="text-sm text-secondary mb-1.5 block text-center">Enter OTP</label>
                  <input type="text" maxLength={6} placeholder="000000" value={form.otp} onChange={update("otp")}
                    className="input-base text-center text-2xl tracking-[0.5em] font-mono" required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
                <div className="text-center text-sm">
                  <span className="text-secondary">Didn&apos;t receive? </span>
                  <button type="button" onClick={resendOTP} disabled={otpTimer > 0}
                    className={`font-semibold transition-colors ${otpTimer > 0 ? "text-muted-custom cursor-not-allowed" : "text-brand-400 hover:text-brand-300"}`}>
                    {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend OTP"}
                  </button>
                </div>
                <button type="button" onClick={() => setTab("login")} className="w-full text-sm text-secondary hover:text-white transition-colors">
                  ← Back to Login
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-muted-custom mt-4">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-brand-400 hover:underline">Terms</Link> and{" "}
          <Link href="/privacy" className="text-brand-400 hover:underline">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <AuthPageContent />
    </Suspense>
  );
}
