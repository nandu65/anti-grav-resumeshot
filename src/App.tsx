import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import HistoryPage from "./pages/History.tsx";
import Results from "./pages/Results.tsx";
import NotFound from "./pages/NotFound.tsx";
import Pricing from "./pages/Pricing.tsx";
import CoverLetterTool from "./pages/tools/CoverLetterTool.tsx";
import CompanyBriefTool from "./pages/tools/CompanyBriefTool.tsx";
import SkillGapTool from "./pages/tools/SkillGapTool.tsx";
import KeywordDensityTool from "./pages/tools/KeywordDensityTool.tsx";
import DiffTool from "./pages/tools/DiffTool.tsx";
import ResumeBuilder from "./pages/tools/ResumeBuilder.tsx";
import AtsCompareTool from "./pages/tools/AtsCompareTool.tsx";
import RecruiterViewTool from "./pages/tools/RecruiterViewTool.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Terms from "./pages/legal/Terms.tsx";
import Privacy from "./pages/legal/Privacy.tsx";
import Refund from "./pages/legal/Refund.tsx";
import Admin from "./pages/Admin.tsx";
import SharePage from "./pages/SharePage.tsx";
import Applications from "./pages/Applications.tsx";
import Notifications from "./pages/Notifications.tsx";
import { usePresence } from "./hooks/usePresence";

import { Navigate } from "react-router-dom";

function AppRoutes() {
  usePresence();
  return (
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
  );
}

const queryClient = new QueryClient();

import { useEffect } from "react";

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
