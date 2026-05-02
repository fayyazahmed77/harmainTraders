import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    TrendingUp, 
    Calendar,
    Wallet,
    Percent
} from 'lucide-react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';

interface ProfitShare {
    id: number;
    profit_amount: number;
    ownership_snapshot: number;
    capital_snapshot: number;
    credited_at: string;
    distribution: {
        distribution_period: string;
    };
}

interface Props {
    shares: {
        data: ProfitShare[];
        links: any[];
    };
}

export default function ProfitHistory({ shares }: Props) {
    const breadcrumbs = [
        { title: 'Investor Panel', href: '#' },
        { title: 'Profit History', href: '/investor/profit/history' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profit History" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#F1F1F1]">Profit Distributions</h1>
                        <p className="text-sm text-[#6B7280]">Historical record of your monthly profit shares</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border border-white/5 bg-[#111318] p-5">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#6B7280]">
                            <Wallet size={12} className="text-[#C9A84C]" />
                            <span>Total Profit Earned</span>
                        </div>
                        <h2 className="mt-2 text-xl font-bold text-[#F1F1F1]">
                            PKR {shares.data.reduce((sum, s) => sum + Number(s.profit_amount), 0).toLocaleString()}
                        </h2>
                    </div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-white/5 bg-[#111318] overflow-hidden"
                >
                    <Table>
                        <TableHeader className="bg-[#181C23]/50">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-[#6B7280]">Period</TableHead>
                                <TableHead className="text-[#6B7280]">Capital Snapshot</TableHead>
                                <TableHead className="text-[#6B7280]">Ownership %</TableHead>
                                <TableHead className="text-right text-[#6B7280]">Profit Credited (PKR)</TableHead>
                                <TableHead className="text-right text-[#6B7280]">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shares.data.map((share) => (
                                <TableRow key={share.id} className="border-white/5 hover:bg-[#181C23]/30 transition-colors">
                                    <TableCell className="font-bold text-[#F1F1F1]">
                                        {share.distribution.distribution_period}
                                    </TableCell>
                                    <TableCell className="text-[#6B7280]">
                                        {Number(share.capital_snapshot).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-[#6B7280]">
                                        {Number(share.ownership_snapshot).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-[#C9A84C]">
                                        {Number(share.profit_amount).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-[#374151]">
                                        {new Date(share.credited_at).toLocaleDateString('en-GB')}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {shares.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-[#6B7280]">
                                        No profit distributions found yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </motion.div>
            </div>
        </AppLayout>
    );
}
