import React from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

interface Props {
    payment: any;
    mode?: string;
}

export default function PaymentView({ payment, mode }: Props) {
    const isPrint = mode === 'print';

    const handlePrint = () => {
        window.print();
    };

    const Content = () => (
        <div className="max-w-4xl mx-auto bg-white p-8 shadow-sm border rounded-lg print:shadow-none print:border-none">
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-6 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">PAYMENT VOUCHER</h1>
                    <p className="text-gray-500 mt-1">{payment.type === 'RECEIPT' ? 'Receipt Voucher' : 'Payment Voucher'}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-semibold">{payment.voucher_no}</h2>
                    <p className="text-gray-500">Date: {payment.date}</p>
                </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                        {payment.type === 'RECEIPT' ? 'Received From' : 'Paid To'}
                    </h3>
                    <div className="font-medium text-lg">{payment.account?.title}</div>
                    <div className="text-gray-600">{payment.account?.address1}</div>
                    <div className="text-gray-600">{payment.account?.mobile}</div>
                </div>
                <div className="text-right">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Payment Details</h3>
                    <div className="grid grid-cols-2 gap-2 justify-end">
                        <span className="text-gray-600">Method:</span>
                        <span className="font-medium">{payment.payment_method || 'Cash'}</span>

                        {payment.payment_method === 'Cheque' && (
                            <>
                                <span className="text-gray-600">Cheque #:</span>
                                <span className="font-medium">{payment.cheque_no}</span>
                                <span className="text-gray-600">Cheque Date:</span>
                                <span className="font-medium">{payment.cheque_date}</span>
                            </>
                        )}

                        <span className="text-gray-600">Account:</span>
                        <span className="font-medium">{payment.payment_account?.title || 'Cash'}</span>
                    </div>
                </div>
            </div>

            {/* Amount */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8 print:bg-gray-100">
                <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Total Amount</span>
                    <span className="text-3xl font-bold text-gray-900">{Number(payment.amount).toLocaleString()}</span>
                </div>
                {payment.remarks && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <span className="text-sm font-semibold text-gray-500">Remarks:</span>
                        <p className="mt-1 text-gray-700">{payment.remarks}</p>
                    </div>
                )}
            </div>

            {/* Allocations */}
            {payment.allocations && payment.allocations.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Payment Allocation</h3>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase">
                            <tr>
                                <th className="px-4 py-3">Bill Type</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {payment.allocations.map((alloc: any) => (
                                <tr key={alloc.id}>
                                    <td className="px-4 py-3">{alloc.bill_type.split('\\').pop()} #{alloc.bill_id}</td>
                                    <td className="px-4 py-3 text-right font-medium">{Number(alloc.amount).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-8 border-t grid grid-cols-2 gap-4 text-center text-sm text-gray-500">
                <div className="pt-8 border-t w-48 mx-auto">Authorized Signature</div>
                <div className="pt-8 border-t w-48 mx-auto">Receiver Signature</div>
            </div>
        </div>
    );

    if (isPrint) {
        return (
            <div className="min-h-screen bg-white p-8">
                <Content />
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
                    { title: payment.voucher_no, href: `/payment/${payment.id}` }
                ]} />

                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center print:hidden">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" /> Print
                            </Button>
                            <Button variant="outline" onClick={() => window.location.href = route('payments.pdf', payment.id)}>
                                <Download className="mr-2 h-4 w-4" /> Download PDF
                            </Button>
                        </div>
                    </div>

                    <Content />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
