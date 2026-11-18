import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Head, router, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import {
    Trash2,
    Plus,
    Calendar as CalendarIcon,
    Save,
    AlertTriangle,
    Hash,
    Clock,
    MessageCircle,
    Printer,
    ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ItemRegistryDialog } from "../sales/components/ItemRegistryDialog";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Daily", href: "/sales" },
    { title: "Online Orders", href: "/online-orders" },
    { title: "Edit Order", href: "" },
];

const CARD_BASE = "bg-white dark:bg-card border border-zinc-200 dark:border-zinc-800 shadow-sm";
const ACCENT_GRADIENT = "bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600";

const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
};

const TechLabel = ({
    children,
    icon: Icon,
    label,
    className = "space-y-1.5 flex-1 min-w-0",
}: {
    children: React.ReactNode;
    icon?: any;
    label: string;
    className?: string;
}) => (
    <div className={className}>
        <div className="flex items-center gap-1.5 px-1">
            {Icon && <Icon size={11} className="text-orange-500 shrink-0" />}
            <span className="text-[10px] font-black uppercase text-zinc-700 dark:text-zinc-300 tracking-wider truncate">
                {label}
            </span>
        </div>
        {children}
    </div>
);

interface OrderItemRow {
    id: string | number;
    product_id: number;
    item_name: string;
    item_code: string;
    packing: number;        // packing size per carton
    qty_carton: number;     // Full
    qty_pcs: number;        // Pcs
    bonus_full: number;     // B.Full
    bonus_pcs: number;      // B.Pcs
    rate: number;
    disc_percent: number;
    available_stock_pcs: number;
}

interface Props {
    order: any;
    stockBalances: Record<number, any>;
    whatsappLink?: string | null;
    items?: any[];
}

