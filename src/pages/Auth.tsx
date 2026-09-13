import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || "/dashboard";
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password reset link sent! Check your email.");
      setForgotOpen(false);
      setForgotEmail("");
    }
  };

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}${redirectTo}` },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Account created! Redirecting...");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    // Log attempt so admins can spot brute-force
    supabase.from("login_attempts").insert({
      email,
      success: !error,
      user_agent: navigator.userAgent.slice(0, 300),
      error: error?.message?.slice(0, 500) ?? null,
    } as any).then(() => {});
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen bg-[#090b0e] flex items-center justify-center p-4 relative overflow-hidden text-zinc-100">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-2 font-display font-bold text-xl mb-8">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Sparkles className="h-4 w-4 text-slate-950" />
          </div>
          <span className="text-white">ResumeShot <span className="text-emerald-400">AI</span></span>
        </Link>
        <div className="rounded-2xl border border-white/[0.08] bg-[#11141b]/95 backdrop-blur-xl p-8 shadow-2xl">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#161922] p-1 rounded-xl border border-white/[0.06]">
              <TabsTrigger value="signin" className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 font-semibold text-xs rounded-lg transition-all">Sign in</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 font-semibold text-xs rounded-lg transition-all">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="si-email" className="text-xs text-zinc-300">Email</Label>
                  <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-[#161922] border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="si-pw" className="text-xs text-zinc-300">Password</Label>
                  <PasswordInput id="si-pw" required value={password} onChange={(e) => setPassword(e.target.value)} className="bg-[#161922] border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 rounded-xl" />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 rounded-xl h-10 cursor-pointer">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
                <button
                  type="button"
                  onClick={() => { setForgotEmail(email); setForgotOpen(true); }}
                  className="block w-full text-center text-xs text-zinc-400 hover:text-emerald-400 transition-colors pt-2"
                >
                  Forgot password?
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="su-email" className="text-xs text-zinc-300">Email</Label>
                  <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-[#161922] border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-pw" className="text-xs text-zinc-300">Password</Label>
                  <PasswordInput id="su-pw" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="bg-[#161922] border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 rounded-xl" />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 rounded-xl h-10 cursor-pointer">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
                <p className="text-xs text-zinc-400 text-center">Free plan includes 1 resume optimization.</p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your account email and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fp-email">Email</Label>
              <Input id="fp-email" type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <Button type="submit" disabled={forgotLoading} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-md">
              {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
