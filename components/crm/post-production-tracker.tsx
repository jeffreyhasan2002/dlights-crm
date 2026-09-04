"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Film,
  HardDrive,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  MessageCircle,
  Save,
  Sparkles,
  Truck,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { LeadWithDetails, PostProductionStatus, Profile } from "@/types/crm";
import { updateLeadPostProductionServerAction } from "@/lib/crm-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const POST_PROD_STAGES: { status: PostProductionStatus; label: string; iconName: string }[] = [
  { status: "Raw Footage Backup", label: "Raw Backup", iconName: "hard-drive" },
  { status: "Client Selection Sent", label: "Selection Sent", iconName: "image" },
  { status: "Client Selection Received", label: "Selection Done", iconName: "check" },
  { status: "Editing & Color Grading", label: "Editing / Color", iconName: "film" },
  { status: "Trailer / Film Delivered", label: "Film Delivered", iconName: "video" },
  { status: "Album Layout Proofing", label: "Album Proofing", iconName: "sparkles" },
  { status: "Album Printed & Delivered", label: "Album Delivered", iconName: "truck" },
  { status: "Project Completed", label: "Completed", iconName: "check" },
];

interface PostProductionTrackerProps {
  lead: LeadWithDetails;
  profile?: Profile;
}

export function PostProductionTracker({ lead, profile }: PostProductionTrackerProps) {
  const router = useRouter();

  const currentStage: PostProductionStatus =
    (lead.post_production_status as PostProductionStatus) || "Raw Footage Backup";

  const [selectedStatus, setSelectedStatus] = useState<PostProductionStatus>(currentStage);
  const [rawStorageLink, setRawStorageLink] = useState(lead.raw_storage_link || "");
  const [selectionGalleryLink, setSelectionGalleryLink] = useState(lead.selection_gallery_link || "");
  const [finalVideoLink, setFinalVideoLink] = useState(lead.final_video_link || "");
  const [galleryPasswordPin, setGalleryPasswordPin] = useState(lead.gallery_password_pin || "");

  const [isSaving, setIsSaving] = useState(false);

  const currentIndex = POST_PROD_STAGES.findIndex((s) => s.status === selectedStatus);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await updateLeadPostProductionServerAction(lead.id, {
        status: selectedStatus,
        rawStorageLink: rawStorageLink.trim() || undefined,
        selectionGalleryLink: selectionGalleryLink.trim() || undefined,
        finalVideoLink: finalVideoLink.trim() || undefined,
        galleryPasswordPin: galleryPasswordPin.trim() || undefined,
      });

      if (res.success) {
        toast.success("Post-production pipeline & gallery links updated");
        router.refresh();
      } else {
        toast.error("Failed to update post-production", {
          description: (res as any)?.error || "Database error",
        });
      }
    } catch {
      toast.error("An unexpected error occurred while saving post-production details");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareOnWhatsApp = () => {
    const clientName = lead.client?.name || "Client";
    const phone = (lead.client?.whatsapp || lead.client?.phone || "").replace(/\D/g, "");

    const studioName = profile?.business_name || "Dlight Studios";
    let msg = `Hi ${clientName},\n\nGreetings from *${studioName}*! ✨\nHere is an update on your *${lead.event_type}* post-production & deliverables:\n\n`;
    msg += `📊 *Current Status:* ${selectedStatus}\n`;

    if (selectionGalleryLink.trim()) {
      msg += `🖼️ *Client Photo Selection Gallery:*\n${selectionGalleryLink.trim()}\n`;
    }
    if (galleryPasswordPin.trim()) {
      msg += `🔑 *Gallery Password / PIN:* ${galleryPasswordPin.trim()}\n`;
    }
    if (finalVideoLink.trim()) {
      msg += `🎬 *Master Film / Video Link:*\n${finalVideoLink.trim()}\n`;
    }

    msg += `\nPlease let us know if you have any questions or selections ready!\n\nWarm regards,\n*${studioName} Team*`;

    const encoded = encodeURIComponent(msg);
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank");
  };

  return (
    <Card className="shadow-xs border-indigo-200/80 dark:border-indigo-900/50">
      <CardHeader className="pb-3 border-b bg-indigo-50/25 dark:bg-indigo-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-indigo-950 dark:text-indigo-100 flex items-center gap-2">
              <Film className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Post-Production Delivery Pipeline & Cloud Galleries</span>
            </CardTitle>
            <CardDescription className="text-xs text-indigo-900/70 dark:text-indigo-300/70">
              Track raw footage backup, client selections, film edits, albums, and cloud delivery links
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="outline" className="text-xs font-semibold bg-indigo-100/50 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 border-indigo-300 dark:border-indigo-800">
              {selectedStatus}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-6">
        {/* Stage Progress Stepper */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pipeline Stage (Click to update)
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {POST_PROD_STAGES.map((step, idx) => {
              const isCurrent = step.status === selectedStatus;
              const isPast = idx < currentIndex;

              return (
                <button
                  key={step.status}
                  type="button"
                  onClick={() => setSelectedStatus(step.status)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-300 dark:ring-indigo-800 font-semibold"
                      : isPast
                      ? "bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900 hover:bg-indigo-100/50"
                      : "bg-card text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <div className="mb-1">
                    {isCurrent ? (
                      <span className="p-1 rounded-full bg-white/20 inline-block">
                        {step.iconName === 'hard-drive' && <HardDrive className="h-3.5 w-3.5" />}
                        {step.iconName === 'image' && <ImageIcon className="h-3.5 w-3.5" />}
                        {step.iconName === 'check' && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {step.iconName === 'film' && <Film className="h-3.5 w-3.5" />}
                        {step.iconName === 'video' && <Video className="h-3.5 w-3.5" />}
                        {step.iconName === 'sparkles' && <Sparkles className="h-3.5 w-3.5" />}
                        {step.iconName === 'truck' && <Truck className="h-3.5 w-3.5" />}
                      </span>
                    ) : isPast ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 inline-block" />
                    ) : (
                      <Circle className="h-4 w-4 opacity-40 inline-block" />
                    )}
                  </div>
                  <span className="text-[11px] leading-tight line-clamp-2">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cloud Gallery Links & Credentials Grid */}
        <div className="space-y-3 pt-2 border-t">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Client Cloud Delivery Links & Storage
          </Label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selection Gallery URL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="selectionGallery" className="text-xs font-medium flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Client Photo Selection Gallery</span>
                </Label>
                {selectionGalleryLink && (
                  <a
                    href={selectionGalleryLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Open</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                id="selectionGallery"
                placeholder="https://clientgallery.dlightstudios.com or Google Drive"
                value={selectionGalleryLink}
                onChange={(e) => setSelectionGalleryLink(e.target.value)}
                className="text-xs h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                Pic-Time, Pixieset, or cloud album link for client photo selection.
              </p>
            </div>

            {/* Gallery Password / Access PIN */}
            <div className="space-y-1.5">
              <Label htmlFor="galleryPin" className="text-xs font-medium flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                <span>Gallery Password / PIN</span>
              </Label>
              <Input
                id="galleryPin"
                placeholder="e.g. DLIGHT2026 or 4882"
                value={galleryPasswordPin}
                onChange={(e) => setGalleryPasswordPin(e.target.value)}
                className="text-xs h-9 font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Access pin or download PIN provided to the client.
              </p>
            </div>

            {/* Master Film / Video Link */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="finalVideo" className="text-xs font-medium flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-rose-600" />
                  <span>Master Video / Film URL</span>
                </Label>
                {finalVideoLink && (
                  <a
                    href={finalVideoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Watch</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                id="finalVideo"
                placeholder="https://youtu.be/... or Vimeo / Drive link"
                value={finalVideoLink}
                onChange={(e) => setFinalVideoLink(e.target.value)}
                className="text-xs h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                Final cinematic teaser, wedding highlight, or master 4K film link.
              </p>
            </div>

            {/* Raw Footage Backup Archive */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="rawStorage" className="text-xs font-medium flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                  <span>Internal Raw Footage Archive</span>
                </Label>
                {rawStorageLink && (
                  <a
                    href={rawStorageLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Folder</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                id="rawStorage"
                placeholder="Google Drive, Dropbox, or NAS folder path"
                value={rawStorageLink}
                onChange={(e) => setRawStorageLink(e.target.value)}
                className="text-xs h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                Internal studio archive link for cards backup and project files.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShareOnWhatsApp}
            className="w-full sm:w-auto text-xs gap-1.5 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
            <span>Notify Client on WhatsApp</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>Save Post-Production</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
