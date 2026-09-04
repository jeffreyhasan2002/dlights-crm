"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ChevronRight, AlertTriangle } from "lucide-react";
import { LeadStatus } from "@/types/crm";
import { updateLeadStatusServerAction } from "@/lib/crm-actions";
import { toast } from "sonner";

const STAGES: { id: LeadStatus; label: string; short: string }[] = [
  { id: "New Enquiry", label: "New Enquiry", short: "Enquiry" },
  { id: "Contacted", label: "Contacted", short: "Contacted" },
  { id: "Follow-up Required", label: "Follow-up Required", short: "Follow-up" },
  { id: "Quotation Sent", label: "Quotation Sent", short: "Quotation" },
  { id: "Negotiation", label: "Negotiation", short: "Negotiate" },
  { id: "Accepted / Booked", label: "Accepted / Booked", short: "Booked" },
];

interface PipelineStageStepperProps {
  leadId: string;
  currentStatus: LeadStatus;
  onStatusChange?: (newStatus: LeadStatus) => void;
}

export function PipelineStageStepper({ leadId, currentStatus, onStatusChange }: PipelineStageStepperProps) {
  const router = useRouter();
  const [status, setStatus] = React.useState<LeadStatus>(currentStatus);
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const isLost = status === "Rejected / Lost";
  const currentIndex = STAGES.findIndex((s) => s.id === status);

  const handleStageClick = async (targetStage: LeadStatus) => {
    if (targetStage === status || isUpdating) return;
    setStatus(targetStage);
    if (onStatusChange) {
      onStatusChange(targetStage);
    }
    try {
      setIsUpdating(true);
      const res = await updateLeadStatusServerAction(leadId, targetStage);
      if (res.success) {
        toast.success(`Pipeline stage moved to "${targetStage}"`);
        router.refresh();
      } else {
        setStatus(currentStatus);
        if (onStatusChange) onStatusChange(currentStatus);
      }
    } catch {
      setStatus(currentStatus);
      if (onStatusChange) onStatusChange(currentStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-2xs space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Pipeline Progression
          </span>
          {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        </div>
        {isLost ? (
          <span className="text-xs font-semibold text-destructive flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Deal Archived as Lost / Rejected</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Stage <strong className="text-foreground">{currentIndex >= 0 ? currentIndex + 1 : 1}</strong> of {STAGES.length}
          </span>
        )}
      </div>

      {/* Stepper Flow Bar with Horizontal Scroll for Mobile */}
      <div className="overflow-x-auto pb-1 -mb-1 scrollbar-none">
        <div className="flex items-center min-w-[580px] sm:min-w-0 gap-1 sm:gap-1.5 pt-0.5">
          {STAGES.map((s, index) => {
            const isCompleted = !isLost && currentIndex > index;
            const isCurrent = !isLost && currentIndex === index;

            return (
              <React.Fragment key={s.id}>
                <button
                  type="button"
                  onClick={() => handleStageClick(s.id)}
                  disabled={isUpdating}
                  className={`flex-1 group flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all border ${
                    isCurrent
                      ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold ring-2 ring-primary/20"
                      : isCompleted
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/15"
                      : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground"
                  }`}
                  title={`Click to set stage: ${s.label}`}
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isCurrent
                        ? "bg-primary-foreground text-primary"
                        : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {isCompleted ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : index + 1}
                  </div>
                  <span className="truncate">{s.short}</span>
                </button>
                {index < STAGES.length - 1 && (
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40 hidden sm:block -mx-0.5" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
