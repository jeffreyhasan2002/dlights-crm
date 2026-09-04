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
  Edit3,
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
  Tag,
  ChevronRight,
  TrendingUp,
  Activity as ActivityIcon,
  ShieldCheck,
  User,
  MoreVertical,
  CheckCircle,
  Radio,
  Compass,
  LayoutGrid,
  TableProperties,
  Users,
  Lock,
  ChevronDown,
  PhoneCall,
} from "lucide-react";
import { toast } from "sonner";

import {
  LeadWithDetails,
  Quotation,
  Booking,
  Communication,
  Note,
  Activity,
  LeadStatus,
  ContactStatus,
  Profile,
} from "@/types/crm";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  isOverdue,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadTimeline } from "@/components/crm/lead-timeline";
import { LeadActionDialogs } from "@/components/crm/lead-action-dialogs";
import { EditLeadDialog } from "@/components/crm/edit-lead-dialog";
import { WhatsAppProposalDialog } from "@/components/crm/whatsapp-proposal-dialog";
import { ShootCallSheetDialog } from "@/components/crm/shoot-call-sheet-dialog";
import { DeliverablesEditor } from "@/components/crm/deliverables-editor";
import { LeadExpenseCalculator } from "@/components/crm/lead-expense-calculator";
import { PipelineStageStepper } from "@/components/crm/pipeline-stage-stepper";
import { PostProductionTracker } from "@/components/crm/post-production-tracker";
import { RecordPaymentDialog } from "@/components/payments/record-payment-dialog";
import { WhatsAppPaymentReminderDialog } from "@/components/payments/whatsapp-payment-reminder-dialog";
import { EditEventDialog } from "@/components/crm/edit-event-dialog";
import {
  addNoteServerAction,
  logCommunicationServerAction,
  updateLeadStatusServerAction,
  updateContactStatusServerAction,
  sendQuotationServerAction,
  acceptQuotationServerAction,
  startNegotiationServerAction,
  deleteLeadServerAction,
} from "@/lib/crm-actions";

interface LeadDetailViewProps {
  initialLead: LeadWithDetails;
  profile?: Profile;
}

