import { FilterParams, WorkOrder, WorkOrderInput, PaginatedResponse, OcrResult } from '@/types';

const API_BASE = '/api';

export async function uploadFiles(files: File[], fileType: 'pdf' | 'images'): Promise<OcrResult[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('fileType', fileType);

    const res = await fetch(`${API_BASE}/ocr`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to process files');
    }

    const data = await res.json();
    return data.results;
}

// Process a single file — used for per-file progress tracking
export async function uploadSingleFile(file: File, fileType: 'pdf' | 'images'): Promise<OcrResult[]> {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('fileType', fileType);

    const res = await fetch(`${API_BASE}/ocr`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Failed to process ${file.name}`);
    }

    const data = await res.json();
    return data.results;
}

export async function fetchWorkOrders(params: FilterParams): Promise<PaginatedResponse> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.ascending !== undefined) searchParams.set('ascending', String(params.ascending));
    if (params.signedByBoth !== null && params.signedByBoth !== undefined) searchParams.set('signedByBoth', String(params.signedByBoth));
    if (params.customerSign !== null && params.customerSign !== undefined) searchParams.set('customerSign', String(params.customerSign));
    if (params.wcdpSign !== null && params.wcdpSign !== undefined) searchParams.set('wcdpSign', String(params.wcdpSign));
    if (params.hours) searchParams.set('hours', params.hours);

    const res = await fetch(`${API_BASE}/work-orders?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch work orders');
    return res.json();
}

export async function createWorkOrders(records: WorkOrderInput[]): Promise<WorkOrder[]> {
    const res = await fetch(`${API_BASE}/work-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save work orders');
    }

    const data = await res.json();
    return data.data;
}

export async function updateWorkOrder(id: string, data: WorkOrderInput): Promise<WorkOrder> {
    const res = await fetch(`${API_BASE}/work-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update work order');
    }

    const result = await res.json();
    return result.data;
}

export async function deleteWorkOrder(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/work-orders/${id}`, {
        method: 'DELETE',
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete work order');
    }
}

export async function exportWorkOrders(params: FilterParams): Promise<Blob> {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.ascending !== undefined) searchParams.set('ascending', String(params.ascending));
    if (params.signedByBoth !== null && params.signedByBoth !== undefined) searchParams.set('signedByBoth', String(params.signedByBoth));
    if (params.customerSign !== null && params.customerSign !== undefined) searchParams.set('customerSign', String(params.customerSign));
    if (params.wcdpSign !== null && params.wcdpSign !== undefined) searchParams.set('wcdpSign', String(params.wcdpSign));
    if (params.hours) searchParams.set('hours', params.hours);

    const res = await fetch(`${API_BASE}/work-orders/export?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to export work orders');
    return res.blob();
}
