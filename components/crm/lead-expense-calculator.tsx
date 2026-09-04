"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  Calculator,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  IndianRupee,
  Percent,
  Receipt,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { LeadExpense, DEFAULT_EXPENSE_CATEGORIES } from "@/types/crm";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createLeadExpenseServerAction,
  updateLeadExpenseServerAction,
  deleteLeadExpenseServerAction,
  updateLeadProfitPercentageServerAction,
} from "@/lib/crm-actions";

interface LeadExpenseCalculatorProps {
  leadId: string;
  initialExpenses: LeadExpense[];
  initialProfitPercentage?: number;
}

export function LeadExpenseCalculator({
  leadId,
  initialExpenses = [],
  initialProfitPercentage = 30,
}: LeadExpenseCalculatorProps) {
  const router = useRouter();
  const [expenses, setExpenses] = useState<LeadExpense[]>(initialExpenses);
  const [profitPercentage, setProfitPercentage] = useState<number>(initialProfitPercentage);
  const [isUpdatingProfit, setIsUpdatingProfit] = useState(false);

  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_EXPENSE_CATEGORIES[0].name);
  const [customExpenseName, setCustomExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState<string>("");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<LeadExpense | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState<string>("");
  const [editNotes, setEditNotes] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  React.useEffect(() => {
    setExpenses(initialExpenses);
  }, [initialExpenses]);

  React.useEffect(() => {
    setProfitPercentage(initialProfitPercentage);
  }, [initialProfitPercentage]);

  // Derived Calculations
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [expenses]);

  const profitAmount = useMemo(() => {
    return (totalExpenses * (Number(profitPercentage) || 0)) / 100;
  }, [totalExpenses, profitPercentage]);

  const packageAmount = useMemo(() => {
    return totalExpenses + profitAmount;
  }, [totalExpenses, profitAmount]);

  const handleProfitChange = async (newVal: number) => {
    const val = Math.max(0, newVal);
    setProfitPercentage(val);
    try {
      setIsUpdatingProfit(true);
      await updateLeadProfitPercentageServerAction(leadId, val);
      toast.success(`Profit percentage updated to ${val}%`);
    } catch {
      toast.error("Failed to update profit percentage");
    } finally {
      setIsUpdatingProfit(false);
    }
  };

  const handleCategorySelect = (catName: string) => {
    setSelectedCategory(catName);
    if (catName !== "Other") {
      setCustomExpenseName(catName);
    } else {
      setCustomExpenseName("");
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = selectedCategory === "Other" ? customExpenseName.trim() : selectedCategory;
    const numAmount = parseFloat(expenseAmount);

    if (!finalName) {
      toast.error("Please provide an expense name");
      return;
    }
    if (isNaN(numAmount) || numAmount < 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    try {
      setIsSubmitting(true);
      const isCustom = selectedCategory === "Other" || !DEFAULT_EXPENSE_CATEGORIES.some((c) => c.name === finalName);

      const optimisticItem: LeadExpense = {
        id: "exp-" + Date.now(),
        lead_id: leadId,
        owner_id: "owner-temp",
        expense_name: finalName,
        expense_category: selectedCategory,
        amount: numAmount,
        notes: expenseNotes.trim() || null,
        is_custom: isCustom,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setExpenses((prev) => [...prev, optimisticItem]);

      const res = await createLeadExpenseServerAction({
        leadId,
        expenseName: finalName,
        expenseCategory: selectedCategory,
        amount: numAmount,
        notes: expenseNotes.trim() || undefined,
        isCustom,
      });

      if (res.success) {
        toast.success(`Added ₹${numAmount.toLocaleString("en-IN")} for "${finalName}".`);
        setIsAddOpen(false);
        setSelectedCategory(DEFAULT_EXPENSE_CATEGORIES[0].name);
        setCustomExpenseName("");
        setExpenseAmount("");
        setExpenseNotes("");
        router.refresh();
      } else {
        toast.error("Failed to add expense");
        setExpenses(initialExpenses);
      }
    } catch {
      toast.error("An error occurred while saving expense.");
      setExpenses(initialExpenses);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (item: LeadExpense) => {
    setEditingExpense(item);
    setEditName(item.expense_name);
    setEditCategory(item.expense_category);
    setEditAmount(item.amount.toString());
    setEditNotes(item.notes || "");
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editName.trim()) return;
    const numAmount = parseFloat(editAmount);
    if (isNaN(numAmount) || numAmount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setIsSubmitting(true);
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === editingExpense.id
            ? {
                ...e,
                expense_name: editName.trim(),
                expense_category: editCategory,
                amount: numAmount,
                notes: editNotes.trim() || null,
                updated_at: new Date().toISOString(),
              }
            : e
        )
      );

      const res = await updateLeadExpenseServerAction(editingExpense.id, leadId, {
        expense_name: editName.trim(),
        expense_category: editCategory,
        amount: numAmount,
        notes: editNotes.trim() || null,
      });

      if (res.success) {
        toast.success("Expense updated.");
        setIsEditOpen(false);
        setEditingExpense(null);
        router.refresh();
      } else {
        toast.error("Failed to update expense");
        setExpenses(initialExpenses);
      }
    } catch {
      toast.error("An error occurred while updating expense.");
      setExpenses(initialExpenses);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      setDeletingId(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      const res = await deleteLeadExpenseServerAction(id, leadId);
      if (res.success) {
        toast.success(`Deleted "${name}" expense.`);
        router.refresh();
      } else {
        toast.error("Failed to delete expense");
        setExpenses(initialExpenses);
      }
    } catch {
      toast.error("An error occurred while deleting expense.");
      setExpenses(initialExpenses);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="shadow-xs border-border/80">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calculator className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Lead Expense Calculator & Margin Estimation</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Direct production costs, overhead allocations, and target profit margin calculation
          </CardDescription>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            handleCategorySelect(DEFAULT_EXPENSE_CATEGORIES[0].name);
            setIsAddOpen(true);
          }}
          className="gap-1.5 text-xs shadow-2xs shrink-0"
        >
          <Plus className="h-3.5 w-3.5 text-emerald-600" />
          <span>Add Expense</span>
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Expenses List / Table */}
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl text-center space-y-2 bg-muted/10">
            <Receipt className="h-8 w-8 text-muted-foreground/40" />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">No Direct Expenses Logged</p>
              <p className="text-[11px] text-muted-foreground">
                Add equipment rental, team shoots, printing, travel, or post-production costs to calculate exact margins.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                handleCategorySelect(DEFAULT_EXPENSE_CATEGORIES[0].name);
                setIsAddOpen(true);
              }}
              className="text-xs mt-2"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add First Expense
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden bg-card shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="px-3.5 py-2.5">Category & Item</th>
                    <th className="px-3.5 py-2.5">Notes</th>
                    <th className="px-3.5 py-2.5 text-right">Amount (₹)</th>
                    <th className="px-3.5 py-2.5 text-right w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {expenses.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-3.5 py-2.5">
                        <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                          <span>{item.expense_name}</span>
                          {item.expense_category && item.expense_category !== item.expense_name && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground">
                              {item.expense_category}
                            </Badge>
                          )}
                          {item.is_custom && (
                            <Badge variant="warning" className="text-[9px] px-1 py-0">
                              Other
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-muted-foreground max-w-[200px] truncate">
                        {item.notes || "—"}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-semibold text-foreground tabular-nums">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditModal(item)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(item.id, item.expense_name)}
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Calculation Summary Card */}
        <div className="rounded-xl border p-4 bg-muted/20 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span>Commercial Calculation Summary</span>
            </span>
            <div className="flex items-center gap-2">
              <Label htmlFor="profitPctInput" className="text-xs font-semibold text-foreground">
                Target Profit %:
              </Label>
              <div className="relative w-20">
                <Input
                  id="profitPctInput"
                  type="number"
                  min={0}
                  max={500}
                  value={profitPercentage}
                  onChange={(e) => handleProfitChange(parseFloat(e.target.value) || 0)}
                  className="h-7 text-xs pr-6 text-right font-bold"
                />
                <span className="absolute right-2 top-1.5 text-[11px] font-semibold text-muted-foreground pointer-events-none">
                  %
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {/* 1. Overall Expenses W/O Profit */}
            <div className="p-3 bg-background rounded-xl border shadow-2xs space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Overall Expenses W/O Profit
              </span>
              <span className="text-base sm:text-lg font-bold text-foreground tracking-tight block">
                {formatCurrency(totalExpenses)}
              </span>
              <span className="text-[10px] text-muted-foreground">Total Direct Costs</span>
            </div>

            {/* 2. Profit Margin % */}
            <div className="p-3 bg-background rounded-xl border shadow-2xs space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Profit Margin %
              </span>
              <span className="text-base sm:text-lg font-bold text-primary tracking-tight block">
                {profitPercentage}%
              </span>
              <span className="text-[10px] text-muted-foreground">Studio Target Margin</span>
            </div>

            {/* 3. Profit Amount */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shadow-2xs space-y-0.5">
              <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 block">
                Profit Amount
              </span>
              <span className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-400 tracking-tight block">
                {formatCurrency(profitAmount)}
              </span>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                Net Studio Profit
              </span>
            </div>

            {/* 4. Suggested Package Amount */}
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl shadow-2xs space-y-0.5">
              <span className="text-[11px] font-medium text-primary block">
                Suggested Package Amount
              </span>
              <span className="text-base sm:text-lg font-extrabold text-foreground tracking-tight block">
                {formatCurrency(packageAmount)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Expenses + Profit
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Add Expense Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-600" />
              <span>Add Lead Expense</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Choose from standard event categories or record custom shoot expenses.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-3.5 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="expenseCategorySelect">Expense Category</Label>
              <Select value={selectedCategory} onValueChange={handleCategorySelect}>
                <SelectTrigger id="expenseCategorySelect">
                  <SelectValue placeholder="Choose expense category" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {DEFAULT_EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Name if Other */}
            {selectedCategory === "Other" && (
              <div className="space-y-1.5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg animate-in fade-in-50">
                <Label htmlFor="customExpName" className="text-xs font-semibold">
                  Expense Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="customExpName"
                  placeholder="e.g. Drone Rental, Helicopter Shoot, Crane Operator..."
                  value={customExpenseName}
                  onChange={(e) => setCustomExpenseName(e.target.value)}
                  className="text-xs bg-background"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="expenseAmount">Amount (₹ INR) <span className="text-destructive">*</span></Label>
              <Input
                id="expenseAmount"
                type="number"
                step="any"
                min={0}
                placeholder="e.g. 15000"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expenseNotes">Notes / Vendor Info</Label>
              <Input
                id="expenseNotes"
                placeholder="e.g. External drone operator payment, 2 assistants..."
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : "Add Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-emerald-600" />
              <span>Edit Lead Expense</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-3.5 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="editExpName">Expense Name</Label>
              <Input
                id="editExpName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editExpCategory">Category</Label>
              <Input
                id="editExpCategory"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editExpAmount">Amount (₹ INR)</Label>
              <Input
                id="editExpAmount"
                type="number"
                step="any"
                min={0}
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editExpNotes">Notes</Label>
              <Input
                id="editExpNotes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
