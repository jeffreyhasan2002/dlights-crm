import * as React from "react";
import { Metadata } from "next";
import { getExpenseCalculations, getLeads } from "@/lib/crm-service";
import { ExpenseCalculatorView } from "@/components/expenses/expense-calculator-view";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Expense & Profit Calculator | Dlight Studios CRM",
  description: "Calculate photography and cinematography shoot expenses, apply profit margins, and generate package proposals.",
};

export default async function ExpenseCalculatorPage() {
  const [calculations, leads] = await Promise.all([
    getExpenseCalculations(),
    getLeads(),
  ]);

  return (
    <ExpenseCalculatorView
      initialCalculations={calculations}
      leads={leads}
    />
  );
}
