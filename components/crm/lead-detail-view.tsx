"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Calendar,
  IndianRupee,
  Clock,
  FileText,
  CreditCard,
  Building2,
  StickyNote,
  Send,
  CheckCircle2,
  XCircle,
  MessageSquareQuote,
  Sparkles,
  Copy,
  Check,
  Plus,
  Share2,
  ExternalLink,
  Camera,
  Film,
  Disc,
  Layers,
  BookOpen,
  HardDrive,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { LeadWithDetails, Quotation, Booking, Communication, Note, Activity, LeadStatus } from "@/types/crm";
import { formatCurrency, formatDate, formatDateTime, isOverdue } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LeadTimeline } from "@/components/crm/lead-timeline";
import { LeadActionDialogs } from "@/components/crm/lead-action-dialogs";
import { PipelineStageStepper } from "@/components/crm/pipeline-stage-stepper";
import {
  addNoteServerAction,
  logCommunicationServerAction,
  updateLeadStatusServerAction,
  sendQuotationServerAction,
  acceptQuotationServerAction,
  startNegotiationServerAction,
  deleteLeadServerAction,
} from "@/lib/crm-actions";

interface LeadDetailViewProps {
  initialLead: LeadWithDetails;
}

export function LeadDetailView({ initialLead }: LeadDetailViewProps) {
  const router = useRouter();
  const [lead, setLead] = useState<LeadWithDetails>(initialLead);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Quick inline note state
  const [quickNote, setQuickNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Deliverables checklist local state
  const [deliverables, setDeliverables] = useState<Record<string, boolean>>({
    candidStills: true,
    cinematicFilm: true,
    traditionalCoverage: true,
    droneCinematography: Boolean((initialLead?.budget || 0) >= 400000),
    preWeddingShoot: Boolean(initialLead?.event_type?.toLowerCase()?.includes("pre-wedding")),
    luxuryAlbum: true,
    rawFootageDrive: true,
    sameDayReels: Boolean((initialLead?.budget || 0) >= 450000),
  });

  useEffect(() => {
    if (initialLead) {
      setLead(initialLead);
    }
  }, [initialLead]);

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground opacity-50" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">Lead Record Not Found</h2>
          <p className="text-xs text-muted-foreground">The requested client enquiry could not be retrieved.</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/crm">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            <span>Return to CRM Pipeline</span>
          </Link>
        </Button>
      </div>
    );
  }

  const client = lead.client || {
    id: lead.client_id || "client-fallback",
    owner_id: lead.owner_id,
    name: "Client Lead",
    phone: null,
    whatsapp: null,
    email: null,
    location: null,
    created_at: lead.created_at,
    updated_at: lead.updated_at,
  };

  const overdue = isOverdue(lead.next_follow_up_at);
  const quotations = lead.quotations || [];
  const booking = lead.bookings?.[0];
  const communications = lead.communications || [];
  const notes = lead.notes || [];
  const activities = lead.activities || [];

  // Calculate days remaining until event
  const getEventDaysLeft = () => {
    if (!lead.event_date) return null;
    const diff = new Date(lead.event_date).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return "Event Completed";
    if (days === 0) return "Event is Today";
    if (days === 1) return "Event Tomorrow (1 day left)";
    return `${days} days remaining`;
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAddQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNote.trim()) return;

    const content = quickNote.trim();
    setQuickNote("");

    // Optimistic update
    const newNote: Note = {
      id: "note-" + Date.now(),
      owner_id: lead.owner_id,
      lead_id: lead.id,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setLead((prev) => ({
      ...prev,
      notes: [newNote, ...(prev.notes || [])],
    }));

    try {
      setIsAddingNote(true);
      await addNoteServerAction(lead.id, content);
      toast.success("Studio note saved");
      router.refresh();
    } catch {
      toast.error("Failed to save note");
    } finally {
      setIsAddingNote(false);
    }
  };

  const toggleDeliverable = (key: string) => {
    setDeliverables((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.info("Deliverables checklist updated");
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteLead = async () => {
    try {
      setIsDeleting(true);
      const res = await deleteLeadServerAction(lead.id);
      if (res.success) {
        toast.success(`${client.name || "Lead"} deleted successfully.`);
        router.push("/crm");
        router.refresh();
      } else {
        toast.error("Failed to delete lead", { description: (res as any)?.error || "Database error" });
      }
    } catch {
      toast.error("An error occurred while deleting the lead.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Quick Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/crm">CRM Pipeline</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-foreground">{client.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Lead Action Modals + Delete Lead */}
        <div className="flex items-center gap-2 flex-wrap">
          <LeadActionDialogs lead={lead} />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/60 transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Delete Lead</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Delete Enquiry & Lead Record?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2 text-xs">
                  <p>
                    Are you sure you want to permanently delete{" "}
                    <strong className="text-foreground">{client.name}</strong> ({lead.event_type})?
                  </p>
                  <p className="text-destructive font-medium">
                    This action will permanently delete all quotations, booking agreements, payments, timeline activity, and client notes linked to this lead.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteLead}
                  disabled={isDeleting}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  {isDeleting ? "Deleting..." : "Permanently Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main Client Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-card p-6 rounded-2xl border shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {client.name}
            </h1>
            <Badge variant="outline" className="font-semibold text-xs px-2.5 bg-muted/40">
              {lead.event_type || "Event"}
            </Badge>
            <Badge
              variant={
                lead.lead_status === "Accepted / Booked"
                  ? "success"
                  : lead.lead_status === "Rejected / Lost"
                  ? "destructive"
                  : "default"
              }
              className="text-xs"
            >
              {lead.lead_status}
            </Badge>
            {getEventDaysLeft() && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Calendar className="h-3 w-3 text-primary" />
                <span>{getEventDaysLeft()}</span>
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
            {client.phone && (
              <div className="flex items-center gap-1.5 font-medium text-foreground group">
                <Phone className="h-3.5 w-3.5 text-primary" />
                <span>{client.phone}</span>
                <button
                  onClick={() => copyToClipboard(client.phone!, "Phone")}
                  className="text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity"
                  title="Copy Phone"
                >
                  {copiedField === "Phone" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span>{client.email}</span>
                <button
                  onClick={() => copyToClipboard(client.email!, "Email")}
                  className="text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity"
                  title="Copy Email"
                >
                  {copiedField === "Email" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            )}
            {client.location && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.location)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-primary hover:underline"
                title="Open in Google Maps"
              >
                <MapPin className="h-3.5 w-3.5 text-red-500" />
                <span>{client.location}</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-50" />
              </a>
            )}
            {lead.source && (
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Found via {lead.source}
              </span>
            )}
          </div>
        </div>

        {/* Direct Contact Launcher Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {client.whatsapp && (
            <Button
              size="sm"
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              asChild
            >
              <a
                href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hi ${client.name}! This is Bruno Sangeeth from Dlight Studios regarding your ${lead.event_type} on ${lead.event_date ? formatDate(lead.event_date) : "the upcoming date"}.`
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp Client</span>
              </a>
            </Button>
          )}

          {client.phone && (
            <Button size="sm" variant="outline" className="gap-1.5 text-xs shadow-2xs" asChild>
              <a href={`tel:${client.phone}`}>
                <Phone className="h-4 w-4" />
                <span>Direct Call</span>
              </a>
            </Button>
          )}

          {client.email && (
            <Button size="sm" variant="outline" className="gap-1.5 text-xs shadow-2xs" asChild>
              <a
                href={`mailto:${client.email}?subject=${encodeURIComponent(
                  `Dlight Studios Photography Proposal for ${client.name}`
                )}`}
              >
                <Mail className="h-4 w-4" />
                <span>Email Client</span>
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Visual Pipeline Progression Stepper */}
      <PipelineStageStepper leadId={lead.id} currentStatus={lead.lead_status} />

      {/* Grid Layout: 2/3 Content, 1/3 Timeline & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Next Action Banner */}
          {lead.next_action && (
            <Card className="border-amber-200/80 bg-amber-50/30 shadow-xs dark:border-amber-900/50 dark:bg-amber-950/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Next Required Action</span>
                  </span>
                  <p className="text-sm font-semibold text-foreground">{lead.next_action}</p>
                  {lead.next_action_due_at && (
                    <p className="text-xs text-muted-foreground">
                      Target Due Date: {formatDateTime(lead.next_action_due_at)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 2. Enquiry & Shoot Details */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                <span>Shoot & Requirement Specifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Event Type</span>
                <span className="font-semibold text-foreground text-sm">{lead.event_type}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Event Date</span>
                <span className="font-semibold text-foreground text-sm">
                  {lead.event_date ? formatDate(lead.event_date) : "TBD"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Venue / Location</span>
                <span className="font-semibold text-foreground text-sm">
                  {lead.location || "TBD"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Estimated Budget</span>
                <span className="font-semibold text-foreground text-sm">
                  {formatCurrency(lead.budget)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Enquiry Date</span>
                <span className="font-semibold text-foreground text-sm">
                  {formatDate(lead.created_at)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Follow-up Activity</span>
                <span className="font-semibold text-foreground text-sm">
                  {lead.follow_up_count} interactions
                </span>
              </div>

              {lead.enquiry_message && (
                <div className="col-span-full pt-3 border-t space-y-1">
                  <span className="text-muted-foreground font-semibold">Initial Enquiry Message:</span>
                  <p className="p-3.5 bg-muted/40 rounded-xl text-foreground italic border">
                    "{lead.enquiry_message}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Deliverables & Production Package Checklist */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Film className="h-4 w-4 text-primary" />
                <span>Deliverables & Production Scope</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Select contracted media deliverables for photography and cinematography
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 p-2.5 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors">
                <Checkbox
                  checked={deliverables.candidStills}
                  onCheckedChange={() => toggleDeliverable("candidStills")}
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Candid Wedding Photography</span>
                  <span className="text-[10px] text-muted-foreground">High-res edited stills with color grade</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors">
                <Checkbox
                  checked={deliverables.cinematicFilm}
                  onCheckedChange={() => toggleDeliverable("cinematicFilm")}
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Cinematic 4K Wedding Trailer</span>
                  <span className="text-[10px] text-muted-foreground">3-5 min highlight reel with licensed music</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors">
                <Checkbox
                  checked={deliverables.traditionalCoverage}
                  onCheckedChange={() => toggleDeliverable("traditionalCoverage")}
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Traditional Full Coverage</span>
                  <span className="text-[10px] text-muted-foreground">60-90 min ceremony documentation</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors">
                <Checkbox
                  checked={deliverables.droneCinematography}
                  onCheckedChange={() => toggleDeliverable("droneCinematography")}
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Aerial Drone 4K Cinematography</span>
                  <span className="text-[10px] text-muted-foreground">Licensed drone pilot aerial footage</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors">
                <Checkbox
                  checked={deliverables.luxuryAlbum}
                  onCheckedChange={() => toggleDeliverable("luxuryAlbum")}
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Luxury Hardbound Photo Album</span>
                  <span className="text-[10px] text-muted-foreground">40-page flush mount silk album</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors">
                <Checkbox
                  checked={deliverables.rawFootageDrive}
                  onCheckedChange={() => toggleDeliverable("rawFootageDrive")}
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Raw Footage SSD Handover</span>
                  <span className="text-[10px] text-muted-foreground">Master files on studio SSD drive</span>
                </div>
              </label>
            </CardContent>
          </Card>

          {/* 4. Quotations Section */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <span>Quotations & Commercial Proposals</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Proposals submitted for package consideration
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {quotations.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No quotation draft created yet for this client lead.
                </div>
              ) : (
                quotations.map((q) => (
                  <div
                    key={q.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border rounded-xl bg-card gap-3 shadow-2xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs bg-muted/60 px-2 py-0.5 rounded border">
                          {q.quotation_number}
                        </span>
                        <Badge
                          variant={
                            q.status === "Accepted"
                              ? "success"
                              : q.status === "Rejected"
                              ? "destructive"
                              : "outline"
                          }
                          className="text-[10px]"
                        >
                          {q.status}
                        </Badge>
                      </div>
                      {q.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{q.notes}</p>
                      )}
                      <div className="text-[11px] text-muted-foreground pt-1">
                        Created {formatDate(q.created_at)}
                        {q.sent_at && ` • Sent ${formatDate(q.sent_at)}`}
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="font-bold text-base text-foreground tracking-tight">
                        {formatCurrency(q.amount)}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Contract Package
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* 5. Booking & Financial Ledger */}
          {booking && (
            <Card className="shadow-xs border-emerald-200/80 dark:border-emerald-900/50">
              <CardHeader className="pb-3 border-b bg-emerald-50/20 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-emerald-600" />
                      <span>Booking Contract & Financial Ledger</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                      Confirmed status: {booking.booking_status}
                    </CardDescription>
                  </div>
                  <Badge variant="success">{booking.booking_status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 border rounded-xl bg-background shadow-2xs">
                    <span className="text-xs text-muted-foreground block">Total Contract</span>
                    <span className="font-bold text-base text-foreground">
                      {formatCurrency(booking.total_amount)}
                    </span>
                  </div>
                  <div className="p-3 border rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 shadow-2xs">
                    <span className="text-xs text-emerald-700 dark:text-emerald-300 block">Advance Token</span>
                    <span className="font-bold text-base text-emerald-800 dark:text-emerald-200">
                      {formatCurrency(booking.advance_amount)}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {booking.advance_paid_at ? "Paid" : "Due"}
                    </p>
                  </div>
                  <div className="p-3 border rounded-xl bg-amber-50/50 dark:bg-amber-950/30 shadow-2xs">
                    <span className="text-xs text-amber-700 dark:text-amber-300 block">Remaining Due</span>
                    <span className="font-bold text-base text-amber-800 dark:text-amber-200">
                      {formatCurrency(booking.remaining_amount)}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Final settlement
                    </p>
                  </div>
                </div>

                {/* Payments History */}
                <div className="space-y-2 pt-2 border-t">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Payments Received
                  </span>
                  {(!booking.payments || booking.payments.length === 0) ? (
                    <p className="text-xs text-muted-foreground">No payments recorded yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {booking.payments.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-xs border"
                        >
                          <div>
                            <span className="font-semibold text-foreground">
                              {formatCurrency(p.amount)}
                            </span>
                            <span className="text-muted-foreground ml-2">
                              ({p.payment_type} via {p.payment_method})
                            </span>
                            {p.reference && (
                              <span className="text-muted-foreground text-[11px] block">
                                Ref: {p.reference}
                              </span>
                            )}
                          </div>
                          <span className="text-muted-foreground">{formatDate(p.payment_date)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 6. Communication Log */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquareQuote className="h-4 w-4 text-primary" />
                <span>Communication History</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {communications.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No communication logs recorded yet. Use "Log Contact" to save phone calls and messages.
                </div>
              ) : (
                communications.map((c) => (
                  <div key={c.id} className="p-3 border rounded-xl bg-card text-xs space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{c.direction}</Badge>
                        <span className="font-semibold text-foreground">{c.contact_method}</span>
                      </div>
                      <span className="text-muted-foreground text-[10px]">
                        {formatDateTime(c.created_at)}
                      </span>
                    </div>
                    <p className="text-muted-foreground pt-0.5">{c.message}</p>
                    {c.client_response && (
                      <div className="p-2.5 bg-muted/50 rounded-lg mt-1 text-foreground border border-border/60">
                        <span className="font-semibold text-muted-foreground">Client:</span> {c.client_response}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* 7. Internal Notes with Quick Inline Input */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-amber-600" />
                <span>Internal Studio Notes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Inline Quick Note Form */}
              <form onSubmit={handleAddQuickNote} className="flex gap-2">
                <Input
                  placeholder="Type a quick note about this shoot or client..."
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  className="text-xs"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!quickNote.trim() || isAddingNote}
                  className="text-xs gap-1 shrink-0"
                >
                  {isAddingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  <span>Add Note</span>
                </Button>
              </form>

              {notes.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No internal notes logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {notes.map((n) => (
                    <div key={n.id} className="p-3 bg-muted/30 border rounded-xl text-xs space-y-1">
                      <p className="text-foreground">{n.content}</p>
                      <span className="text-[10px] text-muted-foreground block text-right">
                        {formatDateTime(n.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col) - Timeline & Status Summary */}
        <div className="space-y-6">
          {/* Status & Follow-up Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold">Relationship Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Lead Status</span>
                <span className="font-semibold text-foreground">{lead.lead_status}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Contact Status</span>
                <span className="font-semibold text-foreground">{lead.contact_status}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Last Contacted</span>
                <span>{lead.last_contacted_at ? formatDateTime(lead.last_contacted_at) : "Never"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Next Follow-up</span>
                <span className={overdue ? "text-destructive font-bold" : "font-semibold text-foreground"}>
                  {lead.next_follow_up_at ? formatDateTime(lead.next_follow_up_at) : "None scheduled"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Follow-up Count</span>
                <span className="font-semibold text-foreground">{lead.follow_up_count} times</span>
              </div>
            </CardContent>
          </Card>

          {/* Full Activity Timeline */}
          <Card className="shadow-xs">
            <CardContent className="p-4">
              <LeadTimeline activities={activities} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
