import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid, isBefore, startOfDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined, currency = "INR"): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹0";
  
  if (currency === "INR") {
    // Format Indian numbering format (lakhs/crores)
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | null | undefined, formatStr = "dd MMM yyyy"): string {
  if (!dateString) return "—";
  try {
    const d = typeof dateString === "string" ? parseISO(dateString) : new Date(dateString);
    if (!isValid(d)) return "—";
    return format(d, formatStr);
  } catch {
    return "—";
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  return formatDate(dateString, "dd MMM yyyy, hh:mm a");
}

export function isOverdue(dateString: string | null | undefined, isCompleted = false): boolean {
  if (!dateString || isCompleted) return false;
  try {
    const targetDate = typeof dateString === "string" ? parseISO(dateString) : new Date(dateString);
    if (!isValid(targetDate)) return false;
    return isBefore(targetDate, new Date());
  } catch {
    return false;
  }
}

export function isDueToday(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  try {
    const targetDate = typeof dateString === "string" ? parseISO(dateString) : new Date(dateString);
    if (!isValid(targetDate)) return false;
    const today = startOfDay(new Date());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    return targetDate >= today && targetDate < tomorrow;
  } catch {
    return false;
  }
}
