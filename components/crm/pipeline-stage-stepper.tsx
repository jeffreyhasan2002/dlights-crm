"use client";

import * as React from "react";
import { Check, Sparkles, AlertCircle } from "lucide-react";
import { LeadStatus } from "@/types/crm";
import { updateLeadStatusServerAction } from "@/lib/crm-actions";
import { toast } from "sonner";

const STAGES: { id: LeadStatus; label: string }[] = [
  { id: "New Enquiry", label: "Enquiry" },
  { id: "Contacted", label: "Contacted" },
  { id: "Follow-up Required", label: "Follow-up" },
  { id: "Quotation Sent", label: "Quotation" },
  { id: "Negotiation", label: "Negotiate" },
  { id: "Accepted / Booked", label: "Booked" },
];

interface PipelineStageStepperProps {
  leadId: string;
  currentStatus: LeadStatus;
}

export function PipelineStageStepper({ leadId, currentStatus }: PipelineStageStepperProps) {
  const [status, setStatus] = React.useState<LeadStatus>(currentStatus);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const isLost = status === "Rejected / Lost";
  const currentIndex = STAGES.findIndex((s) => s.id === status);

  const handleStageClick = async (targetStage: LeadStatus) => {
    if (targetStage === status || isUpdating) return;
    setStatus(targetStage);
    try {
      setIsUpdating(true);
      const res = await updateLeadStatusServerAction(leadId, targetStage);
      if (res.success) {
        toast.success(`Pipeline stage moved to "${targetStage}"`);
      } else {
        setStatus(currentStatus);
      }
    } catch {
      setStatus(currentStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Pipeline Progression Flow
        </span>
        {isLost ? (
          <span className="text-xs font-semibold text-destructive">Deal Archived as Lost</span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Stage <strong className="text-foreground">{currentIndex + 1}</strong> of {STAGES.length}
          </span>
        )}
      </div>

      {/* Stepper Flow Bar */}
      <div className="grid grid-cols-6 gap-1.5 pt-1">
        {STAGES.map((s, index) => {
          const isCompleted = !isLost && currentIndex > index;
          const isCurrent = !isLost && currentIndex === index;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleStageClick(s.id)}
              disabled={isUpdating}
              className={`group flex flex-col items-center p-2 rounded-lg text-center transition-all border ${
                isCurrent
                  ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                  : isCompleted
                  ? "bg-emerald-50/50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-800"
                  : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/60"
              }`}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full mb-1">
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <span className="text-[10px] font-mono">{index + 1}</span>
                )}
              </div>
              <span className="text-[11px] truncate w-full">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
