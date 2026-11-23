import React, { useState, useRef, useEffect, useCallback } from "react";

export type InvoiceNavColumn =
  | "full"
  | "pcs"
  | "bonus_full"
  | "bonus_pcs"
  | "rate"
  | "disc";

interface RowNavItem {
  id: number;
  item_id: number | null;
}

interface UseInvoiceRowNavigationOptions<T extends RowNavItem> {
  rows: T[];
  isModalOpen: boolean;
  onRowFocus?: (row: T) => void;
}

/**
 * Shared Up/Down arrow keyboard navigation for invoice item rows across Sales & Purchase screens.
 * - ArrowUp / ArrowDown inside any row input moves focus to the same column on the adjacent row
 *   (falling back to 'full' if the target row does not render 'pcs' or 'bonus_pcs'), and prevents
 *   native <input type="number"> increment/decrement.
 * - ArrowUp / ArrowDown when no input/modal is focused selects rows from the main screen and
 *   focuses that row's 'full' input.
 * - Keeps mouse clicks, input focus, scroll-into-view, and active row highlighting in sync.
 */
export function useInvoiceRowNavigation<T extends RowNavItem>({
  rows,
  isModalOpen,
  onRowFocus,
}: UseInvoiceRowNavigationOptions<T>) {
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const rowRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const cellRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());

  const rowsRef = useRef<T[]>(rows);
  rowsRef.current = rows;

  const onRowFocusRef = useRef(onRowFocus);
  onRowFocusRef.current = onRowFocus;

  const selectedRowIdRef = useRef<number | null>(selectedRowId);
  selectedRowIdRef.current = selectedRowId;

  const setRowRef = useCallback(
    (rowId: number) => (el: HTMLDivElement | null) => {
      if (el) {
        rowRefs.current.set(rowId, el);
      } else {
        rowRefs.current.delete(rowId);
      }
    },
    []
  );

  const setCellRef = useCallback(
    (rowId: number, col: InvoiceNavColumn) => (el: HTMLInputElement | null) => {
      const key = `${rowId}:${col}`;
      if (el) {
        cellRefs.current.set(key, el);
      } else {
        cellRefs.current.delete(key);
      }
    },
    []
  );

  const focusRowAtIndex = useCallback(
    (targetIndex: number, preferredCol: InvoiceNavColumn = "full") => {
      const currentRows = rowsRef.current;
      if (currentRows.length === 0) return;

      const clampedIndex = Math.max(0, Math.min(currentRows.length - 1, targetIndex));
      const targetRow = currentRows[clampedIndex];
      if (!targetRow) return;

      setSelectedRowId(targetRow.id);
      onRowFocusRef.current?.(targetRow);

      const rowEl = rowRefs.current.get(targetRow.id);
      rowEl?.scrollIntoView({ block: "nearest", behavior: "smooth" });

      const targetInput =
        cellRefs.current.get(`${targetRow.id}:${preferredCol}`) ||
        cellRefs.current.get(`${targetRow.id}:full`) ||
        cellRefs.current.get(`${targetRow.id}:rate`);

      if (targetInput) {
        targetInput.focus();
        // Select text so user can immediately overwrite with a new value
        try {
          targetInput.select();
        } catch {
          // Ignore selection errors on unsupported input types
        }
      }
    },
    []
  );

  const selectRow = useCallback((row: T) => {
    setSelectedRowId(row.id);
    onRowFocusRef.current?.(row);
  }, []);

  const handleCellKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      rowIndex: number,
      col: InvoiceNavColumn
    ) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (rowsRef.current.length === 0) return;
        const nextIdx =
          rowIndex < rowsRef.current.length - 1 ? rowIndex + 1 : 0;
        focusRowAtIndex(nextIdx, col);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (rowsRef.current.length === 0) return;
        const prevIdx =
          rowIndex > 0 ? rowIndex - 1 : rowsRef.current.length - 1;
        focusRowAtIndex(prevIdx, col);
      }
    },
    [focusRowAtIndex]
  );

  // Global ArrowUp / ArrowDown when user is on the main page outside inputs/dropdowns/modals
  useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen) return;
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;

      const activeEl = document.activeElement as HTMLElement | null;
      const tag = activeEl?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        activeEl?.isContentEditable ||
        activeEl?.getAttribute("role") === "combobox" ||
        activeEl?.getAttribute("role") === "option" ||
        activeEl?.closest('[role="listbox"]') ||
        activeEl?.closest('[role="dialog"]')
      ) {
        return;
      }

      const currentRows = rowsRef.current;
      if (currentRows.length === 0) return;

      e.preventDefault();
      const currentIdx = currentRows.findIndex(
        (r) => r.id === selectedRowIdRef.current
      );

      if (e.key === "ArrowDown") {
        const nextIdx =
          currentIdx < 0
            ? 0
            : currentIdx < currentRows.length - 1
            ? currentIdx + 1
            : 0;
        focusRowAtIndex(nextIdx, "full");
      } else {
        const prevIdx =
          currentIdx <= 0 ? currentRows.length - 1 : currentIdx - 1;
        focusRowAtIndex(prevIdx, "full");
      }
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [isModalOpen, focusRowAtIndex]);

  // Clear stale selection if selected row was deleted
  useEffect(() => {
    if (
      selectedRowId !== null &&
      !rows.some((r) => r.id === selectedRowId)
    ) {
      setSelectedRowId(null);
    }
  }, [rows, selectedRowId]);

  return {
    selectedRowId,
    setSelectedRowId,
    setRowRef,
    setCellRef,
    selectRow,
    handleCellKeyDown,
    focusRowAtIndex,
  };
}
