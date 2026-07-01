import React from "react";
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
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderItem {
  id: number;
  qty_full: number;
  qty_pcs: number;
  rate: string;
  discount_percent: string;
  net_rate: string;
  subtotal: string;
  item: {
    id: number;
    title: string;
  };
}

interface Order {
  id: number;
  order_date: string;
  total_discount: string;
  total_amount: string;
  status: string;
  supplier: {
    id: number;
    title: string;
    type?: number;
  };
  items: OrderItem[];
}

interface ShowProps {
  order: Order;
}

export default function SupplierOrderShow({ order }: ShowProps) {
  return (
    <SidebarProvider>
      <Head title={`Order #ORD-${String(order.id).padStart(4, '0')}`} />
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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin/supplier-order/list" className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300">Supplier Orders</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-zinc-900 dark:text-zinc-200 font-semibold tracking-wide">ORD-{String(order.id).padStart(4, '0')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-4">
                <Link href="/admin/supplier-order/list">
                  <Button variant="outline" size="sm" className="h-8 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 gap-2">
                    <ArrowLeft size={14} /> Back to List
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl font-black tracking-widest text-zinc-900 dark:text-white uppercase">Order #ORD-{String(order.id).padStart(4, '0')}</h1>
                  <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-0.5">Created on {order.order_date}</p>
                </div>
              </div>
              <Button 
                onClick={() => window.open(`/admin/supplier-order/${order.id}/print`, '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-widest uppercase text-xs gap-2"
              >
                <Printer size={14} /> Print Order
              </Button>
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg shadow-sm">
                <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold mb-1">
                  {order.supplier?.type === 5 ? 'Company' : 'Supplier'}
                </p>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-200">{order.supplier?.title || 'N/A'}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg shadow-sm">
                <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold mb-1">Status</p>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-widest inline-block mt-1 ${
                  order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' :
                  order.status === 'Cancelled' ? 'bg-red-500/10 text-red-600 dark:text-red-500' :
                  'bg-orange-500/10 text-orange-600 dark:text-orange-500'
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="bg-emerald-50/50 dark:bg-[#151515] border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-lg shadow-sm">
                <p className="text-xs text-emerald-600 dark:text-emerald-500/70 uppercase tracking-widest font-bold mb-1">Total Amount</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-500">Rs {Number(order.total_amount).toFixed(2)}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#1a1a1a]">
                <h2 className="text-sm font-bold tracking-widest text-zinc-700 dark:text-zinc-300 uppercase">Order Items</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] uppercase bg-zinc-50 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-500 font-black tracking-widest">
                    <tr>
                      <th className="px-4 py-3">Product Title</th>
                      <th className="px-4 py-3 text-center">Full</th>
                      <th className="px-4 py-3 text-center">Pcs</th>
                      <th className="px-4 py-3 text-right">Rate</th>
                      <th className="px-4 py-3 text-right">Disc %</th>
                      <th className="px-4 py-3 text-right">Net Rate</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={item.id} className={`border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-[#1a1a1a] ${index % 2 === 0 ? 'bg-white dark:bg-[#151515]' : 'bg-zinc-50/30 dark:bg-[#131313]'}`}>
                        <td className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-200">{item.item?.title || 'Unknown Item'}</td>
                        <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-400 font-mono">{item.qty_full}</td>
                        <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-400 font-mono">{item.qty_pcs}</td>
                        <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400 font-mono">{Number(item.rate).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400 font-mono">{Number(item.discount_percent).toFixed(2)}%</td>
                        <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-300 font-mono font-bold">{Number(item.net_rate).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-500 font-mono font-bold">{Number(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                    {order.items.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500">
                          No items found in this order.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 font-bold">
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-right text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-[10px]">
                        Total Discount
                      </td>
                      <td className="px-4 py-3 text-right text-rose-600 dark:text-red-500 font-mono">
                        -Rs {Number(order.total_discount).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[10px]">
                        Grand Total
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-500 font-mono text-lg">
                        Rs {Number(order.total_amount).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
