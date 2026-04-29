import { 
    LayoutDashboard, 
    Calculator, 
    Calendar, 
    Clock, 
    Users, 
    UserCheck, 
    Building2 
} from 'lucide-react';

export const profitReports = [
    {
        id: 'transaction',
        title: 'Profit & Loss (Transaction Wise)',
        description: 'Detailed profit analysis per individual sale/bill.',
        icon: Calculator,
        color: 'text-blue-500'
    },
    {
        id: 'party',
        title: 'Profit & Loss (Party Wise)',
        description: 'Customer profitability analysis with aggregated revenue and COGS.',
        icon: Users,
        color: 'text-indigo-500'
    },
    {
        id: 'salesman',
        title: 'Profit & Loss (Salesman Wise)',
        description: 'Performance tracking grouped by sales representatives.',
        icon: UserCheck,
        color: 'text-emerald-500'
    },
    {
        id: 'company',
        title: 'Profit & Loss (Company Wise)',
        description: 'Financial outcomes segmented by your business firms.',
        icon: Building2,
        color: 'text-amber-500'
    },
    {
        id: 'date',
        title: 'Profit & Loss (Date Wise)',
        description: 'Chronological trend of profitability on a daily basis.',
        icon: Calendar,
        color: 'text-violet-500'
    },
    {
        id: 'month',
        title: 'Profit & Loss (Month Wise)',
        description: 'Strategic monthly overview of revenue and net margins.',
        icon: Clock,
        color: 'text-rose-500'
    }
];
