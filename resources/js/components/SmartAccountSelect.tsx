import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  X,
  Phone,
  MapPin,
  User as UserIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  RotateCcw,
  Loader2,
  Users,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SmartAccountContext =
  | "sale"
  | "purchase"
  | "sales_return"
  | "purchase_return";

export interface SmartAccount {
  id: number;
  code?: string;
  title: string;
  type?: number | string;
  phone?: string;
  mobile?: string | null;
  telephone1?: string | null;
  telephone2?: string | null;
  aging_days?: number;
  credit_limit?: number | string | null;
  saleman_id?: number | null;
  saleman_name?: string | null;
  city_id?: number | null;
  city_name?: string | null;
  area_id?: number | null;
  area_name?: string | null;
  item_category?: string | null;
  tp_label?: string;
  account_type?: { id?: number; name: string } | null;
  account_category?: { id?: number; name: string; percentage?: number } | null;
  current_balance?: number;
  balance_side?: "DR" | "CR" | "ZERO";
}

interface FilterOptionsPayload {
  cities: { id: number; name: string }[];
  areas: { id: number; name: string; city_id?: number | null }[];
  salemans: { id: number; name: string }[];
  categories: { id: number; name: string; percentage: number }[];
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

// Module-level cache for filter dropdown options so reopening never re-fetches cities/areas/salemans
const filterOptionsCache: Record<string, FilterOptionsPayload> = {};

// ─────────────────────────────────────────────────────────────────────────────
// Internal Searchable Full-Width Filter Dropdown (with keyboard navigation)
// ─────────────────────────────────────────────────────────────────────────────
interface SearchableFilterOption {
  value: string;
  label: string;
}

interface SearchableFilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableFilterOption[];
  placeholder: string;
  searchPlaceholder: string;
}

