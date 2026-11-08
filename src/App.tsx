import { Suspense, lazy, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { usePresence } from "./hooks/usePresence";
import { GlobalCursorSpotlight } from "@/components/GlobalCursorSpotlight";

// Critical landing and auth routes loaded immediately
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";

// Lazy-loaded routes for optimal initial bundle size and fast TTI
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const HistoryPage = lazy(() => import("./pages/History.tsx"));
const Results = lazy(() => import("./pages/Results.tsx"));
const ResumeBuilder = lazy(() => import("./pages/tools/ResumeBuilder.tsx"));
const CoverLetterTool = lazy(() => import("./pages/tools/CoverLetterTool.tsx"));
const CompanyBriefTool = lazy(() => import("./pages/tools/CompanyBriefTool.tsx"));
const SkillGapTool = lazy(() => import("./pages/tools/SkillGapTool.tsx"));
const KeywordDensityTool = lazy(() => import("./pages/tools/KeywordDensityTool.tsx"));
const DiffTool = lazy(() => import("./pages/tools/DiffTool.tsx"));
const AtsCompareTool = lazy(() => import("./pages/tools/AtsCompareTool.tsx"));
const RecruiterViewTool = lazy(() => import("./pages/tools/RecruiterViewTool.tsx"));
const Pricing = lazy(() => import("./pages/Pricing.tsx"));
const Terms = lazy(() => import("./pages/legal/Terms.tsx"));
const Privacy = lazy(() => import("./pages/legal/Privacy.tsx"));
const Refund = lazy(() => import("./pages/legal/Refund.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const SharePage = lazy(() => import("./pages/SharePage.tsx"));
const Applications = lazy(() => import("./pages/Applications.tsx"));
const Notifications = lazy(() => import("./pages/Notifications.tsx"));

function PageFallback() {
  return (
    <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Loading ResumeShot...</p>
    </div>
  );
}

function AppRoutes() {
  usePresence();
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/results/:id" element={<ProtectedRoute><Results /></ProtectedRoute>} />

        {/* Resume Builder & Aliases */}
        <Route path="/tools/resume-builder" element={<ResumeBuilder />} />
        <Route path="/resume-builder" element={<ResumeBuilder />} />
        <Route path="/resume_builder" element={<ResumeBuilder />} />
        <Route path="/resumebuilder" element={<ResumeBuilder />} />
        <Route path="/resume/builder" element={<ResumeBuilder />} />
        <Route path="/builder" element={<ResumeBuilder />} />
        <Route path="/resume" element={<ResumeBuilder />} />
        <Route path="/resume builder" element={<ResumeBuilder />} />
        <Route path="/resume%20builder" element={<ResumeBuilder />} />
        <Route path="/tools/resumebuilder" element={<ResumeBuilder />} />
        <Route path="/tools/resume_builder" element={<ResumeBuilder />} />
        <Route path="/tools/builder" element={<ResumeBuilder />} />
        <Route path="/tools/resume" element={<ResumeBuilder />} />

        {/* Other Tools & Aliases */}
        <Route path="/tools/cover-letter" element={<CoverLetterTool />} />
        <Route path="/cover-letter" element={<CoverLetterTool />} />
        <Route path="/coverletter" element={<CoverLetterTool />} />

        <Route path="/tools/company-brief" element={<CompanyBriefTool />} />
        <Route path="/company-brief" element={<CompanyBriefTool />} />

        <Route path="/tools/skill-gap" element={<SkillGapTool />} />
        <Route path="/skill-gap" element={<SkillGapTool />} />

        <Route path="/tools/keyword-density" element={<KeywordDensityTool />} />
        <Route path="/keyword-density" element={<KeywordDensityTool />} />

        <Route path="/tools/diff" element={<DiffTool />} />
        <Route path="/diff" element={<DiffTool />} />

        <Route path="/tools/ats-compare" element={<AtsCompareTool />} />
        <Route path="/ats-compare" element={<AtsCompareTool />} />

        <Route path="/tools/recruiter-view" element={<RecruiterViewTool />} />
        <Route path="/recruiter-view" element={<RecruiterViewTool />} />

        <Route path="/pricing" element={<Pricing />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/terms-of-service" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/privacy-policy" element={<Privacy />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/refund-policy" element={<Refund />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
        <Route path="/share/:token" element={<SharePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
        e.preventDefault();
      }
    };
    const handleGlobalDrop = (e: DragEvent) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
        e.preventDefault();
      }
    };
    window.addEventListener("dragover", handleGlobalDragOver);
    window.addEventListener("drop", handleGlobalDrop);
    return () => {
      window.removeEventListener("dragover", handleGlobalDragOver);
      window.removeEventListener("drop", handleGlobalDrop);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GlobalCursorSpotlight />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
