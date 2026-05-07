import React from 'react';
import { Link } from '@inertiajs/react';
import { 
    Phone, 
    Mail, 
    MapPin, 
    Facebook, 
    Instagram, 
    Twitter, 
    ExternalLink,
    ShieldCheck,
    Truck,
    Clock
} from 'lucide-react';
import AppLogo from '@/components/app-logo';

interface CatalogFooterProps {
    token: string;
}

export const CatalogFooter: React.FC<CatalogFooterProps> = ({ token }) => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 mt-5 pt-16 pb-8">
            <div className="max-w-[1800px] mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/" className="inline-block">
                            <AppLogo />
                        </Link>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xs">
                            Harnain Traders provides premium wholesale solutions with a focus on quality, 
                            reliability, and seamless trade experiences for our valued partners.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 hover:bg-orange-500 hover:text-white transition-all">
                                <Facebook size={16} />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 hover:bg-orange-500 hover:text-white transition-all">
                                <Instagram size={16} />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 hover:bg-orange-500 hover:text-white transition-all">
                                <Twitter size={16} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Navigation */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-zinc-100 mb-6">Quick Navigation</h4>
                        <ul className="space-y-4">
                            <li>
                                <Link href={`/g/${token}`} className="text-sm text-slate-500 dark:text-zinc-400 hover:text-orange-600 flex items-center gap-2 group transition-colors">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 group-hover:bg-orange-500 transition-colors" />
                                    Guest Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href={`/g/${token}/catalog`} className="text-sm text-slate-500 dark:text-zinc-400 hover:text-orange-600 flex items-center gap-2 group transition-colors">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 group-hover:bg-orange-500 transition-colors" />
                                    Shop Now
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-sm text-slate-500 dark:text-zinc-400 hover:text-orange-500 flex items-center gap-2 group transition-colors">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 group-hover:bg-orange-500 transition-colors" />
                                    Track Shipment
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-sm text-slate-500 dark:text-zinc-400 hover:text-orange-500 flex items-center gap-2 group transition-colors">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 group-hover:bg-orange-500 transition-colors" />
                                    Price List PDF
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support & Services */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-zinc-100 mb-6">Partner Support</h4>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                                <Clock className="text-orange-500 shrink-0" size={18} />
                                <div>
                                    <p className="text-xs font-black uppercase text-slate-900 dark:text-zinc-100">Working Hours</p>
                                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold mt-1">Mon - Sat: 09:00 - 18:00</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                                <ShieldCheck className="text-emerald-500 shrink-0" size={18} />
                                <div>
                                    <p className="text-xs font-black uppercase text-slate-900 dark:text-zinc-100">Trade Assurance</p>
                                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold mt-1">Verified Partner Program</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-zinc-100 mb-6">Contact Us</h4>
                        <div className="space-y-4">
                            <a href="tel:+923001234567" className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 group-hover:text-orange-500 transition-colors tracking-widest leading-none">Phone Support</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1">+92 300 1234567</p>
                                </div>
                            </a>
                            <a href="mailto:info@harnaintraders.com" className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 group-hover:text-orange-500 transition-colors tracking-widest leading-none">Email Inquiry</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1">info@harnaintraders.com</p>
                                </div>
                            </a>
                            <div className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Our Location</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1">Karachi, Pakistan</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                        © {currentYear} <span className="text-slate-900 dark:text-zinc-100">Harnain Traders</span>. All Rights Reserved.
                    </p>
                    <div className="flex items-center gap-8">
                        <Link href="#" className="text-[10px] font-black uppercase text-slate-400 hover:text-orange-500 transition-colors tracking-widest">Terms & Conditions</Link>
                        <Link href="#" className="text-[10px] font-black uppercase text-slate-400 hover:text-orange-500 transition-colors tracking-widest">Privacy Policy</Link>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-5 rounded bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-slate-200 dark:border-zinc-700">
                                <span className="text-[6px] font-black uppercase text-slate-400 tracking-tighter">VISA</span>
                            </div>
                            <div className="w-8 h-5 rounded bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-slate-200 dark:border-zinc-700">
                                <span className="text-[6px] font-black uppercase text-slate-400 tracking-tighter">MASTER</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
