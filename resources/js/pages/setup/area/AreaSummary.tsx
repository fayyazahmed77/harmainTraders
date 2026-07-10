import React from "react";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface AreaSummaryProps {
    total: number;
}

export default function AreaSummary({ total }: AreaSummaryProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Areas</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold tracking-tight text-foreground">
                                    {total.toString().padStart(2, '0')}
                                </span>
                                <span className="text-xs font-medium text-muted-foreground">Nodes</span>
                            </div>
                        </div>
                        <div className="h-10 w-10 rounded-md border bg-muted/50 flex items-center justify-center text-muted-foreground">
                            <MapPin className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

