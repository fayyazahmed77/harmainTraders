import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SiteHeader } from '@/components/site-header';
import { LocationNode, LocationStats, LocationType, SearchResultItem } from './types';

declare const route: any;
import { LocationTreeView } from './components/LocationTreeView';
import { LocationListView } from './components/LocationListView';
import { LocationFormModal } from './components/LocationFormModal';
import { LocationDetailDrawer } from './components/LocationDetailDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Search, 
    Plus, 
    Globe, 
    Landmark, 
    Building2, 
    MapPin, 
    Compass, 
    Layers, 
    ListFilter, 
    ChevronRight,
    Sparkles,
    AlertTriangle
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import axios from 'axios';
import { cn } from '@/lib/utils';

interface PageProps {
    countries: LocationNode[];
    stats: LocationStats;
}

const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Settings", href: "#" },
    { title: "Location Management", href: "/locations" },
];

export default function LocationManagementIndex({ countries = [], stats }: PageProps) {
    // View mode: 'tree' | 'list'
    const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');

    // Selected hierarchy path in Tree View
    const [selectedPath, setSelectedPath] = useState<{
        country?: LocationNode | null;
        state?: LocationNode | null;
        city?: LocationNode | null;
        area?: LocationNode | null;
        subarea?: LocationNode | null;
    }>({});

    // Global Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);

    // Modal state for Add/Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<LocationType>('country');
    const [modalParent, setModalParent] = useState<{ countryId?: number; provinceId?: number; cityId?: number; areaId?: number }>({});
    const [editingNode, setEditingNode] = useState<LocationNode | null>(null);

    // Drawer state for Detail View
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerNode, setDrawerNode] = useState<LocationNode | null>(null);

    // Delete Confirmation dialog state
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [nodeToDelete, setNodeToDelete] = useState<LocationNode | null>(null);

    // Handle Global Search Input
    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (val.trim().length >= 2) {
            setIsSearching(true);
            setShowSearchDropdown(true);
            axios.get(route('locations.search'), { params: { q: val } })
                .then(res => setSearchResults(res.data || []))
                .catch(err => console.error("Search failed", err))
                .finally(() => setIsSearching(false));
        } else {
            setSearchResults([]);
            setShowSearchDropdown(false);
        }
    };

    // Select node in Tree View
    const handleSelectNode = (node: LocationNode, level: LocationType) => {
        switch (level) {
            case 'country':
                setSelectedPath({ country: node });
                break;
            case 'state':
                setSelectedPath(prev => ({ country: prev.country, state: node }));
                break;
            case 'city':
                setSelectedPath(prev => ({ country: prev.country, state: prev.state, city: node }));
                break;
            case 'area':
                setSelectedPath(prev => ({ country: prev.country, state: prev.state, city: prev.city, area: node }));
                break;
            case 'subarea':
                setSelectedPath(prev => ({ ...prev, subarea: node }));
                break;
        }
    };

    // Handle Add Child from Context
    const handleAddChild = (parentType: LocationType, parentNode: LocationNode) => {
        setEditingNode(null);
        if (parentType === 'country') {
            setModalType('state');
            setModalParent({ countryId: parentNode.id });
        } else if (parentType === 'state') {
            setModalType('city');
            setModalParent({ countryId: parentNode.country_id || selectedPath.country?.id, provinceId: parentNode.id });
        } else if (parentType === 'city') {
            setModalType('area');
            setModalParent({ 
                countryId: parentNode.country_id || selectedPath.country?.id, 
                provinceId: parentNode.province_id || selectedPath.state?.id, 
                cityId: parentNode.id 
            });
        } else if (parentType === 'area') {
            setModalType('subarea');
            setModalParent({ 
                countryId: parentNode.country_id || selectedPath.country?.id, 
                provinceId: parentNode.province_id || selectedPath.state?.id, 
                cityId: parentNode.city_id || selectedPath.city?.id, 
                areaId: parentNode.id 
            });
        }
        setIsModalOpen(true);
    };

    // Open Edit Modal
    const handleEditNode = (node: LocationNode) => {
        setEditingNode(node);
        setModalType(node.type);
        setIsModalOpen(true);
    };

    // Open Delete Safeguard Dialog
    const handleDeletePrompt = (node: LocationNode) => {
        setNodeToDelete(node);
        setIsDeleteOpen(true);
    };

    // Confirm Delete Action
    const confirmDelete = () => {
        if (!nodeToDelete) return;
        router.delete(route('locations.destroy', { type: nodeToDelete.type, id: nodeToDelete.id }), {
            onSuccess: () => {
                toast.success(`${nodeToDelete.name} deleted successfully`);
                setIsDeleteOpen(false);
                setNodeToDelete(null);
            },
            onError: () => {
                toast.error("Failed to delete location node");
                setIsDeleteOpen(false);
            }
        });
    };

    // Toggle Active Status
    const handleToggleStatus = (node: LocationNode) => {
        const newStatus = !node.is_active;
        router.put(route('locations.update', { type: node.type, id: node.id }), {
            ...node,
            location_type: node.type,
            is_active: newStatus,
            status: newStatus ? 'active' : 'inactive'
        }, {
            onSuccess: () => toast.success(`${node.name} status updated to ${newStatus ? 'Active' : 'Inactive'}`),
            onError: () => toast.error("Failed to update status")
        });
    };

    // View Details Drawer
    const handleViewDetails = (node: LocationNode) => {
        setDrawerNode(node);
        setIsDrawerOpen(true);
    };

    // Select search item
    const handleSelectSearchResult = (item: SearchResultItem) => {
        setShowSearchDropdown(false);
        setSearchQuery('');
        
        // If in List view, open details
        if (viewMode === 'list') {
            handleViewDetails({
                id: item.id,
                name: item.name,
                type: item.type,
                code: item.code,
                is_active: item.is_active
            });
            return;
        }

        // In Tree View: set selection path
        const rootCountry = countries.find(c => c.id === item.path_ids.country);
        if (rootCountry) {
            setSelectedPath({ country: { ...rootCountry, type: 'country' } });
        }
        toast.info(`Navigated to ${item.name}`);
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-background selection:bg-emerald-500/30">
                <Head title="Location Management System" />
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="relative min-h-screen bg-transparent">
                    {/* Background Subtle Gradient */}
                    <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-emerald-600/5 to-transparent pointer-events-none" />

                    <div className="relative p-6 md:p-10 max-w-[1720px] mx-auto space-y-8">

                        {/* Page Header */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-1.5 w-6 bg-emerald-600 rounded-full" />
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Settings & Intelligence</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black text-text-primary tracking-tighter uppercase italic">
                                    Location <span className="text-emerald-600">Management</span>
                                </h1>
                                <p className="text-xs font-semibold text-text-muted mt-1">
                                    Unified geographical hierarchy framework for Country, State, City, Area, and Sub Area nodes.
                                </p>
                            </div>

                            {/* Stat Pill Bar */}
                            <div className="grid grid-cols-5 gap-2 p-2 bg-surface-1/80 backdrop-blur-md border border-border/30 rounded-2xl shadow-sm">
                                <div className="px-3 py-1.5 border-r border-border/20 text-center">
                                    <span className="text-[9px] font-black uppercase text-text-muted tracking-widest block">Countries</span>
                                    <span className="text-sm font-black text-emerald-600">{stats?.countries || countries.length}</span>
                                </div>
                                <div className="px-3 py-1.5 border-r border-border/20 text-center">
                                    <span className="text-[9px] font-black uppercase text-text-muted tracking-widest block">States</span>
                                    <span className="text-sm font-black text-blue-600">{stats?.states || 0}</span>
                                </div>
                                <div className="px-3 py-1.5 border-r border-border/20 text-center">
                                    <span className="text-[9px] font-black uppercase text-text-muted tracking-widest block">Cities</span>
                                    <span className="text-sm font-black text-indigo-600">{stats?.cities || 0}</span>
                                </div>
                                <div className="px-3 py-1.5 border-r border-border/20 text-center">
                                    <span className="text-[9px] font-black uppercase text-text-muted tracking-widest block">Areas</span>
                                    <span className="text-sm font-black text-amber-600">{stats?.areas || 0}</span>
                                </div>
                                <div className="px-3 py-1.5 text-center">
                                    <span className="text-[9px] font-black uppercase text-text-muted tracking-widest block">Sub Areas</span>
                                    <span className="text-sm font-black text-rose-600">{stats?.subareas || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Control Toolbar */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-2 bg-surface-1/90 border border-border/30 rounded-2xl shadow-md backdrop-blur-xl">
                            
                            {/* Global Search Bar */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40" />
                                <Input 
                                    placeholder="SEARCH LOCATIONS (E.G. GULBERG, LAHORE)..."
                                    value={searchQuery}
                                    onChange={handleSearchInput}
                                    onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
                                    className="pl-10 h-11 text-xs font-bold uppercase tracking-wider bg-surface-0 border-border/20 rounded-xl focus-visible:ring-emerald-600/20"
                                />

                                {/* Search Dropdown Menu */}
                                {showSearchDropdown && (
                                    <div className="absolute left-0 right-0 top-13 bg-surface-1 border border-border/40 shadow-2xl rounded-2xl z-[150] overflow-hidden max-h-[320px] overflow-y-auto">
                                        {isSearching ? (
                                            <div className="p-4 text-center text-xs font-bold text-text-muted">Searching hierarchy...</div>
                                        ) : searchResults.length === 0 ? (
                                            <div className="p-4 text-center text-xs font-bold text-text-muted">No matching locations found.</div>
                                        ) : (
                                            searchResults.map((item, idx) => (
                                                <button
                                                    key={`${item.type}-${item.id}-${idx}`}
                                                    onClick={() => handleSelectSearchResult(item)}
                                                    className="w-full px-4 py-3 text-left hover:bg-emerald-600/10 transition-colors flex items-center justify-between border-b border-border/10 last:border-none group cursor-pointer"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black uppercase text-text-primary group-hover:text-emerald-600">
                                                            {item.name}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-text-muted">
                                                            {item.path.join(' → ')}
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-surface-0 border-border/30 tracking-widest text-text-muted">
                                                        {item.type}
                                                    </span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* View Switcher & Add Button */}
                            <div className="flex items-center gap-3">
                                {/* View Toggle Buttons */}
                                <div className="flex items-center p-1 bg-surface-0 border border-border/20 rounded-xl">
                                    <button
                                        onClick={() => setViewMode('tree')}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                            viewMode === 'tree' ? "bg-emerald-600 text-white shadow-sm" : "text-text-muted hover:text-text-primary"
                                        )}
                                    >
                                        <Layers className="h-3.5 w-3.5" /> Tree View
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                            viewMode === 'list' ? "bg-emerald-600 text-white shadow-sm" : "text-text-muted hover:text-text-primary"
                                        )}
                                    >
                                        <ListFilter className="h-3.5 w-3.5" /> List View
                                    </button>
                                </div>

                                {/* Primary Add Button */}
                                <Button 
                                    onClick={() => {
                                        setEditingNode(null);
                                        setModalType('country');
                                        setModalParent({});
                                        setIsModalOpen(true);
                                    }}
                                    className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" /> Add Location
                                </Button>
                            </div>
                        </div>

                        {/* Interactive Breadcrumb Trail */}
                        {viewMode === 'tree' && (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-1/60 border border-border/20 rounded-xl text-xs font-bold text-text-muted overflow-x-auto scrollbar-none">
                                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/60">Hierarchy Path:</span>
                                <button onClick={() => setSelectedPath({})} className="hover:text-emerald-600 font-bold uppercase cursor-pointer">
                                    Locations
                                </button>

                                {selectedPath.country && (
                                    <>
                                        <ChevronRight className="h-3.5 w-3.5 text-text-muted/40 shrink-0" />
                                        <button 
                                            onClick={() => setSelectedPath({ country: selectedPath.country })} 
                                            className={cn("font-bold uppercase cursor-pointer", !selectedPath.state ? "text-emerald-600 font-black" : "hover:text-emerald-600")}
                                        >
                                            {selectedPath.country.name}
                                        </button>
                                    </>
                                )}

                                {selectedPath.state && (
                                    <>
                                        <ChevronRight className="h-3.5 w-3.5 text-text-muted/40 shrink-0" />
                                        <button 
                                            onClick={() => setSelectedPath({ country: selectedPath.country, state: selectedPath.state })} 
                                            className={cn("font-bold uppercase cursor-pointer", !selectedPath.city ? "text-blue-600 font-black" : "hover:text-blue-600")}
                                        >
                                            {selectedPath.state.name}
                                        </button>
                                    </>
                                )}

                                {selectedPath.city && (
                                    <>
                                        <ChevronRight className="h-3.5 w-3.5 text-text-muted/40 shrink-0" />
                                        <button 
                                            onClick={() => setSelectedPath({ country: selectedPath.country, state: selectedPath.state, city: selectedPath.city })} 
                                            className={cn("font-bold uppercase cursor-pointer", !selectedPath.area ? "text-indigo-600 font-black" : "hover:text-indigo-600")}
                                        >
                                            {selectedPath.city.name}
                                        </button>
                                    </>
                                )}

                                {selectedPath.area && (
                                    <>
                                        <ChevronRight className="h-3.5 w-3.5 text-text-muted/40 shrink-0" />
                                        <button 
                                            onClick={() => setSelectedPath(prev => ({ ...prev, subarea: null }))} 
                                            className={cn("font-bold uppercase cursor-pointer", !selectedPath.subarea ? "text-amber-600 font-black" : "hover:text-amber-600")}
                                        >
                                            {selectedPath.area.name}
                                        </button>
                                    </>
                                )}

                                {selectedPath.subarea && (
                                    <>
                                        <ChevronRight className="h-3.5 w-3.5 text-text-muted/40 shrink-0" />
                                        <span className="text-rose-600 font-black uppercase">
                                            {selectedPath.subarea.name}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* View Workspace */}
                        {viewMode === 'tree' ? (
                            <LocationTreeView 
                                rootCountries={countries}
                                selectedPath={selectedPath}
                                onSelectNode={handleSelectNode}
                                onAddChild={handleAddChild}
                                onEdit={handleEditNode}
                                onDelete={handleDeletePrompt}
                                onToggleStatus={handleToggleStatus}
                                onViewDetails={handleViewDetails}
                            />
                        ) : (
                            <LocationListView 
                                rootCountries={countries}
                                onEdit={handleEditNode}
                                onDelete={handleDeletePrompt}
                                onToggleStatus={handleToggleStatus}
                                onViewDetails={handleViewDetails}
                            />
                        )}

                    </div>
                </div>

                {/* Create/Edit Modal */}
                <LocationFormModal 
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    initialType={modalType}
                    initialParent={modalParent}
                    editNode={editingNode}
                    rootCountries={countries}
                />

                {/* Detail Inspection Drawer */}
                <LocationDetailDrawer 
                    open={isDrawerOpen}
                    onOpenChange={setIsDrawerOpen}
                    node={drawerNode}
                    parentPathStr={drawerNode ? [selectedPath.country?.name, selectedPath.state?.name, selectedPath.city?.name, selectedPath.area?.name].filter(Boolean).join(' → ') : undefined}
                    onEdit={handleEditNode}
                    onDelete={handleDeletePrompt}
                    onToggleStatus={handleToggleStatus}
                    onAddChild={handleAddChild}
                />

                {/* Delete Safeguard Dialog */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent className="bg-surface-1 border-border/40 max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black uppercase tracking-tight text-text-primary flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-rose-500" /> Confirm Deletion
                            </DialogTitle>
                            <DialogDescription className="text-xs text-text-muted">
                                Are you sure you want to delete <span className="font-black text-text-primary uppercase">{nodeToDelete?.name}</span> ({nodeToDelete?.type})?
                                <br /><br />
                                Deleting this node will remove it from the system. If this location contains active child nodes or is referenced in operational records, deletion will be safely blocked.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/10">
                            <Button 
                                variant="ghost" 
                                onClick={() => setIsDeleteOpen(false)}
                                className="h-9 text-xs font-black uppercase tracking-wider"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={confirmDelete} 
                                className="h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-rose-600/20"
                            >
                                Delete Node
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

            </SidebarInset>
        </SidebarProvider>
    );
}
