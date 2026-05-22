import React from 'react';

export default function TopNavBar() {
    return (
        <div className="w-full bg-[#161920] border-b border-[#2a2d38] px-4 py-[9px] flex items-center justify-between">
            {/* Left Side */}
            <div className="flex items-center gap-3">
                <div className="w-[30px] h-[30px] bg-[#e07b1a] rounded-md flex items-center justify-center text-white font-medium">
                    H
                </div>
                <div className="flex flex-col">
                    <span className="text-[12px] font-medium text-[#f0f0f0] leading-tight">
                        Harmain Traders
                    </span>
                    <span className="text-[10px] text-[#888] leading-tight mt-0.5">
                        Counter Sales · Wholesale & Supply Chain
                    </span>
                </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-[10px]">
                {/* Shift Active Badge */}
                <div className="flex items-center gap-1.5 bg-[#4caf7a22] border border-[#4caf7a44] rounded px-2.5 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4caf7a] animate-pulse"></div>
                    <span className="text-[10px] text-[#4caf7a]">Shift active · 08:00 AM</span>
                </div>

                {/* User Avatar & Meta */}
                <div className="flex items-center gap-2 ml-2">
                    <div className="flex flex-col text-right">
                        <span className="text-[12px] font-medium text-[#e0e0e0] leading-tight">
                            Zain Ahmed
                        </span>
                        <span className="text-[10px] text-[#e07b1a] leading-tight mt-0.5">
                            Counter Salesman
                        </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#e07b1a] flex items-center justify-center text-white text-[11px] font-medium">
                        ZA
                    </div>
                </div>
            </div>
        </div>
    );
}
