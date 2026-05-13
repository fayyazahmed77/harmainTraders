import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Package, AlertTriangle, XCircle } from "lucide-react";

interface StockItem {
    sku: string;
    name: string;
    category: string;
    unit: string;
    qty: number;
    min_level: number;
    status: 'out' | 'low' | 'ok';
}

interface StockSummary {
    total_skus: number;
    low_stock: number;
    out_of_stock: number;
}

interface StockTabProps {
    stockItems: StockItem[];
    stockSummary: StockSummary;
}

const StockTab: React.FC<StockTabProps> = ({ stockItems, stockSummary }) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredItems = stockItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'out':
                return "bg-red-500/10 text-red-500 border-red-500/20";
            case 'low':
                return "bg-orange-500/10 text-orange-500 border-orange-500/20";
            case 'ok':
                return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            default:
                return "";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'out': return "Out of Stock";
            case 'low': return "Low Stock";
            case 'ok': return "In Stock";
            default: return status;
        }
    };

    return (
       
           
            <div className="">
                <div className="flex flex-wrap gap-3 mb-2">
                <div className="flex items-center gap-2.5 px-4 py-2  border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg">
                        <Package className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total SKUs</p>
                        <p className="text-sm font-black text-gray-900 dark:text-gray-100 leading-none">{stockSummary.total_skus}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-2  border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm">
                    <div className="p-1.5 bg-orange-500/10 rounded-lg">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Low Stock</p>
                        <p className="text-sm font-black text-orange-500 leading-none">{stockSummary.low_stock}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-2  border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm">
                    <div className="p-1.5 bg-red-500/10 rounded-lg">
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Out of Stock</p>
                        <p className="text-sm font-black text-red-500 leading-none">{stockSummary.out_of_stock}</p>
                    </div>
                </div>

                <div className="relative w-full md:w-64 lg:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                        placeholder="Search by SKU or Name..." 
                        className="pl-9 h-9 text-xs font-bold border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table Container */}
            <div className="rounded-xl border border-gray-100 dark:border-gray-800  overflow-hidden">
                
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/50 dark:bg-gray-900/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-500">SKU</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-500">Product Name</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-500">Category</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-500">Unit</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-500 text-right">Qty</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-500 text-right">Min Level</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-500 text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item, index) => (
                                    <TableRow key={index} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono text-[10px] py-0 bg-gray-50 dark:bg-gray-900 border-none">{item.sku}</Badge>
                                        </TableCell>
                                        <TableCell className="font-black text-xs text-gray-900 dark:text-gray-100 max-w-[200px] truncate">{item.name}</TableCell>
                                        <TableCell className="text-[11px] font-bold text-gray-500">{item.category}</TableCell>
                                        <TableCell className="text-[11px] font-bold text-gray-400 uppercase">{item.unit}</TableCell>
                                        <TableCell className={`text-xs font-black text-right ${item.status === 'ok' ? 'text-gray-900 dark:text-gray-100' : (item.status === 'low' ? 'text-orange-500' : 'text-red-500')}`}>
                                            {item.qty.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-xs font-bold text-gray-400 text-right">
                                            {item.min_level}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge 
                                                variant="outline" 
                                                className={`capitalize text-[9px] font-black px-2 py-0.5 border shadow-none ${getStatusStyle(item.status)}`}
                                            >
                                                {getStatusLabel(item.status)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-gray-400 italic text-xs font-bold uppercase tracking-widest opacity-40">
                                        {searchTerm ? "No products match your search" : "No stock data available"}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
        
    );
};

export default StockTab;
