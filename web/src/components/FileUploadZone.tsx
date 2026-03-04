'use client';

import { useRef, useState, useCallback } from 'react';

interface FileUploadZoneProps {
    onFilesSelected: (files: File[]) => void;
    fileType: 'pdf' | 'images';
    disabled?: boolean;
}

export default function FileUploadZone({ onFilesSelected, fileType, disabled }: FileUploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const accept = fileType === 'pdf' ? '.pdf' : '.png,.jpg,.jpeg,.webp';

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        const files = Array.from(e.dataTransfer.files);
        setSelectedFiles(files);
        onFilesSelected(files);
    }, [disabled, onFilesSelected]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles(files);
        onFilesSelected(files);
    }, [onFilesSelected]);

    const removeFile = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        onFilesSelected(newFiles);
    };

    return (
        <div>
            <div
                className={`border-2 border-dashed rounded-2xl p-6 md:p-12 text-center transition-all cursor-pointer
          ${isDragging
                        ? 'border-primary bg-primary/5 shadow-[0_0_0_4px_rgba(99,102,241,0.08)]'
                        : 'border-slate-200 dark:border-white/10 bg-primary/[0.01] hover:border-primary hover:bg-primary/[0.03]'
                    }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !disabled && inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple
                    onChange={handleChange}
                    className="hidden"
                    disabled={disabled}
                />
                <div className="text-4xl mb-4 opacity-50">{fileType === 'pdf' ? '📄' : '🖼️'}</div>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                    or <span className="text-primary font-semibold underline cursor-pointer">browse</span> to select {fileType === 'pdf' ? 'PDF files' : 'images'}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    {fileType === 'pdf' ? 'Supports: PDF' : 'Supports: PNG, JPG, JPEG, WebP'}
                </p>
            </div>

            {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-1.5">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected</p>
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-lg text-sm text-slate-600 dark:text-slate-300">
                            <span className="truncate mr-3">{file.name}</span>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                                <button
                                    className="text-rose-500 hover:opacity-70 transition-opacity cursor-pointer text-sm"
                                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                    disabled={disabled}
                                >✕</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
