import React from 'react';
import { LocationNode } from '../types';
import { cn } from '@/lib/utils';
import { 
    Globe, 
    Landmark, 
    Building2, 
    MapPin, 
    Compass, 
    MoreVertical, 
    ChevronRight, 
    Plus, 
    Edit, 
    Trash2, 
    Eye,
    Power
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface LocationCardProps {
    node: LocationNode;
    isSelected?: boolean;
    onSelect?: () => void;
    onAddChild?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onToggleStatus?: () => void;
    onViewDetails?: () => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({
    node,
    isSelected = false,
    onSelect,
    onAddChild,
    onEdit,
    onDelete,
    onToggleStatus,
    onViewDetails,
}) => {
    // Determine icon & labels based on type
    const getCardTheme = () => {
        switch (node.type) {
            case 'country':
                return {
                    icon: Globe,
                    typeLabel: 'COUNTRY',
                    typeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                    childLabel: node.provinces_count !== undefined ? `${node.provinces_count} States` : null,
                    nextChildType: 'State',
                };
            case 'state':
                return {
                    icon: Landmark,
                    typeLabel: 'STATE / PROVINCE',
                    typeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                    childLabel: node.cities_count !== undefined ? `${node.cities_count} Cities` : null,
                    nextChildType: 'City',
                };
            case 'city':
                return {
                    icon: Building2,
                    typeLabel: 'CITY',
                    typeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
                    childLabel: node.areas_count !== undefined ? `${node.areas_count} Areas` : null,
                    nextChildType: 'Area',
                };
            case 'area':
                return {
                    icon: MapPin,
                    typeLabel: 'AREA',
                    typeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                    childLabel: node.subareas_count !== undefined ? `${node.subareas_count} Sub Areas` : null,
                    nextChildType: 'Sub Area',
                };
            case 'subarea':
                return {
                    icon: Compass,
                    typeLabel: 'SUB AREA',
                    typeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
                    childLabel: null,
                    nextChildType: null,
                };
        }
    };

    const theme = getCardTheme();
    const IconComponent = theme.icon;

    return (
        <div 
            onClick={onSelect}
            className={cn(
                "group relative w-[280px] shrink-0 p-4 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md",
                isSelected 
                    ? "bg-surface-1 border-emerald-500/60 ring-2 ring-emerald-500/20 shadow-emerald-500/5" 
                    : "bg-surface-1/80 hover:bg-surface-1 border-border/30 hover:border-emerald-500/40"
            )}
        >
            {/* Top Row: Icon + Type Badge + Menu */}
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                    <div className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center border transition-colors",
                        isSelected 
                            ? "bg-emerald-600 border-emerald-400 text-white shadow-sm" 
                            : "bg-surface-0 border-border/20 text-text-muted group-hover:text-emerald-600 group-hover:border-emerald-500/30"
                    )}>
                        <IconComponent className="h-4 w-4" />
                    </div>

                    <div>
                        <span className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border tracking-widest leading-none inline-block",
                            theme.typeColor
                        )}>
                            {theme.typeLabel}
                        </span>
                        {node.code && (
                            <span className="ml-1.5 text-[9px] font-bold font-mono text-text-muted opacity-70">
                                {node.code}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Active/Inactive Status Dot */}
                    <div className="flex items-center gap-1.5 mr-1" title={node.is_active ? "Active" : "Inactive"}>
                        <span className={cn(
                            "h-2 w-2 rounded-full",
                            node.is_active ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-zinc-400"
                        )} />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-0"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-surface-1 border-border/40 z-[100]">
                            {onViewDetails && (
                                <DropdownMenuItem onClick={onViewDetails} className="text-[11px] font-bold gap-2 cursor-pointer">
                                    <Eye className="h-3.5 w-3.5 text-text-muted" /> View Details
                                </DropdownMenuItem>
                            )}

                            {onAddChild && theme.nextChildType && (
                                <DropdownMenuItem onClick={onAddChild} className="text-[11px] font-bold gap-2 text-emerald-600 cursor-pointer">
                                    <Plus className="h-3.5 w-3.5" /> Add {theme.nextChildType}
                                </DropdownMenuItem>
                            )}

                            {onEdit && (
                                <DropdownMenuItem onClick={onEdit} className="text-[11px] font-bold gap-2 cursor-pointer">
                                    <Edit className="h-3.5 w-3.5 text-blue-500" /> Edit
                                </DropdownMenuItem>
                            )}

                            {onToggleStatus && (
                                <DropdownMenuItem onClick={onToggleStatus} className="text-[11px] font-bold gap-2 cursor-pointer">
                                    <Power className="h-3.5 w-3.5 text-amber-500" /> {node.is_active ? 'Deactivate' : 'Activate'}
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator className="bg-border/20" />

                            {onDelete && (
                                <DropdownMenuItem onClick={onDelete} className="text-[11px] font-bold gap-2 text-rose-500 focus:text-rose-600 cursor-pointer">
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Title / Name */}
            <div className="mb-3">
                <h3 className="text-sm font-black text-text-primary uppercase tracking-tight truncate group-hover:text-emerald-600 transition-colors">
                    {node.name}
                </h3>
            </div>

            {/* Bottom Row: Child Count or Action */}
            <div className="flex items-center justify-between pt-2 border-t border-border/10 text-[10px]">
                {theme.childLabel ? (
                    <div className={cn(
                        "flex items-center justify-between w-full font-bold uppercase tracking-wider transition-colors",
                        isSelected ? "text-emerald-600 font-black" : "text-text-muted group-hover:text-text-primary"
                    )}>
                        <span>{theme.childLabel}</span>
                        <ChevronRight className={cn(
                            "h-3.5 w-3.5 transition-transform",
                            isSelected ? "translate-x-1 text-emerald-600" : "group-hover:translate-x-0.5"
                        )} />
                    </div>
                ) : (
                    <span className="text-[9px] font-semibold text-text-muted italic opacity-60">Leaf Node</span>
                )}
            </div>
        </div>
    );
};
