import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { Search, Filter, X, Calendar as CalendarIcon,RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface FilterProps {
    filters: {
        start_date?: string;
        end_date?: string;
        account_id?: string;
        type?: string;
        payment_method?: string;
    };
    accounts: {
        id: number;
        title: string;
        type: string;
    }[];
}

export default function PaymentFilters({ filters, accounts }: FilterProps) {
    const [date, setDate] = useState<DateRange | undefined>({
        from: filters.start_date ? new Date(filters.start_date) : undefined,
        to: filters.end_date ? new Date(filters.end_date) : undefined,
    });
    const [accountId, setAccountId] = useState(filters.account_id || "all");
    const [type, setType] = useState(filters.type || "all");
    const [method, setMethod] = useState(filters.payment_method || "all");

    const applyFilters = () => {
        router.get(
            "/payments",
            {
                start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
                end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
                account_id: accountId === "all" ? "" : accountId,
                type: type === "all" ? "" : type,
                payment_method: method === "all" ? "" : method,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const clearFilters = () => {
        setDate(undefined);
        setAccountId("all");
        setType("all");
        setMethod("all");
        router.get("/payments");
    };

    return (
        <div className="p-4 rounded-lg shadow-sm border mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">

            {/* Date Range Picker */}
            <div className="flex-1 min-w-[200px]">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                                date.to ? (
                                    <>
                                        {format(date.from, "LLL dd, y")} -{" "}
                                        {format(date.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(date.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
            </div>


            {/* Account Filter */}
            <div className="flex-1 min-w-[180px]">
                <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Accounts</SelectItem>
                        {accounts.map((account) => (
                            <SelectItem key={account.id} value={String(account.id)}>
                                {account.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Type Filter */}
            <div className="flex-1 min-w-[150px]">
                <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="RECEIPT">Receipt</SelectItem>
                        <SelectItem value="PAYMENT">Payment</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Method Filter */}
            <div className="flex-1 min-w-[150px]">
                <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pay Method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank">Bank</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="Online Transfer">Online Transfer</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <Button onClick={applyFilters} className="bg-primary hover:bg-primary/90">
                    <Filter className="mr-2 h-4 w-4" /> Apply
                </Button>
                <Button variant="outline" onClick={clearFilters} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
