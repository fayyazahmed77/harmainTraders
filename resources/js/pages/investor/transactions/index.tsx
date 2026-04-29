import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    History, 
    ArrowUpRight, 
    ArrowDownLeft,
    TrendingUp,
    Filter,
    Calendar
} from 'lucide-react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';

interface Transaction {
    id: number;
    amount: number;
    type: string;
    narration: string;
    balance_after: number;
    created_at: string;
}

interface Props {
    transactions: {
        data: Transaction[];
        links: any[];
    };
}

export default function Transactions({ transactions }: Props) {
    const breadcrumbs = [
        { title: 'Investor Panel', href: '#' },
        { title: 'Transactions', href: '/investor/transactions' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaction History" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#F1F1F1]">Transaction Ledger</h1>
                        <p className="text-sm text-[#6B7280]">Complete audit trail of your capital movements</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-[#111318] border border-white/5 rounded-md px-3 py-1.5 text-sm text-[#6B7280]">
                            <Calendar size={14} />
                            <span>Last 30 Days</span>
                        </div>
                        <button className="rounded-md bg-[#181C23] border border-white/5 p-2 text-[#6B7280] hover:text-[#F1F1F1] transition-colors">
                            <Filter size={18} />
                        </button>
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
                                <TableHead className="text-[#6B7280]">Date</TableHead>
                                <TableHead className="text-[#6B7280]">Description</TableHead>
                                <TableHead className="text-[#6B7280]">Type</TableHead>
                                <TableHead className="text-right text-[#6B7280]">Amount (PKR)</TableHead>
                                <TableHead className="text-right text-[#6B7280]">Balance After</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.data.map((tx) => (
                                <TableRow key={tx.id} className="border-white/5 hover:bg-[#181C23]/30 transition-colors">
                                    <TableCell className="text-sm text-[#6B7280]">
                                        {new Date(tx.created_at).toLocaleDateString('en-GB')}
                                    </TableCell>
                                    <TableCell className="font-medium text-[#F1F1F1]">
                                        {tx.narration}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                            tx.type.includes('in') || tx.type.includes('credit')
                                                ? 'bg-green-500/10 text-green-500' 
                                                : 'bg-red-500/10 text-red-500'
                                        }`}>
                                            {tx.type.includes('in') || tx.type.includes('credit') ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                                            {tx.type.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </TableCell>
                                    <TableCell className={`text-right font-bold ${
                                        tx.type.includes('in') || tx.type.includes('credit') ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                        {tx.type.includes('in') || tx.type.includes('credit') ? '+' : '-'}
                                        {tx.amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-[#F1F1F1]">
                                        {tx.balance_after.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {transactions.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-[#6B7280]">
                                        No transactions found in this period.
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
