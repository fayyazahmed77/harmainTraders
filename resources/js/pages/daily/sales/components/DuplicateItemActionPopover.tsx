import React, { useState, useEffect, useRef } from "react";
import { Plus, Pencil, X, Layers, Check, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ExistingLineMatch {
    rowId: number;
    lineNumber: number;
    full: number;
    pcs: number;
    bonus_full: number;
    bonus_pcs: number;
    rate: number;
    discPercent: number;
    packingQty?: number;
    subtotal?: number;
}

export interface DuplicateItemActionPopoverProps {
    itemTitle: string;
    itemId?: number;
    packingQty?: number;
    matchingLines: ExistingLineMatch[];
    onAddNewLine: () => void;
    onEditLine: (rowId: number) => void;
    onCancel: () => void;
}

export const DuplicateItemActionPopover: React.FC<DuplicateItemActionPopoverProps> = ({
    itemTitle,
    itemId,
    matchingLines,
    onAddNewLine,
    onEditLine,
    onCancel,
}) => {
    const [selectedRowId, setSelectedRowId] = useState<number>(
        matchingLines[0]?.rowId ?? 0
    );
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (matchingLines.length > 0 && !matchingLines.some(l => l.rowId === selectedRowId)) {
            setSelectedRowId(matchingLines[0].rowId);
        }
    }, [matchingLines, selectedRowId]);

    useEffect(() => {
        // Focus the popover container on mount for immediate keyboard navigation
        const timer = setTimeout(() => {
            containerRef.current?.focus();
            containerRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }, 20);
        return () => clearTimeout(timer);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
            return;
        }

        if (e.key === "a" || e.key === "A" || e.key === "1") {
            e.preventDefault();
            e.stopPropagation();
            onAddNewLine();
            return;
        }

        if (e.key === "e" || e.key === "E" || e.key === "2" || e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            if (selectedRowId) {
                onEditLine(selectedRowId);
            }
            return;
        }

        if (matchingLines.length > 1 && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            e.stopPropagation();
            const currentIndex = matchingLines.findIndex(l => l.rowId === selectedRowId);
            if (e.key === "ArrowDown") {
                const nextIndex = (currentIndex + 1) % matchingLines.length;
                setSelectedRowId(matchingLines[nextIndex].rowId);
            } else {
                const prevIndex = (currentIndex - 1 + matchingLines.length) % matchingLines.length;
                setSelectedRowId(matchingLines[prevIndex].rowId);
            }
        }
    };

    const selectedLine = matchingLines.find(l => l.rowId === selectedRowId) || matchingLines[0];

    const calcLineSubtotal = (line: ExistingLineMatch) => {
        const packing = Math.max(1, line.packingQty || 1);
        const gross = (line.full * line.rate) + (line.pcs * (line.rate / packing));
        const net = gross * (1 - (line.discPercent || 0) / 100);
        return Math.round(net);
    };

    return (
        <div
            ref={containerRef}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="mx-3 my-1.5 p-3 rounded-xl bg-white dark:bg-zinc-900 border-2 border-orange-500/80 dark:border-orange-500/70 shadow-xl shadow-orange-500/10 outline-none animate-in fade-in zoom-in-95 duration-150 relative z-30"
        >
            {/* Header Bar */}
            <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
                        <Layers className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        <span className="text-[11px] font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                            {itemTitle}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider shrink-0">
                            {matchingLines.length === 1
                                ? "Already in List (Line #" + matchingLines[0].lineNumber + ")"
                                : `Already in List (${matchingLines.length} Lines)`}
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onCancel();
                    }}
                    className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                    title="Cancel (Esc)"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Existing Line(s) Inspection / Disambiguation */}
            {matchingLines.length === 1 ? (
                <div className="mb-3 px-2.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-[10px] font-black uppercase">
                            Line #{selectedLine.lineNumber}
                        </span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
                            Qty: <strong className="text-zinc-900 dark:text-white">{selectedLine.full} Full</strong>
                            {(selectedLine.packingQty ?? 1) > 1 ? `, ${selectedLine.pcs} Pcs` : ""}
                            {(selectedLine.bonus_full > 0 || selectedLine.bonus_pcs > 0) && (
                                <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                                    (+{selectedLine.bonus_full}F/{selectedLine.bonus_pcs}P Bonus)
                                </span>
                            )}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-zinc-600 dark:text-zinc-400">
                            Rate: <strong className="text-orange-600 dark:text-orange-400">Rs {selectedLine.rate.toLocaleString()}</strong>
                        </span>
                        {selectedLine.discPercent > 0 && (
                            <span className="text-rose-600 dark:text-rose-400 font-bold">
                                Disc: {selectedLine.discPercent.toFixed(1)}%
                            </span>
                        )}
                        <span className="font-black text-zinc-900 dark:text-zinc-100">
                            Rs {calcLineSubtotal(selectedLine).toLocaleString()}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="mb-3 space-y-1.5">
                    <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <CornerDownRight className="w-3 h-3 text-orange-500" />
                        <span>Multiple lines found for this item — Choose which line to edit:</span>
                    </div>
                    <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1 pr-0.5">
                        {matchingLines.map((line) => {
                            const isLineSelected = line.rowId === selectedRowId;
                            return (
                                <div
                                    key={line.rowId}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedRowId(line.rowId);
                                    }}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        onEditLine(line.rowId);
                                    }}
                                    className={cn(
                                        "px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all flex flex-wrap items-center justify-between gap-2 text-xs",
                                        isLineSelected
                                            ? "bg-orange-50/90 dark:bg-orange-950/40 border-orange-500 ring-1 ring-orange-500/30"
                                            : "bg-zinc-50/70 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 hover:border-orange-300"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={cn(
                                                "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                                                isLineSelected
                                                    ? "border-orange-500 bg-orange-500 text-white"
                                                    : "border-zinc-300 dark:border-zinc-700"
                                            )}
                                        >
                                            {isLineSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                        </div>
                                        <span className="px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-[10px] font-black uppercase">
                                            Line #{line.lineNumber}
                                        </span>
                                        <span className="font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                                            {line.full} Full{(line.packingQty ?? 1) > 1 ? ` / ${line.pcs} Pcs` : ""}
                                            {(line.bonus_full > 0 || line.bonus_pcs > 0) && (
                                                <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                                                    (+{line.bonus_full}F/{line.bonus_pcs}P)
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2.5 font-mono text-[11px]">
                                        <span className="text-zinc-600 dark:text-zinc-400">
                                            Rate: <strong className="text-orange-600 dark:text-orange-400">Rs {line.rate.toLocaleString()}</strong>
                                        </span>
                                        {line.discPercent > 0 && (
                                            <span className="text-rose-600 dark:text-rose-400 font-bold">
                                                Disc: {line.discPercent.toFixed(1)}%
                                            </span>
                                        )}
                                        <span className="font-black text-zinc-900 dark:text-zinc-100">
                                            Rs {calcLineSubtotal(line).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Action Buttons: Option A (Add) | Option B (Edit) | Cancel */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hidden sm:flex items-center gap-2">
                    <span>Choose action:</span>
                    <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded font-mono text-[9px] text-zinc-700 dark:text-zinc-300">
                        A = Add
                    </kbd>
                    <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded font-mono text-[9px] text-zinc-700 dark:text-zinc-300">
                        E = Edit
                    </kbd>
                    <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded font-mono text-[9px] text-zinc-700 dark:text-zinc-300">
                        Esc = Cancel
                    </kbd>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCancel();
                        }}
                        className="h-8 px-2.5 text-[10px] font-black uppercase tracking-wider border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                    >
                        Cancel
                    </Button>

                    <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddNewLine();
                        }}
                        className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider gap-1.5 shadow-sm shadow-emerald-500/20"
                    >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Add New Line</span>
                    </Button>

                    <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (selectedLine) {
                                onEditLine(selectedLine.rowId);
                            }
                        }}
                        className="h-8 px-3 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-wider gap-1.5 shadow-sm shadow-orange-500/20"
                    >
                        <Pencil className="w-3 h-3 stroke-[2.5]" />
                        <span>
                            {matchingLines.length > 1
                                ? `Edit Line #${selectedLine?.lineNumber ?? 1}`
                                : "Edit Existing"}
                        </span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

