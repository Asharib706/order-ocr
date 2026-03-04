'use client';

import { useState, useCallback } from 'react';
import FileUploadZone from '@/components/FileUploadZone';
import MetricCard from '@/components/MetricCard';
import Toast, { useToast } from '@/components/Toast';
import { uploadSingleFile, createWorkOrders } from '@/lib/api';
import { OcrResult } from '@/types';

interface ProcessingStatus {
  currentFile: string;
  currentIndex: number;
  totalFiles: number;
  completed: string[];
  failed: string[];
}

export default function UploadPage() {
  const [fileType, setFileType] = useState<'pdf' | 'images'>('pdf');
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<OcrResult[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const handleProcess = useCallback(async () => {
    if (files.length === 0) { addToast('error', 'Please select files to process'); return; }
    setProcessing(true);
    setResults([]);
    const allResults: OcrResult[] = [];
    const completed: string[] = [];
    const failed: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setStatus({ currentFile: file.name, currentIndex: i + 1, totalFiles: files.length, completed: [...completed], failed: [...failed] });
      try {
        const fileResults = await uploadSingleFile(file, fileType);
        allResults.push(...fileResults);
        completed.push(file.name);
      } catch { failed.push(file.name); }
    }

    setResults(allResults);
    setStatus(null);
    setProcessing(false);
    if (allResults.length > 0) addToast('success', `Extracted data from ${allResults.length} item(s)`);
    if (failed.length > 0) addToast('error', `Failed to process: ${failed.join(', ')}`);
  }, [files, fileType, addToast]);

  const handleSave = useCallback(async () => {
    if (results.length === 0) return;
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const records = results.map(({ filename, ...rest }) => rest);
      await createWorkOrders(records);
      addToast('success', `Saved ${records.length} record(s) to database!`);
    } catch (err) { addToast('error', err instanceof Error ? err.message : 'Save failed'); }
    finally { setSaving(false); }
  }, [results, addToast]);

  const handleDownloadExcel = useCallback(() => {
    if (results.length === 0) return;
    const headers = ['work_order_number', 'job_number', 'date', 'hours', 'total_amount_due', 'signed_by_both', 'customer_sign', 'wcdp_sign', 'description', 'filename'];
    const csvContent = [headers.join(','), ...results.map((r) => headers.map((h) => { const val = r[h as keyof OcrResult]; const str = val === null || val === undefined ? '' : String(val); return `"${str.replace(/"/g, '""')}"`; }).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'extracted_work_orders.csv'; a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'CSV downloaded');
  }, [results, addToast]);

  const updateResult = (index: number, field: string, value: string | boolean | null) => {
    setResults((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const removeResult = (index: number) => {
    setResults((prev) => prev.filter((_, i) => i !== index));
    setEditingIdx(null);
    addToast('info', 'Row removed');
  };

  const totalHours = results.reduce((sum, r) => { const h = parseFloat(r.hours || '0'); return sum + (isNaN(h) ? 0 : h); }, 0);
  const signedPct = results.length > 0 ? ((results.filter((r) => r.signed_by_both).length / results.length) * 100).toFixed(1) : '0';
  const progressPct = status ? Math.round(((status.currentIndex - 1) / status.totalFiles) * 100) : 0;

  const inputCls = 'w-full px-2 py-1.5 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary';

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">📤 Upload & Extract</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Upload work orders (PDF or Images) to extract data automatically using AI</p>
      </div>

      {/* File Type Toggle */}
      <div className="flex max-w-[260px] mb-5 bg-slate-100 dark:bg-white/5 rounded-[10px] border border-slate-200 dark:border-white/10 overflow-hidden">
        <button className={`flex-1 py-2 px-4 text-sm font-medium cursor-pointer transition-all ${fileType === 'pdf' ? 'bg-primary text-white font-semibold' : 'text-slate-400 dark:text-slate-500'}`} onClick={() => setFileType('pdf')}>📄 PDF</button>
        <button className={`flex-1 py-2 px-4 text-sm font-medium cursor-pointer transition-all ${fileType === 'images' ? 'bg-primary text-white font-semibold' : 'text-slate-400 dark:text-slate-500'}`} onClick={() => setFileType('images')}>🖼️ Images</button>
      </div>

      <FileUploadZone fileType={fileType} onFilesSelected={setFiles} disabled={processing} />

      {files.length > 0 && !processing && (
        <div className="mt-4">
          <button className="px-5 py-2.5 rounded-[10px] text-sm font-semibold bg-gradient-to-br from-primary to-secondary text-white shadow-[0_2px_12px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-all cursor-pointer" onClick={handleProcess}>
            🚀 Process {files.length} File{files.length > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Processing Progress */}
      {processing && status && (
        <div className="mt-6 p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">🤖 Processing with Gemini AI</span>
            <span className="text-xs text-slate-400 font-semibold">{status.currentIndex} / {status.totalFiles}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-primary to-secondary rounded transition-all duration-400" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/10 dark:border-primary/20 mb-3">
            <span className="inline-block animate-spin text-base">⏳</span>
            <span className="text-sm text-slate-900 dark:text-slate-100 font-medium">Processing: <strong>{status.currentFile}</strong></span>
          </div>
          {status.completed.length > 0 && (
            <div className="flex flex-col gap-1 mt-2">
              {status.completed.map((name, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400"><span>✓</span><span>{name}</span></div>
              ))}
            </div>
          )}
          {status.failed.length > 0 && (
            <div className="flex flex-col gap-1 mt-2">
              {status.failed.map((name, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-rose-500 dark:text-rose-400"><span>✗</span><span>{name}</span></div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !processing && (
        <>
          <div className="h-px bg-slate-200 dark:bg-white/10 my-6" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">✅ Extracted Data</h2>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 mb-6">
            <MetricCard label="Items Extracted" value={results.length} icon="📋" color="primary" />
            <MetricCard label="Total Hours" value={totalHours.toFixed(2)} icon="⏱️" color="info" />
            <MetricCard label="Fully Signed" value={`${signedPct}%`} icon="✍️" color="success" />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {['#', 'Order #', 'Job #', 'Date', 'Hours', 'Total Due', 'Both Signed', 'Customer', 'WCDP', 'Description', 'File', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-white/5 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                    {editingIdx === idx ? (
                      <>
                        <td className="px-4 py-2"><input className={inputCls} value={r.work_order_number || ''} onChange={(e) => updateResult(idx, 'work_order_number', e.target.value)} /></td>
                        <td className="px-4 py-2"><input className={inputCls} value={r.job_number || ''} onChange={(e) => updateResult(idx, 'job_number', e.target.value)} /></td>
                        <td className="px-4 py-2"><input className={inputCls} value={r.date || ''} onChange={(e) => updateResult(idx, 'date', e.target.value)} /></td>
                        <td className="px-4 py-2"><input className={`${inputCls} w-[70px]`} value={r.hours || ''} onChange={(e) => updateResult(idx, 'hours', e.target.value)} /></td>
                        <td className="px-4 py-2"><input className={`${inputCls} w-[90px]`} value={r.total_amount_due || ''} onChange={(e) => updateResult(idx, 'total_amount_due', e.target.value)} /></td>
                        <td className="px-4 py-2"><input type="checkbox" className="w-[18px] h-[18px] accent-primary cursor-pointer" checked={!!r.signed_by_both} onChange={(e) => updateResult(idx, 'signed_by_both', e.target.checked)} /></td>
                        <td className="px-4 py-2"><input type="checkbox" className="w-[18px] h-[18px] accent-primary cursor-pointer" checked={!!r.customer_sign} onChange={(e) => updateResult(idx, 'customer_sign', e.target.checked)} /></td>
                        <td className="px-4 py-2"><input type="checkbox" className="w-[18px] h-[18px] accent-primary cursor-pointer" checked={!!r.wcdp_sign} onChange={(e) => updateResult(idx, 'wcdp_sign', e.target.checked)} /></td>
                        <td className="px-4 py-2"><input className={inputCls} value={r.description || ''} onChange={(e) => updateResult(idx, 'description', e.target.value)} /></td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.work_order_number || '—'}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.job_number || '—'}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.date || '—'}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.hours || '—'}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.total_amount_due || '—'}</td>
                        <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${r.signed_by_both ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/8 text-rose-500 dark:text-rose-400'}`}>{r.signed_by_both ? '✓ Yes' : '✗ No'}</span></td>
                        <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${r.customer_sign ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/8 text-rose-500 dark:text-rose-400'}`}>{r.customer_sign ? '✓' : '✗'}</span></td>
                        <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${r.wcdp_sign ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/8 text-rose-500 dark:text-rose-400'}`}>{r.wcdp_sign ? '✓' : '✗'}</span></td>
                        <td className="px-4 py-3 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap text-slate-600 dark:text-slate-300">{r.description || '—'}</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-xs text-slate-400">{r.filename}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {editingIdx === idx ? (
                          <button className="w-[30px] h-[30px] rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center hover:bg-emerald-500/10 hover:text-emerald-500 transition-all cursor-pointer" onClick={() => setEditingIdx(null)} title="Done">✓</button>
                        ) : (
                          <button className="w-[30px] h-[30px] rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all cursor-pointer" onClick={() => setEditingIdx(idx)} title="Edit">✎</button>
                        )}
                        <button className="w-[30px] h-[30px] rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer" onClick={() => removeResult(idx)} title="Remove">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 mt-5 flex-wrap">
            <button className="px-5 py-2.5 rounded-[10px] text-sm font-semibold bg-gradient-to-br from-primary to-secondary text-white shadow-[0_2px_12px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleSave} disabled={saving}>
              {saving ? '⏳ Saving...' : '💾 Save to Database'}
            </button>
            <button className="px-5 py-2.5 rounded-[10px] text-sm font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-all cursor-pointer" onClick={handleDownloadExcel}>
              📥 Download CSV
            </button>
          </div>
        </>
      )}
    </>
  );
}
