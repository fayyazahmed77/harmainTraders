import React from "react";
import { Map, Activity, Building2, Globe, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface ProvinceSummaryProps {
  summary: {
    total_provinces: number;
    active_provinces: number;
    total_cities_count: number;
    countries_count: number;
    mapped_coordinates_count?: number;
  };
}

export default function ProvinceSummary({ summary }: ProvinceSummaryProps) {
  const activePercent =
    summary.total_provinces > 0
      ? Math.round((summary.active_provinces / summary.total_provinces) * 100)
      : 0;

  const cards = [
    {
      label: "Total Provinces",
      value: summary.total_provinces.toString().padStart(2, "0"),
      sub: "Administrative Regions",
      icon: Map,
      iconColor: "text-blue-500 dark:text-blue-400",
      iconBg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Operational Status",
      value: summary.active_provinces.toString().padStart(2, "0"),
      sub: `${activePercent}% Active`,
      icon: Activity,
      iconColor: "text-emerald-500 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      isStatus: true,
    },
    {
      label: "Linked Cities",
      value: (summary.total_cities_count || 0).toString().padStart(2, "0"),
      sub: "Total Mapped Municipalities",
      icon: Building2,
      iconColor: "text-indigo-500 dark:text-indigo-400",
      iconBg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "Country Coverage",
      value: summary.countries_count.toString().padStart(2, "0"),
      sub: "Sovereign Jurisdictions",
      icon: Globe,
      iconColor: "text-amber-500 dark:text-amber-400",
      iconBg: "bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
        >
          <Card className="rounded-xl border border-border/70 bg-card text-card-foreground shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-black tracking-tight text-foreground">
                    {card.value}
                  </span>
                  {card.isStatus && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  {card.sub}
                </p>
              </div>
              <div
                className={`h-11 w-11 rounded-xl border flex items-center justify-center ${card.iconBg}`}
              >
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
