'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

const navItems = [
    { href: '/', label: 'Upload & Extract', icon: '📤' },
    { href: '/work-orders', label: 'Work Orders', icon: '📊' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Close sidebar on navigate
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsOpen(false);
    }, [pathname]);

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-[#0b0f1a]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 z-40 flex items-center justify-between px-5 shadow-sm">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm shadow-[0_2px_8px_rgba(99,102,241,0.25)]">⚡</div>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-lg">OrderOCR</span>
                </div>
                <button onClick={() => setIsOpen(true)} className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer" aria-label="Open menu">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </div>

            {/* Backdrop */}
            {isOpen && (
                <div className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 animate-[fade-in_0.2s_ease-out]" onClick={() => setIsOpen(false)} />
            )}

            <aside className={`fixed left-0 top-0 bottom-0 w-[260px] bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-white/10 flex flex-col p-6 px-4 z-50 shadow-[2px_0_8px_rgba(0,0,0,0.03)] dark:shadow-none transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                {/* Brand */}
                <div className="text-center mb-8 pb-6 border-b border-slate-200 dark:border-white/10 relative">
                    <button onClick={() => setIsOpen(false)} className="md:hidden absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg cursor-pointer transition-colors">✕</button>
                    <div className="w-[52px] h-[52px] rounded-[14px] bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl mx-auto mb-3 shadow-[0_4px_16px_rgba(99,102,241,0.25)]">
                        ⚡
                    </div>
                    <h1 className="text-lg font-extrabold text-primary tracking-tight">OrderOCR</h1>
                    <p className="text-[0.65rem] text-slate-400 dark:text-slate-500 uppercase tracking-[2px] mt-0.5">AI-Powered Extraction</p>
                </div>

                {/* Nav */}
                <nav className="flex flex-col gap-1 flex-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] text-sm font-medium transition-all no-underline
                ${isActive
                                        ? 'bg-primary/10 text-primary font-semibold border-l-[3px] border-primary'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse-dot_2s_ease-in-out_infinite]" />
                        <span className="text-[0.72rem] text-slate-400 dark:text-slate-500">Connected</span>
                    </div>
                    <ThemeToggle />
                </div>
            </aside>
        </>
    );
}
