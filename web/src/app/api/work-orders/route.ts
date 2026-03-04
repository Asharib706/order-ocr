import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/work-orders — List with pagination, search, filters, sorting
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const search = searchParams.get('search') || '';
        const sortBy = searchParams.get('sortBy') || 'created_at';
        const ascending = searchParams.get('ascending') === 'true';
        const signedByBoth = searchParams.get('signedByBoth');
        const customerSign = searchParams.get('customerSign');
        const wcdpSign = searchParams.get('wcdpSign');
        const hours = searchParams.get('hours');

        let query = supabase
            .from('work_orders')
            .select('*', { count: 'exact' });

        // Search across multiple text fields
        if (search) {
            query = query.or(
                `work_order_number.ilike.%${search}%,job_number.ilike.%${search}%,description.ilike.%${search}%`
            );
        }

        // Boolean filters
        if (signedByBoth !== null && signedByBoth !== undefined && signedByBoth !== '') {
            query = query.eq('signed_by_both', signedByBoth === 'true');
        }
        if (customerSign !== null && customerSign !== undefined && customerSign !== '') {
            query = query.eq('customer_sign', customerSign === 'true');
        }
        if (wcdpSign !== null && wcdpSign !== undefined && wcdpSign !== '') {
            query = query.eq('wcdp_sign', wcdpSign === 'true');
        }

        // Hours filter
        if (hours) {
            query = query.eq('hours', hours);
        }

        // Sorting
        query = query.order(sortBy, { ascending });

        // Pagination
        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;
        query = query.range(start, end);

        const { data, count, error } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        const total = count || 0;

        return NextResponse.json({
            data: data || [],
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        console.error('Error fetching work orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch work orders' },
            { status: 500 }
        );
    }
}

// POST /api/work-orders — Bulk insert
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { records } = body;

        if (!records || !Array.isArray(records) || records.length === 0) {
            return NextResponse.json(
                { error: 'No records provided' },
                { status: 400 }
            );
        }

        // Only keep valid columns
        const validKeys = new Set([
            'work_order_number', 'job_number', 'description', 'hours',
            'date', 'total_amount_due', 'signed_by_both', 'customer_sign',
            'wcdp_sign', 'raw_text',
        ]);

        const cleanedRecords = records.map((record: Record<string, unknown>) => {
            const cleaned: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(record)) {
                if (validKeys.has(key)) {
                    cleaned[key] = value;
                }
            }
            return cleaned;
        });

        const { data, error } = await supabase
            .from('work_orders')
            .insert(cleanedRecords)
            .select();

        if (error) {
            console.error('Supabase insert error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            data,
            message: `Successfully saved ${cleanedRecords.length} records`,
        });
    } catch (error) {
        console.error('Error creating work orders:', error);
        return NextResponse.json(
            { error: 'Failed to save work orders' },
            { status: 500 }
        );
    }
}
