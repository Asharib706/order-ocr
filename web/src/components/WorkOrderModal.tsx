'use client';

import { useState, useEffect } from 'react';
import { WorkOrder } from '@/types';
import styles from './WorkOrderModal.module.css';

interface WorkOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: WorkOrder | null;
    mode: 'view' | 'edit';
    onSave?: (data: Partial<WorkOrder>) => void;
    onDelete?: (id: string) => void;
    onSwitchToEdit?: () => void;
}

export default function WorkOrderModal({
    isOpen,
    onClose,
    order,
    mode,
    onSave,
    onDelete,
    onSwitchToEdit,
}: WorkOrderModalProps) {
    const [formData, setFormData] = useState<Partial<WorkOrder>>({});

    useEffect(() => {
        if (order) {
            setFormData({ ...order });
        }
    }, [order]);

    if (!isOpen || !order) return null;

    const handleChange = (field: string, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave?.(formData);
    };

    const isView = mode === 'view';

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.title}>
                            {isView ? '📋 Work Order Details' : '✏️ Edit Work Order'}
                        </h2>
                        <p className={styles.subtitle}>
                            {isView
                                ? `Viewing order ${order.work_order_number || '#' + order.id}`
                                : `Editing order ${order.work_order_number || '#' + order.id}`}
                        </p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    {/* Row 1: Order # and Job # */}
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label}>Work Order #</label>
                            {isView ? (
                                <div className={styles.value}>{order.work_order_number || '—'}</div>
                            ) : (
                                <input
                                    className={styles.input}
                                    value={formData.work_order_number || ''}
                                    onChange={(e) => handleChange('work_order_number', e.target.value)}
                                    placeholder="Enter work order number"
                                />
                            )}
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Job #</label>
                            {isView ? (
                                <div className={styles.value}>{order.job_number || '—'}</div>
                            ) : (
                                <input
                                    className={styles.input}
                                    value={formData.job_number || ''}
                                    onChange={(e) => handleChange('job_number', e.target.value)}
                                    placeholder="Enter job number"
                                />
                            )}
                        </div>
                    </div>

                    {/* Row 2: Date and Hours */}
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label}>Date</label>
                            {isView ? (
                                <div className={styles.value}>{order.date || '—'}</div>
                            ) : (
                                <input
                                    className={styles.input}
                                    value={formData.date || ''}
                                    onChange={(e) => handleChange('date', e.target.value)}
                                    placeholder="MM/DD/YYYY"
                                />
                            )}
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Hours</label>
                            {isView ? (
                                <div className={styles.value}>{order.hours || '—'}</div>
                            ) : (
                                <input
                                    className={styles.input}
                                    value={formData.hours || ''}
                                    onChange={(e) => handleChange('hours', e.target.value)}
                                    placeholder="0.00"
                                />
                            )}
                        </div>
                    </div>

                    {/* Row 3: Total Amount Due */}
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label}>Total Amount Due</label>
                            {isView ? (
                                <div className={`${styles.value} ${styles.amount}`}>
                                    {order.total_amount_due ? `$${order.total_amount_due}` : '—'}
                                </div>
                            ) : (
                                <input
                                    className={styles.input}
                                    value={formData.total_amount_due || ''}
                                    onChange={(e) => handleChange('total_amount_due', e.target.value)}
                                    placeholder="0.00"
                                />
                            )}
                        </div>
                    </div>

                    {/* Signatures Section */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Signatures</h3>
                        <div className={styles.checkboxRow}>
                            <label className={styles.checkboxLabel}>
                                {isView ? (
                                    <span className={`${styles.badge} ${order.signed_by_both ? styles.badgeGreen : styles.badgeRed}`}>
                                        {order.signed_by_both ? '✓ Signed by Both' : '✗ Not Signed by Both'}
                                    </span>
                                ) : (
                                    <>
                                        <input
                                            type="checkbox"
                                            className={styles.checkbox}
                                            checked={!!formData.signed_by_both}
                                            onChange={(e) => handleChange('signed_by_both', e.target.checked)}
                                        />
                                        <span>Signed by Both</span>
                                    </>
                                )}
                            </label>
                            <label className={styles.checkboxLabel}>
                                {isView ? (
                                    <span className={`${styles.badge} ${order.customer_sign ? styles.badgeGreen : styles.badgeRed}`}>
                                        {order.customer_sign ? '✓ Customer Signed' : '✗ Customer Not Signed'}
                                    </span>
                                ) : (
                                    <>
                                        <input
                                            type="checkbox"
                                            className={styles.checkbox}
                                            checked={!!formData.customer_sign}
                                            onChange={(e) => handleChange('customer_sign', e.target.checked)}
                                        />
                                        <span>Customer Sign</span>
                                    </>
                                )}
                            </label>
                            <label className={styles.checkboxLabel}>
                                {isView ? (
                                    <span className={`${styles.badge} ${order.wcdp_sign ? styles.badgeGreen : styles.badgeRed}`}>
                                        {order.wcdp_sign ? '✓ WCDP Signed' : '✗ WCDP Not Signed'}
                                    </span>
                                ) : (
                                    <>
                                        <input
                                            type="checkbox"
                                            className={styles.checkbox}
                                            checked={!!formData.wcdp_sign}
                                            onChange={(e) => handleChange('wcdp_sign', e.target.checked)}
                                        />
                                        <span>WCDP Sign</span>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Description */}
                    <div className={styles.field}>
                        <label className={styles.label}>Description</label>
                        {isView ? (
                            <div className={`${styles.value} ${styles.descriptionValue}`}>
                                {order.description || '—'}
                            </div>
                        ) : (
                            <textarea
                                className={styles.textarea}
                                value={formData.description || ''}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Enter description"
                                rows={4}
                            />
                        )}
                    </div>

                    {/* Raw Text (only in view mode) */}
                    {isView && order.raw_text && (
                        <div className={styles.field}>
                            <label className={styles.label}>Raw OCR Text</label>
                            <div className={`${styles.value} ${styles.rawText}`}>
                                {order.raw_text}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    {isView ? (
                        <>
                            <button className="btn btn-secondary" onClick={onClose}>
                                Close
                            </button>
                            <button className="btn btn-primary" onClick={onSwitchToEdit}>
                                ✏️ Edit
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => onDelete?.(order.id)}
                            >
                                🗑 Delete
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                💾 Save Changes
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
