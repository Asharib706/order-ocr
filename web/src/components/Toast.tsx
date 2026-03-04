'use client';

import { useEffect, useState } from 'react';
import styles from './Toast.module.css';

export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}

interface ToastProps {
    toasts: ToastMessage[];
    onRemove: (id: string) => void;
}

export default function Toast({ toasts, onRemove }: ToastProps) {
    return (
        <div className={styles.container}>
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

    const icons: Record<string, string> = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
    };

    return (
        <div className={`${styles.toast} ${styles[toast.type]} ${exiting ? styles.exit : ''}`}>
            <span className={styles.icon}>{icons[toast.type]}</span>
            <span className={styles.message}>{toast.message}</span>
            <button className={styles.close} onClick={() => { setExiting(true); setTimeout(() => onRemove(toast.id), 300); }}>✕</button>
        </div>
    );
}

// Helper hook
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
