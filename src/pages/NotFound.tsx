import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const rawPath = decodeURIComponent(location.pathname).toLowerCase().replace(/[_-]/g, " ").trim();
    if (rawPath.includes("resume") && rawPath.includes("builder")) {
      navigate("/tools/resume-builder", { replace: true });
      return;
    }
    if (rawPath === "/resume" || rawPath === "/builder") {
      navigate("/tools/resume-builder", { replace: true });
      return;
    }
    if (rawPath.includes("cover") && rawPath.includes("letter")) {
      navigate("/tools/cover-letter", { replace: true });
      return;
    }
    if (rawPath.includes("company") && rawPath.includes("brief")) {
      navigate("/tools/company-brief", { replace: true });
      return;
    }
    if (rawPath.includes("skill") && rawPath.includes("gap")) {
      navigate("/tools/skill-gap", { replace: true });
      return;
    }
    if (rawPath.includes("keyword")) {
      navigate("/tools/keyword-density", { replace: true });
      return;
    }
    if (rawPath.includes("ats")) {
      navigate("/tools/ats-compare", { replace: true });
      return;
    }
    if (rawPath.includes("recruiter")) {
      navigate("/tools/recruiter-view", { replace: true });
      return;
    }

    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
