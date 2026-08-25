import React, { useState, useEffect, useMemo } from 'react';
import { LocationNode, LocationType } from '../types';
import { cn } from '@/lib/utils';
import { Search, Filter, Globe, Landmark, Building2, MapPin, Compass, Eye, Edit, Trash2, Power, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';

declare const route: any;

interface FlatLocationRow extends LocationNode {
    parent_path_str?: string;
}

interface LocationListViewProps {
    rootCountries: LocationNode[];
    onEdit: (node: LocationNode) => void;
    onDelete: (node: LocationNode) => void;
    onToggleStatus: (node: LocationNode) => void;
    onViewDetails: (node: LocationNode) => void;
}

export const LocationListView: React.FC<LocationListViewProps> = ({
    rootCountries,
    onEdit,
    onDelete,
    onToggleStatus,
    onViewDetails,
}) => {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [searchResults, setSearchResults] = useState<FlatLocationRow[]>([]);
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(1);
    const pageSize = 12;

    // Load list data from search API or local tree items
    useEffect(() => {
        if (!search.trim() && typeFilter === 'ALL' && statusFilter === 'ALL') {
            // Default: flatten root countries + state preview
            const defaultRows: FlatLocationRow[] = rootCountries.map(c => ({
                ...c,
                type: 'country',
                parent_path_str: '—',
            }));
            setSearchResults(defaultRows);
            return;
        }

        setLoading(true);
        axios.get(route('locations.search'), {
            params: { q: search.trim() || 'a' }
        })
        .then(res => {
            const mapped: FlatLocationRow[] = (res.data || []).map((item: any) => ({
                id: item.id,
                name: item.name,
                type: item.type as LocationType,
                code: item.code,
                is_active: item.is_active,
                parent_path_str: item.path?.slice(0, -1).join(' → ') || '—',
                path_ids: item.path_ids,
            }));
            setSearchResults(mapped);
        })
        .catch(err => console.error("Search failed", err))
        .finally(() => setLoading(false));
    }, [search, typeFilter, statusFilter, rootCountries]);

    // Apply Client-Side Type & Status Filters
    const filteredRows = useMemo(() => {
        return searchResults.filter(row => {
            if (typeFilter !== 'ALL' && row.type !== typeFilter) return false;
            if (statusFilter === 'active' && !row.is_active) return false;
            if (statusFilter === 'inactive' && row.is_active) return false;
            return true;
        });
    }, [searchResults, typeFilter, statusFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
    const paginatedRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, page]);

    const getTypeBadge = (type: LocationType) => {
        switch (type) {
            case 'country':
                return { icon: Globe, label: 'Country', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
            case 'state':
                return { icon: Landmark, label: 'State', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
            case 'city':
                return { icon: Building2, label: 'City', cls: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' };
            case 'area':
                return { icon: MapPin, label: 'Area', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
            case 'subarea':
                return { icon: Compass, label: 'Sub Area', cls: 'bg-rose-500/10 text-rose-600 border-rose-500/20' };
        }
    };

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-surface-1 p-3 rounded-2xl border border-border/30 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40" />
                    <Input 
                        placeholder="SEARCH LOCATIONS, CODES..." 
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9 h-10 bg-surface-0 border-border/20 text-xs font-bold uppercase tracking-widest focus-visible:ring-emerald-600/20 rounded-xl"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* Type Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5 text-text-muted" />
                        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                            <SelectTrigger className="h-10 w-[140px] text-xs font-black uppercase tracking-wider bg-surface-0 border-border/20 rounded-xl">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent className="bg-surface-1 border-border/40 z-[100]">
                                <SelectItem value="ALL" className="text-xs font-bold">ALL TYPES</SelectItem>
                                <SelectItem value="country" className="text-xs font-bold">COUNTRY</SelectItem>
                                <SelectItem value="state" className="text-xs font-bold">STATE</SelectItem>
                                <SelectItem value="city" className="text-xs font-bold">CITY</SelectItem>
                                <SelectItem value="area" className="text-xs font-bold">AREA</SelectItem>
                                <SelectItem value="subarea" className="text-xs font-bold">SUB AREA</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                        <SelectTrigger className="h-10 w-[130px] text-xs font-black uppercase tracking-wider bg-surface-0 border-border/20 rounded-xl">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-surface-1 border-border/40 z-[100]">
                            <SelectItem value="ALL" className="text-xs font-bold">ALL STATUS</SelectItem>
                            <SelectItem value="active" className="text-xs font-bold text-emerald-600">ACTIVE</SelectItem>
                            <SelectItem value="inactive" className="text-xs font-bold text-zinc-500">INACTIVE</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-surface-1 border border-border/30 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/20 bg-surface-0/60 text-[10px] font-black uppercase tracking-widest text-text-muted">
                                <th className="p-4">Location Type</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Code</th>
                                <th className="p-4">Parent Path</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10 text-xs font-medium text-text-primary">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-muted uppercase tracking-widest font-black text-xs">
                                        Loading locations...
                                    </td>
                                </tr>
                            ) : paginatedRows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-muted font-bold">
                                        No location records match the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                paginatedRows.map(row => {
                                    const b = getTypeBadge(row.type);
                                    const IconComp = b.icon;

                                    return (
                                        <tr key={`${row.type}-${row.id}`} className="hover:bg-surface-0/40 transition-colors group">
                                            <td className="p-4">
                                                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest", b.cls)}>
                                                    <IconComp className="h-3 w-3" />
                                                    {b.label}
                                                </span>
                                            </td>
                                            <td className="p-4 font-black uppercase text-text-primary group-hover:text-emerald-600 transition-colors">
                                                {row.name}
                                            </td>
                                            <td className="p-4">
                                                {row.code ? (
                                                    <span className="font-mono text-[10px] bg-surface-0 px-2 py-0.5 rounded border border-border/20 text-text-muted font-bold">
                                                        {row.code}
                                                    </span>
                                                ) : (
                                                    <span className="text-text-muted/40">—</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-text-muted font-semibold text-[11px]">
                                                {row.parent_path_str}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                                                    row.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-zinc-500/10 text-zinc-500"
                                                )}>
                                                    <span className={cn("h-1.5 w-1.5 rounded-full", row.is_active ? "bg-emerald-500" : "bg-zinc-400")} />
                                                    {row.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => onViewDetails(row)} 
                                                        title="View Details"
                                                        className="h-7 w-7 text-text-muted hover:text-text-primary"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => onEdit(row)} 
                                                        title="Edit"
                                                        className="h-7 w-7 text-text-muted hover:text-blue-600"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => onToggleStatus(row)} 
                                                        title="Toggle Status"
                                                        className="h-7 w-7 text-text-muted hover:text-amber-600"
                                                    >
                                                        <Power className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => onDelete(row)} 
                                                        title="Delete"
                                                        className="h-7 w-7 text-text-muted hover:text-rose-600"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between p-4 border-t border-border/10 bg-surface-0/40 text-xs font-bold text-text-muted">
                    <span>
                        Showing {filteredRows.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length} locations
                    </span>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="h-8 text-xs font-black uppercase tracking-wider"
                        >
                            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                        </Button>
                        <span className="text-xs font-black text-text-primary px-2">{page} / {totalPages}</span>
                        <Button 
                            variant="outline" 
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="h-8 text-xs font-black uppercase tracking-wider"
                        >
                            Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
