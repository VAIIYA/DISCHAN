import { NextRequest, NextResponse } from 'next/server';
import { getArchivedThreads, unarchiveThread } from '@/lib/storage';
import { isExemptFromFees } from '@/lib/admin';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin (basic check - in production add proper auth)
    const adminWallet = request.headers.get('x-admin-wallet');
    if (!adminWallet) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isExemptFromFees(adminWallet);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const archivedThreads = await getArchivedThreads();
    return NextResponse.json({ archivedThreads });
  } catch (error) {
    console.error('Error fetching archived threads:', error);
    return NextResponse.json({ error: 'Failed to fetch archived threads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminWallet = request.headers.get('x-admin-wallet');
    if (!adminWallet) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isExemptFromFees(adminWallet);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, threadId } = body;

    if (action === 'unarchive' && threadId) {
      const success = await unarchiveThread(threadId);
      if (success) {
        return NextResponse.json({ message: 'Thread unarchived successfully' });
      } else {
        return NextResponse.json({ error: 'Thread not found or already unarchived' }, { status: 404 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing archived threads:', error);
    return NextResponse.json({ error: 'Failed to manage archived threads' }, { status: 500 });
  }
}