import React, { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

interface ItemCategoryFiltersProps {
  filters: {
    search?: string;
  };
}

const ItemCategoryFilters: React.FC<ItemCategoryFiltersProps> = ({ filters }) => {
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const debouncedSearch = useDebounce(searchValue, 500);

  const isFirstRender = React.useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debouncedSearch !== (filters.search || "")) {
      router.get(
        "/item-categories",
        { search: debouncedSearch },
        { preserveState: true, preserveScroll: true, replace: true }
      );
    }
  }, [debouncedSearch]);

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="relative w-full max-w-md group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
        </div>
        <Input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="SEARCH CATEGORIES BY NAME OR CODE..."
          className="h-12 pl-12 pr-12 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold uppercase tracking-widest text-[10px] focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/50 transition-all shadow-sm"
        />
        {searchValue && (
          <button
            onClick={() => setSearchValue("")}
            className="absolute inset-y-0 right-4 flex items-center"
          >
            <X className="h-4 w-4 text-zinc-400 hover:text-zinc-600 transition-colors" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-inner">
         <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-500" />
         <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 opacity-60">Filters Auto-Applied</span>
      </div>
    </div>
  );
};

export default ItemCategoryFilters;
