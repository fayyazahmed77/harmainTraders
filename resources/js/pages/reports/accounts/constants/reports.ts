import { ElementType } from 'react';
import { 
    Clock, 
    List, 
    FileSpreadsheet, 
    AlertCircle, 
    CalendarDays, 
    BookOpen, 
    Receipt, 
    CreditCard, 
    Wallet, 
    Banknote, 
    NotebookText, 
    BarChartHorizontal, 
    Columns2, 
    Columns 
} from 'lucide-react';

export interface ReportOption {
    id: string;
    title: string;
    description: string;
    icon: ElementType;
    category: 'Financial' | 'Inventory' | 'Sales' | 'Purchase';
}

export const reports: ReportOption[] = [
    {
        id: 'accounts_aging',
        title: 'Accounts Aging Wise',
        description: 'Breakdown of receivables and payables based on aging periods.',
        icon: Clock,
        category: 'Financial'
    },
    {
        id: 'account_list',
        title: 'Account List',
        description: 'Complete list of all chart of accounts.',
        icon: List,
        category: 'Financial'
    },
    {
        id: 'detail_ledger',
        title: 'Detail Ledger',
        description: 'Expanded ledger with transaction-level details.',
        icon: FileSpreadsheet,
        category: 'Financial'
    },
    {
        id: 'due_bills',
        title: 'Due Bills',
        description: 'List of all pending and overdue bills.',
        icon: AlertCircle,
        category: 'Financial'
    },
    {
        id: 'day_book',
        title: 'Day Book',
        description: 'Daily transaction activity summary.',
        icon: CalendarDays,
        category: 'Financial'
    },
    {
        id: 'general_ledger',
        title: 'Ledger',
        description: 'General ledger overview of all account transactions.',
        icon: BookOpen,
        category: 'Financial'
    },
    {
        id: 'outstanding_billwise',
        title: 'Outstanding Payment Bill Wise',
        description: 'Outstanding balances grouped by individual bills.',
        icon: Receipt,
        category: 'Financial'
    },
    {
        id: 'payment_detail',
        title: 'Payment Detail',
        description: 'Detailed record of outgoing payments.',
        icon: CreditCard,
        category: 'Financial'
    },
    {
        id: 'receivable',
        title: 'Receivable',
        description: 'Summary of all incoming receivables.',
        icon: Wallet,
        category: 'Financial'
    },
    {
        id: 'receiving_detail',
        title: 'Receiving Detail',
        description: 'Detailed record of received payments.',
        icon: Banknote,
        category: 'Financial'
    },
    {
        id: 'roznamcha',
        title: 'Roznamcha',
        description: 'Chronological journal entry report.',
        icon: NotebookText,
        category: 'Financial'
    },
    {
        id: 'summary',
        title: 'Summary',
        description: 'Condensed financial activity overview.',
        icon: BarChartHorizontal,
        category: 'Financial'
    },
    {
        id: 'trial_balance_2col',
        title: 'Trial Balance (2 Column)',
        description: 'Trial balance report in 2-column format.',
        icon: Columns2,
        category: 'Financial'
    },
    {
        id: 'trial_balance_6col',
        title: 'Trial Balance (6 Column)',
        description: 'Detailed trial balance report in 6-column format.',
        icon: Columns,
        category: 'Financial'
    }
];
