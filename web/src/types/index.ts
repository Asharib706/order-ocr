export interface WorkOrder {
    id: string;
    created_at: string;
    work_order_number: string | null;
    job_number: string | null;
    description: string | null;
    hours: string | null;
    date: string | null;
    total_amount_due: string | null;
    signed_by_both: boolean | null;
    customer_sign: boolean | null;
    wcdp_sign: boolean | null;
    raw_text: string | null;
}

export interface WorkOrderInput {
    work_order_number?: string | null;
    job_number?: string | null;
    description?: string | null;
    hours?: string | null;
    date?: string | null;
    total_amount_due?: string | null;
    signed_by_both?: boolean | null;
    customer_sign?: boolean | null;
    wcdp_sign?: boolean | null;
    raw_text?: string | null;
}

export interface PaginatedResponse {
    data: WorkOrder[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface FilterParams {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    ascending?: boolean;
    signedByBoth?: boolean | null;
    customerSign?: boolean | null;
    wcdpSign?: boolean | null;
    hours?: string | null;
}

export interface OcrResult {
    work_order_number: string | null;
    job_number: string | null;
    description: string | null;
    hours: string | null;
    date: string | null;
    total_amount_due: string | null;
    signed_by_both: boolean | null;
    customer_sign: boolean | null;
    wcdp_sign: boolean | null;
    filename: string;
}
