import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Skip MongoDB checks during build time
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      deployment: 'v4.0',
      message: 'Health check endpoint working (build time)',
      mongodb: {
        available: false,
        message: 'MongoDB URI not configured during build'
      }
    });
  }

  try {
    // Test MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Count threads
    const Thread = mongoose.models.Thread || mongoose.model('Thread',
      new mongoose.Schema({ archived: Boolean }, { strict: false })
    );

    const totalThreads = await Thread.countDocuments({});
    const activeThreads = await Thread.countDocuments({ archived: false });
    const archivedThreads = await Thread.countDocuments({ archived: true });

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      deployment: 'v4.0',
      message: 'Health check endpoint working',
      mongodb: {
        connected: mongoose.connection.readyState === 1,
        totalThreads,
        activeThreads,
        archivedThreads
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      deployment: 'v4.0',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
