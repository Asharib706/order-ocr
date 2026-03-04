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
    const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
    const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { toasts, addToast, removeToast } = useToast();
    const addToastRef = useRef(addToast);
    addToastRef.current = addToast;

    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 400); return () => clearTimeout(t); }, [search]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params: FilterParams = { page, pageSize, search: debouncedSearch, sortBy, ascending, signedByBoth, customerSign, wcdpSign };
            const result = await fetchWorkOrders(params);
            setData(result.data); setTotal(result.total); setTotalPages(result.totalPages);
        } catch (err) { addToastRef.current('error', err instanceof Error ? err.message : 'Failed to load data'); }
        finally { setLoading(false); }
    }, [page, pageSize, debouncedSearch, sortBy, ascending, signedByBoth, customerSign, wcdpSign]);

    useEffect(() => { loadData(); }, [loadData]);
    useEffect(() => { setPage(1); }, [debouncedSearch, sortBy, ascending, signedByBoth, customerSign, wcdpSign, pageSize]);

    const handleRowClick = (order: WorkOrder) => { setSelectedOrder(order); setModalMode('view'); setModalOpen(true); };
    const handleEditClick = (e: React.MouseEvent, order: WorkOrder) => { e.stopPropagation(); setSelectedOrder(order); setModalMode('edit'); setModalOpen(true); };
    const handleSwitchToEdit = () => setModalMode('edit');

    const handleModalSave = async (formData: Partial<WorkOrder>) => {
        if (!selectedOrder) return;
        try { await updateWorkOrder(selectedOrder.id, formData); addToast('success', 'Work order updated'); setModalOpen(false); setSelectedOrder(null); loadData(); }
        catch (err) { addToast('error', err instanceof Error ? err.message : 'Update failed'); }
    };

    const handleModalDelete = (id: string) => { setModalOpen(false); setDeleteId(id); };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try { await deleteWorkOrder(deleteId); addToast('success', 'Work order deleted'); setDeleteId(null); loadData(); }
        catch (err) { addToast('error', err instanceof Error ? err.message : 'Delete failed'); }
        finally { setDeleting(false); }
    };

    const handleExport = async () => {
        try {
            const blob = await exportWorkOrders({ search: debouncedSearch, sortBy, ascending, signedByBoth, customerSign, wcdpSign });
            const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'work_orders_export.xlsx'; a.click(); URL.revokeObjectURL(url);
            addToast('success', 'Excel downloaded');
        } catch (err) { addToast('error', err instanceof Error ? err.message : 'Export failed'); }
    };

    const signedCount = data.filter((r) => r.signed_by_both).length;
    const sortOptions = [
        { value: 'created_at', label: 'Created At' }, { value: 'total_amount_due', label: 'Total Amount' },
        { value: 'date', label: 'Date' }, { value: 'job_number', label: 'Job Number' }, { value: 'hours', label: 'Hours' },
    ];

    const selectCls = 'px-3 py-2 rounded-[10px] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 appearance-none cursor-pointer';

    return (
        <>
            <Toast toasts={toasts} onRemove={removeToast} />

            <div className="mb-8">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">📊 Work Orders</h1>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">View, edit, delete, and export your work order records</p>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 mb-6">
                <MetricCard label="Total Records" value={total} icon="📁" color="primary" />
                <MetricCard label="On This Page" value={data.length} icon="📄" color="info" />
                <MetricCard label="Signed on Page" value={`${signedCount} / ${data.length}`} icon="✍️" color="success" />
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap mb-5">
                <div className="flex-1 min-w-[200px]">
                    <input className="w-full px-3 py-2.5 rounded-[10px] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder-slate-400 dark:placeholder-slate-500" type="text" placeholder="🔍 Search by order #, job #, or description..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <button className="px-4 py-2 rounded-[10px] text-sm font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-all cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
                    {showFilters ? '▲ Hide Filters' : '▼ Filters & Sort'}
                </button>
                <select className={`${selectCls} w-[120px]`} value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                    <option value={10}>10 rows</option><option value={20}>20 rows</option><option value={50}>50 rows</option><option value={100}>100 rows</option>
                </select>
                <button className="px-4 py-2 rounded-[10px] text-sm font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-all cursor-pointer" onClick={handleExport}>📥 Export Excel</button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 p-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-xl mb-5 shadow-sm">
                    <div>
                        <label className="block text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Sort By</label>
                        <select className={`${selectCls} w-full`} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            {sortOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Sort Order</label>
                        <select className={`${selectCls} w-full`} value={ascending ? 'asc' : 'desc'} onChange={(e) => setAscending(e.target.value === 'asc')}>
                            <option value="desc">Descending</option><option value="asc">Ascending</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Both Signed</label>
                        <select className={`${selectCls} w-full`} value={signedByBoth === null ? '' : String(signedByBoth)} onChange={(e) => setSignedByBoth(e.target.value === '' ? null : e.target.value === 'true')}>
                            <option value="">All</option><option value="true">Yes</option><option value="false">No</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Customer Sign</label>
                        <select className={`${selectCls} w-full`} value={customerSign === null ? '' : String(customerSign)} onChange={(e) => setCustomerSign(e.target.value === '' ? null : e.target.value === 'true')}>
                            <option value="">All</option><option value="true">Yes</option><option value="false">No</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">WCDP Sign</label>
                        <select className={`${selectCls} w-full`} value={wcdpSign === null ? '' : String(wcdpSign)} onChange={(e) => setWcdpSign(e.target.value === '' ? null : e.target.value === 'true')}>
                            <option value="">All</option><option value="true">Yes</option><option value="false">No</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Data Table */}
            {loading ? (
                <LoadingSpinner message="Loading work orders..." />
            ) : data.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                    <div className="text-4xl mb-4 opacity-50">📭</div>
                    <p className="text-sm">No work orders found. Upload some files to get started!</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] shadow-sm">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr>
                                {['#', 'Order #', 'Job #', 'Date', 'Hours', 'Total Due', 'Both Signed', 'Customer', 'WCDP', 'Description', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => {
                                const serial = (page - 1) * pageSize + idx + 1;
                                return (
                                    <tr key={row.id} onClick={() => handleRowClick(row)} className="cursor-pointer border-b border-slate-100 dark:border-white/5 last:border-b-0 hover:bg-primary/[0.03] dark:hover:bg-primary/[0.06] hover:shadow-[inset_3px_0_0_var(--color-primary)] transition-all">
                                        <td className="px-4 py-3 text-slate-400 text-xs">{serial}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.work_order_number || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.job_number || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.date || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.hours || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.total_amount_due || '—'}</td>
                                        <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${row.signed_by_both ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/8 text-rose-500 dark:text-rose-400'}`}>{row.signed_by_both ? '✓ Yes' : '✗ No'}</span></td>
                                        <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${row.customer_sign ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/8 text-rose-500 dark:text-rose-400'}`}>{row.customer_sign ? '✓' : '✗'}</span></td>
                                        <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${row.wcdp_sign ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/8 text-rose-500 dark:text-rose-400'}`}>{row.wcdp_sign ? '✓' : '✗'}</span></td>
                                        <td className="px-4 py-3 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap text-slate-600 dark:text-slate-300">{row.description || '—'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <button className="w-[30px] h-[30px] rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all cursor-pointer" title="Edit" onClick={(e) => handleEditClick(e, row)}>✎</button>
                                                <button className="w-[30px] h-[30px] rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer" title="Delete" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}>🗑</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}

            <WorkOrderModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setSelectedOrder(null); }} order={selectedOrder} mode={modalMode} onSave={handleModalSave} onDelete={handleModalDelete} onSwitchToEdit={handleSwitchToEdit} />

            <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Work Order" actions={
                <>
                    <button className="px-4 py-2 rounded-[10px] text-sm font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-all cursor-pointer" onClick={() => setDeleteId(null)}>Cancel</button>
                    <button className="px-4 py-2 rounded-[10px] text-sm font-semibold bg-rose-500/8 dark:bg-rose-500/10 text-rose-500 border border-rose-500/15 hover:bg-rose-500/15 transition-all cursor-pointer disabled:opacity-50" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting...' : '🗑 Delete'}</button>
                </>
            }>
                <p className="text-sm text-slate-500 dark:text-slate-400">Are you sure you want to delete this work order? This action cannot be undone.</p>
            </Modal>
        </>
    );
}
