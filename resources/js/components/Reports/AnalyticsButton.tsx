import React from 'react';
import { BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AnalyticsButtonProps {
    onClick: () => void;
    icon?: React.ReactNode;
    className?: string;
}

const AnalyticsButton = ({ onClick, icon, className }: AnalyticsButtonProps) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            "h-9 w-9 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all duration-300",
                            className
                        )}
                        onClick={onClick}
                    >
                        {icon || <BarChart2 className="h-4 w-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-[10px] font-bold uppercase tracking-tight">Open Data Analytics</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default AnalyticsButton;
