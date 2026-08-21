import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowUpDown, Table as TableIcon } from 'lucide-react';

interface AnalyticsDataTableProps {
    reportType: string;
    tableData: any[];
}

export const AnalyticsDataTable: React.FC<AnalyticsDataTableProps> = ({ reportType, tableData = [] }) => {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<string>('net_amount');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState<number>(1);
    const pageSize = 15;

    const fmtNum = (val: number) => {
        if (!val && val !== 0) return '0';
        return Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 });
    };

    // Filtering
    const filteredData = tableData.filter((row: any) => {
        const query = search.toLowerCase();
        const code = (row.code || '').toLowerCase();
        const itemName = (row.item_name || '').toLowerCase();
        const category = (row.category_name || '').toLowerCase();
        const company = (row.company_name || row.supplier_name || '').toLowerCase();

        return code.includes(query) || itemName.includes(query) || category.includes(query) || company.includes(query);
    });

    // Sorting
    const sortedData = [...filteredData].sort((a: any, b: any) => {
        let valA = a[sortKey] ?? 0;
        let valB = b[sortKey] ?? 0;

        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = (valB || '').toLowerCase();
            return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    // Pagination
    const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
    const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc');
        }
    };

    return (
        <Card className="p-5 bg-surface-1/60 border-border/40 shadow-sm rounded-xl backdrop-blur-sm space-y-4">
            {/* Header & Search */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <TableIcon className="h-5 w-5 text-emerald-600" />
                    <div>
                        <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">
                            {reportType === 'stock' ? 'Stock Inventory Details' : reportType === 'purchase' ? 'Purchase Breakdown by Item' : 'Sales Breakdown by Item'}
                        </h3>
                        <p className="text-[10px] font-mono text-text-muted">
                            Showing {sortedData.length} records
                        </p>
                    </div>
                </div>

                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                    <Input
                        type="text"
                        placeholder="Search product, category..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="pl-9 h-8 text-xs bg-surface-0 border-border/40 rounded-lg focus:ring-emerald-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-border/30">
                <table className="w-full text-xs text-left">
                    <thead className="bg-surface-0/80 text-[9px] font-black uppercase text-text-muted tracking-widest border-b border-border/30">
                        <tr>
                            <th className="p-3 cursor-pointer" onClick={() => handleSort('code')}>
                                <div className="flex items-center gap-1">Code <ArrowUpDown className="h-3 w-3" /></div>
                            </th>
                            <th className="p-3 cursor-pointer" onClick={() => handleSort('item_name')}>
                                <div className="flex items-center gap-1">Product Title <ArrowUpDown className="h-3 w-3" /></div>
                            </th>
                            <th className="p-3 cursor-pointer" onClick={() => handleSort('category_name')}>
                                <div className="flex items-center gap-1">Category <ArrowUpDown className="h-3 w-3" /></div>
                            </th>
                            {reportType === 'stock' ? (
                                <>
                                    <th className="p-3 text-center cursor-pointer" onClick={() => handleSort('total_pcs')}>
                                        <div className="flex items-center justify-center gap-1">Total Pcs <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="p-3 text-right cursor-pointer" onClick={() => handleSort('trade_price')}>
                                        <div className="flex items-center justify-end gap-1">Trade Price <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="p-3 text-right cursor-pointer" onClick={() => handleSort('valuation')}>
                                        <div className="flex items-center justify-end gap-1">Valuation <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="p-3 text-center">Status</th>
                                </>
                            ) : (
                                <>
                                    <th className="p-3 text-right cursor-pointer" onClick={() => handleSort('qty')}>
                                        <div className="flex items-center justify-end gap-1">Qty <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="p-3 text-right cursor-pointer" onClick={() => handleSort('gross_amount')}>
                                        <div className="flex items-center justify-end gap-1">Gross <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="p-3 text-right cursor-pointer" onClick={() => handleSort('discount_amount')}>
                                        <div className="flex items-center justify-end gap-1">Discount <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="p-3 text-right cursor-pointer text-emerald-600" onClick={() => handleSort('net_amount')}>
                                        <div className="flex items-center justify-end gap-1">Net Total <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="p-3 text-right cursor-pointer" onClick={() => handleSort('contribution_pct')}>
                                        <div className="flex items-center justify-end gap-1">Contrib % <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 font-mono">
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row: any, idx: number) => (
                                <tr key={idx} className="hover:bg-surface-0/60 transition-colors">
                                    <td className="p-3 font-bold text-text-muted">{row.code || '---'}</td>
                                    <td className="p-3 font-sans font-bold text-text-primary">{row.item_name}</td>
                                    <td className="p-3 font-sans text-text-muted">{row.category_name}</td>
                                    {reportType === 'stock' ? (
                                        <>
                                            <td className="p-3 text-center font-bold">{fmtNum(row.total_pcs)}</td>
                                            <td className="p-3 text-right">Rs {fmtNum(row.trade_price)}</td>
                                            <td className="p-3 text-right font-bold text-emerald-600">Rs {fmtNum(row.valuation)}</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                                    row.status === 'Out of Stock' 
                                                        ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' 
                                                        : row.status === 'Low Stock' 
                                                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' 
                                                        : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                                }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-3 text-right font-bold">{fmtNum(row.qty)}</td>
                                            <td className="p-3 text-right">Rs {fmtNum(row.gross_amount)}</td>
                                            <td className="p-3 text-right text-rose-600">Rs {fmtNum(row.discount_amount)}</td>
                                            <td className="p-3 text-right font-black text-emerald-600">Rs {fmtNum(row.net_amount)}</td>
                                            <td className="p-3 text-right font-bold text-blue-600">{row.contribution_pct}%</td>
                                        </>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-text-muted font-sans text-xs">
                                    No matching analytical records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-text-muted font-mono">
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="h-8 text-xs font-bold rounded-lg"
                        >
                            Previous
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            className="h-8 text-xs font-bold rounded-lg"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
};