const SearchableFilterDropdown: React.FC<SearchableFilterDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      const curIdx = options.findIndex((o) => o.value === value);
      setActiveIdx(curIdx >= 0 ? curIdx : 0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open, options, value]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      optionRefs.current[activeIdx]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx, open]);

  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;
  const isFiltered = value !== "all";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      if (filtered.length > 0) {
        setActiveIdx((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      if (filtered.length > 0) {
        setActiveIdx((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (filtered[activeIdx]) {
        onChange(filtered[activeIdx].value);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full h-8 px-2.5 justify-between text-[11px] font-semibold bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-orange-400 transition-colors gap-1.5",
            isFiltered &&
              "border-orange-400 bg-orange-50/50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 font-bold"
          )}
        >
          <span className="truncate text-left">{selectedLabel}</span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        onKeyDown={handleKeyDown}
        data-filter-popover="true"
        className="w-[var(--radix-popover-trigger-width)] min-w-[200px] p-0 shadow-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-[120]"
      >
        <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 gap-1.5 bg-zinc-50 dark:bg-zinc-900">
          <Search className="h-3.5 w-3.5 text-orange-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="max-h-60 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="py-5 text-center text-[11px] font-semibold text-zinc-400">
              No matches found
            </div>
          ) : (
            filtered.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isActive = idx === activeIdx;
              return (
                <button
                  key={opt.value}
                  type="button"
                  ref={(el) => {
                    optionRefs.current[idx] = el;
                  }}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 text-xs flex items-center justify-between gap-2 transition-colors",
                    isActive
                      ? "bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 font-bold"
                      : isSelected
                      ? "bg-zinc-100/80 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const formatBalanceDisplay = (
  balance: number | undefined,
  side: "DR" | "CR" | "ZERO" | undefined,
  isPurchaseContext: boolean
) => {
  const num = Number(balance ?? 0);
  if (Math.abs(num) < 0.005 || side === "ZERO") {
    return { text: "Rs 0", tone: "neutral" as const };
  }
  const absFormatted = Math.abs(num).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const effectiveSide =
    side || (isPurchaseContext ? (num > 0 ? "CR" : "DR") : num > 0 ? "DR" : "CR");

  // Positive in customer context = receivable (amber/rose); negative = customer advance (emerald)
  // Positive in supplier context = payable (amber/rose); negative = supplier advance (emerald)
  const isAdvance = num < 0;
  return {
    text: `Rs ${absFormatted} ${effectiveSide}`,
    tone: isAdvance ? ("advance" as const) : ("due" as const),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Trigger Button (replaces Combobox / Select / Popover trigger cleanly)
// ─────────────────────────────────────────────────────────────────────────────
export interface SmartAccountTriggerProps {
  value: { id: number; title: string; code?: string | null } | null;
  onClick: () => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showShortcutHint?: boolean;
}

export const SmartAccountTrigger: React.FC<SmartAccountTriggerProps> = ({
  value,
  onClick,
  onClear,
  placeholder = "Select Account...",
  className,
  disabled = false,
  showShortcutHint = true,
}) => {
  const displayLabel = value
    ? `${value.title}${value.code ? ` (${value.code})` : ""}`
    : "";

  return (
    <div className="relative flex items-center w-full">
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "w-full justify-between h-9 px-3 font-bold text-xs rounded-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-orange-500 transition-all text-left gap-2",
          !value && "text-muted-foreground font-medium",
          onClear && value && "pr-8",
          className
        )}
      >
        <span className="truncate uppercase">
          {value ? displayLabel : placeholder}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {showShortcutHint && (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded">
              F1
            </kbd>
          )}
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
        </span>
      </Button>
      {onClear && value && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          title="Clear selected account"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Smart Account Selection Dialog (single instance per page)
// ─────────────────────────────────────────────────────────────────────────────
export interface SmartAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: SmartAccountContext;
  selectedAccountId?: number | string | null;
  onSelect: (account: SmartAccount) => void;
  title?: string;
  subtitle?: string;
  enableF1Shortcut?: boolean;
  f1Disabled?: boolean;
}

export const SmartAccountDialog: React.FC<SmartAccountDialogProps> = ({
  open,
  onOpenChange,
  context,
  selectedAccountId,
  onSelect,
  title,
  subtitle,
  enableF1Shortcut = true,
  f1Disabled = false,
}) => {
  const isPurchaseContext =
    context === "purchase" || context === "purchase_return";
  const cacheKey = isPurchaseContext ? "purchase" : "sale";

  const dialogTitle =
    title || (isPurchaseContext ? "Select Supplier" : "Select Customer");
  const dialogSubtitle =
    subtitle ||
    (isPurchaseContext
      ? "Search suppliers by name, code, phone, city or area"
      : "Search customers by name, code, phone, city or area");

  // Search, Filters & Pagination State
  const [search, setSearch] = useState("");
  const [cityId, setCityId] = useState("all");
  const [areaId, setAreaId] = useState("all");
  const [salemanId, setSalemanId] = useState("all");
  const [tpFilter, setTpFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Results State
  const [accounts, setAccounts] = useState<SmartAccount[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 0,
    from: null,
    to: null,
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptionsPayload>(
    () =>
      filterOptionsCache[cacheKey] || {
        cities: [],
        areas: [],
        salemans: [],
        categories: [],
      }
  );

  // Keyboard Highlight State
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSearchRef = useRef<string>("");

  // Global F1 Shortcut to open dialog
  useEffect(() => {
    if (!enableF1Shortcut) return;
    const handleF1 = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        if (f1Disabled && !open) return;
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", handleF1);
    return () => window.removeEventListener("keydown", handleF1);
  }, [enableF1Shortcut, f1Disabled, open, onOpenChange]);

  // Focus search input automatically when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 40);
    } else {
      // Cancel any in-flight fetch on close
      abortControllerRef.current?.abort();
    }
  }, [open]);

  // Fetch paginated accounts from server
  const fetchAccounts = useCallback(
    async (params: {
      search: string;
      cityId: string;
      areaId: string;
      salemanId: string;
      tpFilter: string;
      page: number;
    }) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setErrorMsg(null);

      const needFilters = !filterOptionsCache[cacheKey];

      try {
        const res = await axios.get("/account/picker", {
          signal: controller.signal,
          params: {
            context,
            search: params.search.trim() || undefined,
            city_id: params.cityId !== "all" ? params.cityId : undefined,
            area_id: params.areaId !== "all" ? params.areaId : undefined,
            saleman_id: params.salemanId !== "all" ? params.salemanId : undefined,
            tp: params.tpFilter !== "all" ? params.tpFilter : undefined,
            page: params.page,
            per_page: 25,
            include_filters: needFilters ? 1 : undefined,
          },
        });

        const list: SmartAccount[] = Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        setAccounts(list);
        if (res.data?.meta) {
          setMeta(res.data.meta);
        }
        if (res.data?.filter_options) {
          filterOptionsCache[cacheKey] = res.data.filter_options;
          setFilterOptions(res.data.filter_options);
        }

        // Highlight currently selected account if visible on this page, otherwise first row
        const selectedIdx =
          selectedAccountId != null
            ? list.findIndex(
                (a) => Number(a.id) === Number(selectedAccountId)
              )
            : -1;
        setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);
      } catch (err: any) {
        if (
          axios.isCancel(err) ||
          err?.code === "ERR_CANCELED" ||
          err?.name === "CanceledError"
        ) {
          return;
        }
        console.error("Failed to fetch accounts for picker", err);
        setErrorMsg("Could not load accounts. Please try again.");
      } finally {
        if (abortControllerRef.current === controller) {
          setLoading(false);
        }
      }
    },
    [context, cacheKey, selectedAccountId]
  );

  // Trigger fetch when dialog opens or search/filters/page change (debounced on search changes)
  useEffect(() => {
    if (!open) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const searchChanged = prevSearchRef.current !== search;
    prevSearchRef.current = search;

    const delay = searchChanged ? 250 : 0;

    debounceTimerRef.current = setTimeout(() => {
      fetchAccounts({
        search,
        cityId,
        areaId,
        salemanId,
        tpFilter,
        page,
      });
    }, delay);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [open, search, cityId, areaId, salemanId, tpFilter, page, fetchAccounts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Scroll highlighted row smoothly into view
  useEffect(() => {
    if (!open) return;
    rowRefs.current[highlightedIndex]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [highlightedIndex, open]);

  // Filter areas by selected city
  const visibleAreas = useMemo(() => {
    if (cityId === "all") return filterOptions.areas;
    const filtered = filterOptions.areas.filter(
      (a) => a.city_id != null && String(a.city_id) === String(cityId)
    );
    return filtered.length > 0 ? filtered : filterOptions.areas;
  }, [filterOptions.areas, cityId]);

  const hasActiveFilters =
    search.trim() !== "" ||
    cityId !== "all" ||
    areaId !== "all" ||
    salemanId !== "all" ||
    tpFilter !== "all";

  const resetAllFilters = () => {
    setSearch("");
    setCityId("all");
    setAreaId("all");
    setSalemanId("all");
    setTpFilter("all");
    setPage(1);
    searchInputRef.current?.focus();
  };

  const handleSelectAccount = (account: SmartAccount) => {
    onSelect(account);
    onOpenChange(false);
  };

  // Full keyboard navigation inside dialog
  const handleDialogKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const role = target?.getAttribute("role");
    const isInsideSelectOption =
      role === "option" ||
      !!target?.closest('[role="listbox"]') ||
      !!target?.closest('[data-filter-popover="true"]');
    if (isInsideSelectOption) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (accounts.length > 0) {
        setHighlightedIndex((prev) =>
          prev < accounts.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (accounts.length > 0) {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : accounts.length - 1
        );
      }
    } else if (e.key === "Enter") {
      // Allow buttons (like pagination or reset) to work normally if explicitly focused
      const isControlButton =
        target?.tagName === "BUTTON" &&
        !target.hasAttribute("data-account-row");
      if (isControlButton) return;

      if (accounts.length > 0 && accounts[highlightedIndex]) {
        e.preventDefault();
        handleSelectAccount(accounts[highlightedIndex]);
      }
    } else if (e.key === "PageDown") {
      if (meta.current_page < meta.last_page) {
        e.preventDefault();
        setPage((p) => Math.min(meta.last_page, p + 1));
      }
    } else if (e.key === "PageUp") {
      if (meta.current_page > 1) {
        e.preventDefault();
        setPage((p) => Math.max(1, p - 1));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onKeyDown={handleDialogKeyDown}
        className="w-full max-w-full h-[100dvh] max-h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:h-[86vh] sm:max-h-[86vh] sm:rounded-2xl sm:max-w-4xl lg:max-w-5xl p-0 gap-0 overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col"
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 pr-14 bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 text-white shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-orange-600/30">
          <div className="min-w-0">
            <DialogTitle className="text-base sm:text-lg font-black uppercase tracking-wider flex items-center gap-2 text-white">
              {isPurchaseContext ? (
                <Building2 className="w-5 h-5 shrink-0" />
              ) : (
                <Users className="w-5 h-5 shrink-0" />
              )}
              <span className="truncate">{dialogTitle}</span>
            </DialogTitle>
            <DialogDescription className="text-orange-100/90 text-[10px] font-bold uppercase tracking-wider mt-0.5 truncate">
              {dialogSubtitle}
            </DialogDescription>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-96 shrink-0">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none"
            />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Name, code, phone, city or area..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-8 h-9 bg-white/15 border-white/30 text-white placeholder:text-white/75 focus-visible:ring-0 focus-visible:bg-white/25 rounded-xl text-xs font-bold"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Compact Full-Width Searchable Filter Bar */}
        <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 min-w-0">
              {/* City */}
              <SearchableFilterDropdown
                value={cityId}
                onChange={(val) => {
                  setCityId(val);
                  setAreaId("all");
                  setPage(1);
                }}
                placeholder="All Cities"
                searchPlaceholder="Search city..."
                options={[
                  { value: "all", label: "All Cities" },
                  ...filterOptions.cities.map((c) => ({
                    value: String(c.id),
                    label: c.name,
                  })),
                ]}
              />

              {/* Area */}
              <SearchableFilterDropdown
                value={areaId}
                onChange={(val) => {
                  setAreaId(val);
                  setPage(1);
                }}
                placeholder="All Areas"
                searchPlaceholder="Search area..."
                options={[
                  { value: "all", label: "All Areas" },
                  ...visibleAreas.map((a) => ({
                    value: String(a.id),
                    label: a.name,
                  })),
                ]}
              />

              {/* Salesman */}
              <SearchableFilterDropdown
                value={salemanId}
                onChange={(val) => {
                  setSalemanId(val);
                  setPage(1);
                }}
                placeholder="All Salesmen"
                searchPlaceholder="Search salesman..."
                options={[
                  { value: "all", label: "All Salesmen" },
                  ...filterOptions.salemans.map((s) => ({
                    value: String(s.id),
                    label: s.name,
                  })),
                ]}
              />

              {/* TP Tier (Sale) or Category (Purchase) */}
              <SearchableFilterDropdown
                value={tpFilter}
                onChange={(val) => {
                  setTpFilter(val);
                  setPage(1);
                }}
                placeholder={
                  isPurchaseContext ? "All Categories" : "All TP Tiers"
                }
                searchPlaceholder={
                  isPurchaseContext ? "Search category..." : "Search TP tier..."
                }
                options={
                  isPurchaseContext
                    ? [
                        { value: "all", label: "All Categories" },
                        { value: "none", label: "0% / Uncategorized" },
                        ...filterOptions.categories.map((cat) => ({
                          value: String(cat.id),
                          label: `${cat.name} (${cat.percentage}%)`,
                        })),
                      ]
                    : [
                        { value: "all", label: "All TP Tiers" },
                        { value: "retail", label: "Retail (Default)" },
                        ...["1", "2", "3", "4", "5", "6", "7"].map((tier) => ({
                          value: tier,
                          label: `TP ${tier}`,
                        })),
                      ]
                }
              />
            </div>

            {/* Reset + Count */}
            <div className="flex items-center justify-between lg:justify-end gap-2 shrink-0">
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetAllFilters}
                  className="h-8 px-2.5 text-[10px] font-black uppercase tracking-wider text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              )}
              <span className="text-[10px] font-bold font-mono text-zinc-500 dark:text-zinc-400">
                {loading
                  ? "Loading..."
                  : meta.total > 0
                  ? `${meta.from ?? 1}–${meta.to ?? accounts.length} of ${meta.total.toLocaleString()}`
                  : "0 results"}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Table Column Header */}
        <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-2 bg-zinc-100/90 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 shrink-0">
          <div className="col-span-5">
            {isPurchaseContext ? "Supplier Name" : "Customer Name"}
          </div>
          <div className="col-span-2">Phone</div>
          <div className="col-span-2 text-center">
            {isPurchaseContext ? "Category / %" : "TP Tier"}
          </div>
          <div className="col-span-3 text-right">Previous Balance</div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/70 bg-white dark:bg-zinc-950">
          {loading && accounts.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-zinc-400">
              <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Loading Accounts...
              </span>
            </div>
          ) : errorMsg ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-rose-500">
              <span className="text-xs font-bold">{errorMsg}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  fetchAccounts({
                    search,
                    cityId,
                    areaId,
                    salemanId,
                    tpFilter,
                    page,
                  })
                }
              >
                Retry
              </Button>
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-zinc-400">
              <Search className="w-9 h-9 opacity-30" />
              <span className="text-xs font-black uppercase tracking-widest">
                No Matching Accounts Found
              </span>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetAllFilters}
                  className="mt-1 h-8 text-xs"
                >
                  Clear Search & Filters
                </Button>
              )}
            </div>
          ) : (
            accounts.map((acc, idx) => {
              const isHighlighted = idx === highlightedIndex;
              const isSelected =
                selectedAccountId != null &&
                Number(acc.id) === Number(selectedAccountId);
              const bal = formatBalanceDisplay(
                acc.current_balance,
                acc.balance_side,
                isPurchaseContext
              );
              const locationParts = [acc.city_name, acc.area_name].filter(
                Boolean
              );

              return (
                <button
                  key={acc.id}
                  type="button"
                  data-account-row="true"
                  ref={(el) => {
                    rowRefs.current[idx] = el;
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => handleSelectAccount(acc)}
                  className={cn(
                    "w-full text-left px-4 md:px-5 py-2.5 transition-colors border-l-4 focus:outline-none",
                    isHighlighted
                      ? "bg-orange-50/90 dark:bg-orange-950/40 border-l-orange-500"
                      : isSelected
                      ? "bg-emerald-50/60 dark:bg-emerald-950/25 border-l-emerald-500"
                      : "border-l-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  )}
                >
                  {/* Desktop Compact Row */}
                  <div className="hidden md:grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={cn(
                            "text-xs font-black uppercase tracking-tight truncate",
                            isHighlighted
                              ? "text-orange-700 dark:text-orange-400"
                              : isSelected
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-zinc-900 dark:text-zinc-100"
                          )}
                        >
                          {acc.title}
                        </span>
                        {acc.code && (
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[9px] font-mono font-bold text-zinc-500 dark:text-zinc-400 shrink-0">
                            {acc.code}
                          </span>
                        )}
                        {isSelected && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[8px] font-black uppercase shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            Current
                          </span>
                        )}
                      </div>
                      {(locationParts.length > 0 || acc.saleman_name) && (
                        <div className="flex items-center gap-2.5 mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                          {locationParts.length > 0 && (
                            <span className="inline-flex items-center gap-1 truncate">
                              <MapPin className="w-2.5 h-2.5 shrink-0 opacity-70" />
                              {locationParts.join(" • ")}
                            </span>
                          )}
                          {acc.saleman_name && (
                            <span className="inline-flex items-center gap-1 truncate">
                              <UserIcon className="w-2.5 h-2.5 shrink-0 opacity-70" />
                              {acc.saleman_name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="col-span-2 min-w-0">
                      {acc.phone ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                          <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                          {acc.phone}
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-300 dark:text-zinc-600 font-mono">
                          —
                        </span>
                      )}
                    </div>

                    {/* TP / Markup */}
                    <div className="col-span-2 flex justify-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight border truncate max-w-full",
                          acc.tp_label &&
                            acc.tp_label !== "Retail" &&
                            acc.tp_label !== "0% Markup"
                            ? "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/60"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                        )}
                      >
                        {acc.tp_label || (isPurchaseContext ? "0%" : "Retail")}
                      </span>
                    </div>

                    {/* Previous Balance */}
                    <div className="col-span-3 text-right">
                      <span
                        className={cn(
                          "font-mono text-xs font-black",
                          bal.tone === "due"
                            ? "text-rose-600 dark:text-rose-400"
                            : bal.tone === "advance"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-zinc-400 dark:text-zinc-500"
                        )}
                      >
                        {bal.text}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Compact Card */}
                  <div className="md:hidden flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={cn(
                              "text-xs font-black uppercase truncate",
                              isHighlighted
                                ? "text-orange-700 dark:text-orange-400"
                                : "text-zinc-900 dark:text-zinc-100"
                            )}
                          >
                            {acc.title}
                          </span>
                          {acc.code && (
                            <span className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[9px] font-mono text-zinc-500">
                              {acc.code}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5 flex-wrap">
                          {acc.phone && (
                            <span className="inline-flex items-center gap-0.5 font-mono">
                              <Phone className="w-2.5 h-2.5" />
                              {acc.phone}
                            </span>
                          )}
                          {locationParts.length > 0 && (
                            <span>{locationParts.join(" • ")}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-0.5">
                        <span
                          className={cn(
                            "font-mono text-xs font-black",
                            bal.tone === "due"
                              ? "text-rose-600 dark:text-rose-400"
                              : bal.tone === "advance"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-zinc-400"
                          )}
                        >
                          {bal.text}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50">
                          {acc.tp_label || (isPurchaseContext ? "0%" : "Retail")}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer: Keyboard Hints + Server Pagination */}
        <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shrink-0 flex flex-wrap items-center justify-between gap-2">
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[9px]">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[9px]">
                Enter
              </kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[9px]">
                Esc
              </kbd>
              Close
            </span>
            {loading && (
              <span className="inline-flex items-center gap-1 text-orange-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                Updating...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.current_page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2.5 text-[11px] font-bold"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
              Prev
            </Button>
            <span className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-300 px-1">
              Page {meta.current_page} / {Math.max(1, meta.last_page)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.current_page >= meta.last_page || loading}
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              className="h-7 px-2.5 text-[11px] font-bold"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