export default function OnlineOrderEdit({ order, stockBalances, whatsappLink, items = [] }: Props) {
    // Top bar fields
    const [orderDate] = useState<string>(
        order.submitted_at ? order.submitted_at.split("T")[0] : new Date().toISOString().split("T")[0]
    );
    const [orderTime] = useState<string>(
        order.submitted_at
            ? new Date(order.submitted_at).toLocaleTimeString("en-PK", { hour12: false })
            : "12:00:00"
    );

    // Initial items mapping
    const initialRows: OrderItemRow[] = useMemo(() => {
        return (order.items || []).map((it: any) => {
            const product = it.item || it.product;
            const packing = Math.max(
                1,
                Number(it.packing_qty_snapshot || product?.packing_size || product?.packing || product?.packing_qty || 1)
            );
            const totalPcs = Number(it.total_pcs ?? it.quantity ?? 0);
            const qtyCarton =
                it.qty_carton !== undefined && it.qty_carton !== null
                    ? Number(it.qty_carton)
                    : Math.floor(totalPcs / packing);
            const qtyPcs =
                it.qty_pcs !== undefined && it.qty_pcs !== null
                    ? Number(it.qty_pcs)
                    : totalPcs % packing;
            const rate = Number(it.price_piece ?? it.unit_price ?? product?.trade_price ?? 0);

            const liveStockObj = stockBalances[it.product_id] ?? null;
            const liveStock = liveStockObj
                ? Number(liveStockObj.balance_pcs || 0)
                : (it.available_stock_pcs || 0);

            return {
                id: it.id || `row-${Math.random()}`,
                product_id: it.product_id,
                item_name: it.item_name_snapshot || it.item_name || product?.title || "Item",
                item_code: it.item_code_snapshot || product?.code || "",
                packing: packing,
                qty_carton: qtyCarton,
                qty_pcs: qtyPcs,
                bonus_full: Number(it.bonus_qty_carton || it.bonus_full || 0),
                bonus_pcs: Number(it.bonus_qty_pcs || it.bonus_pcs || 0),
                rate: rate,
                disc_percent: 0,
                available_stock_pcs: liveStock,
            };
        });
    }, [order, stockBalances]);

    const [rows, setRows] = useState<OrderItemRow[]>(initialRows);
    const [courier, setCourier] = useState<number>(Number(order.delivery_charges || 0));
    const [extraDiscount, setExtraDiscount] = useState<number>(Number(order.discount_amount || 0));
    const [internalNotes, setInternalNotes] = useState<string>(order.internal_notes || "");
    const [isSaving, setIsSaving] = useState(false);

    // Item Registry Dialog
    const [itemDialogOpen, setItemDialogOpen] = useState(false);

    // Keyboard shortcut F2 to open Item Registry Dialog (same as Sales)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "F2") {
                e.preventDefault();
                setItemDialogOpen(true);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // ─── Row Update Handlers ────────────────────────────────────────────────────

    const updateRow = useCallback((index: number, updates: Partial<OrderItemRow>) => {
        setRows((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], ...updates };
            return updated;
        });
    }, []);

    const removeRow = useCallback(
        (index: number) => {
            if (rows.length <= 1) {
                alert("Order must contain at least 1 item. You cannot delete all items.");
                return;
            }
            setRows((prev) => prev.filter((_, i) => i !== index));
        },
        [rows.length]
    );

    // ItemRegistryDialog → onAddUpdate callback
    const handleItemRegistryAdd = useCallback(
        (
            item: any,
            data: { full: number; pcs: number; bonus_full: number; bonus_pcs: number; rate: number; discPercent: number },
            options?: { mode: "add" | "edit"; targetRowId?: number | null }
        ) => {
            const packing = Math.max(1, Number(item.packing_qty || item.packing_full || 1));

            if (options?.mode === "edit" && options.targetRowId != null) {
                setRows((prev) =>
                    prev.map((r) =>
                        r.id === options.targetRowId
                            ? {
                                  ...r,
                                  qty_carton: data.full,
                                  qty_pcs: data.pcs,
                                  bonus_full: data.bonus_full,
                                  bonus_pcs: data.bonus_pcs,
                                  packing: packing,
                                  rate: data.rate,
                                  disc_percent: data.discPercent,
                              }
                            : r
                    )
                );
                setItemDialogOpen(false);
                return;
            }

            setRows((prev) => {
                const existingIdx = prev.findIndex((r) => r.product_id === item.id);
                if (existingIdx >= 0) {
                    const updated = [...prev];
                    const existing = { ...updated[existingIdx] };
                    existing.qty_carton += data.full;
                    existing.qty_pcs += data.pcs;
                    existing.bonus_full += data.bonus_full;
                    existing.bonus_pcs += data.bonus_pcs;
                    updated[existingIdx] = existing;
                    return updated;
                }

                const newRow: OrderItemRow = {
                    id: `new-${Date.now()}`,
                    product_id: item.id,
                    item_name: item.title,
                    item_code: item.code || "",
                    packing: packing,
                    qty_carton: data.full,
                    qty_pcs: data.pcs,
                    bonus_full: data.bonus_full,
                    bonus_pcs: data.bonus_pcs,
                    rate: data.rate,
                    disc_percent: data.discPercent,
                    available_stock_pcs: Number(item.total_stock_pcs || 0),
                };
                return [...prev, newRow];
            });

            setItemDialogOpen(false);
        },
        []
    );

    // ─── Derived Financials ─────────────────────────────────────────────────────

    const computedRows = useMemo(() => {
        return rows.map((r) => {
            const billablePcs = r.qty_carton * r.packing + r.qty_pcs;
            const totalPcs = (r.qty_carton + r.bonus_full) * r.packing + (r.qty_pcs + r.bonus_pcs);
            const netRate = r.disc_percent > 0 ? r.rate * (1 - r.disc_percent / 100) : r.rate;
            const subtotal = Math.round(billablePcs * netRate * 100) / 100;
            const isStockExceeded = totalPcs > r.available_stock_pcs;
            return { ...r, billablePcs, totalPcs, netRate, subtotal, isStockExceeded };
        });
    }, [rows]);

    const totals = useMemo(() => {
        const grossSubtotal = computedRows.reduce((acc, r) => acc + r.subtotal, 0);
        const finalPayable = Math.max(0, grossSubtotal - extraDiscount + courier);
        const hasStockWarnings = computedRows.some((r) => r.isStockExceeded);
        return { grossSubtotal, finalPayable, hasStockWarnings };
    }, [computedRows, extraDiscount, courier]);

    // ─── Save Handler ───────────────────────────────────────────────────────────

    const handleSaveOrder = (e: React.FormEvent) => {
        e.preventDefault();
        if (rows.length === 0) {
            alert("Please add at least one item before updating.");
            return;
        }
        setIsSaving(true);
        router.post(
            `/online-orders/${order.id}/update`,
            {
                items: computedRows.map((r) => ({
                    product_id: r.product_id,
                    qty_carton: r.qty_carton,
                    qty_pcs: r.qty_pcs,
                    bonus_qty_carton: r.bonus_full,
                    bonus_qty_pcs: r.bonus_pcs,
                    unit_price: r.rate,
                    discount_percent: r.disc_percent,
                })),
                discount_type: extraDiscount > 0 ? "fixed" : "none",
                discount_rate: extraDiscount,
                delivery_charges: courier,
                internal_notes: internalNotes,
            },
            {
                onFinish: () => setIsSaving(false),
            }
        );
    };

    // currentRows for ItemRegistryDialog duplicate detection
    const currentRowsForDialog = useMemo(
        () =>
            rows.map((r) => ({
                id: r.id,
                product_id: r.product_id,
                item_id: r.product_id,
                qty_carton: r.qty_carton,
                qty_pcs: r.qty_pcs,
                rate: r.rate,
            })),
        [rows]
    );

    // ─── Render ──────────────────────────────────────────────────────────────────

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50 dark:bg-zinc-950 min-w-0 overflow-x-hidden">
                <SiteHeader breadcrumbs={breadcrumbs} />
                <Head title={`Edit Order #${order.order_no} - Haramain Traders`} />

                <div className="w-full p-4 md:p-6 space-y-4 min-w-0">
                    {/* ── Top Header Information Card (Matching Sales Edit Invoice Header) ── */}
                    <Card className="p-3 border-orange-200 dark:border-orange-950/50 shadow-sm bg-white dark:bg-card">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                            <TechLabel label="Invoice Date" icon={CalendarIcon} className="space-y-1 shrink-0">
                                <div className="h-9 px-3 flex items-center font-mono text-xs font-black bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md">
                                    {orderDate}
                                </div>
                            </TechLabel>

                            <TechLabel label="Invoice Time" icon={Clock} className="space-y-1 shrink-0">
                                <div className="h-9 px-3 flex items-center justify-center font-mono text-xs font-black bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md">
                                    {orderTime}
                                </div>
                            </TechLabel>

                            <TechLabel label="Select Customer / Account" className="space-y-1 min-w-[220px] flex-1">
                                <div className="h-9 px-3 flex items-center justify-between font-bold text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md">
                                    <span className="truncate">
                                        {order.customer_user?.name}
                                        {order.customer_user?.business_name
                                            ? ` (${order.customer_user.business_name})`
                                            : ""}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 font-mono">
                                        {order.customer_user?.mobile}
                                    </span>
                                </div>
                            </TechLabel>

                            <TechLabel label="Account Code" className="space-y-1 shrink-0 hidden sm:block">
                                <div className="w-20 h-9 flex items-center justify-center font-mono text-xs font-black bg-zinc-100 dark:bg-zinc-800 border rounded-md">
                                    {order.account_id || order.customer_user?.account_id || "ONLINE"}
                                </div>
                            </TechLabel>

                            <TechLabel label="Days" className="space-y-1 shrink-0 hidden md:block">
                                <div className="w-14 h-9 flex items-center justify-center font-mono text-xs font-black bg-zinc-100 dark:bg-zinc-800 border rounded-md">
                                    0
                                </div>
                            </TechLabel>

                            <TechLabel label="Limit" className="space-y-1 shrink-0 hidden lg:block">
                                <div className="w-24 h-9 flex items-center justify-center font-mono text-xs font-black bg-zinc-100 dark:bg-zinc-800 border rounded-md">
                                    9999999
                                </div>
                            </TechLabel>

                            <TechLabel label="Bill No" icon={Hash} className="space-y-1 shrink-0">
                                <div className="w-36 h-9 flex items-center justify-center font-mono text-xs font-black bg-orange-50 text-orange-600 border border-orange-200 rounded-md">
                                    {order.order_no}
                                </div>
                            </TechLabel>

                            <TechLabel label="Channel" className="space-y-1 shrink-0">
                                <div className="w-24 h-9 flex items-center justify-center font-bold text-[11px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-md">
                                    ONLINE
                                </div>
                            </TechLabel>

                            <TechLabel label="Items" className="space-y-1 shrink-0">
                                <div className="w-14 h-9 flex items-center justify-center font-mono text-xs font-black bg-zinc-100 dark:bg-zinc-800 border rounded-md">
                                    {computedRows.length}
                                </div>
                            </TechLabel>

                            <TechLabel label="Status" className="space-y-1 shrink-0">
                                <div className="flex items-center gap-1.5 h-9 px-3 border rounded-md bg-emerald-500/10 border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                                        {order.status.replace(/_/g, " ")}
                                    </span>
                                </div>
                            </TechLabel>
                        </div>
                    </Card>

                    {/* ── Stock Alert Warning Banner ── */}
                    {totals.hasStockWarnings && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                                <strong>Warehouse Stock Alert:</strong> One or more items exceed current warehouse stock
                                balances. You may still save this order revision.
                            </span>
                        </div>
                    )}

                    {/* ── Main Workspace ── */}
                    <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                        {/* Left: Product Lines Table (100% Matching Sales Edit Layout) */}
                        <div className="flex-1 min-w-0">
                            <Card className="p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-card flex flex-col justify-between">
                                <div className="overflow-x-auto min-w-0">
                                    <div className="w-full min-w-[950px]">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-12 bg-zinc-50 dark:bg-zinc-900/80 p-3 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 z-20 items-center">
                                            <div className="col-span-4 text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                                                Item Identification
                                            </div>
                                            <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                                                Full
                                            </div>
                                            <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                                                Pcs
                                            </div>
                                            <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                                                B.Full
                                            </div>
                                            <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                                                B.Pcs
                                            </div>
                                            <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                                                Rate
                                            </div>
                                            <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                                                Disc %
                                            </div>
                                            <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                                                After
                                            </div>
                                            <div className="col-span-1 text-right text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 pr-7">
                                                Subtotal
                                            </div>
                                        </div>

                                        {/* Table Rows */}
                                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs font-medium">
                                            {computedRows.map((row, idx) => (
                                                <div
                                                    key={row.id}
                                                    className={cn(
                                                        "grid grid-cols-12 gap-2 p-2.5 items-center group transition-colors",
                                                        row.isStockExceeded
                                                            ? "bg-rose-50 dark:bg-rose-950/20 shadow-[inset_4px_0_0_0_#f43f5e]"
                                                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                                                    )}
                                                >
                                                    {/* 1. Item Identification (No 76 pcs stock badge) */}
                                                    <div className="col-span-4 min-w-0 pr-2">
                                                        <div className="text-xs font-black uppercase tracking-tighter truncate text-zinc-900 dark:text-zinc-100">
                                                            {row.item_name}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
                                                                {row.item_code
                                                                    ? row.item_code
                                                                    : `ID: ${String(row.product_id).padStart(5, "0")}`}
                                                            </span>
                                                            {row.isStockExceeded && (
                                                                <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">
                                                                    <AlertTriangle className="w-3 h-3" /> Exceeds stock
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* 2. Full (Cartons Input) */}
                                                    <div className="col-span-1">
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            value={row.qty_carton || ""}
                                                            onChange={(e) =>
                                                                updateRow(idx, { qty_carton: toNumber(e.target.value) })
                                                            }
                                                            className="h-8 text-center font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 focus:border-orange-500 transition-all"
                                                        />
                                                    </div>

                                                    {/* 3. Pcs (Loose pieces Input or -- if packing <= 1) */}
                                                    <div className="col-span-1">
                                                        {row.packing > 1 ? (
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                value={row.qty_pcs || ""}
                                                                onChange={(e) =>
                                                                    updateRow(idx, {
                                                                        qty_pcs: toNumber(e.target.value),
                                                                    })
                                                                }
                                                                className="h-8 text-center font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 focus:border-orange-500 transition-all"
                                                            />
                                                        ) : (
                                                            <div className="h-8 flex items-center justify-center text-[10px] text-zinc-300 font-bold uppercase tracking-tighter">
                                                                --
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* 4. B.Full (Bonus Cartons Input) */}
                                                    <div className="col-span-1 border-l border-zinc-100 dark:border-zinc-800">
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            value={row.bonus_full || ""}
                                                            onChange={(e) =>
                                                                updateRow(idx, {
                                                                    bonus_full: toNumber(e.target.value),
                                                                })
                                                            }
                                                            placeholder=""
                                                            className="h-8 text-center font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 transition-all opacity-70 focus:opacity-100"
                                                        />
                                                    </div>

                                                    {/* 5. B.Pcs (Bonus Pieces Input or -- if packing <= 1) */}
                                                    <div className="col-span-1">
                                                        {row.packing > 1 ? (
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                value={row.bonus_pcs || ""}
                                                                onChange={(e) =>
                                                                    updateRow(idx, {
                                                                        bonus_pcs: toNumber(e.target.value),
                                                                    })
                                                                }
                                                                placeholder=""
                                                                className="h-8 text-center font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 transition-all opacity-70 focus:opacity-100"
                                                            />
                                                        ) : (
                                                            <div className="h-8 flex items-center justify-center text-[10px] text-zinc-300 font-bold uppercase tracking-tighter">
                                                                --
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* 6. Rate Input */}
                                                    <div className="col-span-1">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            min={0}
                                                            value={row.rate || ""}
                                                            onChange={(e) =>
                                                                updateRow(idx, { rate: toNumber(e.target.value) })
                                                            }
                                                            className="h-8 text-right font-mono text-[10px] border-zinc-200 dark:border-zinc-700 focus:border-orange-500 transition-all"
                                                        />
                                                    </div>

                                                    {/* 7. Disc % Input */}
                                                    <div className="col-span-1 bg-rose-50/10 dark:bg-rose-900/5 rounded px-1">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            min={0}
                                                            max={100}
                                                            value={row.disc_percent || ""}
                                                            onChange={(e) =>
                                                                updateRow(idx, {
                                                                    disc_percent: toNumber(e.target.value),
                                                                })
                                                            }
                                                            className="h-8 border-none bg-transparent text-center font-mono text-[10px] text-rose-600"
                                                        />
                                                    </div>

                                                    {/* 8. After (Net Rate Display) */}
                                                    <div className="col-span-1">
                                                        <div className="text-right font-mono text-[11px] text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900 h-8 flex items-center justify-end px-1 border border-zinc-100 dark:border-zinc-800 rounded">
                                                            {row.netRate.toFixed(2)}
                                                        </div>
                                                    </div>

                                                    {/* 9. Subtotal + Delete Button on the Far Right */}
                                                    <div className="col-span-1 flex items-center justify-end gap-2 pr-1">
                                                        <div className="text-right font-black text-[11px] tracking-tighter text-zinc-900 dark:text-zinc-100 italic">
                                                            {row.subtotal.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                            })}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRow(idx)}
                                                            title="Delete Row"
                                                            className="h-6 w-6 shrink-0 flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Table Footer Toolbar (Matching Sales Edit Bottom Bar) */}
                                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setItemDialogOpen(true)}
                                        className="h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm"
                                    >
                                        <Plus className="w-4 h-4 mr-1.5" />
                                        SELECT PRODUCT (F2)
                                    </Button>

                                    <div className="flex items-center gap-4 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                        <span>
                                            Total Lines:{" "}
                                            <strong className="text-zinc-900 dark:text-zinc-100">
                                                {computedRows.length}
                                            </strong>
                                        </span>
                                        <span>
                                            Total Pieces:{" "}
                                            <strong className="text-zinc-900 dark:text-zinc-100">
                                                {computedRows.reduce((a, b) => a + b.totalPcs, 0)}
                                            </strong>
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Right: Invoice Summary & Action Panel (Matching Sales Edit Sidebar) */}
                        <div className="w-full lg:w-80 shrink-0">
                            <Card className={`${CARD_BASE} p-4 space-y-4`}>
                                {/* Header Section */}
                                <div className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                                        Net Payable
                                    </div>
                                    <div className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 italic">
                                        <span className="text-xs font-semibold mr-1">Rs</span>
                                        {totals.grossSubtotal.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                        })}
                                    </div>
                                </div>

                                {/* Courier / Delivery Charges */}
                                <TechLabel label="Courier Service / Delivery">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={courier}
                                        onChange={(e) => setCourier(Math.max(0, Number(e.target.value)))}
                                        placeholder="0.00"
                                        className="h-9 text-sm font-bold font-mono"
                                    />
                                </TechLabel>

                                {/* Extra Discount */}
                                <TechLabel label="Extra Discount">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={extraDiscount}
                                        onChange={(e) => setExtraDiscount(Math.max(0, Number(e.target.value)))}
                                        placeholder="0.00"
                                        className="h-9 text-sm font-bold font-mono text-rose-600 bg-rose-50/40 border-rose-200"
                                    />
                                </TechLabel>

                                {/* Internal Notes */}
                                <TechLabel label="Revision Notes for Customer">
                                    <textarea
                                        rows={2}
                                        value={internalNotes}
                                        onChange={(e) => setInternalNotes(e.target.value)}
                                        placeholder="e.g. Added requested items; adjusted quantities per warehouse stock..."
                                        className="w-full text-xs p-2 rounded-md border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    />
                                </TechLabel>

                                {/* Final Net Payable */}
                                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                                    <div className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                                        Final Net Payable
                                    </div>
                                    <div className="text-3xl font-black text-orange-600 dark:text-orange-500 italic tracking-tight leading-none mt-1">
                                        <span className="text-sm font-semibold mr-1">Rs</span>
                                        {totals.finalPayable.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                        })}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-2 space-y-2">
                                    <Button
                                        type="button"
                                        onClick={handleSaveOrder}
                                        disabled={isSaving}
                                        className={`w-full h-10 ${ACCENT_GRADIENT} text-white font-black uppercase tracking-wider text-xs shadow-md hover:scale-[1.02] active:scale-95 transition-all`}
                                    >
                                        <Save className="w-4 h-4 mr-1.5" />
                                        {isSaving ? "Updating Order..." : "Update Order"}
                                    </Button>

                                    {whatsappLink && (
                                        <a
                                            href={whatsappLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full"
                                        >
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full h-9 text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                            >
                                                <MessageCircle className="w-4 h-4 mr-1.5 text-emerald-600" />
                                                WhatsApp Customer
                                            </Button>
                                        </a>
                                    )}

                                    <a
                                        href={`/online-orders/${order.id}/invoice-pdf`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full"
                                    >
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-9 text-xs font-semibold border-zinc-300 text-zinc-700"
                                        >
                                            <Printer className="w-4 h-4 mr-1.5" />
                                            Print Order Invoice
                                        </Button>
                                    </a>

                                    <Link href={`/online-orders/${order.id}`} className="block w-full">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="w-full h-8 text-xs text-zinc-500 hover:text-zinc-900"
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                                            Abort Edits / Back to Order
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* ── Item Registry Dialog (Exact dialog from Sales) ── */}
                <ItemRegistryDialog
                    open={itemDialogOpen}
                    onOpenChange={setItemDialogOpen}
                    items={items}
                    customerCategory={null}
                    currentRows={currentRowsForDialog}
                    onAddUpdate={handleItemRegistryAdd}
                />
            </SidebarInset>
        </SidebarProvider>
    );
}
