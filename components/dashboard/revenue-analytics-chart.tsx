"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, BarChart3 } from "lucide-react";
import { Booking, Payment, Quotation } from "@/types/crm";

interface RevenueAnalyticsChartProps {
  bookings?: Booking[];
  payments?: Payment[];
  quotations?: Quotation[];
}

interface MonthlyData {
  month: string;
  bookedValue: number;
  cashCollected: number;
  proposalPipeline: number;
}

export function RevenueAnalyticsChart({
  bookings = [],
  payments = [],
  quotations = [],
}: RevenueAnalyticsChartProps) {
  const [chartType, setChartType] = React.useState<"area" | "bar">("area");

  // Dynamically compute real monthly metrics from database records
  const seasonData: MonthlyData[] = React.useMemo(() => {
    const now = new Date();
    const monthsData: MonthlyData[] = [];

    // Generate last 6 rolling months dynamically
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthLabel = d.toLocaleString("en-US", { month: "short" });

      // Match bookings in this month
      const monthBookings = bookings.filter((b) => {
        const dateStr = b.booking_date || b.created_at;
        if (!dateStr) return false;
        const bDate = new Date(dateStr);
        return bDate.getFullYear() === year && bDate.getMonth() === monthIndex;
      });
      const bookedValue = monthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

      // Match payments in this month
      const monthPayments = payments.filter((p) => {
        const dateStr = p.payment_date || p.created_at;
        if (!dateStr) return false;
        const pDate = new Date(dateStr);
        return pDate.getFullYear() === year && pDate.getMonth() === monthIndex;
      });
      const cashCollected = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      // Match quotations created in this month
      const monthQuotes = quotations.filter((q) => {
        const dateStr = q.created_at;
        if (!dateStr) return false;
        const qDate = new Date(dateStr);
        return qDate.getFullYear() === year && qDate.getMonth() === monthIndex;
      });
      const proposalPipeline = monthQuotes.reduce(
        (sum, q) => sum + (q.total_amount || q.amount || 0),
        0
      );

      monthsData.push({
        month: monthLabel,
        bookedValue,
        cashCollected,
        proposalPipeline,
      });
    }

    return monthsData;
  }, [bookings, payments, quotations]);

  const totalBookedValue = seasonData.reduce((sum, d) => sum + d.bookedValue, 0);
  const totalCollectedValue = seasonData.reduce((sum, d) => sum + d.cashCollected, 0);
  const hasAnyData = totalBookedValue > 0 || totalCollectedValue > 0;

  return (
    <Card className="shadow-xs border-border/80">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">Revenue & Pipeline Analytics</CardTitle>
            <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
              <TrendingUp className="h-3 w-3 mr-1" /> Live Sync
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Contract value booked vs. cash collected vs. active proposals across rolling 6 months
          </CardDescription>
        </div>

        <div className="flex items-center gap-1 border rounded-md p-0.5 bg-muted/30">
          <button
            type="button"
            onClick={() => setChartType("area")}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
              chartType === "area" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"
            }`}
          >
            Area View
          </button>
          <button
            type="button"
            onClick={() => setChartType("bar")}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
              chartType === "bar" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"
            }`}
          >
            Bar View
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-6">
        {!hasAnyData && (
          <div className="mb-3 rounded-lg border border-dashed bg-muted/20 p-3 text-center text-xs text-muted-foreground">
            <BarChart3 className="mx-auto h-5 w-5 mb-1 opacity-50" />
            <span className="font-medium text-foreground">Awaiting revenue transactions</span> — Revenue trends will dynamically populate as quotations, bookings, and payments are logged.
          </div>
        )}

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={seasonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="bookedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(val) => (val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : val > 0 ? `₹${val / 1000}k` : "₹0")}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-popover p-3 shadow-md text-xs space-y-1">
                          <p className="font-bold text-foreground mb-1">{label} Overview</p>
                          <p className="text-indigo-600 dark:text-indigo-400 font-semibold">
                            Booked: {formatCurrency(Number(payload[0]?.value) || 0)}
                          </p>
                          <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Collected: {formatCurrency(Number(payload[1]?.value) || 0)}
                          </p>
                          <p className="text-amber-600 dark:text-amber-400 font-medium">
                            Proposals: {formatCurrency(Number(payload[2]?.value) || 0)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                <Area type="monotone" dataKey="bookedValue" name="Booked Contracts" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#bookedGrad)" />
                <Area type="monotone" dataKey="cashCollected" name="Cash Collected" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#collectedGrad)" />
                <Area type="monotone" dataKey="proposalPipeline" name="Open Proposals" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" />
              </AreaChart>
            ) : (
              <BarChart data={seasonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(val) => (val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : val > 0 ? `₹${val / 1000}k` : "₹0")}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-popover p-3 shadow-md text-xs space-y-1">
                          <p className="font-bold text-foreground mb-1">{label}</p>
                          <p className="text-indigo-600 font-semibold">Booked: {formatCurrency(Number(payload[0]?.value) || 0)}</p>
                          <p className="text-emerald-600 font-semibold">Collected: {formatCurrency(Number(payload[1]?.value) || 0)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                <Bar dataKey="bookedValue" name="Booked Contracts" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cashCollected" name="Cash Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
