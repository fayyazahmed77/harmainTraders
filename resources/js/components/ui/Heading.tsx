"use client";

import React from "react";
import { motion } from "framer-motion";

interface HeadingProps {
    title: string;
    description: string;
}

export function Heading({ title, description }: HeadingProps) {
    return (
        <div className="flex flex-col gap-1">
            <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 leading-none"
            >
                {title}
            </motion.h1>
            <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-zinc-400"
            >
                {description}
            </motion.p>
        </div>
    );
}
