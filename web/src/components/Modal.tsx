'use client';

import { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, actions }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-[4px] flex items-center justify-center z-[1000] animate-[overlay-in_0.15s_ease]" onClick={onClose}>
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-2xl w-[92%] max-w-[460px] shadow-lg animate-[modal-in_0.2s_cubic-bezier(0.34,1.56,0.64,1)]" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-white/10">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
                    <button className="w-[30px] h-[30px] rounded-lg bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500 flex items-center justify-center transition-all hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer" onClick={onClose}>✕</button>
                </div>
                <div className="px-4 sm:px-6 py-4">{children}</div>
                {actions && <div className="flex justify-end gap-2.5 px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-white/10">{actions}</div>}
            </div>
        </div>
    );
}
