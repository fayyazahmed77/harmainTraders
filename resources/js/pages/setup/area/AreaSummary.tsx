import React from "react";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface AreaSummaryProps {
    total: number;
}

export default function AreaSummary({ total }: AreaSummaryProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm transition-all hover:shadow-xl"
            >
                <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-orange-500/5 transition-transform group-hover:scale-150" />
                
                <div className="relative flex items-center justify-between">
                    <div className="space-y-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 shadow-inner">
                            <MapPin className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Total Areas</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">
                                    {total.toString().padStart(2, '0')}
                                </span>
                                <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Nodes</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
