import React, { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/Reports/DataTable';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { DateRangePicker } from '@/components/Reports/DateRangePicker';
import { ChartCard } from '@/components/Reports/ChartCard';
import { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';
import axios from 'axios';
import { route } from 'ziggy-js';
import { toast } from 'sonner';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from 'recharts';
import { BreadcrumbItem } from '@/types';
import { Activity, Users, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface AuditLog {
    id: number;
    user_name: string;
    action: string;
    module: string;
    module_id: string;
    old_values: any;
    new_values: any;
    ip_address: string;
    created_at: string;
}

interface AuditData {
    logs: AuditLog[];
    activity_by_module: { module: string; count: number }[];
    activity_by_action: { action: string; count: number }[];
    daily_activity: { date: string; count: number }[];
}

interface Props {
    users: { id: number; name: string }[];
    modules: string[];
    actions: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Reports", href: "/reports" },
    { title: "Audit Log", href: "/reports/audit" },
];

const getActionColor = (action: string) => {
    switch (action) {
        case 'created': return 'bg-green-100 text-green-700 border-green-200';
        case 'updated': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'deleted': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

export default function AuditIndex({ users, modules, actions }: Props) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [data, setData] = useState<AuditData | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<string>('all');
    const [selectedModule, setSelectedModule] = useState<string>('all');
    const [selectedAction, setSelectedAction] = useState<string>('all');
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 50,
    });

    const columns: ColumnDef<AuditLog>[] = [
        {
            accessorKey: 'created_at',
            header: 'Date/Time',
            cell: ({ row }) => format(new Date(row.original.created_at), 'dd MMM yyyy HH:mm')
        },
        {
            accessorKey: 'user_name',
            header: 'User',
            cell: ({ row }) => row.original.user_name || 'System'
        },
        {
            accessorKey: 'module',
            header: 'Module',
        },
        {
            accessorKey: 'action',
            header: 'Action',
            cell: ({ row }) => (
                <Badge variant="outline" className={getActionColor(row.original.action)}>
                    {row.original.action}
                </Badge>
            )
        },
        {
            accessorKey: 'module_id',
            header: 'Record ID',
        },
        {
            accessorKey: 'ip_address',
            header: 'IP Address',
        },
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('reports.audit'), {
                params: {
                    from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
                    to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null,
                    user_id: selectedUser !== 'all' ? selectedUser : null,
                    module: selectedModule !== 'all' ? selectedModule : null,
                    action: selectedAction !== 'all' ? selectedAction : null,
                },
                headers: { 'Accept': 'application/json' }
            });
            setData(response.data);
        } catch (error) {
            console.error("Failed to fetch audit data", error);
            toast.error("Failed to load audit log");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange, selectedUser, selectedModule, selectedAction]);

    const paginatedData = useMemo(() => {
        if (!data) return [];
        const start = pagination.pageIndex * pagination.pageSize;
        return data.logs.slice(start, start + pagination.pageSize);
    }, [data, pagination]);

    const pageCount = data ? Math.ceil(data.logs.length / pagination.pageSize) : 0;

    if (!data && loading) return <div className="p-6">Loading...</div>;
    if (!data) return null;

    return (
        <>
            <Head title="Audit Log" />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <SiteHeader breadcrumbs={breadcrumbs} />
                    <div className="p-6 space-y-6 min-h-screen">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
                                <p className="text-slate-500">System activity and change tracking</p>
                            </div>
                            <DateRangePicker date={dateRange} setDate={setDateRange} />
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            <Card className="border-l-4 border-l-blue-500 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                                    <Activity className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{data.logs.length}</div>
                                    <p className="text-xs text-muted-foreground">Logged actions</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-purple-500 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                                    <Users className="h-4 w-4 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {new Set(data.logs.map(l => l.user_name)).size}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Unique users</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-green-500 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Modules Affected</CardTitle>
                                    <FileText className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{data.activity_by_module.length}</div>
                                    <p className="text-xs text-muted-foreground">Different modules</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <ChartCard title="Activity by Module">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.activity_by_module} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" />
                                            <YAxis dataKey="module" type="category" width={80} tick={{ fontSize: 12 }} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            <ChartCard title="Daily Activity Trend">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data.daily_activity}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(str) => format(new Date(str), 'dd MMM')}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis />
                                            <Tooltip
                                                labelFormatter={(str) => format(new Date(str), 'dd MMM yyyy')}
                                            />
                                            <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>
                        </div>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Activity Log</CardTitle>
                                <CardDescription>Detailed system activity records</CardDescription>
                                <div className="grid gap-4 md:grid-cols-3 mt-4">
                                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                                        <SelectTrigger className='w-full'>
                                            <SelectValue placeholder="All Users" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Users</SelectItem>
                                            {users.map(u => (
                                                <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={selectedModule} onValueChange={setSelectedModule}>
                                        <SelectTrigger className='w-full'>
                                            <SelectValue placeholder="All Modules" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Modules</SelectItem>
                                            {modules.map(m => (
                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={selectedAction} onValueChange={setSelectedAction}>
                                        <SelectTrigger className='w-full'>
                                            <SelectValue placeholder="All Actions" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Actions</SelectItem>
                                            {actions.map(a => (
                                                <SelectItem key={a} value={a}>{a}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    columns={columns}
                                    data={paginatedData}
                                    pageCount={pageCount}
                                    pagination={pagination}
                                    onPaginationChange={setPagination}
                                    isLoading={loading}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
