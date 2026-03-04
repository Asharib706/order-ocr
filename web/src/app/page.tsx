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
    if (files.length === 0) {
      addToast('error', 'Please select files to process');
      return;
    }

    setProcessing(true);
    setResults([]);
    const allResults: OcrResult[] = [];
    const completed: string[] = [];
    const failed: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      setStatus({
        currentFile: file.name,
        currentIndex: i + 1,
        totalFiles: files.length,
        completed: [...completed],
        failed: [...failed],
      });

      try {
        const fileResults = await uploadSingleFile(file, fileType);
        allResults.push(...fileResults);
        completed.push(file.name);
      } catch {
        failed.push(file.name);
      }
    }

    setResults(allResults);
    setStatus(null);
    setProcessing(false);

    if (allResults.length > 0) {
      addToast('success', `Extracted data from ${allResults.length} item(s)`);
    }
    if (failed.length > 0) {
      addToast('error', `Failed to process: ${failed.join(', ')}`);
    }
  }, [files, fileType, addToast]);

  const handleSave = useCallback(async () => {
    if (results.length === 0) return;

    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const records = results.map(({ filename, ...rest }) => rest);
      await createWorkOrders(records);
      addToast('success', `Saved ${records.length} record(s) to database!`);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [results, addToast]);

  const handleDownloadExcel = useCallback(() => {
    if (results.length === 0) return;

    const headers = ['work_order_number', 'job_number', 'date', 'hours', 'total_amount_due', 'signed_by_both', 'customer_sign', 'wcdp_sign', 'description', 'filename'];
    const csvContent = [
      headers.join(','),
      ...results.map((r) =>
        headers.map((h) => {
          const val = r[h as keyof OcrResult];
          const str = val === null || val === undefined ? '' : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_work_orders.csv';
    a.click();
    URL.revokeObjectURL(url);

    addToast('success', 'CSV downloaded');
  }, [results, addToast]);

  const updateResult = (index: number, field: string, value: string | boolean | null) => {
    setResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const removeResult = (index: number) => {
    setResults((prev) => prev.filter((_, i) => i !== index));
    setEditingIdx(null);
    addToast('info', 'Row removed');
  };

  // Compute metrics
  const totalHours = results.reduce((sum, r) => {
    const h = parseFloat(r.hours || '0');
    return sum + (isNaN(h) ? 0 : h);
  }, 0);

  const signedPct = results.length > 0
    ? ((results.filter((r) => r.signed_by_both).length / results.length) * 100).toFixed(1)
    : '0';

  const progressPct = status ? Math.round(((status.currentIndex - 1) / status.totalFiles) * 100) : 0;

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <h1>📤 Upload & Extract</h1>
        <p>Upload work orders (PDF or Images) to extract data automatically using AI</p>
      </div>

      {/* File Type Toggle */}
      <div className="toggle-group" style={{ maxWidth: 260, marginBottom: '1.25rem' }}>
        <button
          className={`toggle-btn ${fileType === 'pdf' ? 'active' : ''}`}
          onClick={() => setFileType('pdf')}
        >
          📄 PDF
        </button>
        <button
          className={`toggle-btn ${fileType === 'images' ? 'active' : ''}`}
          onClick={() => setFileType('images')}
        >
          🖼️ Images
        </button>
      </div>

      {/* Upload Zone */}
      <FileUploadZone
        fileType={fileType}
        onFilesSelected={setFiles}
        disabled={processing}
      />

      {/* Process Button */}
      {files.length > 0 && !processing && (
        <div style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={handleProcess}>
            🚀 Process {files.length} File{files.length > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Processing Progress */}
      {processing && status && (
        <div className="progress-card" style={{
          marginTop: '1.5rem',
          padding: '1.5rem',
          background: 'var(--surface)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--border-radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              🤖 Processing with Gemini AI
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
              {status.currentIndex} / {status.totalFiles}
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: 8,
            background: 'var(--bg-tertiary)',
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: '1rem',
          }}>
            <div style={{
              width: `${progressPct}%`,
              height: '100%',
              background: 'var(--gradient-primary)',
              borderRadius: 4,
              transition: 'width 0.4s ease',
            }} />
          </div>

          {/* Current File */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.65rem 0.85rem',
            background: 'rgba(99, 102, 241, 0.06)',
            borderRadius: 8,
            border: '1px solid rgba(99, 102, 241, 0.1)',
            marginBottom: '0.75rem',
          }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', fontSize: '1rem' }}>⏳</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.85rem' }}>
              Processing: <strong>{status.currentFile}</strong>
            </span>
          </div>

          {/* Completed Files */}
          {status.completed.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
              {status.completed.map((name, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--success)',
                }}>
                  <span>✓</span>
                  <span>{name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Failed Files */}
          {status.failed.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
              {status.failed.map((name, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--danger)',
                }}>
                  <span>✗</span>
                  <span>{name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !processing && (
        <>
          <div className="divider" />

          <h2 className="section-title">✅ Extracted Data</h2>

          {/* Metrics */}
          <div className="metrics-grid">
            <MetricCard label="Items Extracted" value={results.length} icon="📋" color="primary" />
            <MetricCard label="Total Hours" value={totalHours.toFixed(2)} icon="⏱️" color="info" />
            <MetricCard label="Fully Signed" value={`${signedPct}%`} icon="✍️" color="success" />
          </div>

          {/* Results Table */}
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
                  <th>File</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    {editingIdx === idx ? (
                      <>
                        <td><input className="inline-input" value={r.work_order_number || ''} onChange={(e) => updateResult(idx, 'work_order_number', e.target.value)} /></td>
                        <td><input className="inline-input" value={r.job_number || ''} onChange={(e) => updateResult(idx, 'job_number', e.target.value)} /></td>
                        <td><input className="inline-input" value={r.date || ''} onChange={(e) => updateResult(idx, 'date', e.target.value)} /></td>
                        <td><input className="inline-input" value={r.hours || ''} onChange={(e) => updateResult(idx, 'hours', e.target.value)} style={{ width: 70 }} /></td>
                        <td><input className="inline-input" value={r.total_amount_due || ''} onChange={(e) => updateResult(idx, 'total_amount_due', e.target.value)} style={{ width: 90 }} /></td>
                        <td><input type="checkbox" className="checkbox" checked={!!r.signed_by_both} onChange={(e) => updateResult(idx, 'signed_by_both', e.target.checked)} /></td>
                        <td><input type="checkbox" className="checkbox" checked={!!r.customer_sign} onChange={(e) => updateResult(idx, 'customer_sign', e.target.checked)} /></td>
                        <td><input type="checkbox" className="checkbox" checked={!!r.wcdp_sign} onChange={(e) => updateResult(idx, 'wcdp_sign', e.target.checked)} /></td>
                        <td><input className="inline-input" value={r.description || ''} onChange={(e) => updateResult(idx, 'description', e.target.value)} /></td>
                      </>
                    ) : (
                      <>
                        <td>{r.work_order_number || '—'}</td>
                        <td>{r.job_number || '—'}</td>
                        <td>{r.date || '—'}</td>
                        <td>{r.hours || '—'}</td>
                        <td>{r.total_amount_due || '—'}</td>
                        <td><span className={`bool-pill ${r.signed_by_both ? 'bool-true' : 'bool-false'}`}>{r.signed_by_both ? '✓ Yes' : '✗ No'}</span></td>
                        <td><span className={`bool-pill ${r.customer_sign ? 'bool-true' : 'bool-false'}`}>{r.customer_sign ? '✓' : '✗'}</span></td>
                        <td><span className={`bool-pill ${r.wcdp_sign ? 'bool-true' : 'bool-false'}`}>{r.wcdp_sign ? '✓' : '✗'}</span></td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description || '—'}</td>
                      </>
                    )}
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{r.filename}</td>
                    <td>
                      <div className="action-btns">
                        {editingIdx === idx ? (
                          <button
                            className="icon-btn icon-btn-save"
                            title="Done"
                            onClick={() => setEditingIdx(null)}
                          >
                            ✓
                          </button>
                        ) : (
                          <button
                            className="icon-btn icon-btn-edit"
                            title="Edit"
                            onClick={() => setEditingIdx(idx)}
                          >
                            ✎
                          </button>
                        )}
                        <button
                          className="icon-btn icon-btn-delete"
                          title="Remove"
                          onClick={() => removeResult(idx)}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '⏳ Saving...' : '💾 Save to Database'}
            </button>
            <button className="btn btn-secondary" onClick={handleDownloadExcel}>
              📥 Download CSV
            </button>
          </div>
        </>
      )}
    </>
  );
}
