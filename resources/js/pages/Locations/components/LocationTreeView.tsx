import React, { useState, useEffect } from 'react';
import { LocationNode, LocationType } from '../types';
import { LocationCard } from './LocationCard';
import { cn } from '@/lib/utils';
import { Search, Plus, Globe, Landmark, Building2, MapPin, Compass, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';

declare const route: any;

interface SelectedPathState {
    country?: LocationNode | null;
    state?: LocationNode | null;
    city?: LocationNode | null;
    area?: LocationNode | null;
    subarea?: LocationNode | null;
}

interface LocationTreeViewProps {
    rootCountries: LocationNode[];
    selectedPath: SelectedPathState;
    onSelectNode: (node: LocationNode, level: LocationType) => void;
    onAddChild: (parentType: LocationType, parentNode: LocationNode) => void;
    onEdit: (node: LocationNode) => void;
    onDelete: (node: LocationNode) => void;
    onToggleStatus: (node: LocationNode) => void;
    onViewDetails: (node: LocationNode) => void;
}

export const LocationTreeView: React.FC<LocationTreeViewProps> = ({
    rootCountries,
    selectedPath,
    onSelectNode,
    onAddChild,
    onEdit,
    onDelete,
    onToggleStatus,
    onViewDetails,
}) => {
    // Column states
    const [states, setStates] = useState<LocationNode[]>([]);
    const [cities, setCities] = useState<LocationNode[]>([]);
    const [areas, setAreas] = useState<LocationNode[]>([]);
    const [subareas, setSubareas] = useState<LocationNode[]>([]);

    // Loading states for each column level
    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingAreas, setLoadingAreas] = useState(false);
    const [loadingSubareas, setLoadingSubareas] = useState(false);

    // Filter query per column
    const [searchCountry, setSearchCountry] = useState('');
    const [searchState, setSearchState] = useState('');
    const [searchCity, setSearchCity] = useState('');
    const [searchArea, setSearchArea] = useState('');
    const [searchSubarea, setSearchSubarea] = useState('');

    // Fetch States when Selected Country changes
    useEffect(() => {
        if (!selectedPath.country) {
            setStates([]);
            setCities([]);
            setAreas([]);
            setSubareas([]);
            return;
        }

        setLoadingStates(true);
        axios.get(route('locations.children'), {
            params: { type: 'country', id: selectedPath.country.id }
        })
        .then(res => {
            setStates((res.data || []).map((item: any) => ({ ...item, type: 'state' })));
        })
        .catch(err => console.error("Failed to load states", err))
        .finally(() => setLoadingStates(false));
    }, [selectedPath.country?.id]);

    // Fetch Cities when Selected State changes
    useEffect(() => {
        if (!selectedPath.state) {
            setCities([]);
            setAreas([]);
            setSubareas([]);
            return;
        }

        setLoadingCities(true);
        axios.get(route('locations.children'), {
            params: { type: 'state', id: selectedPath.state.id }
        })
        .then(res => {
            setCities((res.data || []).map((item: any) => ({ ...item, type: 'city' })));
        })
        .catch(err => console.error("Failed to load cities", err))
        .finally(() => setLoadingCities(false));
    }, [selectedPath.state?.id]);

    // Fetch Areas when Selected City changes
    useEffect(() => {
        if (!selectedPath.city) {
            setAreas([]);
            setSubareas([]);
            return;
        }

        setLoadingAreas(true);
        axios.get(route('locations.children'), {
            params: { type: 'city', id: selectedPath.city.id }
        })
        .then(res => {
            setAreas((res.data || []).map((item: any) => ({ ...item, type: 'area' })));
        })
        .catch(err => console.error("Failed to load areas", err))
        .finally(() => setLoadingAreas(false));
    }, [selectedPath.city?.id]);

    // Fetch Subareas when Selected Area changes
    useEffect(() => {
        if (!selectedPath.area) {
            setSubareas([]);
            return;
        }

        setLoadingSubareas(true);
        axios.get(route('locations.children'), {
            params: { type: 'area', id: selectedPath.area.id }
        })
        .then(res => {
            setSubareas((res.data || []).map((item: any) => ({ ...item, type: 'subarea' })));
        })
        .catch(err => console.error("Failed to load subareas", err))
        .finally(() => setLoadingSubareas(false));
    }, [selectedPath.area?.id]);

    // Column filtering helper
    const filterNodes = (nodes: LocationNode[], query: string) => {
        if (!query.trim()) return nodes;
        const q = query.toLowerCase();
        return nodes.filter(n => 
            n.name.toLowerCase().includes(q) || 
            (n.code && n.code.toLowerCase().includes(q))
        );
    };

    const filteredCountries = filterNodes(rootCountries, searchCountry);
    const filteredStates = filterNodes(states, searchState);
    const filteredCities = filterNodes(cities, searchCity);
    const filteredAreas = filterNodes(areas, searchArea);
    const filteredSubareas = filterNodes(subareas, searchSubarea);

    return (
        <div className="relative w-full overflow-x-auto pb-6 pt-2 scrollbar-thin scrollbar-thumb-emerald-600/20">
            <div className="flex items-start gap-6 min-w-max px-2">

                {/* Column 1: Countries */}
                <div className="flex flex-col w-[300px] shrink-0 bg-surface-0/40 p-3 rounded-2xl border border-border/20">
                    <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-border/10">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <Globe className="h-3.5 w-3.5 text-emerald-600" />
                            </div>
                            <h3 className="text-xs font-black text-text-primary uppercase tracking-widest">
                                Countries <span className="text-text-muted font-bold">({rootCountries.length})</span>
                            </h3>
                        </div>
                    </div>

                    <div className="relative mb-3">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted/40" />
                        <Input 
                            placeholder="Filter countries..." 
                            value={searchCountry}
                            onChange={(e) => setSearchCountry(e.target.value)}
                            className="h-8 pl-8 text-[11px] bg-surface-1 border-border/20 focus-visible:ring-emerald-600/20 rounded-lg uppercase font-semibold"
                        />
                    </div>

                    <div className="space-y-2.5 max-h-[68vh] overflow-y-auto custom-scrollbar pr-1">
                        {filteredCountries.map(c => (
                            <LocationCard 
                                key={`c-${c.id}`}
                                node={{ ...c, type: 'country' }}
                                isSelected={selectedPath.country?.id === c.id}
                                onSelect={() => onSelectNode({ ...c, type: 'country' }, 'country')}
                                onAddChild={() => onAddChild('country', { ...c, type: 'country' })}
                                onEdit={() => onEdit({ ...c, type: 'country' })}
                                onDelete={() => onDelete({ ...c, type: 'country' })}
                                onToggleStatus={() => onToggleStatus({ ...c, type: 'country' })}
                                onViewDetails={() => onViewDetails({ ...c, type: 'country' })}
                            />
                        ))}
                    </div>
                </div>

                {/* Column 2: States / Provinces */}
                {selectedPath.country && (
                    <div className="flex flex-col w-[300px] shrink-0 bg-surface-0/40 p-3 rounded-2xl border border-border/20 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-border/10">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-md bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <Landmark className="h-3.5 w-3.5 text-blue-600" />
                                </div>
                                <h3 className="text-xs font-black text-text-primary uppercase tracking-widest truncate max-w-[170px]">
                                    States <span className="text-text-muted font-bold">({states.length})</span>
                                </h3>
                            </div>
                            <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => onAddChild('country', selectedPath.country!)}
                                className="h-6 px-2 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-500/10 gap-1"
                            >
                                <Plus className="h-3 w-3" /> Add
                            </Button>
                        </div>

                        <div className="relative mb-3">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted/40" />
                            <Input 
                                placeholder="Filter states..." 
                                value={searchState}
                                onChange={(e) => setSearchState(e.target.value)}
                                className="h-8 pl-8 text-[11px] bg-surface-1 border-border/20 focus-visible:ring-blue-600/20 rounded-lg uppercase font-semibold"
                            />
                        </div>

                        <div className="space-y-2.5 max-h-[68vh] overflow-y-auto custom-scrollbar pr-1">
                            {loadingStates ? (
                                <div className="p-8 text-center text-text-muted flex flex-col items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Loading States...</span>
                                </div>
                            ) : filteredStates.length === 0 ? (
                                <div className="p-6 border border-dashed border-border/30 rounded-xl text-center flex flex-col items-center gap-3">
                                    <span className="text-[11px] font-bold text-text-muted">No States Found</span>
                                    <Button 
                                        size="sm" 
                                        onClick={() => onAddChild('country', selectedPath.country!)}
                                        className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider gap-1.5"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add State
                                    </Button>
                                </div>
                            ) : (
                                filteredStates.map(s => (
                                    <LocationCard 
                                        key={`s-${s.id}`}
                                        node={s}
                                        isSelected={selectedPath.state?.id === s.id}
                                        onSelect={() => onSelectNode(s, 'state')}
                                        onAddChild={() => onAddChild('state', s)}
                                        onEdit={() => onEdit(s)}
                                        onDelete={() => onDelete(s)}
                                        onToggleStatus={() => onToggleStatus(s)}
                                        onViewDetails={() => onViewDetails(s)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Column 3: Cities */}
                {selectedPath.state && (
                    <div className="flex flex-col w-[300px] shrink-0 bg-surface-0/40 p-3 rounded-2xl border border-border/20 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-border/10">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-md bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                    <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                                </div>
                                <h3 className="text-xs font-black text-text-primary uppercase tracking-widest truncate max-w-[170px]">
                                    Cities <span className="text-text-muted font-bold">({cities.length})</span>
                                </h3>
                            </div>
                            <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => onAddChild('state', selectedPath.state!)}
                                className="h-6 px-2 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-500/10 gap-1"
                            >
                                <Plus className="h-3 w-3" /> Add
                            </Button>
                        </div>

                        <div className="relative mb-3">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted/40" />
                            <Input 
                                placeholder="Filter cities..." 
                                value={searchCity}
                                onChange={(e) => setSearchCity(e.target.value)}
                                className="h-8 pl-8 text-[11px] bg-surface-1 border-border/20 focus-visible:ring-indigo-600/20 rounded-lg uppercase font-semibold"
                            />
                        </div>

                        <div className="space-y-2.5 max-h-[68vh] overflow-y-auto custom-scrollbar pr-1">
                            {loadingCities ? (
                                <div className="p-8 text-center text-text-muted flex flex-col items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Loading Cities...</span>
                                </div>
                            ) : filteredCities.length === 0 ? (
                                <div className="p-6 border border-dashed border-border/30 rounded-xl text-center flex flex-col items-center gap-3">
                                    <span className="text-[11px] font-bold text-text-muted">No Cities Found</span>
                                    <Button 
                                        size="sm" 
                                        onClick={() => onAddChild('state', selectedPath.state!)}
                                        className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider gap-1.5"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add City
                                    </Button>
                                </div>
                            ) : (
                                filteredCities.map(c => (
                                    <LocationCard 
                                        key={`city-${c.id}`}
                                        node={c}
                                        isSelected={selectedPath.city?.id === c.id}
                                        onSelect={() => onSelectNode(c, 'city')}
                                        onAddChild={() => onAddChild('city', c)}
                                        onEdit={() => onEdit(c)}
                                        onDelete={() => onDelete(c)}
                                        onToggleStatus={() => onToggleStatus(c)}
                                        onViewDetails={() => onViewDetails(c)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Column 4: Areas */}
                {selectedPath.city && (
                    <div className="flex flex-col w-[300px] shrink-0 bg-surface-0/40 p-3 rounded-2xl border border-border/20 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-border/10">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-md bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                    <MapPin className="h-3.5 w-3.5 text-amber-600" />
                                </div>
                                <h3 className="text-xs font-black text-text-primary uppercase tracking-widest truncate max-w-[170px]">
                                    Areas <span className="text-text-muted font-bold">({areas.length})</span>
                                </h3>
                            </div>
                            <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => onAddChild('city', selectedPath.city!)}
                                className="h-6 px-2 text-[10px] font-black uppercase text-amber-600 hover:bg-amber-500/10 gap-1"
                            >
                                <Plus className="h-3 w-3" /> Add
                            </Button>
                        </div>

                        <div className="relative mb-3">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted/40" />
                            <Input 
                                placeholder="Filter areas..." 
                                value={searchArea}
                                onChange={(e) => setSearchArea(e.target.value)}
                                className="h-8 pl-8 text-[11px] bg-surface-1 border-border/20 focus-visible:ring-amber-600/20 rounded-lg uppercase font-semibold"
                            />
                        </div>

                        <div className="space-y-2.5 max-h-[68vh] overflow-y-auto custom-scrollbar pr-1">
                            {loadingAreas ? (
                                <div className="p-8 text-center text-text-muted flex flex-col items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Loading Areas...</span>
                                </div>
                            ) : filteredAreas.length === 0 ? (
                                <div className="p-6 border border-dashed border-border/30 rounded-xl text-center flex flex-col items-center gap-3">
                                    <span className="text-[11px] font-bold text-text-muted">No Areas Found</span>
                                    <Button 
                                        size="sm" 
                                        onClick={() => onAddChild('city', selectedPath.city!)}
                                        className="h-8 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-wider gap-1.5"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add Area
                                    </Button>
                                </div>
                            ) : (
                                filteredAreas.map(a => (
                                    <LocationCard 
                                        key={`area-${a.id}`}
                                        node={a}
                                        isSelected={selectedPath.area?.id === a.id}
                                        onSelect={() => onSelectNode(a, 'area')}
                                        onAddChild={() => onAddChild('area', a)}
                                        onEdit={() => onEdit(a)}
                                        onDelete={() => onDelete(a)}
                                        onToggleStatus={() => onToggleStatus(a)}
                                        onViewDetails={() => onViewDetails(a)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Column 5: Sub Areas */}
                {selectedPath.area && (
                    <div className="flex flex-col w-[300px] shrink-0 bg-surface-0/40 p-3 rounded-2xl border border-border/20 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-border/10">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-md bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                    <Compass className="h-3.5 w-3.5 text-rose-600" />
                                </div>
                                <h3 className="text-xs font-black text-text-primary uppercase tracking-widest truncate max-w-[170px]">
                                    Sub Areas <span className="text-text-muted font-bold">({subareas.length})</span>
                                </h3>
                            </div>
                            <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => onAddChild('area', selectedPath.area!)}
                                className="h-6 px-2 text-[10px] font-black uppercase text-rose-600 hover:bg-rose-500/10 gap-1"
                            >
                                <Plus className="h-3 w-3" /> Add
                            </Button>
                        </div>

                        <div className="relative mb-3">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted/40" />
                            <Input 
                                placeholder="Filter sub areas..." 
                                value={searchSubarea}
                                onChange={(e) => setSearchSubarea(e.target.value)}
                                className="h-8 pl-8 text-[11px] bg-surface-1 border-border/20 focus-visible:ring-rose-600/20 rounded-lg uppercase font-semibold"
                            />
                        </div>

                        <div className="space-y-2.5 max-h-[68vh] overflow-y-auto custom-scrollbar pr-1">
                            {loadingSubareas ? (
                                <div className="p-8 text-center text-text-muted flex flex-col items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin text-rose-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Loading Sub Areas...</span>
                                </div>
                            ) : filteredSubareas.length === 0 ? (
                                <div className="p-6 border border-dashed border-border/30 rounded-xl text-center flex flex-col items-center gap-3">
                                    <span className="text-[11px] font-bold text-text-muted">No Sub Areas Found</span>
                                    <Button 
                                        size="sm" 
                                        onClick={() => onAddChild('area', selectedPath.area!)}
                                        className="h-8 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider gap-1.5"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add Sub Area
                                    </Button>
                                </div>
                            ) : (
                                filteredSubareas.map(sa => (
                                    <LocationCard 
                                        key={`sa-${sa.id}`}
                                        node={sa}
                                        isSelected={selectedPath.subarea?.id === sa.id}
                                        onSelect={() => onSelectNode(sa, 'subarea')}
                                        onEdit={() => onEdit(sa)}
                                        onDelete={() => onDelete(sa)}
                                        onToggleStatus={() => onToggleStatus(sa)}
                                        onViewDetails={() => onViewDetails(sa)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