export function LeadDetailView({ initialLead, profile }: LeadDetailViewProps) {
  const router = useRouter();
  const [lead, setLead] = useState<LeadWithDetails>(initialLead);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [eventScheduleView, setEventScheduleView] = useState<
    "cards" | "matrix"
  >("cards");
  const [isScrolled, setIsScrolled] = useState(false);

  // Quick inline note state
  const [quickNote, setQuickNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleScroll = (e?: any) => {
      const mainEl = document.querySelector("main");
      const currentScroll =
        window.scrollY ||
        (typeof e?.target?.scrollTop === "number" ? e.target.scrollTop : 0) ||
        (mainEl?.scrollTop ?? 0);
      setIsScrolled(currentScroll > 180);
    };
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.addEventListener("scroll", handleScroll, { passive: true });
    }
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true } as any);
      if (mainEl) {
        mainEl.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    if (initialLead) {
      setLead(initialLead);
    }
  }, [initialLead]);

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-slate-500 dark:text-slate-400 opacity-50" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Lead Record Not Found
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The requested client enquiry could not be retrieved.
          </p>
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
  const acceptedQuote = quotations.find((q) => q.status === "Accepted");
  const latestQuote = quotations[0];
  const derivedContractTotal =
    Number(lead.bookings?.[0]?.total_amount) ||
    Number(acceptedQuote?.amount) ||
    Number(latestQuote?.amount) ||
    Number(lead.budget) ||
    0;

  const rawBooking = lead.bookings?.[0];
  const booking: Booking | null =
    rawBooking ||
    (lead.lead_status === "Accepted / Booked" || derivedContractTotal > 0
      ? ({
          id: "b-" + lead.id,
          lead_id: lead.id,
          client_id: lead.client_id,
          owner_id: lead.owner_id,
          booking_status:
            lead.lead_status === "Accepted / Booked"
              ? "Booking Confirmed"
              : "Tentative Contract",
          booking_date: (lead.created_at || new Date().toISOString()).split(
            "T",
          )[0],
          total_amount: derivedContractTotal,
          advance_amount: 0,
          remaining_amount: derivedContractTotal,
          advance_paid_at: null,
          final_payment_due_date: lead.event_date || null,
          notes: "Confirmed booking contract.",
          payments: [],
          created_at: lead.created_at || new Date().toISOString(),
          updated_at: lead.updated_at || new Date().toISOString(),
        } as Booking)
      : null);

  const paymentsList = booking?.payments || [];
  const actualTotalPaid = paymentsList.reduce(
    (acc: number, p: any) => acc + (Number(p.amount) || 0),
    0,
  );
  const actualAdvancePaid = paymentsList
    .filter((p: any) => p.payment_type === "Advance")
    .reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
  const actualContractTotal =
    Number(booking?.total_amount) || derivedContractTotal;
  const actualRemainingDue = Math.max(0, actualContractTotal - actualTotalPaid);
  const paidPercent =
    actualContractTotal > 0
      ? Math.min(100, Math.round((actualTotalPaid / actualContractTotal) * 100))
      : 0;

  const communications = lead.communications || [];
  const notes = lead.notes || [];
  const activities = lead.activities || [];

  // Deliverable visual badge configuration with icons and styling
  const getDeliverableBadgeConfig = (req: string) => {
    const lower = req.toLowerCase();
    if (lower.includes("drone") || lower.includes("aerial")) {
      return {
        label: req,
        icon: <Compass className="h-3 w-3 shrink-0 text-slate-500" />,
        bgClass: "bg-slate-1000/10 dark:bg-slate-900",
        textClass: "text-slate-500 dark:text-slate-400",
        borderClass: "border-slate-200 dark:border-slate-200",
        category: "aerial",
      };
    }
    if (
      lower.includes("live") ||
      lower.includes("stream") ||
      lower.includes("telecast")
    ) {
      return {
        label: req,
        icon: <Radio className="h-3 w-3 shrink-0 text-emerald-500" />,
        bgClass: "bg-emerald-500/10 dark:bg-emerald-950/40",
        textClass: "text-emerald-800 dark:text-emerald-300",
        borderClass: "border-emerald-500/25 dark:border-emerald-700/50",
        category: "stream",
      };
    }
    if (
      lower.includes("album") ||
      lower.includes("photobook") ||
      lower.includes("book") ||
      lower.includes("magazine")
    ) {
      return {
        label: req,
        icon: <BookOpen className="h-3 w-3 shrink-0 text-slate-500" />,
        bgClass: "bg-slate-1000/10 dark:bg-slate-900",
        textClass: "text-slate-500 dark:text-slate-400",
        borderClass: "border-slate-200 dark:border-slate-200",
        category: "album",
      };
    }
    if (
      lower.includes("video") ||
      lower.includes("cinemat") ||
      lower.includes("film") ||
      lower.includes("teaser") ||
      lower.includes("sde") ||
      lower.includes("same day")
    ) {
      return {
        label: req,
        icon: <Film className="h-3 w-3 shrink-0 text-slate-500" />,
        bgClass: "bg-slate-1000/10 dark:bg-slate-900",
        textClass: "text-slate-500 dark:text-slate-400",
        borderClass: "border-slate-200 dark:border-slate-200",
        category: "video",
      };
    }
    if (
      lower.includes("photo") ||
      lower.includes("candid") ||
      lower.includes("traditional")
    ) {
      return {
        label: req,
        icon: <Camera className="h-3 w-3 shrink-0 text-slate-500" />,
        bgClass: "bg-slate-1000/10 dark:bg-slate-900",
        textClass: "text-slate-500 dark:text-slate-400",
        borderClass: "border-slate-200 dark:border-slate-200",
        category: "photo",
      };
    }
    if (
      lower.includes("pre") ||
      lower.includes("post") ||
      lower.includes("couple") ||
      lower.includes("shoot")
    ) {
      return {
        label: req,
        icon: <Sparkles className="h-3 w-3 shrink-0 text-slate-500" />,
        bgClass: "bg-slate-1000/10 dark:bg-slate-900",
        textClass: "text-slate-500 dark:text-slate-400",
        borderClass: "border-slate-200 dark:border-slate-200",
        category: "shoot",
      };
    }
    return {
      label: req,
      icon: <Tag className="h-3 w-3 shrink-0 text-slate-500" />,
      bgClass: "bg-muted/80",
      textClass: "text-slate-900 dark:text-slate-100",
      borderClass: "border-border",
      category: "other",
    };
  };

  // Estimated crew footprint per ceremony
  const getEstimatedCrewSummary = (reqs: string[]): string[] => {
    if (!reqs || reqs.length === 0) return ["Standard Studio Crew"];
    const crew: string[] = [];
    const lowerReqs = reqs.map((r) => r.toLowerCase());

    const hasCandidPhoto = lowerReqs.some((r) => r.includes("candid photo"));
    const hasTradPhoto = lowerReqs.some((r) => r.includes("traditional photo"));
    const hasPhotoGeneric = lowerReqs.some(
      (r) =>
        r.includes("photo") &&
        !r.includes("candid") &&
        !r.includes("traditional"),
    );

    if (hasCandidPhoto && hasTradPhoto) {
      crew.push("2 Photographers (Candid + Traditional)");
    } else if (hasCandidPhoto) {
      crew.push("1 Candid Photographer");
    } else if (hasTradPhoto) {
      crew.push("1 Traditional Photographer");
    } else if (hasPhotoGeneric) {
      crew.push("1 Photographer");
    }

    const hasCinematic = lowerReqs.some(
      (r) =>
        r.includes("cinemat") || r.includes("teaser") || r.includes("film"),
    );
    const hasTradVideo = lowerReqs.some((r) => r.includes("traditional video"));
    const hasVideoGeneric = lowerReqs.some(
      (r) =>
        r.includes("video") &&
        !r.includes("traditional") &&
        !r.includes("cinemat"),
    );

    if (hasCinematic && hasTradVideo) {
      crew.push("2 Cinematographers");
    } else if (hasCinematic) {
      crew.push("1 Cinematographer");
    } else if (hasTradVideo) {
      crew.push("1 Videographer");
    } else if (hasVideoGeneric) {
      crew.push("1 Videographer");
    }

    if (lowerReqs.some((r) => r.includes("drone") || r.includes("aerial"))) {
      crew.push("1 Drone Pilot");
    }

    if (lowerReqs.some((r) => r.includes("live") || r.includes("stream"))) {
      crew.push("1 Live Stream Technician");
    }

    return crew.length > 0 ? crew : ["Standard Studio Coverage"];
  };

  // Resolved list of events with robust requirements & metadata normalization
  const displayedEvents =
    Array.isArray(lead.events) && lead.events.length > 0
      ? lead.events.map((ev, idx) => {
          const evReqs: string[] =
            Array.isArray((ev as any).requirements) &&
            (ev as any).requirements.length > 0
              ? (ev as any).requirements
              : (() => {
                  if (ev.notes && typeof ev.notes === "string") {
                    const m = ev.notes.match(
                      /\[REQUIREMENTS\]:\s*(\[[^\]]*\])/,
                    );
                    if (m) {
                      try {
                        return JSON.parse(m[1]) as string[];
                      } catch {}
                    }
                  }
                  if (
                    idx === 0 &&
                    Array.isArray(lead.requirements) &&
                    lead.requirements.length > 0
                  ) {
                    return lead.requirements;
                  }
                  return [];
                })();

          const evOther: string | null =
            (ev as any).other_requirement ||
            (() => {
              if (ev.notes && typeof ev.notes === "string") {
                const m = ev.notes.match(/\[OTHER_REQ\]:\s*(.*)$/m);
                if (m) return m[1].trim();
              }
              if (idx === 0 && (lead as any).other_requirement) {
                return (lead as any).other_requirement;
              }
              return null;
            })();

          return {
            ...ev,
            requirements: evReqs,
            other_requirement: evOther,
          };
        })
      : lead.event_date || lead.event_type
        ? [
            {
              id: "ev-primary-" + lead.id,
              lead_id: lead.id,
              client_id: lead.client_id,
              owner_id: lead.owner_id,
              event_name: lead.event_type || "Primary Shoot",
              event_type: lead.event_type || "Other",
              custom_event_type: (lead as any).custom_event_type || null,
              event_date: lead.event_date || "",
              start_time: lead.event_start_time || null,
              end_time: lead.event_end_time || null,
              location: lead.location || null,
              status: "Upcoming",
              notes: null,
              requirements: Array.isArray(lead.requirements)
                ? lead.requirements
                : [],
              other_requirement: (lead as any).other_requirement || null,
              created_at: lead.created_at,
              updated_at: lead.updated_at,
            },
          ]
        : [];

  // Aggregated master list of all distinct requirements across all events + lead
  const allUniqueRequirements = Array.from(
    new Set([
      ...(Array.isArray(lead.requirements) ? lead.requirements : []),
      ...displayedEvents.flatMap((ev: any) =>
        Array.isArray(ev.requirements) ? ev.requirements : [],
      ),
    ]),
  );

  // Group deliverables by production category for clean, structured display
  const groupedDeliverables = React.useMemo(() => {
    const groups: {
      label: string;
      icon: React.ReactNode;
      items: string[];
      color: string;
    }[] = [
      {
        label: "Photography Coverage",
        icon: <Camera className="h-3.5 w-3.5 text-slate-500" />,
        items: [],
        color:
          "bg-slate-1000/10 text-slate-500 dark:text-slate-400 border-slate-200",
      },
      {
        label: "Cinematography & Video",
        icon: <Film className="h-3.5 w-3.5 text-slate-500" />,
        items: [],
        color:
          "bg-slate-1000/10 text-slate-500 dark:text-slate-400 border-slate-200",
      },
      {
        label: "Aerial / Drone Coverage",
        icon: <Compass className="h-3.5 w-3.5 text-slate-500" />,
        items: [],
        color:
          "bg-slate-1000/10 text-slate-500 dark:text-slate-400 border-slate-200",
      },
      {
        label: "Luxury Albums & Photobooks",
        icon: <BookOpen className="h-3.5 w-3.5 text-slate-500" />,
        items: [],
        color:
          "bg-slate-1000/10 text-slate-500 dark:text-slate-400 border-slate-200",
      },
      {
        label: "Live Streaming & Broadcast",
        icon: <Radio className="h-3.5 w-3.5 text-emerald-500" />,
        items: [],
        color:
          "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/25",
      },
      {
        label: "Couple / Pre-Wedding Shoots",
        icon: <Sparkles className="h-3.5 w-3.5 text-slate-500" />,
        items: [],
        color:
          "bg-slate-1000/10 text-slate-500 dark:text-slate-400 border-slate-200",
      },
      {
        label: "Custom & Special Services",
        icon: <Tag className="h-3.5 w-3.5 text-slate-500" />,
        items: [],
        color: "bg-muted text-slate-900 dark:text-slate-100 border-border",
      },
    ];

    allUniqueRequirements.forEach((req) => {
      const conf = getDeliverableBadgeConfig(req);
      const target =
        groups.find((g) => {
          if (conf.category === "photo" && g.label.includes("Photo"))
            return true;
          if (conf.category === "video" && g.label.includes("Cinema"))
            return true;
          if (conf.category === "aerial" && g.label.includes("Aerial"))
            return true;
          if (conf.category === "album" && g.label.includes("Album"))
            return true;
          if (conf.category === "stream" && g.label.includes("Live"))
            return true;
          if (conf.category === "shoot" && g.label.includes("Couple"))
            return true;
          return false;
        }) || groups[groups.length - 1];

      target.items.push(req);
    });

    return groups.filter((g) => g.items.length > 0);
  }, [allUniqueRequirements]);

  const handlePaymentRecorded = (payment: any, updatedBooking?: any) => {
    setLead((prev) => {
      const existingBookings = prev.bookings || [];
      const baseContract =
        Number(updatedBooking?.total_amount) ||
        Number(existingBookings[0]?.total_amount) ||
        derivedContractTotal ||
        Number(prev.budget) ||
        0;

      const currentBooking = existingBookings[0] ||
        booking || {
          id: updatedBooking?.id || "b-" + prev.id,
          lead_id: prev.id,
          client_id: prev.client_id,
          owner_id: prev.owner_id,
          booking_status: "Booking Confirmed",
          booking_date: new Date().toISOString().split("T")[0],
          total_amount: baseContract,
          advance_amount: 0,
          remaining_amount: baseContract,
          advance_paid_at: null,
          final_payment_due_date: prev.event_date || null,
          notes: "Confirmed booking contract.",
          payments: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

      const currentPayments = currentBooking.payments || [];
      const updatedPayments = [
        payment,
        ...currentPayments.filter((p: any) => p.id !== payment.id),
      ];
      const totalPaid = updatedPayments.reduce(
        (acc: number, p: any) => acc + (Number(p.amount) || 0),
        0,
      );
      const newRemaining = Math.max(0, baseContract - totalPaid);

      const resolvedB: Booking = {
        ...currentBooking,
        ...(updatedBooking || {}),
        total_amount: baseContract,
        booking_status: "Booking Confirmed",
        payments: updatedPayments,
        remaining_amount: newRemaining,
        advance_paid_at:
          payment.payment_type === "Advance"
            ? payment.payment_date
            : currentBooking.advance_paid_at,
        updated_at: new Date().toISOString(),
      };

      return {
        ...prev,
        lead_status: "Accepted / Booked",
        bookings: [resolvedB, ...existingBookings.slice(1)],
      };
    });
    router.refresh();
  };

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

  const handleConfirmBooking = async () => {
    try {
      setLead((prev) => ({ ...prev, lead_status: "Accepted / Booked" }));
      const res = await updateLeadStatusServerAction(
        lead.id,
        "Accepted / Booked",
      );
      if (res.success) {
        toast.success("Booking confirmed successfully!");
        router.refresh();
      } else {
        toast.error("Failed to confirm booking");
      }
    } catch {
      toast.error("An error occurred while confirming booking");
    }
  };

  const handleUpdateContactStatus = async (newStatus: ContactStatus) => {
    if (lead.contact_status === newStatus) return;
    const now = new Date().toISOString();
    setLead((prev) => ({
      ...prev,
      contact_status: newStatus,
      last_contacted_at: newStatus !== "Not Contacted" ? now : prev.last_contacted_at,
    }));
    try {
      const res = await updateContactStatusServerAction(lead.id, newStatus);
      if (res.success) {
        toast.success(`Contact status updated to "${newStatus}"`);
        router.refresh();
      } else {
        toast.error("Failed to update contact status");
      }
    } catch {
      toast.error("An error occurred while updating contact status");
    }
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

  const handleDeleteLead = async () => {
    try {
      setIsDeleting(true);
      const res = await deleteLeadServerAction(lead.id);
      if (res.success) {
        toast.success(`${client.name || "Lead"} deleted successfully.`);
        router.push("/crm");
        router.refresh();
      } else {
        toast.error("Failed to delete lead", {
          description: (res as any)?.error || "Database error",
        });
      }
    } catch {
      toast.error("An error occurred while deleting the lead.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for initials
  const getInitials = (name?: string) => {
    if (!name) return "CL";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background pb-24 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 pt-1 sm:pt-3">
      <div className="mx-auto w-full max-w-[1480px] space-y-6 sm:space-y-7">
        {/* COMPACT STICKY CLIENT HEADER (Reveals smoothly on scroll on desktop) */}
        <div
          className={`fixed top-0 left-0 md:left-64 right-0 z-40 border-b bg-background/95 backdrop-blur-md transition-all duration-200 shadow-xs ${
            isScrolled
              ? "translate-y-0 opacity-100"
              : "-translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="max-w-[1480px] mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 select-none">
                {getInitials(client.name)}
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-sm text-foreground truncate">
                  {client.name}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0 hidden sm:inline-flex bg-muted/40 font-medium"
                >
                  {lead.event_type || "Event"}
                </Badge>
                <Badge
                  variant={
                    lead.lead_status === "Accepted / Booked"
                      ? "success"
                      : lead.lead_status === "Rejected / Lost"
                        ? "destructive"
                        : lead.lead_status === "Negotiation"
                          ? "purple"
                          : "default"
                  }
                  className="text-[10px] px-2 py-0 font-semibold"
                >
                  {lead.lead_status}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-2 py-0 hidden lg:inline-flex font-medium ${
                    lead.contact_status === "Responded"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : lead.contact_status === "Contacted – Waiting for Response"
                        ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30"
                        : lead.contact_status === "No Response"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {lead.contact_status || "Not Contacted"}
                </Badge>
                {lead.event_date && (
                  <span className="text-xs text-muted-foreground hidden md:inline-flex items-center gap-1 font-medium">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{formatDate(lead.event_date)}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {client.whatsapp && (
                <Button
                  size="sm"
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-2xs rounded-lg"
                  asChild
                >
                  <a
                    href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Hi ${client.name}! This is ${profile?.business_name || "Dlight Studios"} regarding your ${lead.event_type} booking.`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>
                </Button>
              )}

              {booking && (
                <RecordPaymentDialog
                  booking={booking}
                  leadId={lead.id}
                  onPaymentRecorded={handlePaymentRecorded}
                  triggerButton={
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg shadow-2xs"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Payment</span>
                    </Button>
                  }
                />
              )}

              <EditLeadDialog
                lead={lead}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 rounded-lg shadow-2xs"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                }
              />

              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-2.5 text-muted-foreground hover:text-foreground rounded-lg"
                onClick={() => {
                  const mainEl = document.querySelector("main");
                  if (mainEl) mainEl.scrollTo({ top: 0, behavior: "smooth" });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                title="Scroll to top"
              >
                <span>↑ Top</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 1. TOP BREADCRUMB & CONTEXT NAVIGATION BAR */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs font-medium bg-background hover:bg-muted/80 border-border/80 rounded-lg shadow-2xs gap-1.5 transition-all hover:-translate-x-0.5 text-foreground shrink-0"
            >
              <Link href="/crm">
                <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Back to Pipeline</span>
              </Link>
            </Button>

            <div className="hidden sm:block h-3.5 w-px bg-border/80 shrink-0" aria-hidden="true" />

            <Breadcrumb>
              <BreadcrumbList className="text-xs">
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="/dashboard"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="/crm"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Client CRM
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-foreground max-w-[200px] truncate">
                    {client.name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <Badge
              variant="outline"
              className="hidden md:inline-flex text-[10px] font-mono px-2 py-0.5 bg-muted/30 border-border/60 text-muted-foreground"
            >
              #{lead.id.slice(0, 8).toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center text-xs text-muted-foreground">
            {lead.created_at && (
              <span className="hidden lg:inline-flex items-center gap-1.5 text-muted-foreground text-[11px] bg-muted/30 px-2.5 py-1 rounded-md border border-border/40">
                <Calendar className="h-3 w-3 opacity-70" />
                <span>Enquiry Logged {formatDate(lead.created_at)}</span>
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-lg border-border/80 bg-background shadow-2xs"
              onClick={() => copyToClipboard(window.location.href, "Lead Link")}
              title="Copy Lead Link"
            >
              {copiedField === "Lead Link" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">Copied Link</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 2. EXECUTIVE CLIENT HERO HEADER */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground p-5 sm:p-7 shadow-xs backdrop-blur-xs space-y-6">
          {/* Subtle Ambient Accents */}
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl"
            aria-hidden="true"
          />

          {/* Tier 1: Client Identity & Primary Contact CTAs */}
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
            {/* Client Identity Block */}
            <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
              {/* Executive Client Monogram Box */}
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg sm:text-xl shrink-0 shadow-2xs select-none">
                {getInitials(client.name)}
              </div>

              <div className="space-y-2.5 min-w-0 flex-1">
                {/* Title & Status Badges */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-[2rem] font-bold tracking-tight text-foreground truncate">
                    {client.name}
                  </h1>
                  <Badge
                    variant="outline"
                    className="font-semibold text-xs px-2.5 py-0.5 bg-muted/40 border-border/80 text-foreground inline-flex items-center gap-1.5"
                  >
                    <Camera className="h-3 w-3 text-muted-foreground" />
                    <span>{lead.event_type || "Event"}</span>
                  </Badge>
                  <Badge
                    variant={
                      lead.lead_status === "Accepted / Booked"
                        ? "success"
                        : lead.lead_status === "Rejected / Lost"
                          ? "destructive"
                          : lead.lead_status === "Negotiation"
                            ? "purple"
                            : "default"
                    }
                    className="text-xs font-semibold px-2.5 py-0.5"
                  >
                    {lead.lead_status}
                  </Badge>

                  {/* Interactive Contact Status Dropdown Badge */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all hover:opacity-90 active:scale-95 shadow-2xs cursor-pointer ${
                          lead.contact_status === "Responded"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : lead.contact_status === "Contacted – Waiting for Response"
                              ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30"
                              : lead.contact_status === "No Response"
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                : "bg-muted text-muted-foreground border-border"
                        }`}
                        title="Click to update contact status"
                      >
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            lead.contact_status === "Responded"
                              ? "bg-emerald-500"
                              : lead.contact_status === "Contacted – Waiting for Response"
                                ? "bg-sky-500 animate-pulse"
                                : lead.contact_status === "No Response"
                                  ? "bg-amber-500"
                                  : "bg-slate-400"
                          }`}
                        />
                        <span>{lead.contact_status || "Not Contacted"}</span>
                        <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 p-1.5 space-y-1">
                      <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                        Change Contact Status
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {[
                        {
                          status: "Not Contacted" as ContactStatus,
                          label: "Not Contacted",
                          dotClass: "bg-slate-400",
                        },
                        {
                          status: "Contacted – Waiting for Response" as ContactStatus,
                          label: "Waiting for Response",
                          dotClass: "bg-sky-500",
                        },
                        {
                          status: "Responded" as ContactStatus,
                          label: "Responded",
                          dotClass: "bg-emerald-500",
                        },
                        {
                          status: "No Response" as ContactStatus,
                          label: "No Response",
                          dotClass: "bg-amber-500",
                        },
                      ].map((opt) => {
                        const isCurrent = (lead.contact_status || "Not Contacted") === opt.status;
                        return (
                          <DropdownMenuItem
                            key={opt.status}
                            onClick={() => handleUpdateContactStatus(opt.status)}
                            className={`flex items-center justify-between px-2.5 py-2 text-xs rounded-md cursor-pointer ${
                              isCurrent ? "bg-muted font-bold text-foreground" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full shrink-0 ${opt.dotClass}`} />
                              <span>{opt.label}</span>
                            </span>
                            {isCurrent && <Check className="h-3.5 w-3.5 text-primary" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {displayedEvents.length > 1 && (
                    <Badge
                      variant="secondary"
                      className="text-xs font-medium bg-muted/60 text-foreground"
                    >
                      {displayedEvents.length} Ceremonies
                    </Badge>
                  )}
                  {getEventDaysLeft() && (
                    <Badge
                      variant="outline"
                      className="text-xs font-medium text-muted-foreground border-border/70 inline-flex items-center gap-1"
                    >
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{getEventDaysLeft()}</span>
                    </Badge>
                  )}
                  {lead.source && (
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1 bg-muted/30 px-2 py-0.5 rounded-md border border-border/40">
                      Source:{" "}
                      <strong className="text-foreground font-medium">
                        {lead.source}
                      </strong>
                    </span>
                  )}
                </div>

                {/* Subtitle Contact & Location Info Pills */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  {client.phone && (
                    <div className="inline-flex items-center gap-2 text-foreground font-medium bg-muted/40 hover:bg-muted/70 px-3 py-1.5 rounded-lg border border-border/60 transition-colors shadow-2xs">
                      <Phone className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      <a
                        href={`tel:${client.phone}`}
                        className="hover:underline tracking-tight"
                      >
                        {client.phone}
                      </a>
                      <button
                        onClick={() => copyToClipboard(client.phone!, "Phone")}
                        className="text-muted-foreground hover:text-foreground opacity-70 hover:opacity-100 transition-opacity ml-0.5 p-0.5"
                        title="Copy Phone"
                        aria-label="Copy Phone"
                      >
                        {copiedField === "Phone" ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  )}

                  {client.email && (
                    <div className="inline-flex items-center gap-2 text-foreground font-medium bg-muted/40 hover:bg-muted/70 px-3 py-1.5 rounded-lg border border-border/60 transition-colors shadow-2xs">
                      <Mail className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <a
                        href={`mailto:${client.email}`}
                        className="hover:underline max-w-[190px] sm:max-w-none truncate"
                      >
                        {client.email}
                      </a>
                      <button
                        onClick={() => copyToClipboard(client.email!, "Email")}
                        className="text-muted-foreground hover:text-foreground opacity-70 hover:opacity-100 transition-opacity ml-0.5 p-0.5"
                        title="Copy Email"
                        aria-label="Copy Email"
                      >
                        {copiedField === "Email" ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  )}

                  {client.location && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.location)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-foreground font-medium bg-muted/40 hover:bg-muted/70 px-3 py-1.5 rounded-lg border border-border/60 transition-colors shadow-2xs"
                      title="Open Venue in Google Maps"
                    >
                      <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate max-w-[220px]">
                        {client.location}
                      </span>
                      <ExternalLink className="h-3 w-3 opacity-50 ml-0.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Primary Top Action Buttons */}
            <div className="flex items-center gap-2.5 self-start lg:self-center shrink-0 flex-wrap">
              {/* Quick Contact Status Dropdown Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs h-9 px-3.5 font-medium rounded-lg border-border/80 bg-background/90 hover:bg-muted/80 shadow-2xs text-foreground cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        lead.contact_status === "Responded"
                          ? "bg-emerald-500"
                          : lead.contact_status === "Contacted – Waiting for Response"
                            ? "bg-sky-500 animate-pulse"
                            : lead.contact_status === "No Response"
                              ? "bg-amber-500"
                              : "bg-slate-400"
                      }`}
                    />
                    <span className="text-muted-foreground hidden sm:inline">Contact:</span>
                    <span className="font-semibold">{lead.contact_status || "Not Contacted"}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60 ml-0.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5 space-y-1">
                  <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                    Update Contact Status
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[
                    {
                      status: "Not Contacted" as ContactStatus,
                      label: "Not Contacted",
                      dotClass: "bg-slate-400",
                    },
                    {
                      status: "Contacted – Waiting for Response" as ContactStatus,
                      label: "Waiting for Response",
                      dotClass: "bg-sky-500",
                    },
                    {
                      status: "Responded" as ContactStatus,
                      label: "Responded",
                      dotClass: "bg-emerald-500",
                    },
                    {
                      status: "No Response" as ContactStatus,
                      label: "No Response",
                      dotClass: "bg-amber-500",
                    },
                  ].map((opt) => {
                    const isCurrent = (lead.contact_status || "Not Contacted") === opt.status;
                    return (
                      <DropdownMenuItem
                        key={opt.status}
                        onClick={() => handleUpdateContactStatus(opt.status)}
                        className={`flex items-center justify-between px-2.5 py-2 text-xs rounded-md cursor-pointer ${
                          isCurrent ? "bg-muted font-bold text-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${opt.dotClass}`} />
                          <span>{opt.label}</span>
                        </span>
                        {isCurrent && <Check className="h-3.5 w-3.5 text-primary" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              {client.whatsapp && (
                <Button
                  size="sm"
                  className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 px-4 rounded-lg shadow-2xs transition-all hover:shadow-xs active:scale-[0.98]"
                  asChild
                >
                  <a
                    href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Hi ${client.name}! This is ${profile?.business_name || "Dlight Studios"} regarding your ${lead.event_type} photography package.`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp Chat</span>
                  </a>
                </Button>
              )}

              <EditLeadDialog
                lead={lead}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-9 px-3.5 font-medium rounded-lg border-border/80 bg-background/80 hover:bg-muted/80 shadow-2xs text-foreground"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Edit Details</span>
                  </Button>
                }
              />

              {/* Direct Visible Delete Lead Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-9 px-3 font-medium text-destructive hover:bg-destructive/10 hover:text-destructive border-border/80 rounded-lg shadow-2xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
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
                        <strong className="text-foreground font-semibold">
                          {client.name}
                        </strong>{" "}
                        ({lead.event_type})?
                      </p>
                      <p className="text-destructive font-medium">
                        This action will permanently delete all quotations,
                        booking agreements, payments, timeline activity, and
                        client notes linked to this lead.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      Cancel
                    </AlertDialogCancel>
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

          {/* Tier 2: Dedicated Quick Actions Command Strip */}
          <div className="pt-4 border-t border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0 select-none">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Quick Actions</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 w-full flex-nowrap">
                <LeadActionDialogs
                  lead={lead}
                  className="flex items-center gap-2 flex-nowrap shrink-0"
                />

                <ShootCallSheetDialog
                  lead={lead}
                  profile={profile}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs h-8 px-3 font-medium shrink-0 bg-background/90 hover:bg-muted rounded-lg border-border/80 shadow-2xs text-foreground"
                    >
                      <Film className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Shoot Call Sheet</span>
                    </Button>
                  }
                />

                <WhatsAppProposalDialog
                  lead={lead}
                  profile={profile}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs h-8 px-3 font-medium shrink-0 bg-background/90 hover:bg-muted rounded-lg border-border/80 shadow-2xs text-foreground"
                    >
                      <Send className="h-3.5 w-3.5 text-emerald-600" />
                      <span>WhatsApp Proposal</span>
                    </Button>
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. 4-METRIC UNIFIED DASHBOARD KPI STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Estimated Budget / Contract Value */}
          <div className="p-5 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xs hover:border-primary/30 hover:shadow-sm transition-all space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {booking ? "Contract Value" : "Estimated Budget"}
              </span>
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <IndianRupee className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-[1.85rem] leading-none font-bold tracking-tight tabular-nums text-foreground">
              {formatCurrency(actualContractTotal)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded text-[11px]">
                {lead.profit_percentage ?? 30}% Margin
              </span>
              <span>•</span>
              <span className="truncate">
                {booking
                  ? "Booking Confirmed"
                  : quotations.length > 0
                    ? "Quoted package"
                    : "Client budget"}
              </span>
            </div>
          </div>

          {/* Card 2: Financial Settlement Status */}
          <div className="p-5 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xs hover:border-primary/30 hover:shadow-sm transition-all space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Financial Status
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-[1.85rem] leading-none font-bold tracking-tight tabular-nums text-foreground flex items-baseline gap-1.5">
              <span>{formatCurrency(actualTotalPaid)}</span>
              <span className="text-xs text-muted-foreground font-normal">
                / {formatCurrency(actualContractTotal)}
              </span>
            </div>
            {/* Payment progress indicator */}
            <div className="space-y-1.5 pt-0.5">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden border border-border/40">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    paidPercent >= 100
                      ? "bg-emerald-500"
                      : paidPercent > 0
                        ? "bg-gradient-to-r from-emerald-500 to-primary"
                        : "bg-transparent"
                  }`}
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-medium">
                <span
                  className={
                    paidPercent > 0
                      ? "text-emerald-700 dark:text-emerald-300 font-bold"
                      : "text-muted-foreground"
                  }
                >
                  {paidPercent}% Paid
                </span>
                <span
                  className={
                    actualRemainingDue > 0
                      ? "text-muted-foreground font-semibold"
                      : "text-emerald-600 font-bold"
                  }
                >
                  {actualRemainingDue === 0
                    ? "Settled"
                    : `Due: ${formatCurrency(actualRemainingDue)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Upcoming Ceremony Date */}
          <div className="p-5 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xs hover:border-primary/30 hover:shadow-sm transition-all space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ceremony Schedule
              </span>
              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-[1.85rem] leading-none font-bold tracking-tight tabular-nums text-foreground line-clamp-1">
              {lead.event_date ? formatDate(lead.event_date) : "Date TBD"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                {displayedEvents.length > 1
                  ? `${displayedEvents.length} Ceremonies Scheduled`
                  : lead.event_start_time || "Full Day Coverage"}
              </span>
            </div>
          </div>

          {/* Card 4: Next Action & Follow-up Due */}
          <div
            className={`p-5 rounded-2xl border bg-card text-card-foreground shadow-xs hover:border-primary/30 hover:shadow-sm transition-all space-y-2.5 ${
              overdue
                ? "border-destructive/40 bg-destructive/5"
                : "border-border/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Next Action
              </span>
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                  overdue
                    ? "bg-destructive/15 text-destructive"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-base sm:text-lg font-bold tracking-tight text-foreground line-clamp-1">
              {lead.next_action || "Standard follow-up"}
            </div>
            <div className="flex items-center gap-1.5 text-xs pt-0.5">
              <span
                className={
                  overdue
                    ? "text-destructive font-bold"
                    : "text-muted-foreground"
                }
              >
                {lead.next_follow_up_at
                  ? (overdue ? "Overdue: " : "Due: ") +
                    formatDate(lead.next_follow_up_at)
                  : "No follow-up set"}
              </span>
              <span>•</span>
              <span className="text-muted-foreground">
                {lead.follow_up_count} logs
              </span>
            </div>
          </div>
        </div>

        {/* 4. VISUAL PIPELINE STAGE STEPPER */}
        <PipelineStageStepper
          leadId={lead.id}
          currentStatus={lead.lead_status}
          onStatusChange={(newStatus) => {
            setLead((prev) => ({ ...prev, lead_status: newStatus }));
          }}
        />

        {/* 5. MAIN WORKSPACE WITH REFINED TABS & SIDEBAR */}
        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-border/70" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </span>
          <span className="h-px flex-1 bg-border/70" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Structured Tabbed Workspace */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full space-y-5"
            >
              {/* Primary Tab Bar with Mobile Horizontal Scroll Protection */}
              <div className="border-b border-border/80 pb-0">
                <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
                  <TabsList className="bg-transparent p-0 h-auto gap-2 flex flex-nowrap justify-start min-w-max border-b-0">
                    <TabsTrigger
                      value="overview"
                      className="data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none text-xs px-4 py-3 rounded-none border-b-2 border-transparent gap-2 font-semibold transition-all hover:text-foreground hover:bg-transparent text-muted-foreground"
                    >
                      <Camera className="h-4 w-4 text-primary" />
                      <span>Overview & Schedule</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="financials"
                      className="data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none text-xs px-4 py-3 rounded-none border-b-2 border-transparent gap-2 font-semibold transition-all hover:text-foreground hover:bg-transparent text-muted-foreground"
                    >
                      <CreditCard className="h-4 w-4 text-emerald-600" />
                      <span>Financials & Quotations</span>
                      {paymentsList.length + quotations.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200"
                        >
                          {paymentsList.length + quotations.length}
                        </Badge>
                      )}
                    </TabsTrigger>

                    <TabsTrigger
                      value="production"
                      className="data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none text-xs px-4 py-3 rounded-none border-b-2 border-transparent gap-2 font-semibold transition-all hover:text-foreground hover:bg-transparent text-muted-foreground"
                    >
                      <Film className="h-4 w-4 text-indigo-500" />
                      <span>Post-Production</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="activity"
                      className="data-[state=active]:border-primary data-[state=active]:text-slate-900 dark:text-slate-100 text-xs px-3.5 py-3 rounded-none border-b-2 border-transparent gap-1.5 font-semibold transition-colors hover:text-slate-900 dark:text-slate-100 hover:bg-transparent"
                    >
                      <MessageSquareQuote className="h-3.5 w-3.5 text-slate-500" />
                      <span>Notes & Communications</span>
                      {notes.length + communications.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4"
                        >
                          {notes.length + communications.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              {/* TAB 1: OVERVIEW & SCHEDULE */}
              <TabsContent value="overview" className="space-y-6 mt-0">
                {/* Ceremony & Multi-Day Event Schedule */}
                <Card className="shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.035)] border-slate-200 dark:border-slate-200 overflow-hidden">
                  <CardHeader className="pb-3 border-b bg-white dark:bg-slate-950/20">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-0.5">
                        <CardTitle className="text-[15px] font-semibold tracking-[-0.01em] flex items-center gap-2 text-slate-900 dark:text-slate-100">
                          <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-500" />
                          <span>Ceremony & Function Schedule</span>
                          <Badge
                            variant="secondary"
                            className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200"
                          >
                            {displayedEvents.length}{" "}
                            {displayedEvents.length === 1
                              ? "Ceremony"
                              : "Ceremonies"}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          All booked ceremony dates, timings, venues, and
                          specific production deliverables.
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {/* View Mode Toggle: Cards vs Itinerary Matrix */}
                        <div className="flex items-center rounded-lg border bg-muted/60 p-0.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                          <Button
                            type="button"
                            variant={
                              eventScheduleView === "cards"
                                ? "secondary"
                                : "ghost"
                            }
                            size="sm"
                            className="h-6 px-2.5 text-[11px] gap-1 font-semibold"
                            onClick={() => setEventScheduleView("cards")}
                          >
                            <LayoutGrid className="h-3 w-3" />
                            <span>Cards</span>
                          </Button>
                          <Button
                            type="button"
                            variant={
                              eventScheduleView === "matrix"
                                ? "secondary"
                                : "ghost"
                            }
                            size="sm"
                            className="h-6 px-2.5 text-[11px] gap-1 font-semibold"
                            onClick={() => setEventScheduleView("matrix")}
                          >
                            <TableProperties className="h-3 w-3" />
                            <span>Itinerary Matrix</span>
                          </Button>
                        </div>

                        <EditLeadDialog
                          lead={lead}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1.5 border-slate-200 hover:bg-slate-100 dark:border-slate-200 dark:hover:bg-slate-800"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add / Edit Events</span>
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4">
                    {eventScheduleView === "cards" ? (
                      /* CARD GRID VIEW */
                      /* EVENT ITINERARY VIEW */
                      <div className="space-y-3">
                        {displayedEvents.map((ev, i) => {
                          const cleanNote = ev.notes
                            ? ev.notes
                                .replace(/\[REQUIREMENTS\]:.*$/gm, "")
                                .replace(/\[OTHER_REQ\]:.*$/gm, "")
                                .trim()
                            : "";
                          const crewSummary = getEstimatedCrewSummary(
                            ev.requirements,
                          );

                          return (
                            <article
                              key={ev.id || i}
                              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_20px_rgba(15,23,42,0.03)]"
                            >
                              <div className="flex flex-col gap-4 p-4 sm:p-5">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25">
                                    {String(i + 1).padStart(2, "0")}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                      <h3 className="text-[15px] font-semibold tracking-[-0.015em] text-slate-950 dark:text-white">
                                        {ev.event_name || ev.event_type}
                                      </h3>
                                      <span className="text-xs text-slate-400">
                                        /
                                      </span>
                                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {ev.custom_event_type || ev.event_type}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                      Function {i + 1} ·{" "}
                                      {ev.status || "Upcoming"}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600 dark:bg-slate-900 dark:text-slate-300"
                                    >
                                      {ev.status || "Upcoming"}
                                    </Badge>
                                    {ev.id && (
                                      <EditEventDialog
                                        event={ev as any}
                                        leadId={lead.id}
                                        trigger={
                                          <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
                                            <Edit3 className="h-3 w-3" />
                                            <span className="hidden sm:inline">Edit</span>
                                          </Button>
                                        }
                                      />
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:bg-slate-900/30">
                                    <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                                      Date
                                    </span>
                                    <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
                                      <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                      <span>
                                        {ev.event_date
                                          ? formatDate(ev.event_date)
                                          : "Date TBD"}
                                      </span>
                                    </div>
                                    {ev.event_date && (
                                      <span className="mt-1 block pl-5 text-[11px] text-slate-500 dark:text-slate-400">
                                        {new Date(
                                          ev.event_date,
                                        ).toLocaleDateString("en-US", {
                                          weekday: "long",
                                        })}
                                      </span>
                                    )}
                                  </div>

                                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:bg-slate-900/30">
                                    <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                                      Coverage Window
                                    </span>
                                    <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
                                      <Clock className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                      <span>
                                        {ev.start_time || ev.end_time
                                          ? `${ev.start_time || ""} - ${ev.end_time || ""}`
                                          : "Full Day Coverage"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:bg-slate-900/30">
                                    <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                                      Venue
                                    </span>
                                    <div className="mt-1.5 flex items-start gap-2 text-sm font-semibold text-slate-950 dark:text-white">
                                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                                      <span className="leading-5">
                                        {ev.location || "Venue TBD"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="border-t border-slate-200 pt-4">
                                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <Sparkles className="h-3.5 w-3.5 text-slate-500" />
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                                          Production deliverables
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                          {ev.requirements.length}
                                        </span>
                                      </div>
                                      {ev.requirements.length > 0 ? (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {ev.requirements.map(
                                            (req: string) => (
                                              <span
                                                key={req}
                                                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-950 dark:text-slate-200"
                                              >
                                                {req}
                                              </span>
                                            ),
                                          )}
                                          {ev.other_requirement && (
                                            <span className="inline-flex items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                              Custom: {ev.other_requirement}
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                          Standard photo and video coverage
                                          assigned.
                                        </p>
                                      )}
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 lg:min-w-[280px] dark:bg-slate-950">
                                      <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                                        <Users className="h-3.5 w-3.5 text-slate-500" />
                                        Crew footprint
                                      </span>
                                      <p className="mt-1 text-xs font-medium leading-5 text-slate-700 dark:text-slate-200">
                                        {crewSummary.join(" · ")}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {cleanNote && (
                                  <div className="rounded-xl border-l-2 border-slate-400 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                                      Note:
                                    </span>{" "}
                                    {cleanNote}
                                  </div>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      /* ITINERARY MATRIX TABLE VIEW */
                      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                        <Table>
                          <TableHeader className="bg-muted/40">
                            <TableRow>
                              <TableHead className="w-12 font-bold text-xs">
                                #
                              </TableHead>
                              <TableHead className="font-bold text-xs">
                                Ceremony & Function
                              </TableHead>
                              <TableHead className="font-bold text-xs">
                                Date & Day
                              </TableHead>
                              <TableHead className="font-bold text-xs">
                                Timings
                              </TableHead>
                              <TableHead className="font-bold text-xs">
                                Venue / Location
                              </TableHead>
                              <TableHead className="font-bold text-xs">
                                Assigned Deliverables
                              </TableHead>
                              <TableHead className="font-bold text-xs">
                                Crew Footprint
                              </TableHead>
                              <TableHead className="font-bold text-xs text-right">
                                Status
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {displayedEvents.map((ev, i) => {
                              const crewSummary = getEstimatedCrewSummary(
                                ev.requirements,
                              );
                              return (
                                <TableRow
                                  key={ev.id || i}
                                  className="hover:bg-muted/30 transition-colors"
                                >
                                  <TableCell className="font-bold text-xs text-slate-500 dark:text-slate-400">
                                    <span className="h-5 w-5 rounded-full bg-slate-700 text-white text-[10px] flex items-center justify-center font-bold">
                                      {i + 1}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-0.5">
                                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
                                        {ev.event_name || ev.event_type}
                                      </span>
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                                        {ev.custom_event_type
                                          ? `${ev.custom_event_type} (${ev.event_type})`
                                          : ev.event_type}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {ev.event_date ? (
                                      <div className="space-y-0.5">
                                        <span className="font-medium text-slate-900 dark:text-slate-100 block">
                                          {formatDate(ev.event_date)}
                                        </span>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                                          {new Date(
                                            ev.event_date,
                                          ).toLocaleDateString("en-US", {
                                            weekday: "long",
                                          })}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-500 dark:text-slate-400 italic">
                                        TBD
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    <span className="flex items-center gap-1 font-medium text-slate-900 dark:text-slate-100">
                                      <Clock className="h-3 w-3 text-slate-500 dark:text-slate-400 shrink-0" />
                                      <span>
                                        {ev.start_time || ev.end_time
                                          ? `${ev.start_time || ""} - ${ev.end_time || ""}`
                                          : "Full Day"}
                                      </span>
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {ev.location ? (
                                      <span className="flex items-center gap-1 text-slate-900 dark:text-slate-100 font-medium truncate max-w-[160px]">
                                        <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                                        <span>{ev.location}</span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-500 dark:text-slate-400 italic">
                                        TBD
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1 max-w-[280px]">
                                      {ev.requirements.length > 0 ? (
                                        ev.requirements.map((req: string) => {
                                          const conf =
                                            getDeliverableBadgeConfig(req);
                                          return (
                                            <Badge
                                              key={req}
                                              variant="outline"
                                              className={`text-[9px] px-1.5 py-0 gap-1 font-medium border ${conf.bgClass} ${conf.textClass} ${conf.borderClass}`}
                                            >
                                              {conf.icon}
                                              <span>{conf.label}</span>
                                            </Badge>
                                          );
                                        })
                                      ) : (
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                                          Standard coverage
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-[11px] text-slate-500 dark:text-slate-400">
                                    <span className="truncate block max-w-[150px]">
                                      {crewSummary.join(" • ")}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] uppercase font-bold"
                                    >
                                      {ev.status || "Upcoming"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Requirement Specifications & Chips */}
                <Card className="shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.035)]">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <CardTitle className="text-[15px] font-semibold tracking-[-0.01em] flex items-center gap-2">
                          <Camera className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                          <span>Production Scope & Deliverables Required</span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Master production deliverables summary across all
                          client functions.
                        </CardDescription>
                      </div>
                      <EditLeadDialog
                        lead={lead}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Modify Scope</span>
                          </Button>
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Master Categorized Deliverables Scope */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] block">
                          Categorized Production Scope (
                          {allUniqueRequirements.length} Services across{" "}
                          {groupedDeliverables.length} Disciplines)
                        </span>
                        {lead.other_requirement && (
                          <Badge
                            variant="outline"
                            className="text-[11px] px-2.5 py-0.5 gap-1.5 border-slate-200 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 font-medium"
                          >
                            <Tag className="h-3 w-3 text-slate-500" />
                            <span>Custom: {lead.other_requirement}</span>
                          </Badge>
                        )}
                      </div>

                      {groupedDeliverables.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {groupedDeliverables.map((group, gIdx) => (
                            <div
                              key={gIdx}
                              className="p-3.5 rounded-2xl border border-slate-200 bg-white/80 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:border-primary/30 transition-all space-y-2.5 flex flex-col justify-between"
                            >
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                                <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 dark:text-slate-100">
                                  <span className="p-1 rounded-md bg-muted/80">
                                    {group.icon}
                                  </span>
                                  <span>{group.label}</span>
                                </div>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                                  {group.items.length}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {group.items.map((req, rIdx) => {
                                  const conf = getDeliverableBadgeConfig(req);
                                  return (
                                    <Badge
                                      key={rIdx}
                                      variant="outline"
                                      className={`text-[11px] px-2 py-0.5 gap-1.5 font-medium border ${conf.bgClass} ${conf.textClass} ${conf.borderClass}`}
                                    >
                                      {conf.icon}
                                      <span>{conf.label}</span>
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 border border-dashed rounded-xl text-center text-xs text-slate-500 dark:text-slate-400 bg-muted/10">
                          No specific deliverables selected yet. Click "Modify
                          Scope" above to assign photography, cinematic video,
                          drone, or albums.
                        </div>
                      )}
                    </div>

                    {/* Multi-Event Ceremony Scope Breakdown */}
                    {displayedEvents.length > 1 && (
                      <div className="pt-4 border-t space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-slate-500" />
                            <span>Ceremony-Wise Deliverables Assignment</span>
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold bg-muted/40"
                          >
                            {displayedEvents.length} Ceremonies Configured
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {displayedEvents.map((ev, i) => (
                            <div
                              key={ev.id || i}
                              className="p-3.5 rounded-2xl border border-slate-200 bg-white dark:bg-slate-950/20 hover:border-border transition-colors space-y-2.5"
                            >
                              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-border/40">
                                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                  <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                                    {i + 1}
                                  </span>
                                  <span className="truncate">
                                    {ev.event_name || ev.event_type}
                                  </span>
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium shrink-0">
                                  {ev.event_date
                                    ? formatDate(ev.event_date)
                                    : "Date TBD"}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                                {ev.requirements.length > 0 ? (
                                  ev.requirements.map((req: string) => {
                                    const conf = getDeliverableBadgeConfig(req);
                                    return (
                                      <Badge
                                        key={req}
                                        variant="outline"
                                        className={`text-[10px] px-1.5 py-0.5 gap-1 font-medium ${conf.bgClass} ${conf.textClass} ${conf.borderClass}`}
                                      >
                                        {conf.icon}
                                        <span>{conf.label}</span>
                                      </Badge>
                                    );
                                  })
                                ) : (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                                    Standard general coverage
                                  </span>
                                )}
                                {ev.other_requirement && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0.5 gap-1 font-medium bg-slate-1000/10 text-slate-500 dark:text-slate-400 border-slate-200"
                                  >
                                    <Tag className="h-2.5 w-2.5" />
                                    <span>{ev.other_requirement}</span>
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {lead.enquiry_message && (
                      <div className="pt-3 border-t space-y-1.5">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                          Initial Client Inquiry Message / Creative Vision:
                        </span>
                        <blockquote className="p-3.5 bg-muted/40 rounded-xl text-slate-900 dark:text-slate-100 text-xs italic border border-slate-200">
                          "{lead.enquiry_message}"
                        </blockquote>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Interactive Deliverables Manager */}
                <DeliverablesEditor
                  leadId={lead.id}
                  initialDeliverables={lead.deliverables || []}
                />
              </TabsContent>

              {/* TAB 2: FINANCIALS & CONTRACTS */}
              <TabsContent value="financials" className="space-y-6 mt-0">
                {/* Financial Ledger & Booking Contract */}
                {booking && (
                  <Card className="shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.035)] border-emerald-200/80 dark:border-emerald-900/50">
                    <CardHeader className="pb-3 border-b bg-white dark:bg-slate-950/20">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <CardTitle className="text-base font-semibold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-slate-500" />
                            <span>Booking Contract & Financial Ledger</span>
                          </CardTitle>
                          <CardDescription className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                            Confirmed Contract Status: {booking.booking_status}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {((booking.remaining_amount || 0) > 0 ||
                            !booking.advance_paid_at) && (
                            <WhatsAppPaymentReminderDialog
                              booking={booking}
                              profile={profile}
                            />
                          )}
                          <RecordPaymentDialog
                            booking={booking}
                            leadId={lead.id}
                            onPaymentRecorded={handlePaymentRecorded}
                          />
                          <Badge variant="success">
                            {booking.booking_status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3.5 border rounded-xl bg-background shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                          <span className="text-xs text-slate-500 dark:text-slate-400 block">
                            Total Contract Value
                          </span>
                          <span className="font-bold text-xl tabular-nums text-slate-950 dark:text-white tracking-[-0.03em]">
                            {formatCurrency(actualContractTotal)}
                          </span>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {quotations.length > 0
                              ? "Quoted package"
                              : "Client budget"}
                          </p>
                        </div>
                        <div className="p-3.5 border rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                          <span className="text-xs text-emerald-700 dark:text-emerald-300 block">
                            Total Paid So Far
                          </span>
                          <span className="font-bold text-lg text-emerald-800 dark:text-emerald-200 tracking-tight">
                            {formatCurrency(actualTotalPaid)}
                          </span>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {actualAdvancePaid > 0
                              ? `Advance ₹${actualAdvancePaid.toLocaleString("en-IN")} received`
                              : booking.advance_paid_at
                                ? "Advance Received"
                                : actualTotalPaid > 0
                                  ? "Partial Paid"
                                  : "Advance Pending"}
                          </p>
                        </div>
                        <div className="p-3.5 border rounded-xl bg-slate-100 dark:bg-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                          <span className="text-xs text-slate-500 dark:text-slate-400 block">
                            Remaining Due
                          </span>
                          <span className="font-bold text-lg text-slate-500 dark:text-slate-400 tracking-tight">
                            {formatCurrency(actualRemainingDue)}
                          </span>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {actualRemainingDue === 0
                              ? "Fully Cleared"
                              : "Final settlement"}
                          </p>
                        </div>
                      </div>

                      {/* Settlement Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium">
                            Contract Settlement Progress
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {paidPercent}% Paid
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden border">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              paidPercent >= 100
                                ? "bg-emerald-500"
                                : paidPercent > 0
                                  ? "bg-gradient-to-r from-emerald-500 to-primary"
                                  : "bg-transparent"
                            }`}
                            style={{ width: `${paidPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Ceremonies Covered Under This Contract */}
                      {displayedEvents.length > 0 && (
                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em]">
                              Covered Ceremonies & Functions (
                              {displayedEvents.length})
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Multi-Event Scope Included in Contract
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {displayedEvents.map((ev, idx) => {
                              const evReqs: string[] = ev.requirements || [];
                              return (
                                <div
                                  key={ev.id || idx}
                                  className="p-3 rounded-xl border bg-card/60 space-y-1.5 text-xs shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:border-emerald-500/30 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                      <Badge className="h-4 px-1 text-[9px] font-bold bg-emerald-600 text-white">
                                        #{idx + 1}
                                      </Badge>
                                      <span>
                                        {ev.event_name || ev.event_type}
                                      </span>
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1.5 py-0 font-medium"
                                    >
                                      {ev.status || "Scheduled"}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                                      {ev.event_date
                                        ? formatDate(ev.event_date)
                                        : "Date TBD"}
                                    </span>
                                    {ev.location && (
                                      <span className="truncate max-w-[140px]">
                                        • {ev.location}
                                      </span>
                                    )}
                                  </div>
                                  {evReqs.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {evReqs.map((r) => {
                                        const conf =
                                          getDeliverableBadgeConfig(r);
                                        return (
                                          <Badge
                                            key={r}
                                            variant="outline"
                                            className={`text-[9px] px-1.5 py-0 gap-1 font-medium border ${conf.bgClass} ${conf.textClass} ${conf.borderClass}`}
                                          >
                                            {conf.icon}
                                            <span>{conf.label}</span>
                                          </Badge>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Payments History Table / Cards */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em]">
                            Recorded Receipts & Transactions (
                            {paymentsList.length})
                          </span>
                          <RecordPaymentDialog
                            booking={booking}
                            leadId={lead.id}
                            onPaymentRecorded={handlePaymentRecorded}
                            triggerButton={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[11px] gap-1 text-emerald-600 hover:text-emerald-700"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Log Payment</span>
                              </Button>
                            }
                          />
                        </div>

                        {paymentsList.length === 0 ? (
                          <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400 border border-dashed rounded-xl p-4">
                            No payments recorded yet. Click "Log Payment" above
                            to record client advance or settlement.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {paymentsList.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 text-xs border border-slate-200 hover:border-emerald-500/30 transition-colors"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                      {formatCurrency(p.amount)}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-semibold bg-background"
                                    >
                                      {p.payment_type}
                                    </Badge>
                                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                                      via {p.payment_method}
                                    </span>
                                  </div>
                                  {p.reference && (
                                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">
                                      Ref: {p.reference}
                                    </span>
                                  )}
                                </div>
                                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                                  {formatDate(p.payment_date)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Fallback state when booking contract is not yet active */}
                {!booking && (
                  <Card className="shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.035)] border-dashed border-border/80 bg-muted/10">
                    <CardHeader className="pb-3 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[15px] font-semibold tracking-[-0.01em] flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                          <span>Booking Contract & Financial Ledger</span>
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          No Active Booking
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        Formalize a booking contract to log advance payments,
                        track stage balances, and manage multi-ceremony
                        photography coverage.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          Ready to confirm booking for {client.name}?
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Accepting a quotation or moving to "Accepted / Booked"
                          initializes the financial ledger and activates payment
                          tracking.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleConfirmBooking}
                        className="gap-1.5 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.035)] font-semibold text-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Confirm Booking & Open Ledger</span>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Quotations & Commercial Proposals */}
                <Card className="shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.035)]">
                  <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-[15px] font-semibold tracking-[-0.01em] flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <span>Commercial Proposals & Quotations</span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Rate cards and formal quotations drafted for this client
                      </CardDescription>
                    </div>
                    <WhatsAppProposalDialog
                      lead={lead}
                      profile={profile}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1.5"
                        >
                          <Send className="h-3.5 w-3.5 text-slate-500" />
                          <span>Send Proposal</span>
                        </Button>
                      }
                    />
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {quotations.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400 border border-dashed rounded-xl">
                        No quotation drafted yet for this client lead. Click
                        "Send Proposal" to create one.
                      </div>
                    ) : (
                      quotations.map((q) => (
                        <div
                          key={q.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border rounded-xl bg-card gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
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
                                      : q.status === "Negotiating"
                                        ? "purple"
                                        : "outline"
                                }
                                className="text-[10px]"
                              >
                                {q.status}
                              </Badge>
                            </div>
                            {q.notes && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                                {q.notes}
                              </p>
                            )}
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                              Created {formatDate(q.created_at)}
                              {q.sent_at && ` • Sent ${formatDate(q.sent_at)}`}
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                            <div className="text-left sm:text-right">
                              <div className="font-bold text-lg tabular-nums text-slate-950 dark:text-white tracking-[-0.03em]">
                                {formatCurrency(q.amount)}
                              </div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                Contract Package
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 pt-0.5">
                              {q.status !== "Accepted" &&
                                q.status !== "Rejected" && (
                                  <>
                                    {q.status !== "Negotiating" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={async () => {
                                          try {
                                            await startNegotiationServerAction(
                                              q.id,
                                              "Client negotiating package terms",
                                              lead.id,
                                            );
                                            toast.info(
                                              "Moved to Negotiation stage.",
                                            );
                                            setLead((prev) => ({
                                              ...prev,
                                              lead_status: "Negotiation",
                                              quotations: (
                                                prev.quotations || []
                                              ).map((item) =>
                                                item.id === q.id
                                                  ? {
                                                      ...item,
                                                      status: "Negotiating",
                                                    }
                                                  : item,
                                              ),
                                            }));
                                            router.refresh();
                                          } catch {
                                            toast.error(
                                              "Failed to start negotiation.",
                                            );
                                          }
                                        }}
                                        className="h-6 px-2 text-[11px] border-slate-200 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                      >
                                        <MessageSquareQuote className="h-3 w-3 mr-1" />
                                        <span>Negotiate</span>
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={async () => {
                                        try {
                                          await acceptQuotationServerAction(
                                            q.id,
                                            lead.id,
                                          );
                                          toast.success(
                                            "Quotation accepted & booking confirmed!",
                                          );
                                          setLead((prev) => ({
                                            ...prev,
                                            lead_status: "Accepted / Booked",
                                            quotations: (
                                              prev.quotations || []
                                            ).map((item) =>
                                              item.id === q.id
                                                ? {
                                                    ...item,
                                                    status: "Accepted",
                                                  }
                                                : item,
                                            ),
                                          }));
                                          router.refresh();
                                        } catch {
                                          toast.error(
                                            "Failed to accept quotation.",
                                          );
                                        }
                                      }}
                                      className="h-6 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      <span>Accept & Book</span>
                                    </Button>
                                  </>
                                )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Lead Expense & Profit Calculator */}
                <LeadExpenseCalculator
                  leadId={lead.id}
                  initialExpenses={lead.expenses || []}
                  initialProfitPercentage={lead.profit_percentage ?? 30}
                />
              </TabsContent>

              {/* TAB 3: PRODUCTION & DELIVERY */}
              <TabsContent value="production" className="space-y-6 mt-0">
                {/* Post-Production Pipeline Tracker */}
                <PostProductionTracker lead={lead} profile={profile} />

                {/* Shoot Call Sheet Details */}
                <Card className="shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.035)]">
                  <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-[15px] font-semibold tracking-[-0.01em] flex items-center gap-2">
                        <Film className="h-4 w-4 text-slate-500" />
                        <span>Shoot Call Sheet & Crew Briefing</span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Ceremony schedule, crew contact list, and equipment plan
                      </CardDescription>
                    </div>
                    <ShootCallSheetDialog
                      lead={lead}
                      profile={profile}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1.5"
                        >
                          <Share2 className="h-3.5 w-3.5 text-slate-500" />
                          <span>Share Call Sheet</span>
                        </Button>
                      }
                    />
                  </CardHeader>
                  <CardContent className="p-4 text-xs space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-white dark:bg-slate-950/20 border rounded-xl">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block">
                          Main Event
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {lead.event_type}
                        </span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-950/20 border rounded-xl">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block">
                          Shoot Date
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {lead.event_date
                            ? formatDate(lead.event_date)
                            : "TBD"}
                        </span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-950/20 border rounded-xl">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block">
                          Location / Venue
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">
                          {lead.location || "TBD"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 4: NOTES & COMMUNICATIONS */}
              <TabsContent value="activity" className="space-y-6 mt-0">
                {/* Internal Studio Notes with Quick Inline Input */}
                <Card className="shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.035)]">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="space-y-0.5">
                        <CardTitle className="text-[15px] font-semibold tracking-[-0.01em] flex items-center gap-2">
                          <StickyNote className="h-4 w-4 text-slate-500" />
                          <span>Internal Studio Notes ({notes.length})</span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Private internal notes, crew instructions, and studio
                          reminders
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold bg-slate-1000/10 text-slate-500 dark:text-slate-400 border-slate-200 gap-1 w-fit"
                      >
                        <Lock className="h-3 w-3 text-slate-500" />
                        <span>Studio Team Only — Not Visible to Client</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Inline Quick Note Form */}
                    <form onSubmit={handleAddQuickNote} className="flex gap-2">
                      <Input
                        placeholder="Add an internal studio note (gear checklist, client preferences, crew remarks)..."
                        value={quickNote}
                        onChange={(e) => setQuickNote(e.target.value)}
                        className="text-xs"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!quickNote.trim() || isAddingNote}
                        className="text-xs gap-1 shrink-0 font-semibold"
                      >
                        {isAddingNote ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        <span>Add Note</span>
                      </Button>
                    </form>

                    {notes.length === 0 ? (
                      <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-6 border border-dashed rounded-xl bg-muted/10">
                        No internal studio notes logged yet. Use the field above
                        to add notes for your photography & video crew.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {notes.map((n) => (
                          <div
                            key={n.id}
                            className="p-3.5 bg-white dark:bg-slate-900/35 border border-slate-200 rounded-2xl text-xs space-y-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:border-slate-200 transition-colors"
                          >
                            <p className="text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                              {n.content}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-border/40">
                              <span className="flex items-center gap-1 font-medium">
                                <Lock className="h-2.5 w-2.5 text-slate-500" />
                                <span>Internal Studio Note</span>
                              </span>
                              <span className="font-medium">
                                {formatDateTime(n.created_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Communication Log */}
                <Card className="shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.035)]">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <CardTitle className="text-[15px] font-semibold tracking-[-0.01em] flex items-center gap-2">
                          <MessageSquareQuote className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                          <span>
                            Client Communication Log ({communications.length})
                          </span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Audit record of phone calls, WhatsApp messages, and
                          email interactions
                        </CardDescription>
                      </div>
                      <LeadActionDialogs
                        lead={lead}
                        singleAction="contact"
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5 font-medium shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Log Interaction</span>
                          </Button>
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {communications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400 border border-dashed rounded-xl bg-muted/10">
                        No communication logs recorded yet. Click "Log
                        Interaction" above to track calls, WhatsApp exchanges,
                        or client feedback.
                      </div>
                    ) : (
                      communications.map((c) => (
                        <div
                          key={c.id}
                          className="p-3.5 border rounded-xl bg-card text-xs space-y-2 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold uppercase tracking-wider ${
                                  c.direction?.toLowerCase() === "inbound"
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                    : "bg-slate-1000/10 text-slate-500 dark:text-slate-400 border-slate-200"
                                }`}
                              >
                                {c.direction || "Outbound"}
                              </Badge>
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                {c.contact_method}
                              </span>
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium">
                              {formatDateTime(c.created_at)}
                            </span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                            {c.message}
                          </p>
                          {c.client_response && (
                            <div className="p-2.5 bg-muted/40 rounded-lg text-slate-900 dark:text-slate-100 border-l-2 border-primary space-y-0.5">
                              <span className="font-semibold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider block">
                                Client Response:
                              </span>
                              <p className="italic text-xs font-medium">
                                "{c.client_response}"
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Complete Audit Trail Timeline */}
                <Card className="shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.035)]">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-[15px] font-semibold tracking-[-0.01em] flex items-center gap-2">
                      <ActivityIcon className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                      <span>Audit Trail & Pipeline History</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <LeadTimeline activities={activities} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right 1 Column: Sticky Relationship & Quick Actions Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-20 self-start">
            {/* Client Relationship & SLA Intelligence Card */}
            <Card className="shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.035)]">
              <CardHeader className="pb-3 border-b bg-white dark:bg-slate-950/20">
                <CardTitle className="text-sm font-semibold tracking-[-0.01em] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                  <span>Relationship Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    Pipeline Stage
                  </span>
                  <Badge variant="outline" className="font-bold text-[10px]">
                    {lead.lead_status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    Contact Status
                  </span>
                  <Badge
                    variant="outline"
                    className={`font-semibold text-[10px] ${
                      lead.contact_status !== "Not Contacted"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        : "bg-muted text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {lead.contact_status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    Last Contacted
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {lead.last_contacted_at
                      ? formatDateTime(lead.last_contacted_at)
                      : "Never"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    Next Follow-up
                  </span>
                  <div className="text-right">
                    {overdue ? (
                      <span className="text-destructive font-bold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>
                          {lead.next_follow_up_at
                            ? formatDateTime(lead.next_follow_up_at)
                            : "Overdue"}
                        </span>
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {lead.next_follow_up_at
                          ? formatDateTime(lead.next_follow_up_at)
                          : "None scheduled"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    Follow-up Touchpoints
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {lead.follow_up_count} times
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Lead Created
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {formatDate(lead.created_at)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Action Shortcuts Card */}
            <Card className="shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.035)]">
              <CardHeader className="pb-3 border-b bg-white dark:bg-slate-950/20">
                <CardTitle className="text-sm font-semibold tracking-[-0.01em] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-slate-500" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {client.whatsapp && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start gap-2 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-medium"
                    asChild
                  >
                    <a
                      href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Hi ${client.name}! This is ${profile?.business_name || "Dlight Studios"} following up on your ${lead.event_type} photography.`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-slate-500" />
                      <span>WhatsApp Direct Chat</span>
                    </a>
                  </Button>
                )}

                {booking && (
                  <RecordPaymentDialog
                    booking={booking}
                    leadId={lead.id}
                    onPaymentRecorded={handlePaymentRecorded}
                    triggerButton={
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-start gap-2 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-medium"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Record Client Payment</span>
                      </Button>
                    }
                  />
                )}

                <ShootCallSheetDialog
                  lead={lead}
                  profile={profile}
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start gap-2 text-xs font-medium"
                    >
                      <Film className="h-3.5 w-3.5 text-slate-500" />
                      <span>View / Send Call Sheet</span>
                    </Button>
                  }
                />

                <WhatsAppProposalDialog
                  lead={lead}
                  profile={profile}
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start gap-2 text-xs font-medium"
                    >
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      <span>Send WhatsApp Proposal</span>
                    </Button>
                  }
                />

                <EditLeadDialog
                  lead={lead}
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start gap-2 text-xs font-medium"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit Lead & Event Details</span>
                    </Button>
                  }
                />
              </CardContent>
            </Card>

            {/* Quick Studio Notes Widget */}
            <Card className="shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.035)]">
              <CardHeader className="pb-3 border-b bg-white dark:bg-slate-950/20">
                <CardTitle className="text-sm font-semibold tracking-[-0.01em] flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-slate-500" />
                  <span>Recent Studio Note</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-xs space-y-3">
                {notes.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-2 italic">
                    No notes logged yet.
                  </p>
                ) : (
                  <div className="p-3 bg-white dark:bg-slate-950/20 border border-slate-200 rounded-2xl space-y-1">
                    <p className="text-slate-900 dark:text-slate-100 line-clamp-3 leading-relaxed">
                      {notes[0].content}
                    </p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block text-right font-medium">
                      {formatDate(notes[0].created_at)}
                    </span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-slate-700 dark:text-slate-200 justify-center gap-1 h-7 font-medium"
                  onClick={() => setActiveTab("activity")}
                >
                  <span>View all {notes.length} notes & comms</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
