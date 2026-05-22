import { IconUsers, IconCash, IconWallet, IconRefresh } from '@tabler/icons-react';
import React from 'react';

const iconMap: Record<string, React.ComponentType<any>> = {
    users: IconUsers,
    cash: IconCash,
    wallet: IconWallet,
    refresh: IconRefresh,
};

const colorMap: Record<string, { icon: string; value: string }> = {
    users: { icon: 'text-orange-500', value: 'text-orange-600 dark:text-orange-400' },
    cash: { icon: 'text-emerald-500', value: 'text-emerald-600 dark:text-emerald-400' },
    wallet: { icon: 'text-blue-500', value: 'text-blue-600 dark:text-blue-400' },
    refresh: { icon: 'text-red-500', value: 'text-red-600 dark:text-red-400' },
};

interface KpiCardsProps {
    kpis?: Array<{
        title: string;
        value: string;
        subLabel: string;
        subColor: string;
        iconType: string;
    }>;
}

export default function KpiCards({ kpis = [] }: KpiCardsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {kpis.map((kpi, index) => {
                const IconComponent = iconMap[kpi.iconType] || IconCash;
                const colors = colorMap[kpi.iconType] || { icon: 'text-emerald-500', value: 'text-emerald-600 dark:text-emerald-400' };
                
                return (
                    <div
                        key={index}
                        className="bg-card border border-border rounded-lg p-4 flex flex-col shadow-xs"
                    >
                        <IconComponent size={18} className={`${colors.icon} mb-1.5`} />
                        <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground mb-1">
                            {kpi.title}
                        </span>
                        <span className={`text-[20px] font-bold ${colors.value} leading-tight mb-1`}>
                            {kpi.value}
                        </span>
                        <div className="flex items-center gap-1">
                            <span className={`text-[10px] ${kpi.subColor}`}>
                                {kpi.subLabel}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
