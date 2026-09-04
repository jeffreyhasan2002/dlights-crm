"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  Calculator,
  Plus,
  Trash2,
  Loader2,
  Percent,
  Receipt,
  TrendingUp,
  Sparkles,
  Link as LinkIcon,
  Calendar,
  User,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  ExpenseCalculation,
  LeadWithDetails,
  DEFAULT_EXPENSE_CATEGORIES,
  EventType,
} from "@/types/crm";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createExpenseCalculationServerAction,
  updateExpenseCalculationServerAction,
} from "@/lib/crm-actions";

interface CalculatorItemRow {
  id: string;
  expense_name: string;
  expense_category: string;
  amount: number;
  quantity: number;
  unit_cost: number;
  notes: string;
  is_custom: boolean;
}

interface StandaloneCalculatorDialogProps {
  calculation?: ExpenseCalculation | null;
  leads?: LeadWithDetails[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (calcId?: string) => void;
}

const EVENT_TYPES: EventType[] = [
  "Wedding",
  "Engagement",
  "Sangeet",
  "Reception",
  "Muhurtham",
  "Pre-Wedding",
  "Post-Wedding",
  "Birthday",
  "Baby Shoot",
  "Portrait",
  "Corporate",
  "Other",
];

const QUICK_MARGIN_PRESETS = [15, 20, 25, 30, 35, 40, 50];

export function StandaloneCalculatorDialog({
  calculation,
  leads = [],
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
}: StandaloneCalculatorDialogProps) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? setControlledOpen! : setUncontrolledOpen;

  const isEditing = Boolean(calculation?.id);

  // Form State
  const [title, setTitle] = useState(calculation?.name || "");
  const [selectedLeadId, setSelectedLeadId] = useState<string>(calculation?.lead_id || "none");
  const [clientName, setClientName] = useState(calculation?.client_name || "");
  const [eventType, setEventType] = useState<string>(calculation?.event_type || "Wedding");
  const [profitPercentage, setProfitPercentage] = useState<number>(
    calculation?.profit_percentage ?? 30
  );
  const [notes, setNotes] = useState(calculation?.notes || "");

  // Items State
  const [items, setItems] = useState<CalculatorItemRow[]>(() => {
    if (calculation?.items && calculation.items.length > 0) {
      return calculation.items.map((i, idx) => ({
        id: i.id || `item-${Date.now()}-${idx}`,
        expense_name: i.expense_name,
        expense_category: i.expense_category,
        amount: Number(i.amount) || 0,
        quantity: 1,
        unit_cost: Number(i.amount) || 0,
        notes: i.notes || "",
        is_custom: Boolean(i.is_custom),
      }));
    }
    return [
      {
        id: `item-${Date.now()}-0`,
        expense_name: "Lead Candid Photographer",
        expense_category: "Lead Candid Photographer",
        amount: 35000,
        quantity: 1,
        unit_cost: 35000,
        notes: "Full day coverage",
        is_custom: false,
      },
      {
        id: `item-${Date.now()}-1`,
        expense_name: "Cinematographer (Director / Gimbal)",
        expense_category: "Cinematographer (Director / Gimbal)",
        amount: 40000,
        quantity: 1,
        unit_cost: 40000,
        notes: "4K cinematic shoot",
        is_custom: false,
      },
      {
        id: `item-${Date.now()}-2`,
        expense_name: "Drone Pilot & Aerial Rig",
        expense_category: "Drone Pilot & Aerial Rig",
        amount: 20000,
        quantity: 1,
        unit_cost: 20000,
        notes: "Licensed pilot",
        is_custom: false,
      },
    ];
  });

