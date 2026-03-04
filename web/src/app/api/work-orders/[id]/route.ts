import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PUT /api/work-orders/[id] — Update a single work order
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const validKeys = new Set([
            'work_order_number', 'job_number', 'description', 'hours',
            'date', 'total_amount_due', 'signed_by_both', 'customer_sign',
            'wcdp_sign', 'raw_text',
        ]);

        const updateData: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(body)) {
            if (validKeys.has(key)) {
                updateData[key] = value;
            }
        }

        const { data, error } = await supabase
            .from('work_orders')
            .update(updateData)
            .eq('id', parseInt(id))
            .select()
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error updating work order:', error);
        return NextResponse.json(
            { error: 'Failed to update work order' },
            { status: 500 }
        );
    }
}

// DELETE /api/work-orders/[id] — Delete a single work order
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabase
            .from('work_orders')
            .delete()
            .eq('id', parseInt(id));

        if (error) {
            console.error('Supabase delete error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: 'Work order deleted successfully' });
    } catch (error) {
        console.error('Error deleting work order:', error);
        return NextResponse.json(
            { error: 'Failed to delete work order' },
            { status: 500 }
        );
    }
}
