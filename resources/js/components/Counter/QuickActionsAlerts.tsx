import { IconPlus, IconCash, IconBarcode, IconWallet, IconBell } from '@tabler/icons-react';
import React from 'react';
import { Link } from '@inertiajs/react';

interface AlertItem {
    dotClass: string;
    text: string;
    sub: string;
}

interface QuickActionsAlertsProps {
    alerts?: AlertItem[];
}

export default function QuickActionsAlerts({ alerts = [] }: QuickActionsAlertsProps) {
    const actions = [
        { icon: IconPlus, iconColor: 'text-orange-500', label: 'New invoice', sub: 'Counter sale', href: '/sales/create' },
        { icon: IconCash, iconColor: 'text-blue-500', label: 'Record return', sub: 'Reverse invoice', href: '/sales-return' },
        { icon: IconBarcode, iconColor: 'text-emerald-500', label: 'Check stock', sub: 'Live inventory', href: '/items' },
        { icon: IconWallet, iconColor: 'text-amber-500', label: 'Payments', sub: 'Record payment', href: '/payments/create' },
    ];

    return (
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col h-full shadow-xs">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
                {actions.map((act, idx) => (
                    <Link 
                        key={idx} 
                        href={act.href}
                        className="bg-background border border-border rounded-lg p-3 flex flex-col items-center justify-center hover:border-orange-500/40 dark:hover:border-orange-400/40 hover:bg-muted/50 transition-colors group cursor-pointer text-center"
                    >
                        <act.icon size={20} className={`${act.iconColor} mb-1.5`} />
                        <span className="text-[11px] text-foreground font-medium transition-colors">{act.label}</span>
                        <span className="text-[10px] text-muted-foreground">{act.sub}</span>
                    </Link>
                ))}
            </div>

            {/* Alerts */}
            <div className="mt-2.5 pt-2.5 border-t border-border/50 flex-1 flex flex-col">
                <div className="flex items-center gap-1.5 mb-2.5 text-orange-600 dark:text-orange-400">
                    <IconBell size={13} className="text-orange-500" />
                    <span className="text-[13px] font-medium text-foreground">Alerts</span>
                </div>
                <div className="flex flex-col flex-1 justify-center">
                    {alerts.length === 0 ? (
                        <span className="text-[11px] text-muted-foreground text-center py-4">
                            No alerts or warnings at this time.
                        </span>
                    ) : (
                        alerts.map((alert, idx) => (
                            <div key={idx} className="flex gap-2 py-1.5 border-b border-border/50 last:border-0 last:pb-0">
                                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${alert.dotClass}`}></div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] text-foreground leading-relaxed font-medium">{alert.text}</span>
                                    <span className="text-[10px] text-muted-foreground mt-0.5">{alert.sub}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
