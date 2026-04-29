import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { 
    Calculator, 
    Calendar, 
    ArrowUpRight, 
    CheckCircle2, 
    Info,
    AlertTriangle,
    Coins,
    TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';

interface Props {
    distributions: any[];
}

export default function Distribute({ distributions }: Props) {
    const [period, setPeriod] = useState(new Date().toISOString().substring(0, 7));
    const [previewData, setPreviewData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const breadcrumbs = [
        { title: 'Financial Management', href: '#' },
        { title: 'Profit Distribution', href: '/admin/profit/distribute' },
    ];

    const distributionForm = useForm({
        period: '',
        total_profit: 0,
    });

    const fetchPreview = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/admin/profit/distribute/preview', { period });
            setPreviewData(response.data);
            distributionForm.setData({
                period: period,
                total_profit: response.data.total_profit
            });
        } catch (error) {
            console.error('Error fetching preview:', error);
            alert('Failed to fetch profit data for the selected period.');
        } finally {
            setLoading(false);
        }
    };

    const handleDistribute = (e: React.FormEvent) => {
        e.preventDefault();
        if (confirm(`Are you sure you want to distribute PKR ${distributionForm.data.total_profit.toLocaleString()}? This action will update all investor ledgers and cannot be undone.`)) {
            distributionForm.post('/admin/profit/distribute', {
                onSuccess: () => {
                    setPreviewData(null);
                    alert('Profit distributed successfully!');
                }
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profit Distribution" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#F1F1F1]">Profit Distribution</h1>
                        <p className="text-sm text-[#6B7280]">Calculate and allocate monthly net profit to investors</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                    {/* Distribution Tool */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="rounded-lg border border-white/5 bg-[#111318] p-5">
                            <h3 className="text-sm font-bold text-[#F1F1F1] flex items-center gap-2 mb-4">
                                <Calculator size={16} className="text-[#C9A84C]" /> New Allocation
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="period" className="text-xs text-[#6B7280]">Select Month</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-[#374151]" />
                                        <Input 
                                            id="period" 
                                            type="month" 
                                            value={period}
                                            onChange={e => setPeriod(e.target.value)}
                                            className="pl-9 bg-[#181C23] border-white/5 text-[#F1F1F1]"
                                        />
                                    </div>
                                </div>

                                <Button 
                                    onClick={fetchPreview}
                                    disabled={loading}
                                    className="w-full bg-[#181C23] border border-white/5 text-[#F1F1F1] hover:bg-[#22272e]"
                                >
                                    {loading ? 'Calculating...' : 'Preview Distribution'}
                                </Button>
                            </div>
                        </div>

                        {/* Recent History */}
                        <div className="rounded-lg border border-white/5 bg-[#111318] p-5">
                            <h3 className="text-sm font-bold text-[#F1F1F1] flex items-center gap-2 mb-4">
                                <HistoryIcon size={16} className="text-[#6B7280]" /> Distribution History
                            </h3>
                            <div className="space-y-3">
                                {distributions.slice(0, 5).map((dist) => (
                                    <div key={dist.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                        <div>
                                            <p className="text-xs font-semibold text-[#F1F1F1]">{dist.period}</p>
                                            <p className="text-[10px] text-[#6B7280]">{new Date(dist.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <p className="text-xs font-bold text-[#22C55E]">PKR {dist.total_profit.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="lg:col-span-3">
                        <AnimatePresence mode="wait">
                            {previewData ? (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {/* Snapshot Summary */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="rounded-lg border border-white/5 bg-[#111318] p-5 border-l-2 border-[#C9A84C]">
                                            <p className="text-[10px] uppercase text-[#6B7280]">Total Period Profit</p>
                                            <h2 className="text-xl font-bold text-[#F1F1F1] mt-1">PKR {previewData.total_profit.toLocaleString()}</h2>
                                        </div>
                                        <div className="rounded-lg border border-white/5 bg-[#111318] p-5 border-l-2 border-[#3B82F6]">
                                            <p className="text-[10px] uppercase text-[#6B7280]">Investors Count</p>
                                            <h2 className="text-xl font-bold text-[#F1F1F1] mt-1">{previewData.investor_shares.length} Partners</h2>
                                        </div>
                                        <div className="rounded-lg border border-white/5 bg-[#111318] p-5 border-l-2 border-[#22C55E]">
                                            <p className="text-[10px] uppercase text-[#6B7280]">Allocation Rate</p>
                                            <h2 className="text-xl font-bold text-[#F1F1F1] mt-1">100% Pro-rata</h2>
                                        </div>
                                    </div>

                                    {/* Preview Table */}
                                    <div className="rounded-lg border border-white/5 bg-[#111318] overflow-hidden">
                                        <div className="p-4 border-b border-white/5 bg-[#181C23]/30">
                                            <h3 className="text-sm font-bold text-[#F1F1F1]">Distribution Breakdown</h3>
                                        </div>
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-white/5 hover:bg-transparent">
                                                    <TableHead className="text-[#6B7280]">Investor</TableHead>
                                                    <TableHead className="text-[#6B7280]">Ownership Snapshot</TableHead>
                                                    <TableHead className="text-[#6B7280] text-right">Profit Share (PKR)</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {previewData.investor_shares.map((share: any) => (
                                                    <TableRow key={share.investor_id} className="border-white/5">
                                                        <TableCell className="text-[#F1F1F1] font-medium">{share.name}</TableCell>
                                                        <TableCell className="text-[#6B7280]">{share.ownership_percentage.toFixed(4)}%</TableCell>
                                                        <TableCell className="text-right text-[#22C55E] font-bold">
                                                            {share.share_amount.toLocaleString()}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Action Box */}
                                    <div className="rounded-lg border border-white/5 bg-[#181C23] p-6">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="rounded-full bg-yellow-500/10 p-2 text-yellow-500">
                                                <AlertTriangle size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#F1F1F1]">Ready to finalize?</p>
                                                <p className="text-xs text-[#6B7280]">
                                                    Clicking distribute will record these amounts in all investor ledgers and freeze the ownership snapshot for this period.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3">
                                            <Button variant="ghost" onClick={() => setPreviewData(null)}>Cancel</Button>
                                            <Button 
                                                onClick={handleDistribute}
                                                className="bg-[#C9A84C] text-[#0A0C10] hover:bg-[#C9A84C]/90 px-8"
                                                disabled={distributionForm.processing}
                                            >
                                                <Coins size={16} className="mr-2" /> Confirm & Distribute Profit
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-[500px] flex flex-col items-center justify-center rounded-lg border border-dashed border-white/5 bg-[#111318]/50 text-center"
                                >
                                    <div className="rounded-full bg-[#181C23] p-6 mb-4">
                                        <TrendingUp size={48} className="text-[#374151]" />
                                    </div>
                                    <h2 className="text-lg font-bold text-[#F1F1F1]">No Distribution Selected</h2>
                                    <p className="text-sm text-[#6B7280] max-w-xs mt-2">
                                        Select a month and click "Preview Distribution" to see the profit split across partners.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

import { History as HistoryIcon } from 'lucide-react';
