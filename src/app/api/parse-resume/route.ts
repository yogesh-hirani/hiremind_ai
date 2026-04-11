import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseResume } from '@/lib/ai/geminiService';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'docx', 'doc'].includes(ext)) {
      return NextResponse.json({ error: 'Unsupported file type. Only PDF and DOCX are accepted.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let text = '';

    // Step 1: Extract text from file
    if (ext === 'pdf') {
      const { extractText } = await import('unpdf');
      const uint8Array = new Uint8Array(buffer);
      const { text: extracted } = await extractText(uint8Array, { mergePages: true });
      text = extracted;
    } else if (ext === 'docx' || ext === 'doc') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }

    if (!text || text.trim().length < 20) {
      return NextResponse.json({ error: 'Could not extract text from file' }, { status: 422 });
    }

    const extractedText = text.trim();

    // Step 2: Upload file to Supabase Storage
    const supabase = await createClient();
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `uploads/${timestamp}_${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(storagePath, buffer, {
        contentType: file.type || (ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      // Continue even if storage fails — still return parsed text
    }

    // Step 3: Trigger Gemini resume parsing
    let parsedData = null;
    try {
      parsedData = await parseResume(extractedText);
    } catch (parseErr) {
      console.error('Gemini resume parsing error:', parseErr);
      // Non-fatal: return extracted text even if Gemini parsing fails
    }

    // Step 4: Save metadata to resumes table
    const { data: resumeRecord, error: dbError } = await supabase
      .from('resumes')
      .insert({
        file_name: file.name,
        file_path: uploadError ? '' : storagePath,
        file_size: buffer.byteLength,
        mime_type: file.type || '',
        extracted_text: extractedText,
        parsed_data: parsedData ?? null,
        status: parsedData ? 'parsed' : 'extracted',
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Supabase DB insert error:', dbError);
    }

    return NextResponse.json({
      text: extractedText,
      parsedData,
      resumeId: resumeRecord?.id ?? null,
      storagePath: uploadError ? null : storagePath,
    });
  } catch (err) {
    console.error('Resume parse error:', err);
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
  }
}
