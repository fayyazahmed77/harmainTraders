import React, { useState } from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Link, usePage } from '@inertiajs/react';
import {
  ArrowLeft, Printer, Download, MapPin, Phone, Mail, Globe,
  Copy, Check, Building2, CreditCard, FileText, TrendingUp,
  Calendar, Hash, User, Banknote, ReceiptText, ChevronRight,
  AlertCircle, CheckCircle2, XCircle, Clock, Minus
} from 'lucide-react';
import { route } from 'ziggy-js';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface Allocation {
  ref: string;
  invoice_ref: string;
  date: string;
  invoice_total: number;
  amount_applied: number;
  bill_id?: number;
  bill_type?: string;
}

interface Payment {
  id: number;
  voucher_number: string;
  voucher_date: string;
  received_from: string;       // party name (customer / supplier / expense)
  party_label: string;         // "Received From" | "Paid To"
  account_type_label: string;  // e.g. "Customer", "Supplier", "Expense"
  method: string;
  cheque_number: string | null;
  cheque_date: string | null;
  clear_date: string | null;
  cheque_status: string | null;
  account: string;
  total_amount: number;
  amount: number;
  discount: number;
  amount_in_words: string;
  status: string;
  type: string;                // 'RECEIPT' | 'PAYMENT'
  prepared_by: string;
  remarks: string | null;
  message_line: string | null; // Communication line
  allocations: Allocation[];
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
  payment?: any;
  mode?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const formatDate = (d: string | null | undefined): string => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatPKR = (n: number): string =>
  Number(n).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const printedAt = new Date().toLocaleString('en-GB', {
  day: '2-digit', month: 'long', year: 'numeric',
  hour: '2-digit', minute: '2-digit'
});

// ─────────────────────────────────────────────────────────────────────────────
// NUMBER → WORDS (PKR)
// ─────────────────────────────────────────────────────────────────────────────
const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

function words(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + words(n % 100) : '');
  if (n < 100000) return words(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + words(n % 1000) : '');
  if (n < 10000000) return words(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + words(n % 100000) : '');
  return words(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + words(n % 10000000) : '');
}

