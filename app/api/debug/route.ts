import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: 'MongoDB URI not configured' }, { status: 500 });
  }

  try {
    // Connect to MongoDB
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Get Thread model
    const Thread = mongoose.models.Thread || mongoose.model('Thread',
      new mongoose.Schema({}, { strict: false })
    );

    // Get a sample of threads
    // @ts-ignore - mongoose type issues
    const threads = await Thread.find({}).limit(5).lean();

    // Check if we need to unarchive threads (temporary fix)
    // @ts-ignore - mongoose type issues
    const archivedCount = await Thread.countDocuments({ archived: true });
    // @ts-ignore - mongoose type issues
    if (archivedCount > 0 && (await Thread.countDocuments({ archived: false })) === 0) {
      console.log('No active threads but archived threads exist. Unarchiving all threads...');
      // @ts-ignore - mongoose type issues
      await Thread.updateMany({ archived: true }, { archived: false, archivedAt: null });
      console.log('All threads unarchived');
    }

    return NextResponse.json({
      success: true,
      connectionState: mongoose.connection.readyState,
      threadCount: await Thread.countDocuments({}),
      activeThreads: await Thread.countDocuments({ archived: false }),
      archivedThreads: await Thread.countDocuments({ archived: true }),
      // @ts-ignore - t is any from lean()
      sampleThreads: threads.map(t => ({
        id: t.id,
        title: t.title,
        archived: t.archived,
        createdAt: t.createdAt
      })),
      autoUnarchived: archivedCount > 0 && (await Thread.countDocuments({ archived: false })) === 0
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      connectionState: mongoose.connection.readyState
    }, { status: 500 });
  }
}