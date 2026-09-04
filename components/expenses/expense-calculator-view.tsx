"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calculator,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Search,
  Receipt,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Calendar,
  Layers,
  ArrowUpDown,
  Filter,
  Loader2,
  IndianRupee,
  Check,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";

import { ExpenseCalculation, LeadWithDetails } from "@/types/crm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { StandaloneCalculatorDialog } from "@/components/expenses/standalone-calculator-dialog";
import {
  duplicateExpenseCalculationServerAction,
  deleteExpenseCalculationServerAction,
} from "@/lib/crm-actions";

interface ExpenseCalculatorViewProps {
  initialCalculations: ExpenseCalculation[];
  leads: LeadWithDetails[];
}

export function ExpenseCalculatorView({
  initialCalculations = [],
  leads = [],
}: ExpenseCalculatorViewProps) {
  const router = useRouter();
  const [calculations, setCalculations] = useState<ExpenseCalculation[]>(initialCalculations);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [linkFilter, setLinkFilter] = useState("all");
  const [editingCalculation, setEditingCalculation] = useState<ExpenseCalculation | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDuplicatingId, setIsDuplicatingId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Keep state updated on props change
  React.useEffect(() => {
    setCalculations(initialCalculations);
  }, [initialCalculations]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = calculations.length;
    const totalExpensesSum = calculations.reduce(
      (sum, c) => sum + (c.total_expenses || 0),
      0
    );
    const totalProfitSum = calculations.reduce(
      (sum, c) => sum + (c.profit_amount || 0),
      0
    );
    const totalPackageSum = calculations.reduce(
      (sum, c) => sum + (c.package_amount || 0),
      0
    );
    const avgMargin =
      totalCount > 0
        ? Math.round(
            calculations.reduce((sum, c) => sum + (c.profit_percentage || 30), 0) /
              totalCount
          )
        : 30;

    return {
      totalCount,
      totalExpensesSum,
      totalProfitSum,
      totalPackageSum,
      avgMargin,
    };
  }, [calculations]);

  // Filtered Calculations
  const filteredCalculations = useMemo(() => {
    return calculations.filter((calc) => {
      // Search
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesName = calc.name.toLowerCase().includes(query);
        const matchesClient = calc.client_name?.toLowerCase().includes(query);
        const matchesLeadClient = calc.lead?.client?.name?.toLowerCase().includes(query);
        const matchesEventType = calc.event_type?.toLowerCase().includes(query);
        const matchesNotes = calc.notes?.toLowerCase().includes(query);
        const matchesItems = calc.items?.some(
          (i) =>
            i.expense_name.toLowerCase().includes(query) ||
            i.expense_category.toLowerCase().includes(query)
        );

        if (
          !matchesName &&
          !matchesClient &&
          !matchesLeadClient &&
          !matchesEventType &&
          !matchesNotes &&
          !matchesItems
        ) {
          return false;
        }
      }

      // Event Type Filter
      if (eventTypeFilter !== "all") {
        if (calc.event_type !== eventTypeFilter) {
          return false;
        }
      }

      // Link Filter
      if (linkFilter === "linked" && !calc.lead_id) return false;
      if (linkFilter === "standalone" && Boolean(calc.lead_id)) return false;

      return true;
    });
  }, [calculations, searchQuery, eventTypeFilter, linkFilter]);

  // Actions
  const handleDuplicate = async (id: string, name: string) => {
    try {
      setIsDuplicatingId(id);
      const res = await duplicateExpenseCalculationServerAction(id);
      if (res.success) {
        toast.success(`Duplicated calculation "${name}"`);
        router.refresh();
      } else {
        toast.error("Failed to duplicate calculation", {
          description: (res as any)?.error,
        });
      }
    } catch {
      toast.error("Error duplicating calculation");
    } finally {
      setIsDuplicatingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      setIsDeletingId(id);
      const res = await deleteExpenseCalculationServerAction(id);
      if (res.success) {
        toast.success(`Deleted calculation "${name}"`);
        setCalculations((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      } else {
        toast.error("Failed to delete calculation", {
          description: (res as any)?.error,
        });
      }
    } catch {
      toast.error("Error deleting calculation");
    } finally {
      setIsDeletingId(null);
    }
  };

  const openEditModal = (calc: ExpenseCalculation) => {
    setEditingCalculation(calc);
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & New Calculation Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl flex items-center gap-2.5">
            <Calculator className="h-7 w-7 text-primary" />
            <span>Expense & Profit Calculator</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Build independent shoot cost breakdowns, define vendor budgets, apply profit margins, and create accurate client proposals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StandaloneCalculatorDialog leads={leads} />
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5 text-primary" />
              <span>Total Costings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground">{metrics.totalCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Saved calculations
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-amber-500" />
              <span>Total Expenses</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(metrics.totalExpensesSum)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Across all breakdowns
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-emerald-200/60 dark:border-emerald-900/40">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span>Target Profit Margin</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(metrics.totalProfitSum)}
            </div>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
              {metrics.avgMargin}% studio average
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-primary/30 bg-primary/5">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-primary flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Total Package Value</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(metrics.totalPackageSum)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Combined proposal quote
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, client, role, or items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-[140px] text-xs h-9">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="Wedding">Wedding</SelectItem>
              <SelectItem value="Engagement">Engagement</SelectItem>
              <SelectItem value="Sangeet">Sangeet</SelectItem>
              <SelectItem value="Reception">Reception</SelectItem>
              <SelectItem value="Pre-Wedding">Pre-Wedding</SelectItem>
              <SelectItem value="Corporate">Corporate</SelectItem>
              <SelectItem value="Birthday">Birthday</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={linkFilter} onValueChange={setLinkFilter}>
            <SelectTrigger className="w-[140px] text-xs h-9">
              <SelectValue placeholder="Lead Link" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Calculations</SelectItem>
              <SelectItem value="linked">Linked to Lead</SelectItem>
              <SelectItem value="standalone">Standalone Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calculations Grid */}
      {filteredCalculations.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Calculator className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                {searchQuery || eventTypeFilter !== "all" || linkFilter !== "all"
                  ? "No calculations match the selected filters"
                  : "No Expense Calculations Created Yet"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Create detailed shoot cost breakdowns with 21 crew and equipment categories, apply profit percentages, and calculate client package prices.
              </p>
            </div>
            <StandaloneCalculatorDialog
              leads={leads}
              trigger={
                <Button size="sm" className="gap-1.5 shadow-xs">
                  <Plus className="h-4 w-4" />
                  <span>Create First Calculation</span>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCalculations.map((calc) => {
            const itemsCount = calc.items?.length || 0;
            const previewItems = (calc.items || [])
              .slice(0, 3)
              .map((i) => i.expense_name)
              .join(", ");

            return (
              <Card
                key={calc.id}
                className="shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between border"
              >
                <CardHeader className="p-4 pb-3 border-b space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-bold text-sm text-foreground truncate" title={calc.name}>
                        {calc.name}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {calc.event_type && (
                          <Badge variant="outline" className="text-[10px] px-2 py-0 bg-muted/30">
                            {calc.event_type}
                          </Badge>
                        )}
                        {calc.lead ? (
                          <Link
                            href={`/crm/${calc.lead.id}`}
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                          >
                            <span>{calc.lead.client?.name || "Lead"}</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        ) : calc.client_name ? (
                          <span className="text-[10px] text-muted-foreground">
                            {calc.client_name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">
                            Standalone
                          </span>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant="secondary"
                      className="text-[10px] font-semibold shrink-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    >
                      {calc.profit_percentage || 30}% Margin
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between text-xs">
                  {/* Financial Breakdown Table */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/40 border text-center">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Cost</span>
                      <span className="font-semibold text-foreground text-xs">
                        {formatCurrency(calc.total_expenses)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 block">Profit</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300 text-xs">
                        {formatCurrency(calc.profit_amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-primary block">Package</span>
                      <span className="font-bold text-primary text-xs">
                        {formatCurrency(calc.package_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Production Items ({itemsCount})
                    </span>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {previewItems || "No items recorded"}
                      {itemsCount > 3 ? ` + ${itemsCount - 3} more` : ""}
                    </p>
                  </div>

                  {calc.notes && (
                    <p className="text-[11px] text-muted-foreground/80 italic line-clamp-1 border-t pt-1.5">
                      "{calc.notes}"
                    </p>
                  )}

                  {/* Bottom Action Footer */}
                  <div className="flex items-center justify-between pt-2 border-t mt-2">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(calc.created_at)}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicate(calc.id, calc.name)}
                        disabled={isDuplicatingId === calc.id}
                        className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        title="Duplicate this calculation"
                      >
                        {isDuplicatingId === calc.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>Clone</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(calc)}
                        className="h-7 px-2 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="Delete calculation"
                            disabled={isDeletingId === calc.id}
                          >
                            {isDeletingId === calc.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-destructive flex items-center gap-2">
                              <Trash2 className="h-5 w-5" />
                              Delete Calculation?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-xs">
                              Are you sure you want to permanently delete{" "}
                              <strong className="text-foreground">{calc.name}</strong>? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(calc.id, calc.name)}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            >
                              Delete Calculation
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Controlled Edit Modal */}
      {editingCalculation && (
        <StandaloneCalculatorDialog
          calculation={editingCalculation}
          leads={leads}
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) setEditingCalculation(null);
          }}
          onSuccess={() => {
            setIsEditOpen(false);
            setEditingCalculation(null);
          }}
        />
      )}
    </div>
  );
}
