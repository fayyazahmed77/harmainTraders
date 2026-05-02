import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { 
    Users, 
    TrendingUp, 
    ShieldCheck, 
    ArrowUpRight,
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    FileSpreadsheet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';

interface Investor {
    id: number;
    name: string;
    capital: number;
    ownership: number;
    status: string;
}

interface Props {
    investors: Investor[];
}

export default function Index({ investors }: Props) {
    const breadcrumbs = [
        { title: 'Admin Panel', href: '#' },
        { title: 'Investor Management', href: '/admin/investors' },
    ];

    const totalCapital = investors.reduce((sum, inv) => sum + inv.capital, 0);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        cnic: '',
        address: '',
        initial_capital: '',
    });

    const [isOpen, setIsOpen] = React.useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.investors.store'), {
            onSuccess: () => {
                setIsOpen(false);
                reset();
                clearErrors();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Investor Management" />

            <div className="mx-auto w-full max-w-[1600px] p-4 lg:p-6 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase">
                            Investor Management
                        </h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            Oversee capital participation and ownership distribution
                        </p>
                    </motion.div>
                    
                    <div className="flex items-center gap-2">
                        <a href="/admin/investors/export-excel" target="_blank">
                            <Button variant="outline" className="h-10 rounded-xl border-border/50 bg-surface-1/50 backdrop-blur-sm">
                                <FileSpreadsheet size={16} className="mr-2 text-emerald-500" /> 
                                <span className="text-[10px] font-black uppercase tracking-wider">Export Excel</span>
                            </Button>
                        </a>
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-10 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">
                                    <Users size={16} className="mr-2" /> 
                                    <span className="text-[10px] font-black uppercase tracking-wider">Add New Investor</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px] bg-surface-1/95 backdrop-blur-xl border-border/50 p-0 overflow-hidden rounded-3xl">
                                <form onSubmit={handleSubmit}>
                                    <div className="p-8 space-y-6">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                                    <Users size={20} />
                                                </div>
                                                Register New Investor
                                            </DialogTitle>
                                            <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
                                                Create a new investor profile and initialize their capital account.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                                                <Input 
                                                    value={data.name}
                                                    onChange={e => setData('name', e.target.value)}
                                                    className="bg-background/50 border-border/50 rounded-xl h-11 text-xs font-bold focus:ring-primary/20"
                                                    placeholder="e.g. Raza Sheikh"
                                                />
                                                {errors.name && <p className="text-[9px] font-black text-rose-500 uppercase mt-1">{errors.name}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</Label>
                                                <Input 
                                                    type="email"
                                                    value={data.email}
                                                    onChange={e => setData('email', e.target.value)}
                                                    className="bg-background/50 border-border/50 rounded-xl h-11 text-xs font-bold focus:ring-primary/20"
                                                    placeholder="investor@example.com"
                                                />
                                                {errors.email && <p className="text-[9px] font-black text-rose-500 uppercase mt-1">{errors.email}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
                                                <Input 
                                                    type="password"
                                                    value={data.password}
                                                    onChange={e => setData('password', e.target.value)}
                                                    className="bg-background/50 border-border/50 rounded-xl h-11 text-xs font-bold focus:ring-primary/20"
                                                    placeholder="Minimum 8 characters"
                                                />
                                                {errors.password && <p className="text-[9px] font-black text-rose-500 uppercase mt-1">{errors.password}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                                                <Input 
                                                    value={data.phone}
                                                    onChange={e => setData('phone', e.target.value)}
                                                    className="bg-background/50 border-border/50 rounded-xl h-11 text-xs font-bold focus:ring-primary/20"
                                                    placeholder="0300-1234567"
                                                />
                                                {errors.phone && <p className="text-[9px] font-black text-rose-500 uppercase mt-1">{errors.phone}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">CNIC Number</Label>
                                                <Input 
                                                    value={data.cnic}
                                                    onChange={e => setData('cnic', e.target.value)}
                                                    className="bg-background/50 border-border/50 rounded-xl h-11 text-xs font-bold focus:ring-primary/20"
                                                    placeholder="42101-1234567-1"
                                                />
                                                {errors.cnic && <p className="text-[9px] font-black text-rose-500 uppercase mt-1">{errors.cnic}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Initial Capital (PKR)</Label>
                                                <Input 
                                                    type="number"
                                                    value={data.initial_capital}
                                                    onChange={e => setData('initial_capital', e.target.value)}
                                                    className="bg-background/50 border-border/50 rounded-xl h-11 text-xs font-bold focus:ring-primary/20 font-mono"
                                                    placeholder="0.00"
                                                />
                                                {errors.initial_capital && <p className="text-[9px] font-black text-rose-500 uppercase mt-1">{errors.initial_capital}</p>}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Physical Address</Label>
                                            <Textarea 
                                                value={data.address}
                                                onChange={e => setData('address', e.target.value)}
                                                className="bg-background/50 border-border/50 rounded-xl min-h-[80px] text-xs font-bold focus:ring-primary/20 resize-none"
                                                placeholder="Complete residential or business address"
                                            />
                                            {errors.address && <p className="text-[9px] font-black text-rose-500 uppercase mt-1">{errors.address}</p>}
                                        </div>
                                    </div>

                                    <DialogFooter className="p-6 bg-surface-2/50 border-t border-border/50">
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            onClick={() => setIsOpen(false)}
                                            className="h-11 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            disabled={processing}
                                            className="h-11 px-8 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-black text-[10px] uppercase tracking-widest"
                                        >
                                            {processing ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Processing
                                                </>
                                            ) : (
                                                'Confirm Registration'
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Quick Stats Grid with Glassmorphism */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[
                        { label: 'Total Managed Capital', value: `PKR ${totalCapital.toLocaleString()}`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/5' },
                        { label: 'Active Investors', value: investors.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                        { label: 'Ownership Allocated', value: '100%', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative overflow-hidden rounded-2xl border border-border/50 ${stat.bg} p-6 backdrop-blur-md shadow-sm group hover:border-primary/30 transition-all`}
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-primary/5 transition-colors"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                            <div className="mt-3 flex items-center justify-between">
                                <h2 className="text-2xl font-black text-foreground tracking-tight">{stat.value}</h2>
                                <div className={`p-2 rounded-lg ${stat.bg} border border-border/20`}>
                                    <stat.icon size={20} className={stat.color} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Table Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-border/50 bg-surface-1/50 backdrop-blur-xl shadow-sm overflow-hidden"
                >
                    <div className="flex flex-col sm:flex-row items-center justify-between border-b border-border/50 p-4 gap-4">
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="SEARCH INVESTORS..." 
                                className="h-10 pl-9 pr-4 bg-background/50 border border-border/50 rounded-xl text-[10px] font-black tracking-widest text-foreground outline-none focus:border-primary/50 transition-colors w-full sm:w-64 uppercase"
                            />
                        </div>
                        <Button variant="outline" className="h-10 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm w-full sm:w-auto">
                            <Filter size={14} className="mr-2" /> 
                            <span className="text-[10px] font-black uppercase tracking-wider">Advanced Filters</span>
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-surface-2/50">
                                <TableRow className="border-border/50 hover:bg-transparent">
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12">Investor Details</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12">Capital (PKR)</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12">Ownership Stake</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12">Account Status</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {investors.map((investor) => (
                                    <TableRow key={investor.id} className="border-border/50 hover:bg-surface-2/30 transition-colors group">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">
                                                    {investor.name}
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground mt-0.5 font-mono">
                                                    INV-{investor.id.toString().padStart(4, '0')}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-black text-foreground font-mono tabular-nums">
                                                {investor.capital.toLocaleString()}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-1.5 w-24 rounded-full bg-surface-3 overflow-hidden border border-border/20">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${investor.ownership}%` }}
                                                        className="h-full bg-primary" 
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-foreground font-mono">{Number(investor.ownership).toFixed(2)}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[9px] font-black tracking-widest uppercase border ${
                                                investor.status === 'active' 
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                                    : 'bg-muted/10 text-muted-foreground border-border/50'
                                            }`}>
                                                {investor.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/admin/investors/${investor.id}`}>
                                                <Button variant="ghost" size="sm" className="h-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all">
                                                    <Eye size={14} className="mr-2" /> 
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Detail View</span>
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </motion.div>
            </div>
        </AppLayout>
    );
}