  // New item draft state
  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_EXPENSE_CATEGORIES[0].name);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitCost, setItemUnitCost] = useState<number>(15000);
  const [itemNotes, setItemNotes] = useState("");

  // Sync when calculation changes
  useEffect(() => {
    if (calculation) {
      setTitle(calculation.name || "");
      setSelectedLeadId(calculation.lead_id || "none");
      setClientName(calculation.client_name || "");
      setEventType(calculation.event_type || "Wedding");
      setProfitPercentage(calculation.profit_percentage ?? 30);
      setNotes(calculation.notes || "");
      if (calculation.items && calculation.items.length > 0) {
        setItems(
          calculation.items.map((i, idx) => ({
            id: i.id || `item-${Date.now()}-${idx}`,
            expense_name: i.expense_name,
            expense_category: i.expense_category,
            amount: Number(i.amount) || 0,
            quantity: 1,
            unit_cost: Number(i.amount) || 0,
            notes: i.notes || "",
            is_custom: Boolean(i.is_custom),
          }))
        );
      }
    } else {
      setTitle("");
      setSelectedLeadId("none");
      setClientName("");
      setEventType("Wedding");
      setProfitPercentage(30);
      setNotes("");
    }
  }, [calculation, open]);

  // When lead is selected from dropdown, prefill client name and event type
  const handleLeadChange = (leadId: string) => {
    setSelectedLeadId(leadId);
    if (leadId && leadId !== "none") {
      const foundLead = leads.find((l) => l.id === leadId);
      if (foundLead) {
        if (!title.trim()) {
          setTitle(`${foundLead.client?.name || "Client"} - ${foundLead.event_type} Costing`);
        }
        setClientName(foundLead.client?.name || "");
        if (foundLead.event_type) {
          setEventType(foundLead.event_type);
        }
        if (foundLead.profit_percentage !== undefined && foundLead.profit_percentage !== null) {
          setProfitPercentage(foundLead.profit_percentage);
        }
      }
    }
  };

  // Calculations
  const totalExpenses = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [items]);

  const profitAmount = useMemo(() => {
    return (totalExpenses * (Number(profitPercentage) || 0)) / 100;
  }, [totalExpenses, profitPercentage]);

  const packageAmount = useMemo(() => {
    return totalExpenses + profitAmount;
  }, [totalExpenses, profitAmount]);

  // Add Item to list
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const isOther = selectedCategory === "Other";
    const expenseName = isOther ? customCategoryName.trim() : selectedCategory;

    if (!expenseName) {
      toast.error("Please enter an expense name or choose a category");
      return;
    }

    const qty = Math.max(1, itemQuantity);
    const uCost = Math.max(0, itemUnitCost);
    const totalCost = qty * uCost;

    const newItem: CalculatorItemRow = {
      id: `item-${Date.now()}-${items.length}`,
      expense_name: expenseName,
      expense_category: selectedCategory,
      amount: totalCost,
      quantity: qty,
      unit_cost: uCost,
      notes: itemNotes.trim(),
      is_custom: isOther,
    };

    setItems((prev) => [...prev, newItem]);
    setCustomCategoryName("");
    setItemQuantity(1);
    setItemUnitCost(15000);
    setItemNotes("");
    toast.success(`Added ${expenseName} (₹${totalCost.toLocaleString("en-IN")})`);
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Quick preset loader
  const handleLoadStandardTemplate = () => {
    const template: CalculatorItemRow[] = [
      {
        id: `tpl-${Date.now()}-0`,
        expense_name: "Lead Candid Photographer",
        expense_category: "Lead Candid Photographer",
        amount: 35000,
        quantity: 1,
        unit_cost: 35000,
        notes: "Main wedding day candid coverage",
        is_custom: false,
      },
      {
        id: `tpl-${Date.now()}-1`,
        expense_name: "Traditional Photographer",
        expense_category: "Traditional Photographer",
        amount: 20000,
        quantity: 1,
        unit_cost: 20000,
        notes: "Full ritual coverage",
        is_custom: false,
      },
      {
        id: `tpl-${Date.now()}-2`,
        expense_name: "Cinematographer (Director / Gimbal)",
        expense_category: "Cinematographer (Director / Gimbal)",
        amount: 40000,
        quantity: 1,
        unit_cost: 40000,
        notes: "4K Cinema trailer cinematography",
        is_custom: false,
      },
      {
        id: `tpl-${Date.now()}-3`,
        expense_name: "Drone Pilot & Aerial Rig",
        expense_category: "Drone Pilot & Aerial Rig",
        amount: 22000,
        quantity: 1,
        unit_cost: 22000,
        notes: "Aerial drone shots",
        is_custom: false,
      },
      {
        id: `tpl-${Date.now()}-4`,
        expense_name: "Luxury Photo Album (Silk / Leather)",
        expense_category: "Luxury Photo Album (Silk / Leather)",
        amount: 18000,
        quantity: 1,
        unit_cost: 18000,
        notes: "40 pages flush mount album",
        is_custom: false,
      },
      {
        id: `tpl-${Date.now()}-5`,
        expense_name: "Post-Production: Colorist & Video Editor",
        expense_category: "Post-Production: Colorist & Video Editor",
        amount: 25000,
        quantity: 1,
        unit_cost: 25000,
        notes: "Trailer + Full length edit",
        is_custom: false,
      },
    ];
    setItems(template);
    toast.success("Loaded Standard Premium Wedding Template");
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a calculation title (e.g. Royal Palace 3-Day Wedding)");
      return;
    }

    if (items.length === 0) {
      toast.error("Please add at least one expense line item");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: title.trim(),
        clientName: clientName.trim() || undefined,
        eventType: eventType || undefined,
        leadId: selectedLeadId !== "none" ? selectedLeadId : null,
        profitPercentage: Number(profitPercentage) || 30,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          expense_name: i.expense_name,
          expense_category: i.expense_category,
          amount: Number(i.amount) || 0,
          notes: i.notes || undefined,
          is_custom: i.is_custom,
        })),
      };

      if (isEditing && calculation) {
        const res = await updateExpenseCalculationServerAction(calculation.id, payload);
        if (res.success) {
          toast.success("Expense calculation updated successfully");
          setOpen(false);
          router.refresh();
          onSuccess?.(calculation.id);
        } else {
          toast.error("Failed to update calculation", { description: (res as any)?.error });
        }
      } else {
        const res = await createExpenseCalculationServerAction(payload);
        if (res.success) {
          toast.success("New expense calculation created!");
          setOpen(false);
          router.refresh();
          onSuccess?.((res as any)?.calculationId);
        } else {
          toast.error("Failed to create calculation", { description: (res as any)?.error });
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred while saving the calculation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1.5 shadow-xs">
            <Plus className="h-4 w-4" />
            <span>New Calculation</span>
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="sm:max-w-[780px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {isEditing ? "Edit Expense Calculation" : "New Studio Expense & Package Calculator"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Calculate total production cost, apply profit margins, and generate target package quotes.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Top Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/40 border text-xs">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold">
                Calculation Title <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Royal Palace 3-Day Wedding Package Breakdown"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-xs font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5 text-primary" />
                <span>Link to Active CRM Lead (Optional)</span>
              </Label>
              <Select value={selectedLeadId} onValueChange={handleLeadChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select CRM Lead..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Independent Estimate)</SelectItem>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.client?.name || "Client"} - {l.event_type} (
                      {l.event_date || "Date TBD"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Client Name</span>
              </Label>
              <Input
                placeholder="e.g. Rahul & Priya"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Event Type</span>
              </Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-emerald-600" />
                <span>Profit Target Margin (%)</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="500"
                  step="1"
                  value={profitPercentage}
                  onChange={(e) => setProfitPercentage(Number(e.target.value) || 0)}
                  className="h-8 text-xs w-24 font-bold"
                />
                <div className="flex items-center gap-1 flex-wrap">
                  {QUICK_MARGIN_PRESETS.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setProfitPercentage(pct)}
                      className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors ${
                        profitPercentage === pct
                          ? "bg-primary text-primary-foreground font-bold border-primary"
                          : "bg-background hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Summary Cards Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 border rounded-xl bg-card shadow-2xs space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Receipt className="h-3.5 w-3.5 text-amber-500" />
                <span>Total Expenses</span>
              </span>
              <p className="font-bold text-base text-foreground tracking-tight">
                {formatCurrency(totalExpenses)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {items.length} line items
              </p>
            </div>

            <div className="p-3 border rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 shadow-2xs space-y-0.5">
              <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span>Profit ({profitPercentage}%)</span>
              </span>
              <p className="font-bold text-base text-emerald-700 dark:text-emerald-300 tracking-tight">
                {formatCurrency(profitAmount)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Target margin
              </p>
            </div>

            <div className="p-3 border rounded-xl bg-primary/10 border-primary/30 shadow-2xs space-y-0.5">
              <span className="text-[11px] font-medium text-primary flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Package Amount</span>
              </span>
              <p className="font-bold text-base text-primary tracking-tight">
                {formatCurrency(packageAmount)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Recommended client rate
              </p>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Expense Line Items ({items.length})
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Select standard crew, gear, and post-production categories or type custom items.
                </p>
              </div>

              {items.length === 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLoadStandardTemplate}
                  className="h-7 text-xs gap-1 border-dashed"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Load Standard Template</span>
                </Button>
              )}
            </div>

            {/* Inline Add Item Form */}
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-5 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Category / Role</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(val) => {
                      setSelectedCategory(val);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Select Category..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {DEFAULT_EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.slug} value={cat.name} className="text-xs">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCategory === "Other" && (
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Custom Name</Label>
                    <Input
                      placeholder="e.g. Vintage Car Rental"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                )}

                <div className={selectedCategory === "Other" ? "sm:col-span-3 space-y-1" : "sm:col-span-3 space-y-1"}>
                  <Label className="text-[11px] text-muted-foreground">Unit Cost (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="Cost"
                    value={itemUnitCost}
                    onChange={(e) => setItemUnitCost(Number(e.target.value) || 0)}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Qty / Days</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Qty"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(Number(e.target.value) || 1)}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddItem}
                    className="h-8 w-full text-xs gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Item</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-12">
                  <Input
                    placeholder="Item notes / vendor name / day specification (optional)"
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    className="h-7 text-xs bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Items Table */}
            {items.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-xl text-xs text-muted-foreground space-y-2">
                <p>No expense items added yet.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLoadStandardTemplate}
                  className="text-xs h-7 gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Load Standard Wedding Template
                </Button>
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden divide-y text-xs bg-card">
                <div className="grid grid-cols-12 p-2.5 font-semibold text-muted-foreground bg-muted/40 text-[11px]">
                  <div className="col-span-5">Category / Description</div>
                  <div className="col-span-2 text-right">Unit Rate</div>
                  <div className="col-span-2 text-center">Qty / Days</div>
                  <div className="col-span-2 text-right">Total</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>

                {items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 p-2.5 items-center hover:bg-muted/20 transition-colors"
                  >
                    <div className="col-span-5 space-y-0.5">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <span>{item.expense_name}</span>
                        {item.is_custom && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/30 text-amber-600">
                            Custom
                          </Badge>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-[10px] text-muted-foreground">{item.notes}</p>
                      )}
                    </div>

                    <div className="col-span-2 text-right text-muted-foreground">
                      ₹{(item.unit_cost || item.amount).toLocaleString("en-IN")}
                    </div>

                    <div className="col-span-2 text-center font-medium text-foreground">
                      {item.quantity || 1}
                    </div>

                    <div className="col-span-2 text-right font-bold text-foreground">
                      ₹{(item.amount || (item.unit_cost || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                    </div>

                    <div className="col-span-1 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Calculation Notes & Assumptions</Label>
            <Textarea
              placeholder="e.g. Includes accommodation and food allowance for 6 crew members. Raw footages delivered on client HDD."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[60px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || items.length === 0}
              className="gap-1.5 bg-primary text-primary-foreground"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>{isEditing ? "Save Changes" : "Create Expense Calculation"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
