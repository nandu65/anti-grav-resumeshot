import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LiveDiagnosticScanner } from "./LiveDiagnosticScanner";

export function AnalyzeProgress({
  open,
  title = "Tailoring your resume",
  targetRole,
  targetCompany,
}: {
  open: boolean;
  title?: string;
  targetRole?: string;
  targetCompany?: string;
}) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-2xl p-0 border-0 bg-transparent shadow-none"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        aria-live="polite"
      >
        <LiveDiagnosticScanner
          targetRole={targetRole || "Target Role"}
          targetCompany={targetCompany || "Target Company"}
        />
      </DialogContent>
    </Dialog>
  );
}
