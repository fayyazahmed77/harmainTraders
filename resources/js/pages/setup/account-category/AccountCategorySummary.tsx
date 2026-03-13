import React from "react";
import { Tag } from "lucide-react";
import { motion } from "framer-motion";

interface SummaryProps {
  count: number;
}

export default function AccountCategorySummary({ count }: SummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm transition-all hover:shadow-md"
      >
        <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-orange-500/5 blur-2xl transition-all group-hover:bg-orange-500/10" />
        
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-500/20 text-white">
            <Tag className="h-6 w-6" />
          </div>
          
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Total Categories
            </p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
              {count.toString().padStart(2, '0')}
            </h3>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
