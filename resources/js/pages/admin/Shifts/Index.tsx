import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { BreadcrumbItem } from "@/types";
import {
    Pencil,
    Plus,
    Clock,
    AlertTriangle,
    Archive,
    Check,
    X,
    Users as UsersIcon,
    Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Link, router, useForm, Head } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Heading } from "@/components/ui/Heading";

interface Shift {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    break_duration_minutes: number;
    overtime_limit_minutes: number | null;
    color: string | null;
    is_active: boolean;
    deleted_at: string | null;
    users_count?: number;
}

interface Props {
    shifts: Shift[];
    filters: {
        show_archived: boolean;
    };
    flash: {
        success: string | null;
        error: string | null;
        warning: string | null;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Administration", href: "#" },
    { title: "Shifts", href: "/admin/shifts" },
];

const PREMIUM_ROUNDING = "rounded-xl";

// Preset colors for shift badges (strictly avoiding purple or violet)
const PRESET_COLORS = [
    "#3b82f6", // Blue
    "#06b6d4", // Cyan
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#f97316", // Orange
    "#ef4444", // Red
];

export default function ShiftsIndex({ shifts, filters, flash }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

    // Form for Create
    const createForm = useForm({
        name: "",
        start_time: "09:00",
        end_time: "17:00",
        break_duration_minutes: 30,
        limit_ot: false,
        overtime_limit_minutes: 60,
        color: "#3b82f6",
        is_active: true,
    });

    // Form for Edit
    const editForm = useForm({
        name: "",
        start_time: "",
        end_time: "",
        break_duration_minutes: 0,
        limit_ot: false,
        overtime_limit_minutes: 60,
        color: "#3b82f6",
        is_active: true,
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post("/admin/shifts", {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditOpen = (shift: Shift) => {
        setSelectedShift(shift);
        editForm.setData({
            name: shift.name,
            start_time: shift.start_time.substring(0, 5),
            end_time: shift.end_time.substring(0, 5),
            break_duration_minutes: shift.break_duration_minutes,
            limit_ot: shift.overtime_limit_minutes !== null,
            overtime_limit_minutes: shift.overtime_limit_minutes || 60,
            color: shift.color || "#3b82f6",
            is_active: shift.is_active,
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedShift) return;
        editForm.put(`/admin/shifts/${selectedShift.id}`, {
            onSuccess: () => {
                setIsEditOpen(false);
            },
        });
    };

    const handleArchiveClick = (shift: Shift) => {
        setSelectedShift(shift);
        setIsArchiveConfirmOpen(true);
    };

    const confirmArchive = () => {
        if (!selectedShift) return;
        router.delete(`/admin/shifts/${selectedShift.id}`, {
            onFinish: () => {
                setIsArchiveConfirmOpen(false);
            },
        });
    };

    const toggleShowArchived = () => {
        router.get(
            "/admin/shifts",
            { show_archived: !filters.show_archived ? 1 : 0 },
            { preserveState: true }
        );
    };

    const calculateDuration = (start: string, end: string, breakMins: number) => {
        if (!start || !end) return "---";
        const [startH, startM] = start.split(":").map(Number);
        const [endH, endM] = end.split(":").map(Number);

        let diffMins = (endH * 60 + endM) - (startH * 60 + startM);
        if (diffMins < 0) {
            // overnight shift
            diffMins += 24 * 60;
        }

        diffMins -= breakMins;
        if (diffMins <= 0) return "0h 0m";

        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        return `${h}h ${m}m`;
    };

    const formatTimeStr12h = (timeStr: string) => {
        if (!timeStr) return "---";
        const [hStr, mStr] = timeStr.split(":");
        let hours = parseInt(hStr, 10);
        const minutes = mStr;
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
    };

    return (
        <SidebarProvider>
            <Head title="Shift Management" />
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
                        {/* Header Section */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col md:flex-row md:items-end justify-between gap-4"
                        >
                            <Heading
                                title="Shift Management"
                                description="Define and assign work schedules to staff members"
                            />
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={toggleShowArchived}
                                    className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider h-11"
                                >
                                    {filters.show_archived ? "Hide Archived" : "Show Archived"}
                                </Button>
                                <Button
                                    onClick={() => setIsCreateOpen(true)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 h-11"
                                >
                                    <Plus className="mr-2 h-4 w-4" /> New Shift
                                </Button>
                            </div>
                        </motion.div>

                        {/* Flash Messages */}
                        {flash.warning && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle size={16} />
                                {flash.warning}
                            </div>
                        )}

                        {/* Table Listing */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className={cn(PREMIUM_ROUNDING, "overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl")}>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-400">Color</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-400">Shift Name</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-400">Timing</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-400">Net Duration</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-400">OT Limit</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-400 text-center">Assigned Staff</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-400 text-center">Status</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-400 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                            <AnimatePresence mode="popLayout">
                                                {shifts.map((shift, index) => (
                                                    <motion.tr
                                                        key={shift.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className={cn(
                                                            "group hover:bg-orange-500/[0.01] transition-colors",
                                                            shift.deleted_at && "opacity-60 bg-zinc-100/50 dark:bg-zinc-900/20"
                                                        )}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div
                                                                className="h-5 w-5 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm"
                                                                style={{ backgroundColor: shift.color || "#e4e4e7" }}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-xs">
                                                                {shift.name}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400">
                                                                <span>{formatTimeStr12h(shift.start_time)}</span>
                                                                <span className="opacity-40">→</span>
                                                                <span>{formatTimeStr12h(shift.end_time)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                                            {calculateDuration(shift.start_time, shift.end_time, shift.break_duration_minutes)}
                                                            <span className="text-[10px] font-normal text-zinc-400 block lowercase tracking-wider mt-0.5">
                                                                ({shift.break_duration_minutes}m break)
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {shift.overtime_limit_minutes ? (
                                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                                                    {Math.round(shift.overtime_limit_minutes / 60)}h max
                                                                </span>
                                                            ) : (
                                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                                    Unlimited
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 rounded-md border border-zinc-200 dark:border-zinc-700">
                                                                <UsersIcon size={10} />
                                                                {shift.users_count || 0} staff
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {shift.deleted_at ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-200 text-zinc-600 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                                                                    Archived
                                                                </span>
                                                            ) : shift.is_active ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                                    Active
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-400 border border-zinc-200">
                                                                    Inactive
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {!shift.deleted_at && (
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleEditOpen(shift)}
                                                                        className="h-8 w-8 rounded-lg hover:bg-orange-500/10 hover:text-orange-500"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleArchiveClick(shift)}
                                                                        className="h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-500"
                                                                    >
                                                                        <Archive className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>

                {/* Create Shift Modal Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="sm:max-w-[480px] rounded-2xl bg-white dark:bg-zinc-950 p-6 border-zinc-200 dark:border-zinc-800 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                                Create New Shift
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-400 uppercase font-mono tracking-wider">
                                Define shift timings and rule constraints
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateSubmit} className="space-y-5 mt-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="create-name" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Shift Name</Label>
                                <Input
                                    id="create-name"
                                    placeholder="e.g. MORNING SHIFT"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData("name", e.target.value)}
                                    className="rounded-xl border-zinc-200 dark:border-zinc-800"
                                />
                                {createForm.errors.name && (
                                    <p className="text-[9px] font-mono text-rose-500 uppercase font-bold">{createForm.errors.name}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="create-start" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Start Time</Label>
                                    <Input
                                        id="create-start"
                                        type="time"
                                        value={createForm.data.start_time}
                                        onChange={(e) => createForm.setData("start_time", e.target.value)}
                                        className="rounded-xl border-zinc-200 dark:border-zinc-800 font-mono"
                                    />
                                    {createForm.errors.start_time && (
                                        <p className="text-[9px] font-mono text-rose-500 uppercase font-bold">{createForm.errors.start_time}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="create-end" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">End Time</Label>
                                    <Input
                                        id="create-end"
                                        type="time"
                                        value={createForm.data.end_time}
                                        onChange={(e) => createForm.setData("end_time", e.target.value)}
                                        className="rounded-xl border-zinc-200 dark:border-zinc-800 font-mono"
                                    />
                                    {createForm.errors.end_time && (
                                        <p className="text-[9px] font-mono text-rose-500 uppercase font-bold">{createForm.errors.end_time}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create-break" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Break Duration (Minutes)</Label>
                                <Input
                                    id="create-break"
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={createForm.data.break_duration_minutes}
                                    onChange={(e) => createForm.setData("break_duration_minutes", parseInt(e.target.value) || 0)}
                                    className="rounded-xl border-zinc-200 dark:border-zinc-800"
                                />
                            </div>

                            <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <Label htmlFor="create-limit-ot" className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Limit Overtime</Label>
                                        <span className="text-[9px] text-zinc-400 font-mono">TOGGLE TO CAP ALLOWED OVERTIME HOURS</span>
                                    </div>
                                    <Switch
                                        id="create-limit-ot"
                                        checked={createForm.data.limit_ot}
                                        onCheckedChange={(checked) => createForm.setData("limit_ot", checked)}
                                    />
                                </div>

                                {createForm.data.limit_ot && (
                                    <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                        <Label htmlFor="create-ot-limit" className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono">Overtime Limit (Minutes)</Label>
                                        <Input
                                            id="create-ot-limit"
                                            type="number"
                                            min="1"
                                            max="480"
                                            value={createForm.data.overtime_limit_minutes}
                                            onChange={(e) => createForm.setData("overtime_limit_minutes", parseInt(e.target.value) || 0)}
                                            className="rounded-xl border-zinc-200 dark:border-zinc-800"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                    <Palette size={11} /> Badge Color
                                </Label>
                                <div className="flex items-center gap-2">
                                    {PRESET_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => createForm.setData("color", c)}
                                            className={cn(
                                                "h-6 w-6 rounded-full border transition-all relative flex items-center justify-center",
                                                createForm.data.color === c ? "border-zinc-900 scale-110" : "border-zinc-200"
                                            )}
                                            style={{ backgroundColor: c }}
                                        >
                                            {createForm.data.color === c && (
                                                <Check className="h-3 w-3 text-white" />
                                            )}
                                        </button>
                                    ))}
                                    <Input
                                        type="text"
                                        value={createForm.data.color}
                                        onChange={(e) => createForm.setData("color", e.target.value)}
                                        className="h-8 w-24 rounded-lg text-xs font-mono p-1 text-center"
                                        placeholder="#hex"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="rounded-xl font-bold text-xs uppercase tracking-wider h-11 border-zinc-200"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-11 px-6 shadow-md shadow-orange-500/10 transition-all uppercase text-xs tracking-wider"
                                >
                                    Save Shift
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Shift Modal Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[480px] rounded-2xl bg-white dark:bg-zinc-950 p-6 border-zinc-200 dark:border-zinc-800 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                                Edit Shift: {selectedShift?.name}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-400 uppercase font-mono tracking-wider">
                                Modify shift schedule constraints
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleEditSubmit} className="space-y-5 mt-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-name" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Shift Name</Label>
                                <Input
                                    id="edit-name"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData("name", e.target.value)}
                                    className="rounded-xl border-zinc-200 dark:border-zinc-800"
                                />
                                {editForm.errors.name && (
                                    <p className="text-[9px] font-mono text-rose-500 uppercase font-bold">{editForm.errors.name}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-start" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Start Time</Label>
                                    <Input
                                        id="edit-start"
                                        type="time"
                                        value={editForm.data.start_time}
                                        onChange={(e) => editForm.setData("start_time", e.target.value)}
                                        className="rounded-xl border-zinc-200 dark:border-zinc-800 font-mono"
                                    />
                                    {editForm.errors.start_time && (
                                        <p className="text-[9px] font-mono text-rose-500 uppercase font-bold">{editForm.errors.start_time}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-end" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">End Time</Label>
                                    <Input
                                        id="edit-end"
                                        type="time"
                                        value={editForm.data.end_time}
                                        onChange={(e) => editForm.setData("end_time", e.target.value)}
                                        className="rounded-xl border-zinc-200 dark:border-zinc-800 font-mono"
                                    />
                                    {editForm.errors.end_time && (
                                        <p className="text-[9px] font-mono text-rose-500 uppercase font-bold">{editForm.errors.end_time}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-break" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Break Duration (Minutes)</Label>
                                <Input
                                    id="edit-break"
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={editForm.data.break_duration_minutes}
                                    onChange={(e) => editForm.setData("break_duration_minutes", parseInt(e.target.value) || 0)}
                                    className="rounded-xl border-zinc-200 dark:border-zinc-800"
                                />
                            </div>

                            <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <Label htmlFor="edit-limit-ot" className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Limit Overtime</Label>
                                        <span className="text-[9px] text-zinc-400 font-mono">TOGGLE TO CAP ALLOWED OVERTIME HOURS</span>
                                    </div>
                                    <Switch
                                        id="edit-limit-ot"
                                        checked={editForm.data.limit_ot}
                                        onCheckedChange={(checked) => editForm.setData("limit_ot", checked)}
                                    />
                                </div>

                                {editForm.data.limit_ot && (
                                    <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                        <Label htmlFor="edit-ot-limit" className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono">Overtime Limit (Minutes)</Label>
                                        <Input
                                            id="edit-ot-limit"
                                            type="number"
                                            min="1"
                                            max="480"
                                            value={editForm.data.overtime_limit_minutes}
                                            onChange={(e) => editForm.setData("overtime_limit_minutes", parseInt(e.target.value) || 0)}
                                            className="rounded-xl border-zinc-200 dark:border-zinc-800"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                    <Palette size={11} /> Badge Color
                                </Label>
                                <div className="flex items-center gap-2">
                                    {PRESET_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => editForm.setData("color", c)}
                                            className={cn(
                                                "h-6 w-6 rounded-full border transition-all relative flex items-center justify-center",
                                                editForm.data.color === c ? "border-zinc-900 scale-110" : "border-zinc-200"
                                            )}
                                            style={{ backgroundColor: c }}
                                        >
                                            {editForm.data.color === c && (
                                                <Check className="h-3 w-3 text-white" />
                                            )}
                                        </button>
                                    ))}
                                    <Input
                                        type="text"
                                        value={editForm.data.color}
                                        onChange={(e) => editForm.setData("color", e.target.value)}
                                        className="h-8 w-24 rounded-lg text-xs font-mono p-1 text-center"
                                        placeholder="#hex"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <div className="flex flex-col">
                                    <Label htmlFor="edit-is-active" className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Is Active</Label>
                                    <span className="text-[9px] text-zinc-400 font-mono">STAFF CAN ONLY BE ASSIGNED ACTIVE SHIFTS</span>
                                </div>
                                <Switch
                                    id="edit-is-active"
                                    checked={editForm.data.is_active}
                                    onCheckedChange={(checked) => editForm.setData("is_active", checked)}
                                />
                            </div>

                            <DialogFooter className="mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditOpen(false)}
                                    className="rounded-xl font-bold text-xs uppercase tracking-wider h-11 border-zinc-200"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-11 px-6 shadow-md shadow-orange-500/10 transition-all uppercase text-xs tracking-wider"
                                >
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Archive Confirmation Dialog */}
                <Dialog open={isArchiveConfirmOpen} onOpenChange={setIsArchiveConfirmOpen}>
                    <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white dark:bg-zinc-950 p-6 border-zinc-200 dark:border-zinc-800 shadow-2xl">
                        <DialogHeader className="space-y-3">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                                <Archive className="h-6 w-6" />
                            </div>
                            <DialogTitle className="text-center text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                                Archive Shift
                            </DialogTitle>
                            <DialogDescription className="text-center text-xs text-zinc-500 dark:text-zinc-400 uppercase font-mono">
                                Are you sure you want to archive this shift?
                            </DialogDescription>
                        </DialogHeader>

                        {selectedShift && (selectedShift.users_count || 0) > 0 && (
                            <div className="my-4 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex gap-3 items-start">
                                <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                                <div className="text-left space-y-1">
                                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                                        Assigned Staff Warning
                                    </p>
                                    <p className="text-[10px] text-zinc-400 font-mono uppercase">
                                        This shift has {selectedShift.users_count} assigned staff members. It will be archived, not deleted. Staff records will be preserved but they will have no active shift.
                                    </p>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="grid grid-cols-2 gap-3 mt-4 sm:space-x-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsArchiveConfirmOpen(false)}
                                className="w-full h-11 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={confirmArchive}
                                className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                            >
                                Archive Shift
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </SidebarInset>
        </SidebarProvider>
    );
}
