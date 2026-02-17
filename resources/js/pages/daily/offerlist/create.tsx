// Offer Listing Layout with Item Auto-Fill on Select
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import { Trash2, Plus, FileText, ListRestart, RotateCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { router } from '@inertiajs/react';

// ───────────────────────────────────────────
// Breadcrumbs
// ───────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [
    { title: "Offer", href: "/offer" },
    { title: "Listing", href: "/offer/list" },
];

// ───────────────────────────────────────────
// Types
// ───────────────────────────────────────────
interface Item {
    id: number;
    title: string;
    short_name: string;
    company: string;
    trade_price: number;
    retail: number;
    packing_qty: number;
    category: string; // This might be ID or Name depending on backend
    gst_percent: number;
    retail_tp_diff: number;
    discount: number;
}

interface Category {
    id: number;
    name: string;
}

interface Account {
    id: number;
    title: string;
}

interface RowData {
    id: number;
    item_id: number | null;
    title: string;
    pack_ctn: number;
    loos_ctn: number;
    trade_price: number;
    retail: number;
    category_name: string;
    discount: string;
    scheme: string;
    mrp: number;
}

interface MessageLine {
    id: number;
    messageline: string;
}

export default function OfferListing({ items, categories, accounts, messageLines }: { items: Item[]; categories: Category[]; accounts: Account[]; messageLines?: MessageLine[] }) {
    const [date, setDate] = useState(new Date().toLocaleDateString('en-GB'));
    const [selectedAccount, setSelectedAccount] = useState<string>("");
    const [priceType, setPriceType] = useState<"trade" | "retail" | "both">("trade");
    const [selectedMessageId, setSelectedMessageId] = useState<string>("0");

    // ─────────────────────────────
    // Initialize rows with one empty row
    // ─────────────────────────────
    const getEmptyRow = (): RowData => ({
        id: Date.now() + Math.random(),
        item_id: null,
        title: "",
        pack_ctn: 0,
        loos_ctn: 0,
        trade_price: 0,
        retail: 0,
        category_name: "",
        discount: "",
        scheme: "",
        mrp: 0,
    });

    const [rows, setRows] = useState<RowData[]>([getEmptyRow()]);

    // ─────────────────────────────
    // Add New Row
    // ─────────────────────────────
    const addRow = () => {
        setRows((prev) => [getEmptyRow(), ...prev]);
    };

    // ─────────────────────────────
    // Load All Items
    // ─────────────────────────────
    const loadAllItems = () => {
        const allItemRows: RowData[] = items.map((item) => {
            const cat = categories.find(c => String(c.id) === String(item.category));
            const catName = cat ? cat.name : "Uncategorized";

            return {
                id: Date.now() + item.id + Math.random(),
                item_id: item.id,
                title: item.title,
                pack_ctn: item.packing_qty,
                loos_ctn: item.retail_tp_diff,
                trade_price: item.trade_price,
                retail: item.retail,
                category_name: catName,
                discount: item.discount?.toString() ?? "",
                scheme: "",
                mrp: item.retail, // Default MRP to retail price
            };
        });
        setRows(allItemRows);
    };

    // ─────────────────────────────
    // Reset Rows
    // ─────────────────────────────
    const resetRows = () => {
        setRows([getEmptyRow()]);
    };

    // ─────────────────────────────
    // Remove Row
    // ─────────────────────────────
    const removeRow = (id: number) => {
        setRows((prev) => prev.filter((row) => row.id !== id));
    };

    // ─────────────────────────────
    // Handle Item Selection — Auto-Fill Values
    // ─────────────────────────────
    const handleSelectItem = (rowId: number, itemId: number) => {
        const selected = items.find((i) => i.id === itemId);
        if (!selected) return;

        const cat = categories.find(c => String(c.id) === String(selected.category));
        const catName = cat ? cat.name : "Uncategorized";

        setRows((prev) =>
            prev.map((row) =>
                row.id === rowId
                    ? {
                        ...row,
                        item_id: itemId,
                        title: selected.title,
                        pack_ctn: selected.packing_qty,
                        loos_ctn: selected.retail_tp_diff,
                        trade_price: selected.trade_price,
                        retail: selected.retail,
                        category_name: catName,
                        discount: selected.discount?.toString() ?? "",
                        scheme: "",
                        mrp: selected.retail,
                    }
                    : row
            )
        );
    };

    //store fun here 
    // ─────────────────────────────
    // Store Offer to Backend
    // ─────────────────────────────
    const storeOffer = () => {
        if (!selectedAccount) {
            alert("Please select an account first.");
            return;
        }

        const itemsData = rows
            .filter((r) => r.item_id !== null)
            .map((r) => ({
                item_id: r.item_id,
                pack_ctn: r.pack_ctn,
                loos_ctn: r.loos_ctn,
                price_type: priceType === 'both' ? 'trade-retail' : priceType,
                mrp: r.mrp,
                price: priceType === 'trade' ? r.trade_price : r.retail,
                scheme: r.scheme,
                status: 'active'
            }));

        if (itemsData.length === 0) {
            alert("Please add at least one item.");
            return;
        }

        // Convert date from DD/MM/YYYY to YYYY-MM-DD
        const [day, month, year] = date.split('/');
        const formattedDate = `${year}-${month}-${day}`;

        router.post('/offer-list', {
            account_id: selectedAccount,
            date: formattedDate,
            price_type: priceType,
            message_line_id: selectedMessageId !== "0" ? Number(selectedMessageId) : null,
            items: itemsData,
        }, {
            onSuccess: () => {
                // alert('Offer saved successfully!'); // Inertia usually handles success messages via flash props, but we can keep alert or rely on redirect
                resetRows();
            },
            onError: (errors) => {
                console.error(errors);
                alert('Failed to save offer. Please check the inputs.');
            }
        });
    };

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 61)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="w-full p-4 space-y-2">
                    {/* FIXED HEADER */}
                    <Card className="p-3 border rounded-sm shadow-sm sticky top-[70px] z-20 bg-white">
                        <div className="grid grid-cols-12 gap-4 items-center text-sm">
                            <div className="col-span-2">
                                <Label>Date</Label>
                                <Input
                                    value={date}
                                    readOnly
                                    className="bg-gray-50"
                                />
                            </div>

                            <div className="col-span-4">
                                <Label>Select Account (Customer/Supplier)</Label>
                                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                    <SelectTrigger className="w-full h-9">
                                        <SelectValue placeholder="Select Account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id.toString()}>
                                                {acc.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="col-span-3">
                                <Label>Price Type</Label>
                                <Select value={priceType} onValueChange={(v: any) => setPriceType(v)}>
                                    <SelectTrigger className="w-full h-9">
                                        <SelectValue placeholder="Select Price Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="trade">Trade Price Only</SelectItem>
                                        <SelectItem value="retail">Retail Price Only</SelectItem>
                                        <SelectItem value="both">Both</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="col-span-3 flex items-left justify-start gap-2">
                                <div className="flex-1">
                                    <Label>Message Line</Label>
                                    <Select value={selectedMessageId} onValueChange={setSelectedMessageId}>
                                        <SelectTrigger className="w-full h-9 bg-sky-50/50">
                                            <SelectValue placeholder="Optional Message" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">No Message Line (Optional)</SelectItem>
                                            {messageLines?.map(msg => (
                                                <SelectItem key={msg.id} value={msg.id.toString()}>{msg.messageline}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button className="bg-green-600 hover:bg-green-700 mt-5 h-9 shrink-0" onClick={storeOffer}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Save Offer List
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* TABLE HEADER */}
                    <div className="grid grid-cols-12 bg-gray-100 p-2 text-xs font-semibold border sticky top-[159px] z-10 items-center">
                        <div className="col-span-2">Item Selection</div>
                        <div className="col-span-2">Pack Ctn</div>
                        <div className="col-span-2">Loose Ctn</div>
                        <div className="col-span-2">M.R.P.</div>
                        <div className="col-span-2">Scheme</div>
                        <div className="col-span-1 text-right">Price</div>
                        <div className="col-span-1 text-center flex items-center justify-center">
                            <ButtonGroup>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 p-1 bg-green-500 text-white hover:bg-green-600 border-green-600 cursor-pointer"
                                    onClick={addRow}
                                    title="Add New Row"
                                >
                                    <Plus size={14} />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 p-1 bg-blue-500 text-white hover:bg-blue-600 border-blue-600 cursor-pointer"
                                    onClick={loadAllItems}
                                    title="Load All Items"
                                >
                                    <ListRestart size={14} />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 p-1 bg-orange-500 text-white hover:bg-orange-600 border-orange-600 cursor-pointer"
                                    onClick={resetRows}
                                    title="Reset"
                                >
                                    <RotateCcw size={14} />
                                </Button>
                            </ButtonGroup>
                        </div>
                    </div>

                    {/* SCROLLABLE ROW LIST */}
                    <div className="min-h-[610px] max-h-[600px] overflow-auto border pt-2">
                        {rows.map((row) => (
                            <div
                                key={row.id}
                                className="grid grid-cols-12 gap-3 px-2 py-1 border-b text-sm items-center hover:bg-gray-50 transition"
                            >
                                {/* Item Column (col-span-4) */}
                                <div className="col-span-2 flex items-center gap-2">
                                    <Select
                                        value={row.item_id?.toString() ?? ""}
                                        onValueChange={(val) => handleSelectItem(row.id, Number(val))}
                                    >
                                        <SelectTrigger className="w-full h-9">
                                            <SelectValue placeholder="Select item" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Items</SelectLabel>
                                                {items.map((item) => (
                                                    <SelectItem
                                                        key={item.id}
                                                        value={item.id.toString()}
                                                    >
                                                        {item.title} ({item.short_name})
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        className="h-9"
                                        placeholder="Pack Ctn"
                                        value={row.pack_ctn}
                                        onChange={(e) =>
                                            setRows((prev) =>
                                                prev.map((r) =>
                                                    r.id === row.id
                                                        ? { ...r, pack_ctn: Number(e.target.value) }
                                                        : r
                                                )
                                            )
                                        }
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        className="h-9"
                                        placeholder="Loose Ctn"
                                        value={row.loos_ctn}
                                        onChange={(e) =>
                                            setRows((prev) =>
                                                prev.map((r) =>
                                                    r.id === row.id
                                                        ? { ...r, loos_ctn: Number(e.target.value) }
                                                        : r
                                                )
                                            )
                                        }
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        className=" h-9"
                                        placeholder="M.R.P."
                                        value={row.mrp}
                                        onChange={(e) =>
                                            setRows((prev) =>
                                                prev.map((r) =>
                                                    r.id === row.id
                                                        ? { ...r, mrp: Number(e.target.value) }
                                                        : r
                                                )
                                            )
                                        }
                                    />
                                </div>
                                {/* Remarks / Scheme */}
                                <Input
                                    className="col-span-2 h-9"
                                    placeholder="Scheme..."
                                    value={row.scheme}
                                    onChange={(e) =>
                                        setRows((prev) =>
                                            prev.map((r) =>
                                                r.id === row.id
                                                    ? { ...r, scheme: e.target.value }
                                                    : r
                                            )
                                        )
                                    }
                                />



                                {/* Price */}
                                <div className="col-span-1 text-right">
                                    {priceType === 'trade' ? row.trade_price :
                                        priceType === 'retail' ? row.retail :
                                            `${row.trade_price} / ${row.retail}`}
                                </div>

                                {/* Remove Button */}
                                <div className="col-span-1 flex justify-center">
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => removeRow(row.id)}
                                    >
                                        <Trash2 size={15} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
