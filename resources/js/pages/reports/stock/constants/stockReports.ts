import { 
    Box, 
    ClipboardList, 
    Tag, 
    Layers, 
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';

export const stockReports = [
    {
        id: 'summary',
        title: 'STOCK SUMMARY REPORT',
        description: 'Aggregate inventory levels and valuations',
        icon: 'Box'
    },
    {
        id: 'available_stock',
        title: 'Available Stock Summary',
        description: 'Detailed analysis of items currently in stock with purchase history',
        icon: 'CheckCircle2'
    },
    {
        id: 'detail',
        title: 'STOCK DETAIL REPORT',
        description: 'Transaction-level inventory breakdown',
        icon: 'ClipboardList'
    },
    {
        id: 'price_list',
        title: 'Items Price List',
        description: 'Comprehensive catalog of TP, Retail and Net rates',
        icon: 'Tag'
    },
    {
        id: 'type_wise',
        title: 'Stock Summary Item Type Wise',
        description: 'Inventory grouped by product classifications',
        icon: 'Layers'
    },
    {
        id: 'less_than_zero',
        title: 'Stock Summary Less Than Zero',
        description: 'Critical check for negative inventory levels',
        icon: 'AlertTriangle'
    }
];
