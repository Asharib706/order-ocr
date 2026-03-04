'use client';

import { useState, useEffect } from 'react';
import { WorkOrder } from '@/types';

interface WorkOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: WorkOrder | null;
    mode: 'view' | 'edit';
    onSave?: (data: Partial<WorkOrder>) => void;
    onDelete?: (id: string) => void;
    onSwitchToEdit?: () => void;
}

export default function WorkOrderModal({ isOpen, onClose, order, mode, onSave, onDelete, onSwitchToEdit }: WorkOrderModalProps) {
    const [formData, setFormData] = useState<Partial<WorkOrder>>({});

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (order) setFormData({ ...order });
    }, [order]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen || !order) return null;

    const handleChange = (field: string, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => onSave?.(formData);
    const isView = mode === 'view';

    const inputCls = 'w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all';

    return (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-[4px] flex items-center justify-center z-[1000] animate-[overlay-in_0.2s_ease]" onClick={onClose}>
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-2xl w-[95%] max-w-[640px] max-h-[85vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-[modal-in_0.25s_cubic-bezier(0.34,1.56,0.64,1)]" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-start justify-between px-4 sm:px-7 pt-5 pb-3 border-b border-slate-200 dark:border-white/10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-0.5">
                            {isView ? '📋 Work Order Details' : '✏️ Edit Work Order'}
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            {isView ? 'Viewing' : 'Editing'} order {order.work_order_number || '#' + order.id}
                        </p>
                    </div>
                    <button className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-400 flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 transition-all cursor-pointer shrink-0" onClick={onClose}>✕</button>
                </div>

                {/* Body */}
                <div className="px-4 sm:px-7 py-4 overflow-y-auto flex flex-col gap-4">
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Work Order #</label>
                            {isView ? (
                                <div className="text-sm text-slate-900 dark:text-slate-100 px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5 min-h-[38px] flex items-center">{order.work_order_number || '—'}</div>
                            ) : (
                                <input className={inputCls} value={formData.work_order_number || ''} onChange={(e) => handleChange('work_order_number', e.target.value)} placeholder="Enter work order number" />
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Job #</label>
                            {isView ? (
                                <div className="text-sm text-slate-900 dark:text-slate-100 px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5 min-h-[38px] flex items-center">{order.job_number || '—'}</div>
                            ) : (
                                <input className={inputCls} value={formData.job_number || ''} onChange={(e) => handleChange('job_number', e.target.value)} placeholder="Enter job number" />
                            )}
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Date</label>
                            {isView ? (
                                <div className="text-sm text-slate-900 dark:text-slate-100 px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5 min-h-[38px] flex items-center">{order.date || '—'}</div>
                            ) : (
                                <input className={inputCls} value={formData.date || ''} onChange={(e) => handleChange('date', e.target.value)} placeholder="MM/DD/YYYY" />
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Hours</label>
                            {isView ? (
                                <div className="text-sm text-slate-900 dark:text-slate-100 px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5 min-h-[38px] flex items-center">{order.hours || '—'}</div>
                            ) : (
                                <input className={inputCls} value={formData.hours || ''} onChange={(e) => handleChange('hours', e.target.value)} placeholder="0.00" />
                            )}
                        </div>
                    </div>

                    {/* Row 3 */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Amount Due</label>
                        {isView ? (
                            <div className="text-base font-semibold text-primary px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5 min-h-[38px] flex items-center">
                                {order.total_amount_due ? `$${order.total_amount_due}` : '—'}
                            </div>
                        ) : (
                            <input className={inputCls} value={formData.total_amount_due || ''} onChange={(e) => handleChange('total_amount_due', e.target.value)} placeholder="0.00" />
                        )}
                    </div>

                    {/* Signatures */}
                    <div className="border-t border-slate-200 dark:border-white/10 pt-3">
                        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Signatures</h3>
                        <div className="flex flex-wrap gap-3">
                            {(['signed_by_both', 'customer_sign', 'wcdp_sign'] as const).map((field) => {
                                const labels: Record<string, [string, string]> = {
                                    signed_by_both: ['✓ Signed by Both', '✗ Not Signed by Both'],
                                    customer_sign: ['✓ Customer Signed', '✗ Customer Not Signed'],
                                    wcdp_sign: ['✓ WCDP Signed', '✗ WCDP Not Signed'],
                                };
                                const val = isView ? order[field] : formData[field];
                                return isView ? (
                                    <span key={field} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${val ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'}`}>
                                        {val ? labels[field][0] : labels[field][1]}
                                    </span>
                                ) : (
                                    <label key={field} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                                        <input type="checkbox" className="w-[18px] h-[18px] accent-primary cursor-pointer" checked={!!formData[field]} onChange={(e) => handleChange(field, e.target.checked)} />
                                        <span>{field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Description</label>
                        {isView ? (
                            <div className="text-sm text-slate-900 dark:text-slate-100 px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5 min-h-[60px] whitespace-pre-wrap break-words">{order.description || '—'}</div>
                        ) : (
                            <textarea className={`${inputCls} resize-y min-h-[80px]`} value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} placeholder="Enter description" rows={4} />
                        )}
                    </div>

                    {/* Raw Text */}
                    {isView && order.raw_text && (
                        <div className="flex flex-col gap-1">
                            <label className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Raw OCR Text</label>
                            <div className="text-xs font-mono text-slate-400 dark:text-slate-500 px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5 max-h-[150px] overflow-y-auto whitespace-pre-wrap break-all">{order.raw_text}</div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2.5 px-4 sm:px-7 py-4 border-t border-slate-200 dark:border-white/10">
                    {isView ? (
                        <>
                            <button className="px-4 py-2 rounded-[10px] text-sm font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-all cursor-pointer" onClick={onClose}>Close</button>
                            <button className="px-4 py-2 rounded-[10px] text-sm font-semibold bg-gradient-to-br from-primary to-secondary text-white shadow-[0_2px_12px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-all cursor-pointer" onClick={onSwitchToEdit}>✏️ Edit</button>
                            <button className="px-4 py-2 rounded-[10px] text-sm font-semibold bg-rose-500/8 dark:bg-rose-500/10 text-rose-500 border border-rose-500/15 hover:bg-rose-500/15 transition-all cursor-pointer" onClick={() => onDelete?.(order.id)}>🗑 Delete</button>
                        </>
                    ) : (
                        <>
                            <button className="px-4 py-2 rounded-[10px] text-sm font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-all cursor-pointer" onClick={onClose}>Cancel</button>
                            <button className="px-4 py-2 rounded-[10px] text-sm font-semibold bg-gradient-to-br from-primary to-secondary text-white shadow-[0_2px_12px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-all cursor-pointer" onClick={handleSave}>💾 Save Changes</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
