import React, { useState, useEffect } from 'react';
import { LocationNode, LocationType } from '../types';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Globe, Landmark, Building2, MapPin, Compass, Loader2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import axios from 'axios';

declare const route: any;

interface LocationFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialType?: LocationType;
    initialParent?: {
        countryId?: number;
        provinceId?: number;
        cityId?: number;
        areaId?: number;
    };
    editNode?: LocationNode | null;
    rootCountries: LocationNode[];
}

export const LocationFormModal: React.FC<LocationFormModalProps> = ({
    open,
    onOpenChange,
    initialType = 'country',
    initialParent = {},
    editNode = null,
    rootCountries,
}) => {
    const isEdit = !!editNode;

    const [locationType, setLocationType] = useState<LocationType>(initialType);

    // Parent Selection States
    const [countryId, setCountryId] = useState<string>('');
    const [provinceId, setProvinceId] = useState<string>('');
    const [cityId, setCityId] = useState<string>('');
    const [areaId, setAreaId] = useState<string>('');

    // Form fields
    const [name, setName] = useState<string>('');
    const [code, setCode] = useState<string>('');
    const [phoneCode, setPhoneCode] = useState<string>('');
    const [currency, setCurrency] = useState<string>('');
    const [isActive, setIsActive] = useState<boolean>(true);

    // Dynamic Options for Cascading Dropdowns
    const [statesList, setStatesList] = useState<{ id: number; name: string }[]>([]);
    const [citiesList, setCitiesList] = useState<{ id: number; name: string }[]>([]);
    const [areasList, setAreasList] = useState<{ id: number; name: string }[]>([]);

    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingAreas, setLoadingAreas] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Reset/Populate form on Open / editNode change
    useEffect(() => {
        if (!open) return;

        if (editNode) {
            setLocationType(editNode.type);
            setName(editNode.name || '');
            setCode(editNode.code || '');
            setPhoneCode(editNode.phone_code || '');
            setCurrency(editNode.currency || '');
            setIsActive(editNode.is_active ?? true);

            setCountryId(editNode.country_id?.toString() || '');
            setProvinceId(editNode.province_id?.toString() || '');
            setCityId(editNode.city_id?.toString() || '');
            setAreaId(editNode.area_id?.toString() || '');
        } else {
            setLocationType(initialType);
            setName('');
            setCode('');
            setPhoneCode('');
            setCurrency('');
            setIsActive(true);

            setCountryId(initialParent.countryId?.toString() || '');
            setProvinceId(initialParent.provinceId?.toString() || '');
            setCityId(initialParent.cityId?.toString() || '');
            setAreaId(initialParent.areaId?.toString() || '');
        }
    }, [open, editNode, initialType, initialParent]);

    // Fetch States when Country selection changes
    useEffect(() => {
        if (!countryId) {
            setStatesList([]);
            return;
        }
        setLoadingStates(true);
        axios.get(route('locations.children'), { params: { type: 'country', id: countryId } })
            .then(res => setStatesList(res.data || []))
            .finally(() => setLoadingStates(false));
    }, [countryId]);

    // Fetch Cities when Province/State selection changes
    useEffect(() => {
        if (!provinceId) {
            setCitiesList([]);
            return;
        }
        setLoadingCities(true);
        axios.get(route('locations.children'), { params: { type: 'state', id: provinceId } })
            .then(res => setCitiesList(res.data || []))
            .finally(() => setLoadingCities(false));
    }, [provinceId]);

    // Fetch Areas when City selection changes
    useEffect(() => {
        if (!cityId) {
            setAreasList([]);
            return;
        }
        setLoadingAreas(true);
        axios.get(route('locations.children'), { params: { type: 'city', id: cityId } })
            .then(res => setAreasList(res.data || []))
            .finally(() => setLoadingAreas(false));
    }, [cityId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const payload: any = {
            location_type: locationType,
            name,
            code,
            is_active: isActive,
            status: isActive ? 'active' : 'inactive',
        };

        if (locationType === 'country') {
            payload.phone_code = phoneCode;
            payload.currency = currency;
        } else if (locationType === 'state') {
            payload.country_id = countryId;
        } else if (locationType === 'city') {
            payload.country_id = countryId;
            payload.province_id = provinceId;
        } else if (locationType === 'area') {
            payload.country_id = countryId;
            payload.province_id = provinceId;
            payload.city_id = cityId;
        } else if (locationType === 'subarea') {
            payload.country_id = countryId;
            payload.province_id = provinceId;
            payload.city_id = cityId;
            payload.area_id = areaId;
        }

        if (isEdit && editNode) {
            router.put(route('locations.update', { type: editNode.type, id: editNode.id }), payload, {
                onSuccess: () => {
                    toast.success(`${ucFirst(locationType)} updated successfully`);
                    onOpenChange(false);
                    setSubmitting(false);
                },
                onError: (errs) => {
                    toast.error("Failed to update location");
                    setSubmitting(false);
                }
            });
        } else {
            router.post(route('locations.store'), payload, {
                onSuccess: () => {
                    toast.success(`${ucFirst(locationType)} created successfully`);
                    onOpenChange(false);
                    setSubmitting(false);
                },
                onError: (errs) => {
                    toast.error("Failed to create location. Check required fields.");
                    setSubmitting(false);
                }
            });
        }
    };

    const ucFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg bg-surface-1/95 backdrop-blur-xl border-border/40 p-0 overflow-hidden rounded-2xl shadow-2xl">
                <DialogHeader className="p-6 border-b border-border/10 bg-surface-1">
                    <DialogTitle className="text-lg font-black text-text-primary uppercase tracking-tighter italic flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        {isEdit ? 'Edit' : 'Add'} <span className="text-emerald-600">Location Node</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-text-muted">
                        Configure geographical hierarchy level and parent associations.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Location Type Selector */}
                    {!isEdit && (
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Location Type</Label>
                            <div className="grid grid-cols-5 gap-1.5 p-1 bg-surface-0 border border-border/20 rounded-xl">
                                {[
                                    { id: 'country', label: 'Country', icon: Globe },
                                    { id: 'state', label: 'State', icon: Landmark },
                                    { id: 'city', label: 'City', icon: Building2 },
                                    { id: 'area', label: 'Area', icon: MapPin },
                                    { id: 'subarea', label: 'Sub Area', icon: Compass },
                                ].map((t) => {
                                    const IconC = t.icon;
                                    const isSel = locationType === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setLocationType(t.id as LocationType)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                                                isSel ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30" : "text-text-muted hover:text-text-primary hover:bg-surface-1"
                                            )}
                                        >
                                            <IconC className="h-3.5 w-3.5 mb-1" />
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Dependent Dropdowns */}
                    {locationType !== 'country' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Select Country */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Country *</Label>
                                <Select value={countryId} onValueChange={setCountryId}>
                                    <SelectTrigger className="h-10 text-xs font-bold uppercase bg-surface-0 border-border/20 rounded-xl">
                                        <SelectValue placeholder="Select Country" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-surface-1 border-border/40 z-[110]">
                                        {rootCountries.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()} className="text-xs font-bold">
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Select State / Province */}
                            {(locationType === 'city' || locationType === 'area' || locationType === 'subarea') && (
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600">State / Province *</Label>
                                    <Select value={provinceId} onValueChange={setProvinceId} disabled={!countryId || loadingStates}>
                                        <SelectTrigger className="h-10 text-xs font-bold uppercase bg-surface-0 border-border/20 rounded-xl">
                                            <SelectValue placeholder={loadingStates ? "Loading..." : "Select State"} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-surface-1 border-border/40 z-[110]">
                                            {statesList.map(s => (
                                                <SelectItem key={s.id} value={s.id.toString()} className="text-xs font-bold">
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Select City */}
                            {(locationType === 'area' || locationType === 'subarea') && (
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-600">City *</Label>
                                    <Select value={cityId} onValueChange={setCityId} disabled={!provinceId || loadingCities}>
                                        <SelectTrigger className="h-10 text-xs font-bold uppercase bg-surface-0 border-border/20 rounded-xl">
                                            <SelectValue placeholder={loadingCities ? "Loading..." : "Select City"} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-surface-1 border-border/40 z-[110]">
                                            {citiesList.map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()} className="text-xs font-bold">
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Select Area */}
                            {locationType === 'subarea' && (
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-amber-600">Area *</Label>
                                    <Select value={areaId} onValueChange={setAreaId} disabled={!cityId || loadingAreas}>
                                        <SelectTrigger className="h-10 text-xs font-bold uppercase bg-surface-0 border-border/20 rounded-xl">
                                            <SelectValue placeholder={loadingAreas ? "Loading..." : "Select Area"} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-surface-1 border-border/40 z-[110]">
                                            {areasList.map(a => (
                                                <SelectItem key={a.id} value={a.id.toString()} className="text-xs font-bold">
                                                    {a.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                        </div>
                    )}

                    {/* Name & Code */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Name *</Label>
                            <Input 
                                placeholder="E.G. GULBERG, LAHORE..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="h-10 text-xs font-bold uppercase bg-surface-0 border-border/20 rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Code</Label>
                            <Input 
                                placeholder="E.G. LHR, GLB..."
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="h-10 text-xs font-mono font-bold uppercase bg-surface-0 border-border/20 rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Country-Specific Meta */}
                    {locationType === 'country' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Phone Code</Label>
                                <Input 
                                    placeholder="+92"
                                    value={phoneCode}
                                    onChange={(e) => setPhoneCode(e.target.value)}
                                    className="h-10 text-xs font-bold bg-surface-0 border-border/20 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Currency</Label>
                                <Input 
                                    placeholder="PKR, USD..."
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="h-10 text-xs font-bold uppercase bg-surface-0 border-border/20 rounded-xl"
                                />
                            </div>
                        </div>
                    )}

                    {/* Status Checkbox */}
                    <div className="flex items-center space-x-3 p-3 bg-surface-0/50 border border-border/20 rounded-xl">
                        <Checkbox 
                            id="is_active" 
                            checked={isActive}
                            onCheckedChange={(c) => setIsActive(!!c)}
                            className="h-4 w-4 rounded-md border-emerald-600/40 data-[state=checked]:bg-emerald-600"
                        />
                        <Label htmlFor="is_active" className="text-xs font-black uppercase tracking-wider text-text-primary cursor-pointer">
                            Active Status
                        </Label>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/10">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => onOpenChange(false)}
                            className="h-10 text-xs font-black uppercase tracking-wider"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={submitting}
                            className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                        >
                            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {isEdit ? 'Save Changes' : `Create ${ucFirst(locationType)}`}
                        </Button>
                    </div>

                </form>
            </DialogContent>
        </Dialog>
    );
};
