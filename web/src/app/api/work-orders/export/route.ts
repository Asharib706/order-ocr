import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import ExcelJS from 'exceljs';

// GET /api/work-orders/export — Download as Excel
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const sortBy = searchParams.get('sortBy') || 'created_at';
        const ascending = searchParams.get('ascending') === 'true';
        const signedByBoth = searchParams.get('signedByBoth');
        const customerSign = searchParams.get('customerSign');
        const wcdpSign = searchParams.get('wcdpSign');
        const hours = searchParams.get('hours');

        let query = supabase.from('work_orders').select('*');

        if (search) {
            query = query.or(
                `work_order_number.ilike.%${search}%,job_number.ilike.%${search}%,description.ilike.%${search}%`
            );
        }

        if (signedByBoth !== null && signedByBoth !== undefined && signedByBoth !== '') {
            query = query.eq('signed_by_both', signedByBoth === 'true');
        }
        if (customerSign !== null && customerSign !== undefined && customerSign !== '') {
            query = query.eq('customer_sign', customerSign === 'true');
        }
        if (wcdpSign !== null && wcdpSign !== undefined && wcdpSign !== '') {
            query = query.eq('wcdp_sign', wcdpSign === 'true');
        }
        if (hours) {
            query = query.eq('hours', hours);
        }

        query = query.order(sortBy, { ascending });

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Generate Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Work Orders');

        worksheet.columns = [
            { header: 'Work Order #', key: 'work_order_number', width: 18 },
            { header: 'Job #', key: 'job_number', width: 15 },
            { header: 'Date', key: 'date', width: 14 },
            { header: 'Hours', key: 'hours', width: 10 },
            { header: 'Total Due', key: 'total_amount_due', width: 14 },
            { header: 'Both Signed', key: 'signed_by_both', width: 12 },
            { header: 'Customer Sign', key: 'customer_sign', width: 14 },
            { header: 'WCDP Sign', key: 'wcdp_sign', width: 12 },
            { header: 'Description', key: 'description', width: 40 },
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1a1a2e' },
        };

        (data || []).forEach((item) => {
            worksheet.addRow({
                work_order_number: item.work_order_number,
                job_number: item.job_number,
                date: item.date,
                hours: item.hours,
                total_amount_due: item.total_amount_due,
                signed_by_both: item.signed_by_both ? 'Yes' : 'No',
                customer_sign: item.customer_sign ? 'Yes' : 'No',
                wcdp_sign: item.wcdp_sign ? 'Yes' : 'No',
                description: item.description,
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer as ArrayBuffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="work_orders_export.xlsx"',
            },
        });
    } catch (error) {
        console.error('Error exporting work orders:', error);
        return NextResponse.json(
            { error: 'Failed to export work orders' },
            { status: 500 }
        );
    }
}
