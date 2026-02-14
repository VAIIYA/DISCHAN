import { NextRequest, NextResponse } from 'next/server';
import { loadThreadsDataFromCloudinary } from '@/lib/cloudinaryStorage';
import { createThread } from '@/lib/storage';
import { db } from '@/lib/db';
import { users, threads } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Migration endpoint to move old data from Cloudinary to Turso
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET || 'migration-secret'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting migration from Cloudinary to Turso...');

    // Try to load old data from Cloudinary
    const oldData = await loadThreadsDataFromCloudinary();

    if (!oldData || !oldData.threads || oldData.threads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No old data found in Cloudinary to migrate',
        migrated: 0
      });
    }

    console.log(`Found ${oldData.threads.length} threads in Cloudinary`);

    // Create a default user for migrated threads (or use existing)
    const migratedEmail = 'migrated@dischan.vercel.app';
    let defaultUser = await db.query.users.findFirst({
      where: eq(users.email, migratedEmail),
    });

    if (!defaultUser) {
      const hashedPassword = await bcrypt.hash('migrated-' + Date.now(), 10);
      const userId = `user_migrated_${Date.now()}`;
      await db.insert(users).values({
        id: userId,
        email: migratedEmail,
        password: hashedPassword,
        name: 'Migrated User',
      });
      defaultUser = { id: userId, email: migratedEmail, name: 'Migrated User' } as any;
    }

    const userId = defaultUser!.id;
    let migratedCount = 0;
    let errorCount = 0;

    // Migrate each thread
    for (const oldThread of oldData.threads) {
      try {
        // Check if thread already exists in Turso
        const existingThread = await db.query.threads.findFirst({
          where: eq(threads.id, oldThread.id),
        });

        if (existingThread) {
          console.log(`Thread ${oldThread.id} already exists, skipping...`);
          continue;
        }

        // Create thread in Turso
        const threadData = {
          id: oldThread.id,
          slug: oldThread.slug || `thread-${oldThread.id}`,
          title: oldThread.title,
          op: {
            content: oldThread.op?.content || undefined,
            image: undefined,
            video: undefined,
            authorId: userId,
            timestamp: oldThread.op?.timestamp ? new Date(oldThread.op.timestamp) : (oldThread.createdAt ? new Date(oldThread.createdAt) : new Date()),
          },
          authorId: userId,
        };

        await createThread(threadData);
        migratedCount++;

        console.log(`Migrated thread: ${oldThread.id} - ${oldThread.title}`);
      } catch (error) {
        console.error(`Failed to migrate thread ${oldThread.id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration completed`,
      migrated: migratedCount,
      errors: errorCount,
      total: oldData.threads.length
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also allow GET for manual triggers
export async function GET(_request: NextRequest) {
  try {
    // Try to load old data from Cloudinary to see what's available
    const oldData = await loadThreadsDataFromCloudinary();

    // Check Turso for existing threads
    const threadCountResult = await db.select({ count: sql<number>`count(*)` }).from(threads);
    const tursoThreadCount = threadCountResult[0]?.count || 0;

    return NextResponse.json({
      cloudinary: {
        threads: oldData?.threads?.length || 0,
        hasData: !!(oldData && oldData.threads && oldData.threads.length > 0)
      },
      turso: {
        threads: tursoThreadCount
      },
      message: 'Use POST /api/migrate with authorization header to perform migration'
    });
  } catch (error) {
    console.error('Migration check error:', error);
    return NextResponse.json(
      { error: 'Failed to check migration status' },
      { status: 500 }
    );
  }
}