function numberToWords(amount: number): string {
  const n = Math.round(amount);
  const paisas = Math.round((amount - n) * 100);
  let result = (words(n) || 'Zero') + ' Rupees';
  if (paisas > 0) result += ' and ' + words(paisas) + ' Paisas';
  return result + ' Only';
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT (fallback)
// ─────────────────────────────────────────────────────────────────────────────
const defaultPayment: Payment = {
  id: 66,
  voucher_number: 'CRV-0066',
  voucher_date: '01 July 2026',
  received_from: 'SAFDASF Trading Co.',
  party_label: 'Received From',
  account_type_label: 'Customer',
  method: 'Cheque',
  cheque_number: 'CHQ-88776',
  cheque_date: '01 July 2026',
  clear_date: null,
  cheque_status: 'Pending',
  account: 'Cheque in Hand',
  total_amount: 60000,
  amount: 60000,
  discount: 0,
  amount_in_words: 'Sixty Thousand Rupees Only',
  status: 'pending',
  type: 'RECEIPT',
  prepared_by: 'Fayyaz Ahmed',
  remarks: null,
  message_line: null,
  allocations: [
    { ref: 'Sales #119', invoice_ref: 'INV-0119', date: '2026-06-15', invoice_total: 70000, amount_applied: 60000 },
  ],
  company: {
    name: 'Harmain Traders',
    tagline: 'Wholesale & Supply Chain ERP',
    address: 'Karachi, Pakistan',
    phone: '+92 300 0000000',
    email: 'info@harmaintraders.com',
    website: 'aishtycoons.agency',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// COPY BUTTON
// ─────────────────────────────────────────────────────────────────────────────
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={copy}
      className="ml-1.5 inline-flex items-center justify-center h-5 w-5 rounded text-[#94a3b8] hover:text-[#1e3a8a] hover:bg-[#eff6ff] transition-all"
      title="Copy"
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
function getStatusConfig(status: string, chequeStatus: string | null, method?: string) {
  const cs = (chequeStatus || '').toLowerCase();
  const s  = (status  || '').toLowerCase();
  const m  = (method  || '').toLowerCase();

  // Cash is always immediately cleared — no cheque clearance cycle
  if (m === 'cash')
    return { label: 'Cleared', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 };
  if (cs === 'cancelled' || cs === 'canceled')
    return { label: 'Cancelled', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400', icon: XCircle };
  if (cs === 'bounced' || s === 'bounced')
    return { label: 'Bounced', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', icon: XCircle };
  if (cs === 'distributed')
    return { label: 'Distributed', color: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500', icon: CheckCircle2 };
  if (cs === 'cleared' || s === 'received' || s === 'cleared')
    return { label: 'Cleared', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 };
  if (cs === 'in hand')
    return { label: 'In Hand', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', icon: Clock };
  // pending / default
  return { label: 'Pending Clearance', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', icon: Clock };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADING
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-4 w-0.5 rounded-full bg-[#1e3a8a]" />
      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#1e3a8a]">{children}</span>
      <div className="flex-1 h-px bg-[#e2e8f0]" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INFO ROW
// ─────────────────────────────────────────────────────────────────────────────
function InfoRow({
  label, value, copyable, mono = false, highlight = false, empty = false
}: {
  label: string; value: string; copyable?: boolean; mono?: boolean; highlight?: boolean; empty?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#94a3b8]">{label}</span>
      <span className={`text-[13px] flex items-center ${highlight ? 'font-bold text-[#1e3a8a]' : 'font-medium text-[#334155]'} ${mono ? 'font-mono' : ''} ${empty ? 'text-[#94a3b8] italic font-normal text-[12px]' : ''}`}>
        {value}
        {copyable && !empty && <CopyButton value={value} />}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN VOUCHER CARD
// ─────────────────────────────────────────────────────────────────────────────
const VoucherCard = ({ p }: { p: Payment }) => {
  const statusConfig = getStatusConfig(p.status, p.cheque_status, p.method);
  const StatusIcon = statusConfig.icon;

  // Financial calculations
  const invoiceTotal = p.allocations.reduce((s, a) => s + a.invoice_total, 0);
  const totalApplied = p.allocations.reduce((s, a) => s + a.amount_applied, 0);
  const outstandingBefore = invoiceTotal - (totalApplied - p.total_amount); // before this payment
  const remainingBalance = invoiceTotal - totalApplied;
  const paidPct = invoiceTotal > 0 ? Math.min(100, Math.round((totalApplied / invoiceTotal) * 100)) : 0;
  const isFullyPaid = remainingBalance <= 0.01;
  const isOverpaid = remainingBalance < -0.01;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-[#e2e8f0] shadow-xl shadow-slate-200/60 overflow-hidden print:shadow-none print:border-none print:rounded-none relative select-none">

      {/* ── Watermark ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
        <div className={`text-[80px] font-black tracking-[0.25em] transform -rotate-[28deg] uppercase ${
          isFullyPaid ? 'text-emerald-500/[0.04]' : p.status === 'bounced' || p.cheque_status?.toLowerCase() === 'bounced' ? 'text-red-500/[0.04]' : 'text-slate-400/[0.04]'
        }`}>
          {isFullyPaid ? 'PAID' : p.status === 'bounced' ? 'BOUNCED' : 'PENDING'}
        </div>
      </div>

      <div className="relative z-10">

        {/* ══════════════════════════════════════════════════════════════════
            HEADER
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#1d4ed8] px-8 py-7">
          <div className="flex justify-between items-start gap-6">

            {/* Company Identity */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center text-[22px] font-black text-white shadow-inner">
                H
              </div>
              <div>
                <div className="text-[16px] font-bold text-white leading-tight tracking-tight">
                  {p.company?.name}
                </div>
                <div className="text-[11px] text-blue-200 mt-0.5 font-medium tracking-wide">
                  {p.company?.tagline}
                </div>
              </div>
            </div>

            {/* Voucher Identity — Centre */}
            <div className="flex flex-col items-center text-center">
              <div className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5 px-3 py-0.5 rounded-full border ${
                p.type === 'RECEIPT'
                  ? 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10'
                  : 'text-rose-300 border-rose-400/40 bg-rose-400/10'
              }`}>
                {p.type === 'RECEIPT' ? '↓ Cash Receipt' : '↑ Cash Payment'}
              </div>
              <div className="text-[26px] font-black text-white leading-none tracking-tight">
                {p.type === 'RECEIPT' ? 'RECEIPT VOUCHER' : 'PAYMENT VOUCHER'}
              </div>
            </div>

            {/* Right meta */}
            <div className="text-right flex flex-col gap-1.5 min-w-[160px]">
              <div className="inline-flex items-center justify-end gap-1.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${statusConfig.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                  {statusConfig.label}
                </span>
              </div>
              <div className="inline-flex items-center justify-end gap-1.5 bg-white/10 border border-white/20 rounded-lg px-2.5 py-1">
                <CreditCard size={11} className="text-blue-200" />
                <span className="text-[11px] font-bold text-white">{p.method}</span>
              </div>
              <div>
                <div className="text-[10px] text-blue-300 uppercase tracking-wider">Voucher No</div>
                <div className="text-[16px] font-black text-[#fbbf24] tracking-wide font-mono">{p.voucher_number}</div>
              </div>
              <div>
                <div className="text-[10px] text-blue-300 uppercase tracking-wider">Date</div>
                <div className="text-[12px] font-semibold text-white">{formatDate(p.voucher_date)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SUMMARY CARDS
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-4 border-b border-[#e2e8f0]">
          {/* Card 1: Payment Amount */}
          <div className="px-6 py-5 border-r border-[#e2e8f0]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Banknote size={14} className="text-emerald-600" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Payment Amount</span>
            </div>
            <div className="text-[10px] text-[#94a3b8] font-medium">PKR</div>
            <div className="text-[22px] font-black text-emerald-600 leading-tight">{formatPKR(p.total_amount)}</div>
            {p.discount > 0 && (
              <div className="text-[10px] text-[#94a3b8] mt-0.5">Disc: PKR {formatPKR(p.discount)}</div>
            )}
          </div>

          {/* Card 2: Invoice Total */}
          <div className="px-6 py-5 border-r border-[#e2e8f0]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                <FileText size={14} className="text-orange-500" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Invoice Total</span>
            </div>
            <div className="text-[10px] text-[#94a3b8] font-medium">PKR</div>
            <div className="text-[22px] font-black text-orange-500 leading-tight">{formatPKR(invoiceTotal)}</div>
            <div className="text-[10px] text-[#94a3b8] mt-0.5">{p.allocations.length} invoice{p.allocations.length !== 1 ? 's' : ''}</div>
          </div>

          {/* Card 3: Remaining Balance */}
          <div className="px-6 py-5 border-r border-[#e2e8f0]">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isFullyPaid ? 'bg-emerald-50' : isOverpaid ? 'bg-blue-50' : 'bg-amber-50'}`}>
                <TrendingUp size={14} className={isFullyPaid ? 'text-emerald-600' : isOverpaid ? 'text-blue-600' : 'text-amber-500'} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Remaining</span>
            </div>
            <div className="text-[10px] text-[#94a3b8] font-medium">PKR</div>
            <div className={`text-[22px] font-black leading-tight ${isFullyPaid ? 'text-emerald-600' : isOverpaid ? 'text-blue-600' : 'text-amber-600'}`}>
              {formatPKR(Math.abs(remainingBalance))}
            </div>
            <div className={`text-[10px] mt-0.5 font-bold uppercase tracking-wider ${isFullyPaid ? 'text-emerald-500' : isOverpaid ? 'text-blue-500' : 'text-amber-500'}`}>
              {isFullyPaid ? 'Fully Paid' : isOverpaid ? 'Credit Balance' : 'Outstanding'}
            </div>
          </div>

          {/* Card 4: Payment Method */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                <CreditCard size={14} className="text-violet-600" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Payment Method</span>
            </div>
            <div className="text-[15px] font-black text-[#1e3a8a] leading-tight">{p.method}</div>
            {p.cheque_number && (
              <div className="text-[11px] text-[#64748b] font-mono mt-0.5">{p.cheque_number}</div>
            )}
            <div className={`mt-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md inline-block border ${statusConfig.color}`}>
              {statusConfig.label}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            BODY
        ══════════════════════════════════════════════════════════════════ */}
        <div className="px-8 py-7 flex flex-col gap-7">

          {/* ── SECTION A: Customer + Payment Info ── */}
          <div className="grid grid-cols-2 gap-8">

            {/* LEFT: Party Panel */}
            <div>
              <SectionHeading>{p.party_label}</SectionHeading>
              <div className="flex flex-col gap-3">
                {/* Transaction Type Banner */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold border w-fit ${
                  p.type === 'RECEIPT'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    p.type === 'RECEIPT' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`} />
                  {p.type === 'RECEIPT' ? 'RECEIPT — Money Received' : 'PAYMENT — Money Paid Out'}
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#94a3b8]">
                    {p.party_label}
                  </span>
                  <div className="flex items-center mt-0.5">
                    <span className="text-[18px] font-black text-[#1e3a8a] tracking-tight">{p.received_from}</span>
                    <CopyButton value={p.received_from} />
                  </div>
                </div>

                <InfoRow
                  label="Account Type"
                  value={p.account_type_label}
                  empty={!p.account_type_label || p.account_type_label === '—'}
                />

                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#94a3b8]">Transaction Flow</span>
                  <span className={`text-[12px] font-bold ${
                    p.type === 'RECEIPT' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {p.type === 'RECEIPT'
                      ? `← Inbound · ${p.received_from} → ${p.company?.name}`
                      : `→ Outbound · ${p.company?.name} → ${p.received_from}`
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT: Payment Details */}
            <div>
              <SectionHeading>Payment Information</SectionHeading>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <InfoRow label="Voucher No" value={p.voucher_number} copyable mono highlight />
                <InfoRow label="Payment Date" value={formatDate(p.voucher_date)} />
                <InfoRow label="Payment Method" value={p.method} />
                <InfoRow label="Bank / Cash Account" value={p.account} />
                {p.cheque_number && (
                  <InfoRow label="Cheque Number" value={p.cheque_number} copyable mono />
                )}
                {p.cheque_date && (
                  <InfoRow label="Cheque Date" value={formatDate(p.cheque_date)} />
                )}
                {p.clear_date && (
                  <InfoRow label="Clear Date" value={formatDate(p.clear_date)} />
                )}
                {p.cheque_status && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#94a3b8]">Clearance Status</span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border w-fit ${statusConfig.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                      {statusConfig.label}
                    </span>
                  </div>
                )}
                <InfoRow label="Prepared By" value={p.prepared_by} />
              </div>
            </div>
          </div>

          {/* ── SECTION B: Amount Band ── */}
          <div className={`rounded-xl px-6 py-5 border ${
            p.type === 'RECEIPT'
              ? 'bg-gradient-to-r from-[#f0fdf4] to-[#dcfce7] border-[#bbf7d0]'
              : 'bg-gradient-to-r from-[#fff1f2] to-[#ffe4e6] border-[#fecdd3]'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <div className={`text-[11px] font-bold uppercase tracking-[0.15em] ${
                  p.type === 'RECEIPT' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {p.type === 'RECEIPT' ? 'Total Amount Received' : 'Total Amount Paid'}
                </div>
                <div className="text-[12px] text-[#64748b] italic mt-1 font-medium">{p.amount_in_words}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#3b82f6] mb-0.5">PKR</div>
                <div className="text-[32px] font-black text-[#1e3a8a] leading-none">{formatPKR(p.total_amount)}</div>
              </div>
            </div>
            {p.discount > 0 && (
              <div className="border-t border-[#bfdbfe]/60 pt-3 mt-3 flex justify-between items-center">
                <span className="text-[11px] text-[#64748b] font-medium">
                  Cash Received: <span className="text-[#1e3a8a] font-black">PKR {formatPKR(p.amount)}</span>
                </span>
                <span className="text-[11px] text-[#64748b] font-medium">
                  Discount Adjusted: <span className="text-rose-600 font-black">PKR {formatPKR(p.discount)}</span>
                </span>
              </div>
            )}
          </div>

          {/* ── SECTION C: Payment Allocation Table ── */}
          <div>
            <SectionHeading>Payment Allocation</SectionHeading>
            <div className="rounded-xl border border-[#e2e8f0] overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                    <th className="text-[9px] font-bold uppercase tracking-widest text-[#94a3b8] px-4 py-3 w-10">#</th>
                    <th className="text-[9px] font-bold uppercase tracking-widest text-[#94a3b8] px-4 py-3">Invoice Reference</th>
                    <th className="text-[9px] font-bold uppercase tracking-widest text-[#94a3b8] px-4 py-3">Invoice Date</th>
                    <th className="text-[9px] font-bold uppercase tracking-widest text-[#94a3b8] px-4 py-3 text-right">Invoice Total</th>
                    <th className="text-[9px] font-bold uppercase tracking-widest text-[#94a3b8] px-4 py-3 text-right">Amount Applied</th>
                    <th className="text-[9px] font-bold uppercase tracking-widest text-[#94a3b8] px-4 py-3 text-right">Remaining</th>
                    <th className="text-[9px] font-bold uppercase tracking-widest text-[#94a3b8] px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {p.allocations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <ReceiptText size={24} className="text-[#cbd5e1]" />
                          <span className="text-[12px] text-[#94a3b8] italic font-normal">No invoices allocated — Advance Payment</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    p.allocations.map((alloc, idx) => {
                      const remaining = alloc.invoice_total - alloc.amount_applied;
                      const isPaid = remaining <= 0.01;
                      return (
                        <tr
                          key={idx}
                          className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}`}
                        >
                          <td className="text-[11px] text-[#94a3b8] font-mono px-4 py-3">{String(idx + 1).padStart(2, '0')}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <div className="text-[12px] font-bold text-[#1e3a8a]">{alloc.invoice_ref}</div>
                              <CopyButton value={alloc.invoice_ref} />
                            </div>
                            <div className="text-[10px] text-[#94a3b8] mt-0.5 font-medium">{alloc.ref}</div>
                          </td>
                          <td className="px-4 py-3 text-[12px] text-[#64748b] font-medium">{formatDate(alloc.date)}</td>
                          <td className="px-4 py-3 text-[12px] text-[#475569] text-right font-mono">{formatPKR(alloc.invoice_total)}</td>
                          <td className="px-4 py-3 text-[12px] text-[#1e3a8a] font-bold text-right font-mono">{formatPKR(alloc.amount_applied)}</td>
                          <td className={`px-4 py-3 text-[12px] font-bold text-right font-mono ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {formatPKR(Math.max(0, remaining))}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              {isPaid ? 'Settled' : 'Partial'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-[#f0f9ff] border-t-2 border-[#bfdbfe]">
                    <td colSpan={3} className="text-[11px] font-bold uppercase tracking-wider text-[#3b82f6] px-4 py-3">
                      Totals
                    </td>
                    <td className="px-4 py-3 text-[12px] font-black text-[#1e3a8a] text-right font-mono">
                      {formatPKR(invoiceTotal)}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-black text-emerald-600 text-right font-mono">
                      {formatPKR(totalApplied)}
                    </td>
                    <td className={`px-4 py-3 text-[12px] font-black text-right font-mono ${isFullyPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {formatPKR(Math.max(0, remainingBalance))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ── SECTION D: Financial Summary Panel ── */}
          <div className="grid grid-cols-2 gap-5">

            {/* Summary */}
            <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] overflow-hidden">
              <div className="px-5 py-3 bg-[#f0f9ff] border-b border-[#bfdbfe]">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#3b82f6]">Financial Summary</span>
              </div>
              <div className="divide-y divide-[#f1f5f9]">
                {[
                  { label: 'Invoice Total', val: invoiceTotal, color: 'text-[#1e3a8a]' },
                  { label: 'Previously Outstanding', val: Math.max(0, invoiceTotal - p.total_amount), color: 'text-amber-600' },
                  { label: 'Payment Received', val: p.total_amount, color: 'text-emerald-600' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center px-5 py-2.5">
                    <span className="text-[12px] text-[#64748b] font-medium">{row.label}</span>
                    <span className={`text-[13px] font-bold font-mono ${row.color}`}>PKR {formatPKR(row.val)}</span>
                  </div>
                ))}
                <div className={`flex justify-between items-center px-5 py-3 ${isFullyPaid ? 'bg-emerald-50' : isOverpaid ? 'bg-blue-50' : 'bg-amber-50'}`}>
                  <span className="text-[12px] font-black uppercase tracking-wider text-[#1e293b]">Remaining Balance</span>
                  <div className="text-right">
                    <div className={`text-[20px] font-black font-mono ${isFullyPaid ? 'text-emerald-600' : isOverpaid ? 'text-blue-600' : 'text-amber-600'}`}>
                      PKR {formatPKR(Math.abs(remainingBalance))}
                    </div>
                    <div className={`text-[9px] font-black uppercase tracking-widest ${isFullyPaid ? 'text-emerald-500' : isOverpaid ? 'text-blue-500' : 'text-amber-500'}`}>
                      {isFullyPaid ? '✓ Fully Paid' : isOverpaid ? 'Credit Balance' : 'Outstanding'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown with Progress */}
            <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] overflow-hidden">
              <div className="px-5 py-3 bg-[#f0f9ff] border-b border-[#bfdbfe]">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#3b82f6]">Payment Breakdown</span>
              </div>
              <div className="px-5 py-4 flex flex-col gap-3">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#64748b] font-medium">Invoice Total</span>
                  <span className="font-bold font-mono text-[#1e3a8a]">{formatPKR(invoiceTotal)}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#64748b] font-medium">Current Payment</span>
                  <span className="font-bold font-mono text-emerald-600">{formatPKR(p.total_amount)}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#64748b] font-medium">Net Outstanding</span>
                  <span className="font-bold font-mono text-amber-600">{formatPKR(Math.max(0, remainingBalance))}</span>
                </div>

                {/* Progress bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] mb-1.5">
                    <span className="font-bold text-emerald-600">Paid {paidPct}%</span>
                    <span className="font-bold text-amber-500">Outstanding {100 - paidPct}%</span>
                  </div>
                  <div className="h-2.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] mt-1 text-[#94a3b8] font-mono">
                    <span>PKR 0</span>
                    <span>PKR {formatPKR(invoiceTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION E: Remarks & Communication ── */}
          <div>
            <SectionHeading>Remarks &amp; Communication</SectionHeading>
            <div className={`rounded-xl border px-5 py-4 min-h-[56px] flex flex-col gap-2 ${p.remarks || p.message_line ? 'bg-[#fffbeb] border-[#fde68a]' : 'bg-[#f8fafc] border-[#e2e8f0]'}`}>
              {p.message_line && (
                <div className="text-[12px] font-bold text-amber-700 bg-amber-100/50 px-3 py-1.5 rounded-lg border border-amber-200 w-fit">
                  📢 Communication: "{p.message_line}"
                </div>
              )}
              {p.remarks ? (
                <div className="text-[13px] text-[#1e293b] font-medium leading-relaxed">{p.remarks}</div>
              ) : (
                !p.message_line && (
                  <div className="flex items-center gap-2 text-[12px] text-[#94a3b8] italic font-normal">
                    <Minus size={14} />
                    No remarks or communication notes added.
                  </div>
                )
              )}
            </div>
          </div>

          {/* ── SECTION F: Authorization ── */}
          <div>
            <SectionHeading>Authorisation</SectionHeading>
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: 'Prepared By', name: p.prepared_by },
                { label: 'Authorised Signature', name: '' },
                { label: 'Receiver Signature', name: '' },
              ].map(({ label, name }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className="w-full h-14 border-b-2 border-dashed border-[#cbd5e1] flex items-end justify-center pb-2">
                    {name && <span className="text-[12px] text-[#334155] font-semibold">{name}</span>}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex justify-between items-center">
              <span className="text-[10px] text-[#94a3b8] font-mono">Printed: {printedAt}</span>
              <span className="text-[10px] text-[#94a3b8]">This is a computer-generated document.</span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-[#f8fafc] border-t border-[#e2e8f0] px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              {[
                { Icon: MapPin, val: p.company?.address },
                { Icon: Phone, val: p.company?.phone },
                { Icon: Mail, val: p.company?.email },
                { Icon: Globe, val: p.company?.website },
              ].map(({ Icon, val }) => (
                <div key={val} className="flex items-center gap-1.5">
                  <Icon size={11} strokeWidth={1.5} className="text-[#1e3a8a]" />
                  <span className="text-[10px] text-[#64748b] font-medium">{val}</span>
                </div>
              ))}
            </div>
            <div className="text-right">
              <div className="text-[10px] text-[#94a3b8] font-mono">{p.voucher_number} · {formatDate(p.voucher_date)}</div>
              <div className="text-[10px] text-[#94a3b8]">Harmain Traders ERP · v1.0</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// THERMAL PRINT CARD
// ─────────────────────────────────────────────────────────────────────────────
const ThermalCard = ({ p }: { p: Payment }) => {
  const totalApplied = p.allocations.reduce((s, a) => s + a.amount_applied, 0);
  const invoiceTotal = p.allocations.reduce((s, a) => s + a.invoice_total, 0);
  const remainingBalance = invoiceTotal - totalApplied;
  return (
    <div className="w-[80mm] mx-auto bg-white text-[11px] font-mono p-4 border border-dashed border-[#999]">
      <div className="text-center font-black text-[15px] border-b border-[#ccc] pb-2 mb-2">
        {p.company?.name}
      </div>
      <div className="text-center text-[10px] text-[#666] mb-3">{p.company?.tagline}</div>
      <div className="text-center font-bold uppercase tracking-widest text-[12px] mb-2">{p.type} VOUCHER</div>
      <div className="border-t border-dashed border-[#bbb] pt-2 flex flex-col gap-1">
        <div className="flex justify-between"><span>Voucher:</span><span className="font-bold">{p.voucher_number}</span></div>
        <div className="flex justify-between"><span>Date:</span><span>{formatDate(p.voucher_date)}</span></div>
        <div className="flex justify-between"><span>{p.party_label}:</span><span className="font-bold">{p.received_from}</span></div>
        <div className="flex justify-between"><span>Method:</span><span>{p.method}</span></div>
        {p.cheque_number && <div className="flex justify-between"><span>Cheque:</span><span>{p.cheque_number}</span></div>}
      </div>
      <div className="border-t border-dashed border-[#bbb] my-2 pt-2">
        {p.allocations.map((a, i) => (
          <div key={i} className="flex justify-between text-[10px]">
            <span>{a.invoice_ref}</span><span>{formatPKR(a.amount_applied)}</span>
          </div>
        ))}
      </div>
      <div className="border-t-2 border-[#333] pt-2 text-[13px] font-black flex justify-between">
        <span>PKR</span><span>{formatPKR(p.total_amount)}</span>
      </div>
      {remainingBalance > 0.01 && (
        <div className="text-[10px] flex justify-between text-amber-700 mt-1">
          <span>Balance:</span><span>{formatPKR(remainingBalance)}</span>
        </div>
      )}
      <div className="text-center text-[9px] text-[#999] mt-3 border-t border-dashed border-[#bbb] pt-2">
        {p.company?.phone} · {p.company?.email}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAP BACKEND PAYMENT TO LOCAL FORMAT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely extract a string from a value that may be:
 *  - a plain string         → returned as-is
 *  - an Eloquent object     → .title or .name extracted
 *  - null / undefined       → fallback returned
 */
function safeStr(val: any, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val || fallback;
  if (typeof val === 'object') {
    const s = val.title ?? val.name ?? val.code ?? '';
    return String(s) || fallback;
  }
  return String(val) || fallback;
}

function mapPayment(raw: any): Payment {
  if (!raw) return defaultPayment;

  const isPayment = (raw.type ?? '').toUpperCase() === 'PAYMENT';
  const partyLabel = isPayment ? 'Paid To' : 'Received From';

  // Extract account type name from the eager-loaded accountType relation
  const rawAccType   = raw.account?.accountType ?? raw.account?.account_type ?? null;
  const accountTypeRaw = safeStr(rawAccType, '') || safeStr(raw.account_type, '') || '';
  const accountTypeLabelMap: Record<string, string> = {
    customers: 'Customer', customer: 'Customer',
    supplier: 'Supplier', suppliers: 'Supplier',
    expense: 'Expense',   expenses: 'Expense',
    'cheque in hand': 'Cheque in Hand',
    cash: 'Cash Account', bank: 'Bank Account',
    other: 'Other',
  };
  const accountTypeLabel = accountTypeLabelMap[accountTypeRaw.toLowerCase()] ?? (accountTypeRaw || '—');

  const netAmount = raw.net_amount !== undefined
    ? Number(raw.net_amount)
    : (raw.amount ? Number(raw.amount) + Number(raw.discount || 0) : defaultPayment.total_amount);

  const rawMsg = raw.message_line ?? raw.messageLine ?? null;
  const messageLineVal = rawMsg ? rawMsg.messageline : null;

  // Extract selected firm branding if assigned to this payment
  const firmObj = raw.firm ?? null;
  const companyName = firmObj ? firmObj.name : (raw.company?.name ?? defaultPayment.company.name);
  const companyTagline = firmObj ? (firmObj.business || firmObj.tagline) : (raw.company?.tagline ?? defaultPayment.company.tagline);
  const companyAddress = firmObj ? [firmObj.address1, firmObj.address2].filter(Boolean).join(' ') : (raw.company?.address ?? defaultPayment.company.address);
  const companyPhone = firmObj ? firmObj.phone : (raw.company?.phone ?? defaultPayment.company.phone);
  const companyEmail = firmObj ? firmObj.email : (raw.company?.email ?? defaultPayment.company.email);
  const companyWebsite = firmObj ? firmObj.website : (raw.company?.website ?? defaultPayment.company.website);

  return {
    id:                  raw.id             ?? defaultPayment.id,
    voucher_number:      raw.voucher_no     ?? raw.voucher_number ?? defaultPayment.voucher_number,
    voucher_date:        raw.date           ?? raw.voucher_date   ?? defaultPayment.voucher_date,
    received_from:       raw.received_from  ? safeStr(raw.received_from) : safeStr(raw.account, defaultPayment.received_from),
    party_label:         partyLabel,
    account_type_label:  accountTypeLabel,
    method:              raw.payment_method ?? raw.method         ?? defaultPayment.method,
    cheque_number:       raw.cheque_no      ?? raw.cheque_number  ?? null,
    cheque_date:         raw.cheque_date    ?? null,
    clear_date:          raw.clear_date     ?? null,
    cheque_status:       typeof raw.cheque_status === 'string' ? raw.cheque_status : null,
    account:             safeStr(raw.paymentAccount, '') || safeStr(raw.account_name, '') || (typeof raw.account === 'string' ? raw.account : '') || defaultPayment.account,
    total_amount:        netAmount,
    amount:              raw.amount   !== undefined ? Number(raw.amount)   : defaultPayment.amount,
    discount:            raw.discount !== undefined ? Number(raw.discount) : 0,
    amount_in_words:     typeof raw.amount_in_words === 'string' && raw.amount_in_words
                           ? raw.amount_in_words
                           : numberToWords(netAmount),
    status:              ((raw.cheque_status ?? raw.status ?? 'pending') as string).toLowerCase(),
    type:                typeof raw.type === 'string' ? raw.type.toUpperCase() : 'RECEIPT',
    prepared_by:         typeof raw.prepared_by === 'string' ? raw.prepared_by : defaultPayment.prepared_by,
    remarks:             typeof raw.remarks === 'string' ? raw.remarks : null,
    message_line:        messageLineVal,
    allocations: Array.isArray(raw.allocations) ? raw.allocations.map((a: any) => ({
      ref:            a.ref           ?? (a.bill_type ? `${a.bill_type.split('\\').pop()} #${a.bill_id}` : 'Invoice'),
      invoice_ref:    a.invoice_ref   ?? (a.bill_id ? `INV-${String(a.bill_id).padStart(4, '0')}` : 'INV-0001'),
      date:           a.date          ?? raw.date ?? defaultPayment.voucher_date,
      invoice_total:  a.invoice_total  !== undefined ? Number(a.invoice_total)  : Number(a.amount ?? 0),
      amount_applied: a.amount_applied !== undefined ? Number(a.amount_applied) : Number(a.amount ?? 0),
    })) : defaultPayment.allocations,
    company: {
      name:    companyName,
      tagline: companyTagline || 'Wholesale & Supply Chain',
      address: companyAddress || 'Karachi, Pakistan',
      phone:   companyPhone || '+92 300 0000000',
      email:   companyEmail || 'info@harmaintraders.com',
      website: companyWebsite || 'aishtycoons.agency',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function PaymentView({ payment, mode }: Props) {
  const [printMode, setPrintMode] = useState<'a4' | 'thermal' | null>(null);
  const isPrint = mode === 'print';
  const pageProps = usePage().props as any;
  const rawPayment = payment || pageProps.payment;
  const p = mapPayment(rawPayment);

  const handlePrintA4 = () => {
    const url = rawPayment?.id ? route('payments.pdf', rawPayment.id) : null;
    if (url) {
      const w = window.open(url, '_blank');
      if (w) w.addEventListener('load', () => w.print());
    } else {
      window.print();
    }
  };

  const handleDownloadPDF = () => {
    if (rawPayment?.id) {
      window.location.href = route('payments.pdf', rawPayment.id);
    } else {
      window.print();
    }
  };

  const handlePrintThermal = () => {
    if (rawPayment?.id) {
      window.location.href = route('payments.pdf', rawPayment.id) + '?format=small';
    } else {
      window.print();
    }
  };

  const printStyles = `
    @media print {
      header, aside,
      [data-sidebar="sidebar"],
      [data-sidebar="trigger"],
      [data-sidebar="rail"],
      .print\\:hidden { display: none !important; }
      @page { margin: 0 !important; }
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
      [data-slot="sidebar-wrapper"], [data-slot="sidebar-inset"],
      main, .sidebar-inset, .min-h-screen {
        margin: 0 !important; padding: 0 !important;
        min-height: 0 !important; height: auto !important;
        border: none !important; box-shadow: none !important;
      }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  `;

  if (isPrint) {
    return (
      <div className="min-h-screen bg-white p-8">
        <style dangerouslySetInnerHTML={{ __html: printStyles }} />
        <VoucherCard p={p} />
        <script dangerouslySetInnerHTML={{ __html: 'window.print()' }} />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={[
          { title: 'Payments', href: '/payment' },
          { title: p.voucher_number, href: `/payment/${p.id}` },
        ]} />

        <style dangerouslySetInnerHTML={{ __html: printStyles }} />

        <div className="min-h-screen bg-[#f1f5f9] dark:bg-[#0f172a] print:bg-white">

          {/* ── PAGE ACTION BAR ── */}
          <div className="print:hidden sticky top-0 z-20 bg-[#f1f5f9]/80 dark:bg-[#0f172a]/80 backdrop-blur-sm border-b border-[#e2e8f0] dark:border-[#1e293b]">
            <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">

              {/* Left: Back */}
              <Link
                href="/payment"
                className="inline-flex items-center gap-2 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl px-3.5 py-2 text-[12px] text-[#475569] dark:text-[#94a3b8] hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors font-semibold"
              >
                <ArrowLeft size={14} strokeWidth={2} />
                Back
              </Link>

              {/* Center: Breadcrumb */}
              <div className="flex items-center gap-1.5 text-[11px] text-[#64748b] font-medium">
                <Link href="/payment" className="text-[#1e3a8a] hover:underline font-semibold">Payments</Link>
                <ChevronRight size={11} className="text-[#94a3b8]" />
                <span className="font-mono text-[#1e3a8a] font-bold">{p.voucher_number}</span>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintA4}
                  className="inline-flex items-center gap-1.5 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl px-3.5 py-2 text-[12px] font-semibold text-[#475569] dark:text-[#94a3b8] hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors"
                >
                  <Printer size={13} strokeWidth={2} />
                  Print A4
                </button>
                <button
                  onClick={handlePrintThermal}
                  className="inline-flex items-center gap-1.5 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl px-3.5 py-2 text-[12px] font-semibold text-[#475569] dark:text-[#94a3b8] hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors"
                >
                  <ReceiptText size={13} strokeWidth={2} />
                  Thermal
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-1.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl px-4 py-2 text-[12px] font-bold transition-colors shadow-md shadow-blue-900/20"
                >
                  <Download size={13} strokeWidth={2} />
                  Download PDF
                </button>
              </div>
            </div>
          </div>

          {/* ── VOUCHER ── */}
          <div className="max-w-5xl mx-auto px-6 py-8 print:p-0 print:max-w-none">
            <VoucherCard p={p} />
          </div>

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
