import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const uploadKey = process.env.BRIEF_MEDIA_UPLOAD_KEY;
    if (!uploadKey) return NextResponse.json({ error: 'Media upload is not configured' }, { status: 503 });

    const form = await request.formData();
    const file = form.get('file');
    const folder = String(form.get('folder') || 'editorial').replace(/[^a-z0-9/_-]/gi, '').slice(0, 80);
    const filename = String(form.get('filename') || file?.name || 'image').replace(/[^a-z0-9._-]/gi, '-').slice(0, 120);
    if (!file || typeof file.arrayBuffer !== 'function') return NextResponse.json({ error: 'Image required' }, { status: 400 });

    const upstream = new FormData();
    upstream.append('file', file, filename);
    upstream.append('folder', folder);
    upstream.append('filename', filename);

    const response = await fetch('https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-media', {
      method: 'POST',
      headers: { 'x-brief-media-key': uploadKey },
      body: upstream,
      cache: 'no-store'
    });
    const body = await response.text();
    return new NextResponse(body, { status: response.status, headers: { 'content-type': response.headers.get('content-type') || 'application/json' } });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Upload failed' }, { status: 500 });
  }
}
