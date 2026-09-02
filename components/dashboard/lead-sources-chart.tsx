"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadWithDetails } from "@/types/crm";
import { PieChart as PieChartIcon } from "lucide-react";

interface LeadSourcesChartProps {
  leads?: LeadWithDetails[];
}

const SOURCE_COLORS: Record<string, string> = {
  Instagram: "#ec4899",
  Referral: "#8b5cf6",
  Website: "#3b82f6",
  WhatsApp: "#10b981",
  "Google Search": "#f59e0b",
  "Walk-in": "#06b6d4",
  Other: "#64748b",
};

export function LeadSourcesChart({ leads = [] }: LeadSourcesChartProps) {
  const sourceCounts: Record<string, number> = {};

  if (leads && leads.length > 0) {
    leads.forEach((l) => {
      const src = l.source || "Other";
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });
  }

  const chartData = Object.keys(sourceCounts).map((source) => ({
    name: source,
    value: sourceCounts[source],
    color: SOURCE_COLORS[source] || "#64748b",
  }));

  const totalLeads = chartData.reduce((sum, item) => sum + item.value, 0);
  const topSource = chartData.length > 0
    ? chartData.reduce((prev, curr) => (curr.value > prev.value ? curr : prev), chartData[0])
    : null;
  const topPercentage = topSource && totalLeads > 0 ? Math.round((topSource.value / totalLeads) * 100) : 0;

  return (
    <Card className="shadow-xs border-border/80">
      <CardHeader className="pb-2 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Client Acquisition Sources</CardTitle>
            <CardDescription className="text-xs">
              Where new wedding & portrait enquiries originate from
            </CardDescription>
          </div>
          {topSource && totalLeads > 0 && (
            <Badge variant="outline" className="text-[10px]">
              Top: {topSource.name} ({topPercentage}%)
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        {totalLeads === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/10 p-6 text-center text-xs text-muted-foreground">
            <PieChartIcon className="mb-2 h-8 w-8 opacity-40 text-muted-foreground" />
            <p className="font-semibold text-foreground text-sm">No enquiry sources yet</p>
            <p className="mt-1 max-w-[200px] text-xs">
              Channels will break down here automatically as enquiries are created.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="rounded-lg border bg-popover p-2.5 shadow-md text-xs space-y-0.5">
                          <p className="font-bold text-foreground">{data.name}</p>
                          <p className="text-muted-foreground">{data.value} enquiries</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
