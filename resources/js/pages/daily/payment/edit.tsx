import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

import { router } from "@inertiajs/react";
import { route } from "ziggy-js";

interface PaymentProps {
    payment: {
        id: number;
        date: string;
        amount: number;
        remarks?: string;
        cheque_no?: string;
        cheque_date?: string;
        clear_date?: string;
        voucher_no: string;
        payment_method: string;
    };
}

export default function PaymentEdit({ payment }: PaymentProps) {
    const [date, setDate] = useState(payment.date);
    const [remarks, setRemarks] = useState(payment.remarks || "");
    const [chequeNo, setChequeNo] = useState(payment.cheque_no || "");
    const [chequeDate, setChequeDate] = useState(payment.cheque_date || "");
    const [clearDate, setClearDate] = useState(payment.clear_date || "");

    const handleUpdate = () => {
        router.put(route("payment.update", payment.id), {
            date,
            remarks,
            cheque_no: chequeNo,
            cheque_date: chequeDate,
            clear_date: clearDate,
        });
    };

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />

            <SidebarInset>
                {/* Top Header */}
                <SiteHeader
                    breadcrumbs={[
                        { title: "Payments", href: "/payment" },
                        { title: "Edit", href: `/payment/${payment.id}/edit` },
                    ]}
                />

                <div className="p-6 w-full max-w-3xl mx-auto">
                    <Card className="p-6 space-y-6">
                        {/* Title */}
                        <h2 className="text-xl font-bold">
                            Edit Payment – {payment.voucher_no}
                        </h2>

                        {/* Form Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Amount (Read Only)</Label>
                                <Input
                                    value={payment.amount}
                                    readOnly
                                    className="bg-gray-100 font-bold"
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Remarks</Label>
                            <Input
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                        </div>

                        {/* Cheque Fields */}
                        {payment.payment_method === "Cheque" && (
                            <div className="border-t pt-4 grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Cheque No</Label>
                                    <Input
                                        value={chequeNo}
                                        onChange={(e) => setChequeNo(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Cheque Date</Label>
                                    <Input
                                        type="date"
                                        value={chequeDate}
                                        onChange={(e) => setChequeDate(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Clear Date</Label>
                                    <Input
                                        type="date"
                                        value={clearDate}
                                        onChange={(e) => setClearDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => window.history.back()}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleUpdate}>Update Payment</Button>
                        </div>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
