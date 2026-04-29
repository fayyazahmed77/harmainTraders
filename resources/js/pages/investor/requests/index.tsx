import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { route } from 'ziggy-js';

interface Props {
    data: any; // Paginated data
}

export default function RequestHistory({ data }: Props) {
    const breadcrumbs = [
        { title: 'Investor Panel', href: '/investor/dashboard' },
        { title: 'Requests', href: '/investor/requests' },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
            case 'approved': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Approved</Badge>;
            case 'paid': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Paid</Badge>;
            case 'rejected': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Rejected</Badge>;
            case 'cancelled': return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Cancelled</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const handleCancel = (id: number) => {
        if (confirm('Are you sure you want to cancel this request?')) {
            router.delete(route('investor.requests.cancel', id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Requests" />

            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[#F1F1F1]">Financial Requests</h1>
                    <p className="text-sm text-[#6B7280]">Track your reinvestments and withdrawal requests</p>
                </div>

                <Card className="border-white/5 bg-[#111318] overflow-hidden">
                    <Table>
                        <TableHeader className="bg-[#181C23]">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-[#6B7280]">Date</TableHead>
                                <TableHead className="text-[#6B7280]">Type</TableHead>
                                <TableHead className="text-[#6B7280]">Amount</TableHead>
                                <TableHead className="text-[#6B7280]">Status</TableHead>
                                <TableHead className="text-[#6B7280]">Admin Note</TableHead>
                                <TableHead className="text-right text-[#6B7280]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.data.map((req: any) => (
                                <TableRow key={req.id} className="border-white/5 hover:bg-white/[0.02]">
                                    <TableCell className="text-[#F1F1F1] font-medium">
                                        {new Date(req.requested_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="capitalize text-[#F1F1F1]">
                                        {req.request_type.replace('_', ' ')}
                                    </TableCell>
                                    <TableCell className="text-[#F1F1F1] font-mono">
                                        PKR {req.amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                                    <TableCell className="text-[#6B7280] text-xs max-w-[200px] truncate">
                                        {req.admin_note || '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {req.status === 'pending' && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => handleCancel(req.id)}
                                                className="text-[#EF4444] hover:bg-[#EF4444]/10 hover:text-[#EF4444]"
                                            >
                                                <Trash2 size={14} className="mr-1" /> Cancel
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-[#374151]">
                                        No request history found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>

                {/* Simple Pagination Placeholder */}
                <div className="mt-4 flex justify-end gap-2">
                    {data.links.map((link: any, i: number) => (
                        <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            disabled={!link.url || link.active}
                            onClick={() => link.url && router.get(link.url)}
                            className={`border-white/5 bg-[#111318] text-[#F1F1F1] ${link.active ? 'bg-[#C9A84C] text-[#0A0C10]' : ''}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
