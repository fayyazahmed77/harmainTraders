import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Eye, Printer, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Order {
  id: number;
  order_date: string;
  total_discount: string;
  total_amount: string;
  status: string;
  items_count: number;
  supplier: {
    id: number;
    title: string;
  };
}

interface ListProps {
  orders: Order[];
}

export default function SupplierOrdersList({ orders }: ListProps) {
  const [search, setSearch] = useState("");

  const filteredOrders = orders.filter(order => 
    order.supplier?.title.toLowerCase().includes(search.toLowerCase()) || 
    String(order.id).includes(search)
  );

  return (
    <SidebarProvider>
      <Head title="Supplier Orders List" />
      <AppSidebar />
      <SidebarInset className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4">
          <SidebarTrigger className="-ml-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-zinc-200 dark:bg-zinc-800" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#" className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300">Orders</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-zinc-900 dark:text-zinc-200 font-semibold tracking-wide">Supplier Orders List</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-6">
            
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black tracking-widest text-zinc-900 dark:text-white uppercase">Supplier Orders</h1>
                <p className="text-zinc-500 text-sm mt-1">Manage and track your historical supplier stock orders.</p>
              </div>
              <Link href="/admin/supplier-order">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white font-bold tracking-widest uppercase text-xs">
                  Create New Order
                </Button>
              </Link>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden flex flex-col shadow-sm">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/50">
                <div className="relative w-72">
                  <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                  <Input 
                    placeholder="Search supplier or order #" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-orange-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-50 dark:bg-zinc-950">
                    <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-500 dark:text-zinc-400 font-black tracking-widest uppercase text-[10px]">Order #</TableHead>
                      <TableHead className="text-zinc-500 dark:text-zinc-400 font-black tracking-widest uppercase text-[10px]">Supplier Name</TableHead>
                      <TableHead className="text-center text-zinc-500 dark:text-zinc-400 font-black tracking-widest uppercase text-[10px]">Total Items</TableHead>
                      <TableHead className="text-zinc-500 dark:text-zinc-400 font-black tracking-widest uppercase text-[10px]">Order Date</TableHead>
                      <TableHead className="text-right text-zinc-500 dark:text-zinc-400 font-black tracking-widest uppercase text-[10px]">Total Discount</TableHead>
                      <TableHead className="text-right text-zinc-500 dark:text-zinc-400 font-black tracking-widest uppercase text-[10px]">Total Amount</TableHead>
                      <TableHead className="text-center text-zinc-500 dark:text-zinc-400 font-black tracking-widest uppercase text-[10px]">Status</TableHead>
                      <TableHead className="text-right text-zinc-500 dark:text-zinc-400 font-black tracking-widest uppercase text-[10px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id} className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-[#1a1a1a]">
                          <TableCell className="font-mono text-zinc-600 dark:text-zinc-300">ORD-{String(order.id).padStart(4, '0')}</TableCell>
                          <TableCell className="font-bold text-zinc-900 dark:text-zinc-100">{order.supplier?.title || 'Unknown'}</TableCell>
                          <TableCell className="text-center font-bold text-zinc-600 dark:text-zinc-300">{order.items_count}</TableCell>
                          <TableCell className="text-zinc-500 dark:text-zinc-400">{order.order_date}</TableCell>
                          <TableCell className="text-right text-rose-600 dark:text-red-400 font-mono">-Rs {Number(order.total_discount).toFixed(2)}</TableCell>
                          <TableCell className="text-right text-emerald-600 dark:text-emerald-500 font-bold font-mono">Rs {Number(order.total_amount).toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              order.status === 'Cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              'bg-orange-500/10 text-orange-500 border-orange-500/20'
                            }`}>
                              {order.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Link href={`/admin/supplier-order/${order.id}/show`}>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                                  <Eye size={16} />
                                </Button>
                              </Link>
                              <Button 
                                onClick={() => window.open(`/admin/supplier-order/${order.id}/print`, '_blank')}
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              >
                                <Printer size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center text-zinc-500">
                          No orders found matching your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
