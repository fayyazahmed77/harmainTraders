import React from 'react';
import { LocationNode, LocationType } from '../types';
import { cn } from '@/lib/utils';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetDescription 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Globe, Landmark, Building2, MapPin, Compass, Edit, Trash2, Power, Plus, ChevronRight } from 'lucide-react';

interface LocationDetailDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    node: LocationNode | null;
    parentPathStr?: string;
    onEdit?: (node: LocationNode) => void;
    onDelete?: (node: LocationNode) => void;
    onToggleStatus?: (node: LocationNode) => void;
    onAddChild?: (parentType: LocationType, parentNode: LocationNode) => void;
}

export const LocationDetailDrawer: React.FC<LocationDetailDrawerProps> = ({
    open,
    onOpenChange,
    node,
    parentPathStr,
    onEdit,
    onDelete,
    onToggleStatus,
    onAddChild,
}) => {
    if (!node) return null;

    const getTypeMeta = (type: LocationType) => {
        switch (type) {
            case 'country':
                return { icon: Globe, label: 'COUNTRY', childType: 'state', childLabel: 'State', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
            case 'state':
                return { icon: Landmark, label: 'STATE / PROVINCE', childType: 'city', childLabel: 'City', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
            case 'city':
                return { icon: Building2, label: 'CITY', childType: 'area', childLabel: 'Area', cls: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' };
            case 'area':
                return { icon: MapPin, label: 'AREA', childType: 'subarea', childLabel: 'Sub Area', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
            case 'subarea':
                return { icon: Compass, label: 'SUB AREA', childType: null, childLabel: null, cls: 'bg-rose-500/10 text-rose-600 border-rose-500/20' };
        }
    };

    const meta = getTypeMeta(node.type);
    const IconComp = meta.icon;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md bg-surface-1 border-border/30 p-6 flex flex-col justify-between z-[120]">
                <div>
                    {/* Header */}
                    <SheetHeader className="space-y-3 pb-6 border-b border-border/10">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-surface-0 border border-border/20 flex items-center justify-center text-emerald-600 shadow-sm">
                                <IconComp className="h-5 w-5" />
                            </div>
                            <div>
                                <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full border tracking-widest", meta.cls)}>
                                    {meta.label}
                                </span>
                                <SheetTitle className="text-xl font-black uppercase text-text-primary tracking-tight mt-1">
                                    {node.name}
                                </SheetTitle>
                            </div>
                        </div>
                        <SheetDescription className="sr-only">
                            Detailed metadata and audit information for {node.name}
                        </SheetDescription>
                    </SheetHeader>

                    {/* Content Section */}
                    <div className="space-y-6 pt-6">

                        {/* Hierarchy Path Breadcrumbs */}
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Geographical Hierarchy</span>
                            <div className="p-3 bg-surface-0 border border-border/20 rounded-xl flex items-center flex-wrap gap-1 text-xs font-bold text-text-primary">
                                {parentPathStr ? (
                                    parentPathStr.split(' → ').map((part, idx, arr) => (
                                        <React.Fragment key={idx}>
                                            <span className="text-text-muted">{part}</span>
                                            {idx < arr.length && <ChevronRight className="h-3 w-3 text-text-muted/40" />}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <span className="text-text-muted/60">Root Level</span>
                                )}
                                <span className="text-emerald-600 font-black uppercase">{node.name}</span>
                            </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Node Metadata</span>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-surface-0 border border-border/20 rounded-xl space-y-1">
                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Code Identifier</span>
                                    <p className="text-xs font-mono font-bold text-text-primary">{node.code || 'N/A'}</p>
                                </div>

                                <div className="p-3 bg-surface-0 border border-border/20 rounded-xl space-y-1">
                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Active Status</span>
                                    <p className="text-xs font-bold flex items-center gap-1.5">
                                        <span className={cn("h-2 w-2 rounded-full", node.is_active ? "bg-emerald-500" : "bg-zinc-400")} />
                                        {node.is_active ? 'Active' : 'Inactive'}
                                    </p>
                                </div>

                                {node.type === 'country' && (
                                    <>
                                        <div className="p-3 bg-surface-0 border border-border/20 rounded-xl space-y-1">
                                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Phone Code</span>
                                            <p className="text-xs font-bold text-text-primary">{node.phone_code || 'N/A'}</p>
                                        </div>
                                        <div className="p-3 bg-surface-0 border border-border/20 rounded-xl space-y-1">
                                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Currency</span>
                                            <p className="text-xs font-bold text-text-primary">{node.currency || 'N/A'}</p>
                                        </div>
                                    </>
                                )}

                                {node.provinces_count !== undefined && (
                                    <div className="p-3 bg-surface-0 border border-border/20 rounded-xl space-y-1">
                                        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Direct States</span>
                                        <p className="text-xs font-black text-emerald-600">{node.provinces_count}</p>
                                    </div>
                                )}
                                {node.cities_count !== undefined && (
                                    <div className="p-3 bg-surface-0 border border-border/20 rounded-xl space-y-1">
                                        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Direct Cities</span>
                                        <p className="text-xs font-black text-blue-600">{node.cities_count}</p>
                                    </div>
                                )}
                                {node.areas_count !== undefined && (
                                    <div className="p-3 bg-surface-0 border border-border/20 rounded-xl space-y-1">
                                        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Direct Areas</span>
                                        <p className="text-xs font-black text-indigo-600">{node.areas_count}</p>
                                    </div>
                                )}
                                {node.subareas_count !== undefined && (
                                    <div className="p-3 bg-surface-0 border border-border/20 rounded-xl space-y-1">
                                        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Direct Sub Areas</span>
                                        <p className="text-xs font-black text-amber-600">{node.subareas_count}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-6 border-t border-border/10 space-y-2">
                    {onAddChild && meta.childType && (
                        <Button 
                            onClick={() => { onOpenChange(false); onAddChild(node.type, node); }}
                            className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-wider rounded-xl gap-2 shadow-lg shadow-emerald-600/20"
                        >
                            <Plus className="h-4 w-4" /> Add Child {meta.childLabel}
                        </Button>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                        {onEdit && (
                            <Button 
                                variant="outline"
                                onClick={() => { onOpenChange(false); onEdit(node); }}
                                className="h-9 text-xs font-black uppercase tracking-wider rounded-xl gap-1.5"
                            >
                                <Edit className="h-3.5 w-3.5 text-blue-500" /> Edit
                            </Button>
                        )}
                        {onToggleStatus && (
                            <Button 
                                variant="outline"
                                onClick={() => { onOpenChange(false); onToggleStatus(node); }}
                                className="h-9 text-xs font-black uppercase tracking-wider rounded-xl gap-1.5"
                            >
                                <Power className="h-3.5 w-3.5 text-amber-500" /> Toggle
                            </Button>
                        )}
                        {onDelete && (
                            <Button 
                                variant="outline"
                                onClick={() => { onOpenChange(false); onDelete(node); }}
                                className="h-9 text-xs font-black uppercase tracking-wider rounded-xl gap-1.5 text-rose-500 border-rose-500/20 hover:bg-rose-500/10"
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                            </Button>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
