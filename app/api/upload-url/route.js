import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName } = await req.json();
    if (!fileName) {
      return NextResponse.json({ error: 'fileName wajib diisi' }, { status: 400 });
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${user.id}/${Date.now()}-${safeName}`;

    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .createSignedUploadUrl(path);

    if (error) {
      console.error('Supabase signed URL error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl, path });
  } catch (err) {
    console.error('Upload URL route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}