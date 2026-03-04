import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const EXTRACTION_PROMPT = `Extract the following information from this work order image and return it as a valid JSON object:
{
  "work_order_number": "The work order number, usually near top right",
  "job_number": "Job number",
  "description": "Description of work (combine lines if necessary)",
  "date": "Date of the work order (format: DD-MM-YYYY)",
  "hours": "Total hours",
  "total_amount_due": "Total Amount Due (number or string, usually near bottom right)",
  "signed_by_both": boolean (true if both WCDP Signature and Customer Signature are present, false otherwise),
  "customer_sign": boolean (true if Customer Signature is present),
  "wcdp_sign": boolean (true if WCDP Signature is present)
}
If a field is missing or illegible, use null.`;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const results = [];

        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

            if (isPdf) {
                // For PDFs, send directly to Gemini which supports PDF natively
                const base64Data = buffer.toString('base64');

                try {
                    const response = await model.generateContent([
                        EXTRACTION_PROMPT,
                        {
                            inlineData: {
                                mimeType: 'application/pdf',
                                data: base64Data,
                            },
                        },
                    ]);

                    const text = response.response.text().trim();
                    const jsonText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
                    const parsed = JSON.parse(jsonText);

                    // If the result is an array (multi-page PDF), add each
                    if (Array.isArray(parsed)) {
                        parsed.forEach((item: Record<string, unknown>, idx: number) => {
                            results.push({ ...item, filename: `${file.name} - Page ${idx + 1}` });
                        });
                    } else {
                        results.push({ ...parsed, filename: file.name });
                    }
                } catch (e) {
                    console.error(`Error processing PDF ${file.name}:`, e);
                    results.push({ error: `Failed to process ${file.name}`, filename: file.name });
                }
            } else {
                // Image file
                const base64Data = buffer.toString('base64');
                const mimeType = file.type || 'image/png';

                try {
                    const response = await model.generateContent([
                        EXTRACTION_PROMPT,
                        {
                            inlineData: {
                                mimeType,
                                data: base64Data,
                            },
                        },
                    ]);

                    const text = response.response.text().trim();
                    const jsonText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
                    const parsed = JSON.parse(jsonText);
                    results.push({ ...parsed, filename: file.name });
                } catch (e) {
                    console.error(`Error processing image ${file.name}:`, e);
                    results.push({ error: `Failed to process ${file.name}`, filename: file.name });
                }
            }
        }

        return NextResponse.json({ results });
    } catch (error) {
        console.error('OCR API error:', error);
        return NextResponse.json(
            { error: 'Failed to process files' },
            { status: 500 }
        );
    }
}
