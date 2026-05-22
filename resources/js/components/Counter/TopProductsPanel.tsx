import { IconTrendingUp } from '@tabler/icons-react';
import React from 'react';

interface ProductItem {
    rank: number;
    name: string;
    units: number;
    max: number;
    lowStock: boolean;
}

interface TopProductsPanelProps {
    topProducts?: ProductItem[];
}

export default function TopProductsPanel({ topProducts = [] }: TopProductsPanelProps) {
    return (
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col h-full shadow-xs">
            <div className="flex items-center gap-1.5 mb-3 text-orange-600 dark:text-orange-400">
                <IconTrendingUp size={14} className="text-orange-500" />
                <span className="text-[13px] font-medium text-foreground">Top products sold today</span>
            </div>

            <div className="flex flex-col flex-1">
                {topProducts.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center py-8 text-[11px] text-muted-foreground">
                        No sales recorded today.
                    </div>
                ) : (
                    topProducts.map((prod, idx) => {
                        const widthPct = (prod.units / prod.max) * 100;
                        return (
                            <div key={idx} className="flex items-center gap-2 border-b border-border/50 py-1.5 last:border-0">
                                <span className="text-[10px] text-muted-foreground/60 w-4 font-mono">{prod.rank}</span>
                                <span className="text-[11px] text-foreground flex-1 truncate font-medium">{prod.name}</span>
                                
                                {/* Mini bar */}
                                <div className="w-[70px] h-[5px] bg-muted-foreground rounded overflow-hidden">
                                    <div 
                                        className="h-full bg-orange-500 dark:bg-orange-600 rounded"
                                        style={{ width: `${widthPct}%` }}
                                    ></div>
                                </div>
                                
                                <span className={`text-[10px] w-9 text-right ${prod.lowStock ? 'text-red-600 dark:text-red-400 font-bold' : 'text-muted-foreground'}`}>
                                    {prod.units}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
