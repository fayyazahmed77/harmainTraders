import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Cheque {
    id: number;
    customer_name: string;
    cheque_no: string;
    due_date: string;
    amount: number;
    status: 'pending' | 'cleared' | 'bounced' | string;
    due_soon: boolean;
}

interface PostDateChequesTabProps {
    cheques: Cheque[];
}

const PostDateChequesTab: React.FC<PostDateChequesTabProps> = ({ cheques }) => {
    const totalAmount = cheques.reduce((sum, cheque) => sum + cheque.amount, 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
        }).format(amount).replace('PKR', 'Rs');
    };

    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'cleared':
                return "bg-[#4caf7a22] text-[#4caf7a] border-[#4caf7a44] hover:bg-[#4caf7a33]";
            case 'bounced':
                return "bg-[#e05a4a22] text-[#e05a4a] border-[#e05a4a44] hover:bg-[#e05a4a33]";
            case 'pending':
            default:
                return "bg-[#e07b1a22] text-[#e07b1a] border-[#e07b1a44] hover:bg-[#e07b1a33]";
        }
    };

    return (
        <div className="rounded-xl border border-gray-100 dark:border-gray-800  overflow-hidden">
            <Table>
                <TableHeader className="bg-gray-50/50 dark:bg-gray-900/50">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-12 font-black text-[10px] uppercase tracking-widest text-gray-500">#</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-500">Supplier Name</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-500">Cheque No</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-500">Due Date</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-500 text-right">Amount</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-500 text-center">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cheques.length > 0 ? (
                        cheques.map((cheque, index) => (
                            <TableRow 
                                key={cheque.id} 
                                className={`group transition-colors ${cheque.due_soon ? 'border-l-[3px] border-l-[#e07b1a]' : ''}`}
                            >
                                <TableCell className="font-bold text-xs text-gray-400">{index + 1}</TableCell>
                                <TableCell className="font-black text-xs text-gray-900 dark:text-gray-100">{cheque.customer_name}</TableCell>
                                <TableCell className="text-xs font-bold text-gray-500">
                                    <Badge variant="outline" className="font-mono text-[10px] py-0">{cheque.cheque_no}</Badge>
                                </TableCell>
                                <TableCell className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                    {new Date(cheque.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </TableCell>
                                <TableCell className="text-xs font-black text-sidebar-primary text-right">
                                    {formatCurrency(cheque.amount)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge 
                                        variant="outline" 
                                        className={`capitalize text-[10px] font-black px-2 py-0.5 border shadow-none ${getStatusStyle(cheque.status)}`}
                                    >
                                        {cheque.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-gray-400 italic text-xs font-bold uppercase tracking-widest opacity-40">
                                No upcoming post-dated cheques found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                {cheques.length > 0 && (
                    <TableFooter className="bg-gray-50/80 dark:bg-gray-900/80 border-t-2 border-gray-100 dark:border-gray-800">
                        <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={4} className="text-right font-black text-[10px] uppercase tracking-widest text-gray-500">Total Outstanding</TableCell>
                            <TableCell className="text-right font-black text-sm text-sidebar-primary">
                                {formatCurrency(totalAmount)}
                            </TableCell>
                            <TableCell />
                        </TableRow>
                    </TableFooter>
                )}
            </Table>
        </div>
    );
};

export default PostDateChequesTab;
