import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Download, ArrowLeft } from "lucide-react";
import { router } from "@inertiajs/react";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Offer", href: "/offer" },
    { title: "Listing", href: "/offer/list" },
    { title: "View", href: "#" },
];

interface OfferItem {
    id: number;
    pack_ctn: number;
    loos_ctn: number;
    mrp: number;
    scheme: string;
    items: {
        title: string;
        category: {
            name: string;
        };
    };
}

interface Offer {
    id: number;
    date: string;
    offertype: string;
    account: {
        title: string;
        address: string;
    };
    message_line?: {
        id: number;
        messageline: string;
    } | null;
    items: OfferItem[];
}

interface Props {
    offer: Offer;
}

export default function View({ offer }: Props) {
    // Group items by category
    const groupedItems = offer.items.reduce((acc, item) => {
        const categoryName = item.items.category?.name || "Uncategorized";
        if (!acc[categoryName]) {
            acc[categoryName] = [];
        }
        acc[categoryName].push(item);
        return acc;
    }, {} as Record<string, OfferItem[]>);

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader breadcrumbs={breadcrumbs} />
                <div className="p-4 ">
                    <div className="flex justify-between items-center mb-6">
                        <Button variant="outline" onClick={() => router.visit('/offer-list')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => window.open(`/offer-list/${offer.id}/pdf`, '_blank')}>
                                <FileText className="mr-2 h-4 w-4" /> PDF
                            </Button>
                            <Button onClick={() => window.location.href = `/offer-list/${offer.id}/download`}>
                                <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                        </div>
                    </div>

                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Offer Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Account</p>
                                    <p className="text-lg font-bold">{offer.account.title}</p>
                                    <p className="text-sm text-gray-500">{offer.account.address}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-muted-foreground">Date</p>
                                    <p className="text-lg font-bold">{new Date(offer.date).toLocaleDateString('en-GB')}</p>
                                    <p className="text-sm font-medium text-muted-foreground mt-2">Price Type</p>
                                    <p className="capitalize">{offer.offertype}</p>
                                </div>
                            </div>
                            {offer.message_line && (
                                <p className="text-sm text-sky-900 italic border-l-4 border-sky-400 pl-3">
                                    {offer.message_line.messageline}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        {Object.entries(groupedItems).map(([category, items]) => (
                            <div key={category}>
                                <h3 className="text-lg font-bold mb-2 uppercase text-primary">{category}</h3>
                                <div className="border rounded-md overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-gray-100">
                                            <TableRow>
                                                <TableHead className="w-[40%] text-black font-bold border-r">Items</TableHead>
                                                <TableHead className="text-center text-black font-bold border-r">Pack Ctn</TableHead>
                                                <TableHead className="text-center text-black font-bold border-r">Loose Ctn</TableHead>
                                                <TableHead className="text-center text-black font-bold border-r">M.R.P</TableHead>
                                                <TableHead className="text-center text-black font-bold">Scheme</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item) => (
                                                <TableRow key={item.id} className="hover:bg-gray-50">
                                                    <TableCell className="font-medium border-r">{item.items.title}</TableCell>
                                                    <TableCell className="text-center border-r">{item.pack_ctn}</TableCell>
                                                    <TableCell className="text-center border-r">{item.loos_ctn}</TableCell>
                                                    <TableCell className="text-center border-r">{item.mrp}</TableCell>
                                                    <TableCell className="text-center">{item.scheme}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
