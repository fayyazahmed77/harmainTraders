import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Globe, Filter, RotateCcw, Check, ChevronRight } from 'lucide-react';

interface LocationFilterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: {
        provinceId?: string;
        cityId?: string;
        areaId?: string;
        subareaId?: string;
    };
    onApply: (newLocationFilters: {
        provinceId: string;
        cityId: string;
        areaId: string;
        subareaId: string;
    }) => void;
    provinces: any[];
    cities: any[];
    areas: any[];
    subareas: any[];
}

export const LocationFilterDialog: React.FC<LocationFilterDialogProps> = ({
    open,
    onOpenChange,
    filters,
    onApply,
    provinces = [],
    cities = [],
    areas = [],
    subareas = [],
}) => {
    const [selectedProvince, setSelectedProvince] = useState<string>(filters.provinceId || 'ALL');
    const [selectedCity, setSelectedCity] = useState<string>(filters.cityId || 'ALL');
    const [selectedArea, setSelectedArea] = useState<string>(filters.areaId || 'ALL');
    const [selectedSubarea, setSelectedSubarea] = useState<string>(filters.subareaId || 'ALL');

    // Sync state when dialog opens or props update
    useEffect(() => {
        if (open) {
            setSelectedProvince(filters.provinceId || 'ALL');
            setSelectedCity(filters.cityId || 'ALL');
            setSelectedArea(filters.areaId || 'ALL');
            setSelectedSubarea(filters.subareaId || 'ALL');
        }
    }, [open, filters]);

    // Cascading City Options
    const filteredCities = React.useMemo(() => {
        if (selectedProvince === 'ALL') return cities;
        return cities.filter((c) => String(c.province_id) === String(selectedProvince));
    }, [cities, selectedProvince]);

    // Cascading Area Options
    const filteredAreas = React.useMemo(() => {
        if (selectedCity !== 'ALL') {
            return areas.filter((a) => String(a.city_id) === String(selectedCity));
        }
        if (selectedProvince !== 'ALL') {
            const validCityIds = new Set(filteredCities.map((c) => String(c.id)));
            return areas.filter((a) => validCityIds.has(String(a.city_id)) || String(a.province_id) === String(selectedProvince));
        }
        return areas;
    }, [areas, selectedCity, selectedProvince, filteredCities]);

    // Cascading Subarea Options
    const filteredSubareas = React.useMemo(() => {
        if (selectedArea !== 'ALL') {
            return subareas.filter((s) => String(s.area_id) === String(selectedArea));
        }
        if (selectedCity !== 'ALL') {
            const validAreaIds = new Set(filteredAreas.map((a) => String(a.id)));
            return subareas.filter((s) => validAreaIds.has(String(s.area_id)));
        }
        return subareas;
    }, [subareas, selectedArea, selectedCity, filteredAreas]);

    // Handlers
    const handleProvinceChange = (val: string) => {
        setSelectedProvince(val);
        setSelectedCity('ALL');
        setSelectedArea('ALL');
        setSelectedSubarea('ALL');
    };

    const handleCityChange = (val: string) => {
        setSelectedCity(val);
        setSelectedArea('ALL');
        setSelectedSubarea('ALL');
    };

    const handleAreaChange = (val: string) => {
        setSelectedArea(val);
        setSelectedSubarea('ALL');
    };

    const handleSubareaChange = (val: string) => {
        setSelectedSubarea(val);
    };

    const handleReset = () => {
        setSelectedProvince('ALL');
        setSelectedCity('ALL');
        setSelectedArea('ALL');
        setSelectedSubarea('ALL');
    };

    const handleSave = () => {
        onApply({
            provinceId: selectedProvince,
            cityId: selectedCity,
            areaId: selectedArea,
            subareaId: selectedSubarea,
        });
        onOpenChange(false);
    };

    // Breadcrumb title text
    const activeProvinceObj = provinces.find((p) => String(p.id) === selectedProvince);
    const activeCityObj = cities.find((c) => String(c.id) === selectedCity);
    const activeAreaObj = areas.find((a) => String(a.id) === selectedArea);
    const activeSubareaObj = subareas.find((s) => String(s.id) === selectedSubarea);

    const isFilterActive = selectedProvince !== 'ALL' || selectedCity !== 'ALL' || selectedArea !== 'ALL' || selectedSubarea !== 'ALL';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl bg-background/95 backdrop-blur-xl border border-border/40 shadow-2xl rounded-2xl p-6">
                <DialogHeader className="space-y-2 border-b border-border/20 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shadow-inner">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-black text-text-primary tracking-tight">
                                Geographic Location Filter
                            </DialogTitle>
                            <DialogDescription className="text-xs text-text-muted">
                                Filter Sales Analytics metrics, charts, and customer sales by region hierarchy.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Selected Hierarchy Breadcrumb */}
                {isFilterActive && (
                    <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs font-semibold text-emerald-600">
                        <Globe className="h-3.5 w-3.5 mr-1 shrink-0" />
                        <span>{activeProvinceObj ? activeProvinceObj.name : 'ALL Provinces'}</span>
                        {selectedCity !== 'ALL' && (
                            <>
                                <ChevronRight className="h-3 w-3 text-emerald-400" />
                                <span>{activeCityObj ? activeCityObj.name : 'ALL Cities'}</span>
                            </>
                        )}
                        {selectedArea !== 'ALL' && (
                            <>
                                <ChevronRight className="h-3 w-3 text-emerald-400" />
                                <span>{activeAreaObj ? activeAreaObj.name : 'ALL Areas'}</span>
                            </>
                        )}
                        {selectedSubarea !== 'ALL' && (
                            <>
                                <ChevronRight className="h-3 w-3 text-emerald-400" />
                                <span>{activeSubareaObj ? activeSubareaObj.name : 'ALL Subareas'}</span>
                            </>
                        )}
                    </div>
                )}

                {/* Cascading Filter Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                    {/* Province Selection */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                            Province / Region
                        </label>
                        <select
                            value={selectedProvince}
                            onChange={(e) => handleProvinceChange(e.target.value)}
                            className="w-full h-10 text-xs font-semibold bg-surface-0 border border-border/40 rounded-xl px-3 text-text-primary focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                        >
                            <option value="ALL">ALL Provinces</option>
                            {provinces.map((p: any) => (
                                <option key={p.id} value={p.id.toString()}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* City Selection */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                            City
                        </label>
                        <select
                            value={selectedCity}
                            onChange={(e) => handleCityChange(e.target.value)}
                            className="w-full h-10 text-xs font-semibold bg-surface-0 border border-border/40 rounded-xl px-3 text-text-primary focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                        >
                            <option value="ALL">ALL Cities</option>
                            {filteredCities.map((c: any) => (
                                <option key={c.id} value={c.id.toString()}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Area Selection */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                            Area
                        </label>
                        <select
                            value={selectedArea}
                            onChange={(e) => handleAreaChange(e.target.value)}
                            className="w-full h-10 text-xs font-semibold bg-surface-0 border border-border/40 rounded-xl px-3 text-text-primary focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                        >
                            <option value="ALL">ALL Areas</option>
                            {filteredAreas.map((a: any) => (
                                <option key={a.id} value={a.id.toString()}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subarea Selection */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                            Subarea / Market Sector
                        </label>
                        <select
                            value={selectedSubarea}
                            onChange={(e) => handleSubareaChange(e.target.value)}
                            className="w-full h-10 text-xs font-semibold bg-surface-0 border border-border/40 rounded-xl px-3 text-text-primary focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                        >
                            <option value="ALL">ALL Subareas</option>
                            {filteredSubareas.map((s: any) => (
                                <option key={s.id} value={s.id.toString()}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <DialogFooter className="flex flex-row items-center justify-between gap-3 border-t border-border/20 pt-4 mt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleReset}
                        className="h-9 px-3 text-xs font-bold text-text-muted hover:text-text-primary hover:bg-surface-1 rounded-xl"
                    >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        Reset Location
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="h-9 px-4 text-xs font-bold rounded-xl border-border/40 hover:bg-surface-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            className="h-9 px-5 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-600/20"
                        >
                            <Check className="h-4 w-4 mr-1.5" />
                            Apply Filter
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
