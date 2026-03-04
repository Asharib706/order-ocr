'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

const navItems = [
    { href: '/', label: 'Upload & Extract', icon: '📤' },
    { href: '/work-orders', label: 'Work Orders', icon: '📊' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-white/10 flex flex-col p-6 px-4 z-50 shadow-[2px_0_8px_rgba(0,0,0,0.03)] dark:shadow-none">
            {/* Brand */}
            <div className="text-center mb-8 pb-6 border-b border-slate-200 dark:border-white/10">
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
    );
}
