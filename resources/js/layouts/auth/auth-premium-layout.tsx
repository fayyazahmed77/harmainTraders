import AppLogo from '@/components/app-logo';
import { type PropsWithChildren } from 'react';
import { Target, Globe, FileCheck, Plane } from 'lucide-react';

const IMAGES = [
    "/images/Image_5.jpeg",
];

interface AuthPremiumLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthPremiumLayout({ children, title, description }: PropsWithChildren<AuthPremiumLayoutProps>) {
    return (
        <div className="h-screen w-full text-zinc-900 lg:grid lg:grid-cols-2 overflow-hidden bg-white">
            {/* Left Column - Login Form */}
            <div className="relative flex h-full flex-col justify-between px-6 py-8 sm:px-12 sm:py-12 lg:px-16 lg:py-12 xl:px-20 overflow-y-auto custom-scrollbar">
                <div className="flex flex-1 flex-col justify-center py-8">
                    <div className="mx-auto w-full max-w-md space-y-8">
                        {/* Form Container */}
                        {children}
                    </div>
                </div>

                {/* Footer Logo partner with sperton */}
                <div className="mx-auto flex w-full max-w-md justify-center items-center gap-4 pt-8 border-t border-slate-100">
                    <AppLogo />
                    <div className="h-10 w-px bg-slate-200"></div>
                    <img
                        src="/images/aishtycoon.png"
                        alt="Aishtycoon Logo"
                        className="h-10 w-auto object-contain"
                    />
                </div>
            </div>

            {/* Right Column - Promo / Feature Card */}
            <div className="hidden lg:block relative h-full overflow-hidden bg-black border-l border-white/5">
                {/* Background Image - Full Cover */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={IMAGES[0]}
                        alt="Professional Background"
                        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                    />
                    {/* Multi-layered High-end Overlay */}
                    <div className="absolute inset-0 bg-slate-950/25" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                </div>

                {/* Animated Flags Layer - Soap Bubbles Physics */}
                <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden" style={{ zIndex: 999 }}>
                    {[
                        { name: 'apple', size: 45, left: '10%', delay: '0s', dur: '12s' },
                        { name: 'banana', size: 35, left: '60%', delay: '2s', dur: '14s' },
                        { name: 'orange', size: 50, left: '25%', delay: '5s', dur: '16s' },
                        { name: 'biscuits', size: 40, left: '75%', delay: '1s', dur: '13s' },
                        { name: 'oil', size: 42, left: '40%', delay: '8s', dur: '15s' },
                        { name: 'rice', size: 38, left: '85%', delay: '4s', dur: '14s' },
                        { name: 'apple', size: 30, left: '20%', delay: '10s', dur: '17s' },
                        { name: 'orange', size: 36, left: '50%', delay: '3s', dur: '13s' },
                    ].map((product, i) => (
                        <div
                            key={i}
                            className="absolute bottom-[-100px] animate-soap-bubble opacity-0"
                            style={{
                                left: product.left,
                                animationDuration: product.dur,
                                animationDelay: product.delay,
                            }}
                        >
                            {/* Glass Bubble Container */}
                            <div className="relative p-1 rounded-full bg-white/10 backdrop-blur-[2px] border border-white/30 shadow-[inset_0_0_10px_rgba(255,255,255,0.5),0_5px_15px_rgba(0,0,0,0.1)] overflow-hidden flex items-center justify-center"
                                style={{ width: product.size + 10, height: product.size + 10 }}>
                                <img
                                    src={`/images/products/${product.name}.png`}
                                    alt={product.name}
                                    style={{ width: product.size, height: product.size }}
                                    className="object-contain"
                                />
                                {/* Bubble Shine */}
                                <div className="absolute top-1 left-2 w-1/3 h-1/4 bg-white/40 rounded-full blur-[1px] -rotate-15" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 xl:p-12">
                    {/* Header with High-end Typography */}
                    <div className="mb-12 text-center space-y-6 mt-auto max-w-lg">
                        <div className="space-y-4">
                            <h2 className="text-3xl xl:text-4xl font-extrabold leading-[1.1] text-white tracking-tight drop-shadow-2xl">
                                <span className="bg-gradient-to-r from-orange-300 via-orange-100 to-orange-300 bg-clip-text text-transparent text-[2rem]">
                                    Harmain Traders Wholesale & Supply Chain.
                                </span>
                            </h2>
                        </div>
                    </div>

                    {/* Pro Feature Cards - Message Bubbles Style (Final Static & Staggered) */}
                    <div className="relative w-full h-[450px] max-w-[620px] mx-auto mt-4 z-20">

                        <div className="absolute top-[5%] right-[5%] xl:right-0 bg-indigo-50/90 backdrop-blur-2xl p-5 rounded-[2rem] rounded-tr-none shadow-[0_20px_50px_rgba(79,70,229,0.2)] border border-indigo-200/50 z-[1001] max-w-[210px] transition-all hover:scale-[1.05] hover:bg-indigo-50 duration-500 animate-[pop-in_0.6s_ease-out_2s_forwards] origin-top-right opacity-0">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-indigo-500/10 rounded-2xl shrink-0 border border-indigo-500/20 shadow-inner">
                                    <Target className="w-3 h-3 text-indigo-500" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-xs text-indigo-950">Product Catalog Management</h3>
                                    <p className="text-[10px] text-indigo-800/80 font-medium leading-tight">Comprehensive inventory tracking and product organization</p>
                                </div>
                            </div>

                            <div className="absolute top-[-1px] right-[-11px] w-6 h-6 bg-indigo-50/90 backdrop-blur-2xl [clip-path:polygon(0_0,0_100%,100%_0)] border-t border-r border-indigo-200/50" />
                        </div>


                        <div className="absolute top-[-14px%] left-[4%] xl:left-[-5%] bg-emerald-50/90 backdrop-blur-2xl p-5 rounded-[2rem] rounded-tl-none shadow-[0_20px_50px_rgba(16,185,129,0.2)] border border-emerald-200/50 z-[1002] max-w-[220px] transition-all hover:scale-[1.05] hover:bg-emerald-50 duration-500 animate-[pop-in_0.6s_ease-out_2.3s_forwards] origin-top-left opacity-0">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-emerald-500/10 rounded-2xl shrink-0 border border-emerald-500/20 shadow-inner">
                                    <Globe className="w-3 h-3 text-emerald-500" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-xs text-emerald-950">Global Supplier Network</h3>
                                    <p className="text-[10px] text-emerald-800/80 font-medium leading-tight">Connect with trusted suppliers across multiple regions</p>
                                </div>
                            </div>

                            <div className="absolute top-[-1px] left-[-11px] w-6 h-6 bg-emerald-50/90 backdrop-blur-2xl [clip-path:polygon(100%_0,0_0,100%_100%)] border-t border-l border-emerald-200/50" />
                        </div>


                        <div className="absolute bottom-[10%] left-[8%] xl:left-[0%] bg-sky-50/90 backdrop-blur-2xl p-5 rounded-[2rem] rounded-bl-none shadow-[0_20px_50px_rgba(14,165,233,0.2)] border border-sky-200/50 z-[1001] max-w-[220px] transition-all hover:scale-[1.05] hover:bg-sky-50 duration-500 animate-[pop-in_0.6s_ease-out_2.6s_forwards] origin-bottom-left opacity-0">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-sky-500/10 rounded-2xl shrink-0 border border-sky-500/20 shadow-inner">
                                    <FileCheck className="w-3 h-3 text-sky-500" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-xs text-sky-950">Import/Export Documentation</h3>
                                    <p className="text-[10px] text-sky-800/80 font-medium leading-tight">Streamlined customs and compliance documentation</p>
                                </div>
                            </div>

                            <div className="absolute bottom-[-1px] left-[-11px] w-6 h-6 bg-sky-50/90 backdrop-blur-2xl [clip-path:polygon(0_100%,100%_100%,100%_0)] border-b border-l border-sky-200/50" />
                        </div>


                        <div className="absolute bottom-[5%] right-[8%] xl:right-[0%] bg-amber-50/90 backdrop-blur-2xl p-5 rounded-[2rem] rounded-br-none shadow-[0_20px_50px_rgba(245,158,11,0.2)] border border-amber-200/50 z-[1001] max-w-[220px] transition-all hover:scale-[1.05] hover:bg-amber-50 duration-500 animate-[pop-in_0.6s_ease-out_2.9s_forwards] origin-bottom-right opacity-0">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-amber-500/10 rounded-2xl shrink-0 border border-amber-500/20 shadow-inner">
                                    <Plane className="w-3 h-3 text-amber-500" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-xs text-amber-950">Logistics & Shipping Coordination</h3>
                                    <p className="text-[10px] text-amber-800/80 font-medium leading-tight">End-to-end freight and delivery management</p>
                                </div>
                            </div>

                            <div className="absolute bottom-[-1px] right-[-11px] w-6 h-6 bg-amber-50/90 backdrop-blur-2xl [clip-path:polygon(100%_100%,0_100%,0_0)] border-b border-r border-amber-200/50" />
                        </div>
                    </div>
                </div>


                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes pop-in {
                        0% { transform: scale(0.7) translateY(20px); opacity: 0; filter: blur(10px); }
                        100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0); }
                    }
                    @keyframes soap-bubble-float {
                        0% { transform: translateY(0) translateX(0) scale(0.8); opacity: 0; }
                        5% { opacity: 0.8; }
                        25% { transform: translateY(-25vh) translateX(20px) scale(1); }
                        50% { transform: translateY(-50vh) translateX(-20px) scale(0.9); }
                        75% { transform: translateY(-75vh) translateX(15px) scale(1.1); }
                        95% { opacity: 0.8; transform: translateY(-95vh) translateX(-10px) scale(1.1); }
                        100% { transform: translateY(-100vh) translateX(0) scale(2); opacity: 0; }
                    }
                    .animate-soap-bubble {
                        animation: soap-bubble-float linear infinite;
                        will-change: transform, opacity;
                    }
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(0,0,0,0.05);
                        border-radius: 10px;
                    }
                `}} />
            </div>
        </div>
    );
}
