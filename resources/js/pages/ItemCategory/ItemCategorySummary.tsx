import React from "react";
import { motion } from "framer-motion";
import { Layers, Activity, ShieldCheck, Box } from "lucide-react";

interface ItemCategorySummaryProps {
  total: number;
}

const ItemCategorySummary: React.FC<ItemCategorySummaryProps> = ({ total }) => {
  const stats = [
    {
      label: "Total Categories",
      value: total,
      icon: Layers,
      color: "text-zinc-900 dark:text-zinc-100",
      bg: "bg-zinc-100 dark:bg-zinc-800",
      accent: "border-zinc-200 dark:border-zinc-700",
      sub: "Inventory Groups"
    },
    {
      label: "System Status",
      value: "Online",
      icon: Activity,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      accent: "border-emerald-100 dark:border-emerald-500/20",
      sub: "Operating Normally"
    },
    {
      label: "Data Security",
      value: "Active",
      icon: ShieldCheck,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-500/10",
      accent: "border-orange-100 dark:border-orange-500/20",
      sub: "Access Secured"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`relative overflow-hidden group p-6 rounded-3xl border ${stat.accent} ${stat.bg} shadow-sm transition-all duration-500 hover:shadow-xl`}
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-150 transition-transform duration-700">
            <stat.icon className="w-24 h-24" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl ${stat.bg} border ${stat.accent} shadow-inner`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 opacity-60">
                {stat.label}
              </span>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black tracking-tight ${stat.color}`}>
                {stat.value}
              </span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {stat.sub}
              </span>
            </div>
          </div>

          <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-${stat.color.split('-')[1]}-500 to-transparent w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        </motion.div>
      ))}
    </div>
  );
};

export default ItemCategorySummary;
