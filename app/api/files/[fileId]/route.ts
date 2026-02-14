import { NextRequest, NextResponse } from 'next/server';
import { getFile } from '@/lib/storage';
import { BlobStore } from '@/lib/blobStore';

export async function GET(
  _request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;
    // First, try in-memory blob store (CID-like)
    const blob = BlobStore.get(fileId);
    if (blob) {
      return new Response(blob.data, {
        status: 200,
        headers: {
          'Content-Type': blob.mime,
          'Content-Disposition': `inline; filename="${blob.filename}"`,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const file = await getFile(fileId);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // If file has a direct URL (Vercel Blob), redirect to it for better performance
    if (file.url) {
      return NextResponse.redirect(file.url);
    }

    // Return file stream (Legacy Storacha)
    if (file.stream) {
      return new NextResponse(file.stream as any, {
        headers: {
          'Content-Type': file.contentType,
          'Content-Disposition': `inline; filename="${file.filename}"`,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    return NextResponse.json({ error: 'File data unavailable' }, { status: 500 });
  } catch (error) {
    console.error('File retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve file' },
      { status: 500 }
    );
  }
}
