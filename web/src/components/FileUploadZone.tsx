'use client';

import { useRef, useState, useCallback } from 'react';
import styles from './FileUploadZone.module.css';

interface FileUploadZoneProps {
    onFilesSelected: (files: File[]) => void;
    fileType: 'pdf' | 'images';
    disabled?: boolean;
}

export default function FileUploadZone({ onFilesSelected, fileType, disabled }: FileUploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const accept = fileType === 'pdf'
        ? '.pdf'
        : '.png,.jpg,.jpeg,.webp';

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
        <div className={styles.wrapper}>
            <div
                className={`${styles.zone} ${isDragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''}`}
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
                    className={styles.input}
                    disabled={disabled}
                />
                <div className={styles.content}>
                    <div className={styles.iconCircle}>
                        <span className={styles.uploadIcon}>{fileType === 'pdf' ? '📄' : '🖼️'}</span>
                    </div>
                    <p className={styles.title}>
                        {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                    </p>
                    <p className={styles.subtitle}>
                        or <span className={styles.browseLink}>browse</span> to select {fileType === 'pdf' ? 'PDF files' : 'images'}
                    </p>
                    <p className={styles.formats}>
                        {fileType === 'pdf' ? 'Supports: PDF' : 'Supports: PNG, JPG, JPEG, WebP'}
                    </p>
                </div>
            </div>

            {selectedFiles.length > 0 && (
                <div className={styles.fileList}>
                    <p className={styles.fileListTitle}>{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected</p>
                    {selectedFiles.map((file, index) => (
                        <div key={index} className={styles.fileItem}>
                            <span className={styles.fileName}>{file.name}</span>
                            <span className={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</span>
                            <button
                                className={styles.removeBtn}
                                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                disabled={disabled}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
