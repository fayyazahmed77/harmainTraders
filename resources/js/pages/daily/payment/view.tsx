import React from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Printer, Download, MapPin, Phone, Mail, Globe, ChevronRight } from 'lucide-react';
import { route } from 'ziggy-js';

  // Convert amount to words (simple formatter)
  const formatAmountInWords = (amount: number): string => {
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} rupees only`;
  };
  interface Payment {
  id: number;
  voucher_number: string;
  voucher_date: string;
  received_from: string;
  method: string;
  cheque_number: string | null;
  cheque_date: string | null;
  account: string;
  total_amount: number;
  amount_in_words: string;
  status: "pending" | "received" | "bounced";
  prepared_by: string;
  remarks: string | null;
  allocations: {
    ref: string;
    invoice_ref: string;
    date: string;
    invoice_total: number;
    amount_applied: number;
  }[];
  company: {
    name: string;
    tagline: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
}

interface Props {
  payment: any;
  mode?: string;
}

const defaultPayment: Payment = {
  id: 132,
  voucher_number: "CRV-0058",
  voucher_date: "16 May 2026",
  received_from: "SAFDASF",
  method: "Cheque",
  cheque_number: "aasd667",
  cheque_date: null,
  account: "Cheque in hand",
  total_amount: 2052.00,
  amount_in_words: formatAmountInWords(2052.00),
  status: "pending",
  prepared_by: "Fayyaz Ahmed",
  remarks: null,
  allocations: [
    {
      ref: "Sales #119",
      invoice_ref: "INV-0119",
      date: "16 May 2026",
      invoice_total: 2052.00,
      amount_applied: 2052.00
    }
  ],
  company: {
    name: "Harmain Traders",
    tagline: "Wholesale & Supply Chain",
    address: "Karachi, Pakistan",
    phone: "+92 300 0000000",
    email: "info@harmaintraders.com",
    website: "aishtycoons.agency"
  }
};

const VoucherCard = ({ payment }: { payment: Payment }) => {
  return (
    <div className="max-w-3xl mx-auto bg-white  rounded-xl border-[0.5px] border-[#dddddd] shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none relative select-none">
      {/* Dynamic diagonal watermark text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
        <div className="text-[72px] font-medium tracking-[0.25em] text-[rgba(0,80,0,0.03)] transform -rotate-[30deg] uppercase">
          {payment.status === 'received' ? 'RECEIVED' : payment.status === 'bounced' ? 'BOUNCED' : 'PENDING'}
        </div>
      </div>

      <div className="relative z-10">
        {/* HEADER BAND */}
        <div className="bg-[#1a2b4a] px-9 py-7 flex justify-between items-start">
          {/* Company Identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#e07b1a] rounded-lg flex items-center justify-center text-[18px] font-medium text-white select-none">
              H
            </div>
            <div>
              <div className="text-[15px] font-medium text-white leading-tight">
                {payment.company?.name}
              </div>
              <div className="text-[11px] text-[#8fa3c0] mt-0.5 font-normal">
                {payment.company?.tagline}
              </div>
            </div>
          </div>

          {/* Voucher Identity */}
          <div className="text-right">
            <div className="text-[20px] font-medium text-white leading-none">
              Payment Voucher
            </div>
            <div className="text-[11px] text-[#8fa3c0] mt-1 font-normal">
              Receipt Voucher
            </div>
            <div className="text-[13px] font-medium text-[#e07b1a] mt-2">
              {payment.voucher_number}
            </div>
            <div className="text-[11px] text-[#8fa3c0] mt-0.5 font-normal">
              Date: {payment.voucher_date}
            </div>
          </div>
        </div>

        {/* STATUS BAR */}
        <div className="bg-[#f0f4fa] border-b-[0.5px] border-[#e0e8f0] px-9 py-2.5 flex justify-between items-center">
          <div>
            {payment.status === 'pending' && (
              <span className="inline-flex items-center gap-1.5 bg-[#fef3c7] text-[#92400e] rounded px-3 py-1 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                Pending clearance
              </span>
            )}
            {payment.status === 'received' && (
              <span className="inline-flex items-center gap-1.5 bg-[#d1fae5] text-[#065f46] rounded px-3 py-1 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                Received
              </span>
            )}
            {payment.status === 'bounced' && (
              <span className="inline-flex items-center gap-1.5 bg-[#fee2e2] text-[#991b1b] rounded px-3 py-1 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                Bounced
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#888888] font-normal">
            {payment.method} &middot; {payment.cheque_number || "N/A"} &middot; {payment.account} Account
          </div>
        </div>

        {/* VOUCHER BODY */}
        <div className="px-9 py-8 flex flex-col gap-6">
          {/* SECTION A: RECEIVED FROM + PAYMENT DETAILS */}
          <div className="grid grid-cols-2 gap-8">
            {/* Left Col: Received From */}
            <div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-[#888888] border-b-[0.5px] border-[#eeeeee] pb-1.5 mb-2.5">
                Received From
              </div>
              <div className="flex flex-col gap-0.5 mb-2.5">
                <span className="text-[10px] font-normal uppercase tracking-wider text-[#aaaaaa]">Party Name</span>
                <span className="text-[16px] font-medium text-[#1a2b4a]">{payment.received_from}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-normal uppercase tracking-wider text-[#aaaaaa]">Customer Type</span>
                <span className="text-[13px] text-[#666666] font-normal">Trade Customer</span>
              </div>
            </div>

            {/* Right Col: Payment Details */}
            <div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-[#888888] border-b-[0.5px] border-[#eeeeee] pb-1.5 mb-2.5">
                Payment Details
              </div>
              <div className="grid grid-cols-2 gap-y-2.5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-normal uppercase tracking-wider text-[#aaaaaa]">Method</span>
                  <span className="text-[13px] font-medium text-[#1a2b4a]">{payment.method}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-normal uppercase tracking-wider text-[#aaaaaa]">Cheque #</span>
                  <span className="text-[13px] font-medium text-[#666666]">{payment.cheque_number || "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-normal uppercase tracking-wider text-[#aaaaaa]">Cheque Date</span>
                  {payment.cheque_date ? (
                    <span className="text-[13px] font-medium text-[#1a1a2e]">{payment.cheque_date}</span>
                  ) : (
                    <span className="text-[13px] text-[#aaaaaa] italic font-normal">— not specified —</span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-normal uppercase tracking-wider text-[#aaaaaa]">Account</span>
                  <span className="text-[13px] font-medium text-[#1a2b4a]">{payment.account}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B: AMOUNT BAND */}
          <div className="bg-[#f8f9fc] border-[0.5px] border-[#e5eaf5] rounded-lg px-6 py-4 flex justify-between items-center relative overflow-hidden">
            <div>
              <div className="text-[12px] font-medium uppercase tracking-wider text-[#888888]">
                Total Amount Received
              </div>
              <div className="text-[11px] text-[#aaaaaa] italic mt-1 font-normal">
                {payment.amount_in_words}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#aaaaaa] text-right mb-1 block uppercase tracking-wider font-normal">
                PKR
              </span>
              <span className="text-[28px] font-medium text-[#1a2b4a] text-right leading-none block">
                {Number(payment.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* SECTION C: PAYMENT ALLOCATION TABLE */}
          <div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-[#888888] border-b-[0.5px] border-[#eeeeee] pb-1.5 mb-2.5">
              Payment Allocation
            </div>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#f5f7fb]">
                  <th className="text-[10px] font-medium uppercase tracking-wider text-[#888888] px-3 py-2 text-left w-12">#</th>
                  <th className="text-[10px] font-medium uppercase tracking-wider text-[#888888] px-3 py-2 text-left">Bill Type / Reference</th>
                  <th className="text-[10px] font-medium uppercase tracking-wider text-[#888888] px-3 py-2 text-left">Invoice Date</th>
                  <th className="text-[10px] font-medium uppercase tracking-wider text-[#888888] px-3 py-2 text-right">Invoice Total</th>
                  <th className="text-[10px] font-medium uppercase tracking-wider text-[#888888] px-3 py-2 text-right">Amount Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeeee]">
                {payment.allocations?.map((alloc, idx) => (
                  <tr key={idx} className="border-b-[0.5px] border-[#f0f0f0] hover:bg-[#fafafa] transition-colors">
                    <td className="text-[11px] text-[#aaaaaa] px-3 py-2.5 font-normal">{String(idx + 1).padStart(2, '0')}</td>
                    <td className="px-3 py-2.5">
                      <div className="text-[12px] font-medium text-[#1a2b4a]">{alloc.ref}</div>
                      <div className="text-[10px] text-[#aaaaaa] mt-0.5 font-normal">{alloc.invoice_ref}</div>
                    </td>
                    <td className="text-[#888888] px-3 py-2.5 font-normal">{alloc.date}</td>
                    <td className="text-[#555555] text-right px-3 py-2.5 font-normal">
                      {Number(alloc.invoice_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="font-medium text-[#1a2b4a] text-right px-3 py-2.5">
                      {Number(alloc.amount_applied).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#f5f7fb] border-t-[0.5px] border-[#dde3f0]">
                  <td colSpan={3} className="text-[11px] text-[#888888] px-3 py-2.5 font-normal">Total Allocated</td>
                  <td className="px-3 py-2.5 text-right font-normal"></td>
                  <td className="text-[12px] font-medium text-[#1a2b4a] text-right px-3 py-2.5">
                    PKR {Number(payment.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* SECTION D: REMARKS BOX */}
          <div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-[#888888] border-b-[0.5px] border-[#eeeeee] pb-1.5 mb-2.5">
              Remarks
            </div>
            <div className="bg-[#f8f9fc] border-[0.5px] border-[#eeeeee] rounded-md px-3.5 py-2.5 min-h-[44px] flex items-center">
              {payment.remarks ? (
                <div className="text-[12px] text-[#1a1a2e] font-normal">{payment.remarks}</div>
              ) : (
                <div className="text-[12px] text-[#aaaaaa] italic font-normal">No remarks added.</div>
              )}
            </div>
          </div>

          {/* SECTION E: SIGNATURES ROW */}
          <div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-[#888888] border-b-[0.5px] border-[#eeeeee] pb-1.5 mb-2.5">
              Authorisation
            </div>
            <div className="grid grid-cols-3 gap-6 pt-2">
              <div className="flex flex-col items-center">
                <div className="h-9 flex items-end justify-center text-[11px] text-[#555555] pb-1 select-none font-normal">
                  {payment.prepared_by}
                </div>
                <div className="w-full h-[1px] bg-[#dddddd]" />
                <div className="text-[10px] font-medium uppercase tracking-wider text-[#aaaaaa] mt-1.5">Prepared By</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-9" />
                <div className="w-full h-[1px] bg-[#dddddd]" />
                <div className="text-[10px] font-medium uppercase tracking-wider text-[#aaaaaa] mt-1.5">Authorised Signature</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-9" />
                <div className="w-full h-[1px] bg-[#dddddd]" />
                <div className="text-[10px] font-medium uppercase tracking-wider text-[#aaaaaa] mt-1.5">Receiver Signature</div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-[#f8f9fc] border-t-[0.5px] border-[#e8ecf5] px-9 py-4.5 flex justify-between items-center select-none">
          {/* Contact Details Row */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <MapPin size={13} strokeWidth={1.5} className="text-[#1a2b4a]" />
              <span className="text-[11px] text-[#888888] font-normal">{payment.company?.address}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone size={13} strokeWidth={1.5} className="text-[#1a2b4a]" />
              <span className="text-[11px] text-[#888888] font-normal">{payment.company?.phone}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail size={13} strokeWidth={1.5} className="text-[#1a2b4a]" />
              <span className="text-[11px] text-[#888888] font-normal">{payment.company?.email}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe size={13} strokeWidth={1.5} className="text-[#1a2b4a]" />
              <span className="text-[11px] text-[#888888] font-normal">{payment.company?.website}</span>
            </div>
          </div>

          {/* Document Note */}
          <div className="text-right leading-relaxed">
            <div className="text-[10px] text-[#bbbbbb] font-normal">This is a computer-generated document.</div>
            <div className="text-[10px] text-[#bbbbbb] mt-0.5 font-normal">
              {payment.voucher_number} &middot; {payment.voucher_date}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PaymentView({ payment, mode }: Props) {
  const isPrint = mode === 'print';
  const pageProps = usePage().props as any;
  const currentPayment = payment || pageProps.payment;

  // Map dynamic props to local interface, falling back to defaultPayment structure
  const p: Payment = {
    id: currentPayment?.id ?? defaultPayment.id,
    voucher_number: currentPayment?.voucher_number ?? currentPayment?.voucher_no ?? defaultPayment.voucher_number,
    voucher_date: currentPayment?.voucher_date ?? currentPayment?.date ?? defaultPayment.voucher_date,
    received_from: currentPayment?.received_from ?? currentPayment?.account?.title ?? defaultPayment.received_from,
    method: currentPayment?.method ?? currentPayment?.payment_method ?? defaultPayment.method,
    cheque_number: currentPayment?.cheque_number !== undefined && currentPayment?.cheque_number !== null 
      ? currentPayment.cheque_number 
      : (currentPayment?.cheque_no ?? defaultPayment.cheque_number),
    cheque_date: currentPayment?.cheque_date !== undefined && currentPayment?.cheque_date !== null 
      ? currentPayment.cheque_date 
      : (currentPayment?.cheque_date ?? defaultPayment.cheque_date),
    account: currentPayment?.account_name ?? currentPayment?.payment_account?.title ?? defaultPayment.account,
    total_amount: currentPayment?.total_amount !== undefined 
      ? Number(currentPayment.total_amount) 
      : (currentPayment?.amount ? Number(currentPayment.amount) : defaultPayment.total_amount),
    amount_in_words: currentPayment?.amount_in_words ?? defaultPayment.amount_in_words,
    status: (currentPayment?.status?.toLowerCase() as any) ?? defaultPayment.status,
    prepared_by: currentPayment?.prepared_by ?? defaultPayment.prepared_by,
    remarks: currentPayment?.remarks !== undefined ? currentPayment.remarks : defaultPayment.remarks,
    allocations: Array.isArray(currentPayment?.allocations) && currentPayment.allocations.length > 0
      ? currentPayment.allocations.map((alloc: any) => ({
          ref: alloc.ref ?? (alloc.bill_type ? `${alloc.bill_type.split('\\').pop()} #${alloc.bill_id}` : "Sales #119"),
          invoice_ref: alloc.invoice_ref ?? (alloc.bill_id ? `INV-${String(alloc.bill_id).padStart(4, '0')}` : "INV-0119"),
          date: alloc.date ?? currentPayment?.date ?? defaultPayment.voucher_date,
          invoice_total: alloc.invoice_total !== undefined ? Number(alloc.invoice_total) : (alloc.amount ? Number(alloc.amount) : defaultPayment.total_amount),
          amount_applied: alloc.amount_applied !== undefined ? Number(alloc.amount_applied) : (alloc.amount ? Number(alloc.amount) : defaultPayment.total_amount)
        }))
      : defaultPayment.allocations,
    company: {
      name: currentPayment?.company?.name ?? defaultPayment.company.name,
      tagline: currentPayment?.company?.tagline ?? defaultPayment.company.tagline,
      address: currentPayment?.company?.address ?? defaultPayment.company.address,
      phone: currentPayment?.company?.phone ?? defaultPayment.company.phone,
      email: currentPayment?.company?.email ?? defaultPayment.company.email,
      website: currentPayment?.company?.website ?? defaultPayment.company.website
    }
  };

  const handlePrint = () => {
  const url = route('payments.pdf', currentPayment?.id);
  if (!url) return;
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    // Wait until content loads before printing
    printWindow.addEventListener('load', () => {
      printWindow.print();
    });
  }
};

  if (isPrint) {
    return (
      <div className="min-h-screen bg-white p-8">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            header,
            aside,
            [data-sidebar="sidebar"],
            [data-sidebar="trigger"],
            [data-sidebar="rail"],
            .print\:hidden {
              display: none !important;
            }
            @page {
              margin: 0 !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
            [data-slot="sidebar-wrapper"],
            [data-slot="sidebar-inset"],
            main,
            .sidebar-inset,
            .min-h-screen {
              margin: 0 !important;
              padding: 0 !important;
              min-height: 0 !important;
              height: auto !important;
              border: none !important;
              box-shadow: none !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}} />
        <VoucherCard payment={p} />
        <script dangerouslySetInnerHTML={{ __html: 'window.print()' }} />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={[
          { title: "Payments", href: "/payment" },
          { title: p.voucher_number, href: `/payment/${p.id}` }
        ]} />

        {/* Global style tag for printing color preservation */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            header,
            aside,
            [data-sidebar="sidebar"],
            [data-sidebar="trigger"],
            [data-sidebar="rail"],
            .print\:hidden {
              display: none !important;
            }
            @page {
              margin: 0 !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
            [data-slot="sidebar-wrapper"],
            [data-slot="sidebar-inset"],
            main,
            .sidebar-inset,
            .min-h-screen {
              margin: 0 !important;
              padding: 0 !important;
              min-height: 0 !important;
              height: auto !important;
              border: none !important;
              box-shadow: none !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}} />

        {/* Outer Page Container */}
        <div className="min-h-screen bg-[#f0f0ed] dark:bg-[#080706] print:bg-white p-6 space-y-6 print:p-0 print:space-y-0">
          
          {/* PAGE ACTION BAR */}
          <div className="flex justify-between items-center bg-[#f0f0ed] dark:bg-[#080706] px-6 py-4 print:hidden">
            {/* LEFT: Back Button */}
            <Link 
              href="/payment" 
              className="inline-flex items-center gap-2 bg-white border-[0.5px] border-[#dddddd] rounded-lg px-3 py-1.5 text-[13px] text-[#555555] hover:bg-[#f5f5f5] transition-colors font-medium"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              Back to payments
            </Link>

            {/* CENTER: Breadcrumb Trail */}
            <div className="flex items-center gap-1 text-[11px] text-[#888888] font-normal">
              <Link href="/payment" className="text-[#1a2b4a] hover:underline font-medium">
                Payments
              </Link>
              <ChevronRight size={11} strokeWidth={1.5} className="text-[#888888]" />
              <span>{p.voucher_number}</span>
            </div>

            {/* RIGHT: Action Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrint}
                className="inline-flex items-center gap-2 bg-white border-[0.5px] border-[#cccccc] rounded-lg px-4 py-1.5 text-[12px] font-medium text-[#333333] hover:bg-[#f5f5f5] transition-colors"
              >
                <Printer size={14} strokeWidth={1.5} />
                Print
              </button>
              
              <button 
                onClick={() => {
                  if (currentPayment?.id) {
                    window.location.href = route('payments.pdf', currentPayment.id);
                  } else {
                    window.print();
                  }
                }}
                className="inline-flex items-center gap-2 bg-[#1a2b4a] text-white rounded-lg px-4 py-1.5 text-[12px] font-medium hover:bg-[#142238] transition-colors border-none"
              >
                <Download size={14} strokeWidth={1.5} />
                Download PDF
              </button>
            </div>
          </div>

          {/* VOUCHER CARD */}
          <div className="print:p-0">
            <VoucherCard payment={p} />
          </div>
          
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

