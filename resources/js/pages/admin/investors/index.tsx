import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { 
    Users, 
    TrendingUp, 
    ShieldCheck, 
    ArrowUpRight,
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    FileSpreadsheet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';

interface Investor {
    id: number;
    name: string;
    capital: number;
    ownership: number;
    status: string;
}

interface Props {
    investors: Investor[];
}

export default function Index({ investors }: Props) {
    const breadcrumbs = [
        { title: 'Admin Panel', href: '#' },
        { title: 'Investor Management', href: '/admin/investors' },
    ];

    const totalCapital = investors.reduce((sum, inv) => sum + inv.capital, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Investor Management" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header & Stats */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#F1F1F1]">Investor Management</h1>
                        <p className="text-sm text-[#6B7280]">Oversee capital participation and ownership distribution</p>
                    </div>
                    <div className="flex gap-2">
                        <a href="/admin/investors/export-excel" target="_blank">
                            <Button variant="outline" className="border-white/5 bg-[#181C23] text-[#F1F1F1] hover:bg-[#22272e]">
                                <FileSpreadsheet size={16} className="mr-2" /> Export Excel
                            </Button>
                        </a>
                        <Button className="bg-[#C9A84C] text-[#0A0C10] hover:bg-[#C9A84C]/90">
                            <Users size={16} className="mr-2" /> Add New Investor
                        </Button>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[
                        { label: 'Total Managed Capital', value: `PKR ${totalCapital.toLocaleString()}`, icon: TrendingUp, color: 'text-[#C9A84C]' },
                        { label: 'Active Investors', value: investors.length, icon: Users, color: 'text-[#3B82F6]' },
                        { label: 'Ownership Allocated', value: '100%', icon: ShieldCheck, color: 'text-[#22C55E]' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="rounded-lg border border-white/5 bg-[#111318] p-5"
                        >
                            <p className="text-[10px] uppercase tracking-wider text-[#6B7280]">{stat.label}</p>
                            <div className="mt-2 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-[#F1F1F1]">{stat.value}</h2>
                                <stat.icon size={20} className={stat.color} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Table Section */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-lg border border-white/5 bg-[#111318] overflow-hidden"
                >
                    <div className="flex items-center justify-between border-b border-white/5 p-4">
                        <div className="flex items-center gap-3 bg-[#181C23] rounded-md px-3 py-1.5 border border-white/5">
                            <Search size={14} className="text-[#6B7280]" />
                            <input 
                                type="text" 
                                placeholder="Search investors..." 
                                className="bg-transparent text-sm text-[#F1F1F1] outline-none placeholder:text-[#374151] w-48 lg:w-64"
                            />
                        </div>
                        <Button variant="outline" className="border-white/5 bg-[#181C23] text-[#F1F1F1] hover:bg-[#22272e]">
                            <Filter size={14} className="mr-2" /> Filter
                        </Button>
                    </div>

                    <Table>
                        <TableHeader className="bg-[#181C23]/50">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-[#6B7280]">Investor Name</TableHead>
                                <TableHead className="text-[#6B7280]">Capital (PKR)</TableHead>
                                <TableHead className="text-[#6B7280]">Ownership</TableHead>
                                <TableHead className="text-[#6B7280]">Status</TableHead>
                                <TableHead className="text-right text-[#6B7280]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {investors.map((investor) => (
                                <TableRow key={investor.id} className="border-white/5 hover:bg-[#181C23]/30 transition-colors">
                                    <TableCell className="font-medium text-[#F1F1F1]">
                                        <div className="flex flex-col">
                                            <span>{investor.name}</span>
                                            <span className="text-[10px] text-[#374151]">ID: #INV-{investor.id.toString().padStart(4, '0')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-[#F1F1F1]">
                                        {investor.capital.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-16 rounded-full bg-[#181C23] overflow-hidden">
                                                <div 
                                                    className="h-full bg-[#C9A84C]" 
                                                    style={{ width: `${investor.ownership}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-[#F1F1F1]">{investor.ownership.toFixed(2)}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                            investor.status === 'active' 
                                                ? 'bg-green-500/10 text-green-500' 
                                                : 'bg-[#374151] text-[#6B7280]'
                                        }`}>
                                            {investor.status.toUpperCase()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/admin/investors/${investor.id}`}>
                                            <Button variant="ghost" size="sm" className="text-[#6B7280] hover:text-[#C9A84C] hover:bg-transparent">
                                                <Eye size={16} className="mr-2" /> View Details
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </motion.div>
            </div>
        </AppLayout>
    );
}
