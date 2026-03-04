'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import MetricCard from '@/components/MetricCard';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import Toast, { useToast } from '@/components/Toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import WorkOrderModal from '@/components/WorkOrderModal';
import { fetchWorkOrders, updateWorkOrder, deleteWorkOrder, exportWorkOrders } from '@/lib/api';
import { WorkOrder, FilterParams } from '@/types';

export default function WorkOrdersPage() {
    const [data, setData] = useState<WorkOrder[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [ascending, setAscending] = useState(false);
    const [signedByBoth, setSignedByBoth] = useState<boolean | null>(null);
    const [customerSign, setCustomerSign] = useState<boolean | null>(null);
    const [wcdpSign, setWcdpSign] = useState<boolean | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
    const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
    const [modalOpen, setModalOpen] = useState(false);

    // Delete modal
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { toasts, addToast, removeToast } = useToast();
    const addToastRef = useRef(addToast);
    addToastRef.current = addToast;

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params: FilterParams = {
                page,
                pageSize,
                search: debouncedSearch,
                sortBy,
                ascending,
                signedByBoth,
                customerSign,
                wcdpSign,
            };
            const result = await fetchWorkOrders(params);
            setData(result.data);
            setTotal(result.total);
            setTotalPages(result.totalPages);
        } catch (err) {
            addToastRef.current('error', err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, debouncedSearch, sortBy, ascending, signedByBoth, customerSign, wcdpSign]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, sortBy, ascending, signedByBoth, customerSign, wcdpSign, pageSize]);

    // Open row in view mode
    const handleRowClick = (order: WorkOrder) => {
        setSelectedOrder(order);
        setModalMode('view');
        setModalOpen(true);
    };

    // Open row in edit mode
    const handleEditClick = (e: React.MouseEvent, order: WorkOrder) => {
        e.stopPropagation();
        setSelectedOrder(order);
        setModalMode('edit');
        setModalOpen(true);
    };

    // Switch from view → edit
    const handleSwitchToEdit = () => {
        setModalMode('edit');
    };

    // Save from modal
    const handleModalSave = async (formData: Partial<WorkOrder>) => {
        if (!selectedOrder) return;
        try {
            await updateWorkOrder(selectedOrder.id, formData);
            addToast('success', 'Work order updated');
            setModalOpen(false);
            setSelectedOrder(null);
            loadData();
        } catch (err) {
            addToast('error', err instanceof Error ? err.message : 'Update failed');
        }
    };

    // Delete from modal
    const handleModalDelete = (id: string) => {
        setModalOpen(false);
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await deleteWorkOrder(deleteId);
            addToast('success', 'Work order deleted');
            setDeleteId(null);
            loadData();
        } catch (err) {
            addToast('error', err instanceof Error ? err.message : 'Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    const handleExport = async () => {
        try {
            const blob = await exportWorkOrders({ search: debouncedSearch, sortBy, ascending, signedByBoth, customerSign, wcdpSign });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'work_orders_export.xlsx';
            a.click();
            URL.revokeObjectURL(url);
            addToast('success', 'Excel downloaded');
        } catch (err) {
            addToast('error', err instanceof Error ? err.message : 'Export failed');
        }
    };

    const signedCount = data.filter((r) => r.signed_by_both).length;

    const sortOptions = [
        { value: 'created_at', label: 'Created At' },
        { value: 'total_amount_due', label: 'Total Amount' },
        { value: 'date', label: 'Date' },
        { value: 'job_number', label: 'Job Number' },
        { value: 'hours', label: 'Hours' },
    ];

    return (
        <>
            <Toast toasts={toasts} onRemove={removeToast} />

            <div className="page-header">
                <h1>📊 Work Orders</h1>
                <p>View, edit, delete, and export your work order records</p>
            </div>

            {/* Metrics */}
            <div className="metrics-grid">
                <MetricCard label="Total Records" value={total} icon="📁" color="primary" />
                <MetricCard label="On This Page" value={data.length} icon="📄" color="info" />
                <MetricCard label="Signed on Page" value={`${signedCount} / ${data.length}`} icon="✍️" color="success" />
            </div>

            {/* Toolbar */}
            <div className="toolbar">
                <div className="toolbar-grow">
                    <input
                        className="input"
                        type="text"
                        placeholder="🔍 Search by order #, job #, or description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button
                    className="btn btn-secondary"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    {showFilters ? '▲ Hide Filters' : '▼ Filters & Sort'}
                </button>
                <select
                    className="select"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    style={{ width: 120 }}
                >
                    <option value={10}>10 rows</option>
                    <option value={20}>20 rows</option>
                    <option value={50}>50 rows</option>
                    <option value={100}>100 rows</option>
                </select>
                <button className="btn btn-secondary" onClick={handleExport}>
                    📥 Export Excel
                </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="filter-bar">
                    <div>
                        <label className="label">Sort By</label>
                        <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            {sortOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Sort Order</label>
                        <select className="select" value={ascending ? 'asc' : 'desc'} onChange={(e) => setAscending(e.target.value === 'asc')}>
                            <option value="desc">Descending (Newest)</option>
                            <option value="asc">Ascending (Oldest)</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Both Signed</label>
                        <select className="select" value={signedByBoth === null ? '' : String(signedByBoth)} onChange={(e) => setSignedByBoth(e.target.value === '' ? null : e.target.value === 'true')}>
                            <option value="">All</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Customer Sign</label>
                        <select className="select" value={customerSign === null ? '' : String(customerSign)} onChange={(e) => setCustomerSign(e.target.value === '' ? null : e.target.value === 'true')}>
                            <option value="">All</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">WCDP Sign</label>
                        <select className="select" value={wcdpSign === null ? '' : String(wcdpSign)} onChange={(e) => setWcdpSign(e.target.value === '' ? null : e.target.value === 'true')}>
                            <option value="">All</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Data Table */}
            {loading ? (
                <LoadingSpinner message="Loading work orders..." />
            ) : data.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <p>No work orders found. Upload some files to get started!</p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Order #</th>
                                <th>Job #</th>
                                <th>Date</th>
                                <th>Hours</th>
                                <th>Total Due</th>
                                <th>Both Signed</th>
                                <th>Customer</th>
                                <th>WCDP</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => {
                                const serial = (page - 1) * pageSize + idx + 1;

                                return (
                                    <tr
                                        key={row.id}
                                        onClick={() => handleRowClick(row)}
                                        style={{ cursor: 'pointer' }}
                                        className="clickable-row"
                                    >
                                        <td style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>{serial}</td>
                                        <td>{row.work_order_number || '—'}</td>
                                        <td>{row.job_number || '—'}</td>
                                        <td>{row.date || '—'}</td>
                                        <td>{row.hours || '—'}</td>
                                        <td>{row.total_amount_due || '—'}</td>
                                        <td><span className={`bool-pill ${row.signed_by_both ? 'bool-true' : 'bool-false'}`}>{row.signed_by_both ? '✓ Yes' : '✗ No'}</span></td>
                                        <td><span className={`bool-pill ${row.customer_sign ? 'bool-true' : 'bool-false'}`}>{row.customer_sign ? '✓' : '✗'}</span></td>
                                        <td><span className={`bool-pill ${row.wcdp_sign ? 'bool-true' : 'bool-false'}`}>{row.wcdp_sign ? '✓' : '✗'}</span></td>
                                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description || '—'}</td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="icon-btn icon-btn-edit" title="Edit" onClick={(e) => handleEditClick(e, row)}>✎</button>
                                                <button
                                                    className="icon-btn icon-btn-delete"
                                                    title="Delete"
                                                    onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}
                                                >🗑</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            )}

            {/* View / Edit Modal */}
            <WorkOrderModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setSelectedOrder(null); }}
                order={selectedOrder}
                mode={modalMode}
                onSave={handleModalSave}
                onDelete={handleModalDelete}
                onSwitchToEdit={handleSwitchToEdit}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                title="Delete Work Order"
                actions={
                    <>
                        <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
                        <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? 'Deleting...' : '🗑 Delete'}
                        </button>
                    </>
                }
            >
                <p style={{ color: 'var(--text-secondary)' }}>
                    Are you sure you want to delete this work order? This action cannot be undone.
                </p>
            </Modal>
        </>
    );
}
