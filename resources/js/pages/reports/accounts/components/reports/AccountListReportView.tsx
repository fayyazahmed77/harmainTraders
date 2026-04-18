import React from 'react';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import AppLogoIcon from '@/components/app-logo-icon';

interface AccountRow {
    code: string;
    title: string;
    address: string;
    tel: string;
    typed: string;
}

interface AccountListReportViewProps {
    data: AccountRow[];
    criteria: string;
    loading?: boolean;
}

export function AccountListReportView({ data, criteria, loading }: AccountListReportViewProps) {
    return (
        <Card className="p-8 bg-card border-border shadow-sm print:shadow-none print:border-none">
            {/* Report Header */}
            <div className="flex flex-col items-center justify-center space-y-2 mb-8">
                <div className="flex items-center justify-center gap-3 border-b-2 border-text-primary px-4 pb-2">
                    <AppLogoIcon className="w-8 h-8" />
                    <div className="flex flex-col text-left leading-none">
                        <span className="text-sidebar-primary text-xl tracking-tight text-text-primary">Haramain <span className="font-semibold text-sidebar-primary text-xl">Traders</span></span>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Wholesale & Supply Chain</span>
                    </div>
                </div>
                <h2 className="text-sm font-bold text-text-secondary tracking-wider uppercase mt-2">Accounts List</h2>
            </div>

            <div className="mb-6">
                <span className="text-[11px] font-black text-text-primary uppercase tracking-widest border-b border-border pb-1">Criteria:</span>
                <span className="text-[11px] font-bold text-text-muted ml-2 uppercase">{criteria}</span>
            </div>

            {/* Table */}
            <div className="border border-border rounded-sm overflow-hidden">
                <Table className="text-[11px]">
                    <TableHeader>
                        <TableRow className="bg-surface-1 hover:bg-surface-1 border-b-2 border-border">
                            <TableHead className="font-black text-text-primary h-10 border-r border-border text-center w-[100px]">Code</TableHead>
                            <TableHead className="font-black text-text-primary h-10 border-r border-border text-center">Title</TableHead>
                            <TableHead className="font-black text-text-primary h-10 border-r border-border text-center">Address</TableHead>
                            <TableHead className="font-black text-text-primary h-10 border-r border-border text-center w-[150px]">Tel #</TableHead>
                            <TableHead className="font-black text-text-primary h-10 text-center w-[120px]">Typed</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="h-40 text-center text-text-muted font-bold uppercase tracking-widest">Loading Report...</TableCell></TableRow>
                        ) : data.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-40 text-center text-text-muted font-bold uppercase tracking-widest">No Records Found</TableCell></TableRow>
                        ) : (
                            data.map((row, i) => (
                                <TableRow key={i} className="hover:bg-surface-1/50 border-b border-border/10">
                                    <TableCell className="font-bold text-text-primary border-r border-border/10 tabular-nums py-1.5">{row.code}</TableCell>
                                    <TableCell className="font-bold text-text-secondary border-r border-border/10 uppercase">{row.title}</TableCell>
                                    <TableCell className="text-text-muted border-r border-border/10 uppercase italic">{row.address || '-'}</TableCell>
                                    <TableCell className="text-text-secondary border-r border-border/10 tabular-nums">{row.tel || '-'}</TableCell>
                                    <TableCell className="text-text-muted font-bold uppercase">{row.typed}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-8 text-right px-4">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Accounts Listed: </span>
                <span className="text-[10px] font-black text-text-primary ml-1">{data.length}</span>
            </div>

            <div className="mt-8 flex justify-between items-end border-t border-border pt-10 px-4 opacity-50">
                <div className="text-center">
                    <div className="w-40 border-t border-text-primary m-auto mb-1"></div>
                    <span className="text-[10px] font-bold text-text-secondary">Generated By Admin</span>
                </div>
                <div className="text-center">
                    <div className="w-40 border-t border-text-primary m-auto mb-1"></div>
                    <span className="text-[10px] font-bold text-text-secondary">Authorized signature</span>
                </div>
            </div>
        </Card>
    );
}
