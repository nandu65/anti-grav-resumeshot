import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, HelpCircle, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { resetTour } from "@/components/OnboardingTour";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";

export function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const startTour = () => {
    setOpen(false);
    resetTour();
    window.dispatchEvent(new CustomEvent("tour:start"));
    if (window.location.pathname !== "/") window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 dark:bg-[#090b0e]/85 border-b border-zinc-200/80 dark:border-white/[0.08] transition-colors duration-300">
      <div className="container flex h-16 items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-base sm:text-lg min-w-0">
          <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Sparkles className="h-4 w-4 text-slate-950" />
          </div>
          <span className="truncate text-zinc-900 dark:text-white">ResumeShot <span className="text-emerald-500 dark:text-emerald-400">AI</span></span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
          <Button variant="ghost" size="sm" title="Take the product tour" onClick={startTour} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5">
            <HelpCircle className="h-4 w-4 mr-1 text-emerald-500 dark:text-emerald-400" /> Tour
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"><Link to="/pricing">Pricing</Link></Button>
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"><Link to="/dashboard">Dashboard</Link></Button>
              <Button asChild variant="ghost" size="sm" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"><Link to="/applications">Applications</Link></Button>
              <Button size="sm" variant="outline" className="border-zinc-200 dark:border-white/10 bg-white dark:bg-[#161922] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:text-white" onClick={() => supabase.auth.signOut()} aria-label="Sign out of your account">Sign out</Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"><Link to="/auth">Sign in</Link></Button>
              <Button asChild size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20 rounded-xl">
                <Link to="/auth">Get started</Link>
              </Button>
            </>
          )}
        </nav>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="mobile-nav-panel"
            onClick={() => setOpen((v) => !v)}
            className="text-foreground"
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {open && (
        <div id="mobile-nav-panel" role="menu" aria-label="Mobile navigation" className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="container py-3 flex flex-col gap-1">
            <Button variant="ghost" className="justify-start" onClick={startTour}>
              <HelpCircle className="h-4 w-4 mr-2" /> Tour
            </Button>
            <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
              <Link to="/pricing">Pricing</Link>
            </Button>
            {user ? (
              <>
                <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                  <Link to="/applications">Applications</Link>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  aria-label="Sign out of your account"
                  onClick={() => { setOpen(false); supabase.auth.signOut(); }}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button
                  asChild
                  className="justify-start bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-md"
                  onClick={() => setOpen(false)}
                >
                  <Link to="/auth">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
