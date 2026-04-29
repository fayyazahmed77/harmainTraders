export interface ProfitDataRow {
    id?: number;
    date?: string;
    invoice?: string;
    customer_name?: string;
    salesman_name?: string;
    firm_name?: string;
    product_name?: string;
    qty?: number;
    sale_rate?: number;
    purchase_rate?: number;
    name?: string; // For grouped reports
    month?: string; // For month wise
    date_display?: string; // Formatted date string from backend
    revenue: number;
    cogs: number;
    profit: number;
    margin: number;
    expense?: number;
    net_profit?: number;
    net_margin?: number;
}
