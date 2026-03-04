'use client';

import { useEffect, useState } from 'react';

export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}

interface ToastProps {
    toasts: ToastMessage[];
    onRemove: (id: string) => void;
}

const toastStyles: Record<string, string> = {
    success: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20',
    error: 'bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20',
    info: 'bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20',
};

const icons: Record<string, string> = { success: '✓', error: '✕', info: 'ℹ' };

export default function Toast({ toasts, onRemove }: ToastProps) {
    return (
        <div className="fixed top-5 right-5 flex flex-col gap-2.5 z-[1100]">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(() => onRemove(toast.id), 300);
        }, 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    return (
        <div
            className={`px-4 py-3 rounded-[10px] text-sm font-medium flex items-center gap-2 min-w-[260px] max-w-[400px] shadow-md cursor-pointer
        ${toastStyles[toast.type]}
        ${exiting ? 'animate-[slide-out_0.2s_ease_forwards]' : 'animate-[slide-in_0.25s_cubic-bezier(0.34,1.56,0.64,1)]'}
      `}
        >
            <span className="font-bold">{icons[toast.type]}</span>
            <span className="flex-1">{toast.message}</span>
            <button className="opacity-50 hover:opacity-100 cursor-pointer text-sm ml-2" onClick={() => { setExiting(true); setTimeout(() => onRemove(toast.id), 300); }}>✕</button>
        </div>
    );
}

export function useToast() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (type: ToastMessage['type'], message: string) => {
        const id = Date.now().toString() + Math.random();
        setToasts((prev) => [...prev, { id, type, message }]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return { toasts, addToast, removeToast };
}
