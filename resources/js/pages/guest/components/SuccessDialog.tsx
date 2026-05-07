import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Link } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

interface SuccessDialogProps {
    successInvoice: string | null;
    setSuccessInvoice: (val: string | null) => void;
    token: string;
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({
    successInvoice,
    setSuccessInvoice,
    token
}) => {
    return (
        <Dialog open={!!successInvoice} onOpenChange={() => setSuccessInvoice(null)}>
            <DialogContent className="max-w-sm w-[90%] rounded-3xl p-8 text-center border-none flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 shadow-2xl shadow-emerald-500/30"
                >
                    <CheckCircle2 size={48} />
                </motion.div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 italic uppercase">Order Placed!</h2>
                <p className="text-sm text-slate-500 mb-6">
                    Your order <span className="font-bold text-slate-900">#{successInvoice}</span> has been received and is pending confirmation.
                </p>
                <div className="flex flex-col w-full gap-3">
                    <Link href={`/g/${token}`} className="w-full">
                        <Button className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold h-11">Back to Dashboard</Button>
                    </Link>
                    <Button variant="outline" onClick={() => setSuccessInvoice(null)} className="h-12 rounded-xl border-slate-200 font-bold h-11">Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
