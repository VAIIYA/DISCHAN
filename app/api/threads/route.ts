import { NextRequest, NextResponse } from 'next/server';
import { getAllThreads, createThread } from '@/lib/storage';
import { generateSlug } from '@/lib/cloudinaryStorage';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const NewThreadSchema = z.object({
  title: z.string().trim().min(1, { message: 'Title is required' }).max(150, { message: 'Title must be 150 characters or less' }),
  content: z.string().trim().max(30000, { message: 'Content must be 30,000 characters or less' }).nullable().optional(),
  image: z.string().nullable().optional(),
  video: z.string().nullable().optional(),
  ipfsCid: z.string().trim().min(1).nullable().optional(),
  authorWallet: z.string().trim().nullable().optional(),
  paymentSignature: z.string().nullable().optional(),
  hashtags: z.array(z.string()).max(5, { message: 'You can add up to 5 hashtags' }).nullable().optional(),
  ipnsLink: z.string().trim().url({ message: 'IPNS link must be a valid URL' }).or(z.string().startsWith('k51')).nullable().optional(),
  isAnonymous: z.boolean().nullable().optional(),
  twitterUrl: z.string().trim().url({ message: 'Twitter URL must be valid' }).nullable().optional(),
}).refine(data => data.content || data.image || data.video || data.ipfsCid || data.twitterUrl, {
  message: 'Please provide either a comment, image, video, IPFS CID, or Twitter URL',
  path: ['content'],
});


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('POST /api/threads - Received body:', JSON.stringify(body, null, 2));

    const validationResult = NewThreadSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.format());
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validationResult.error.flatten().fieldErrors,
          format: validationResult.error.format()
        },
        { status: 400 }
      );
    }

    const {
      title,
      content,
      image,
      video,
      ipfsCid,
      authorWallet,
      hashtags,
      ipnsLink,
      isAnonymous,
      twitterUrl
    } = validationResult.data;

    console.log('Request parameters:', {
      title,
      hasContent: !!content,
      hasImage: !!image,
      hasVideo: !!video,
      hasIpfsCid: !!ipfsCid,
      hasTwitterUrl: !!twitterUrl
    });

    // Extract file IDs from URLs if they are URLs
    const extractFileId = (urlOrId: string | null | undefined): string | undefined => {
      if (!urlOrId) return undefined;
      if (urlOrId.startsWith('/api/files/')) {
        return urlOrId.replace('/api/files/', '');
      }
      return urlOrId;
    };

    const imageFileId = extractFileId(image);
    // Use twitterUrl as video if provided, otherwise extract from video
    const videoFileId = twitterUrl || extractFileId(video);

    // Process hashtags (max 5)
    let hashtagNames: string[] = [];
    if (Array.isArray(hashtags)) {
      hashtagNames = hashtags.map((h) => String(h).trim().toLowerCase().replace(/^#/, '')).filter(Boolean).slice(0, 5);
    }

    // Create new thread
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Generate unique slug for the thread.
    const baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;

    const { threads: threadsTable } = await import('@/lib/schema');
    const { db } = await import('@/lib/db');
    const { eq } = await import('drizzle-orm');

    try {
      while (await db.query.threads.findFirst({ where: eq(threadsTable.slug, slug) })) {
        slug = `${baseSlug}-${counter++}`;
      }
    } catch (dbError) {
      console.error('Database connection error during slug generation:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    console.log(`Generated slug for thread "${title}": ${slug}`);

    // Create thread data structure
    const newThreadData = {
      id: threadId,
      slug,
      title,
      op: {
        content: content || undefined,
        image: imageFileId || undefined,
        video: videoFileId || undefined,
        authorId: authorWallet || undefined,
        timestamp: new Date()
      },
      authorId: authorWallet || undefined,
      hashtags: hashtagNames,
      ipnsLink: ipnsLink || undefined,
      ipfsCid: ipfsCid || undefined,
      isAnonymous: isAnonymous ?? true,
    };

    console.log(`Calling storage.createThread`, JSON.stringify(newThreadData, null, 2));

    try {
      const thread = await createThread(newThreadData);
      console.log(`Thread created successfully with slug "${slug}" (ID: ${threadId})`);

      // Revalidate the homepage
      revalidatePath('/');

      return NextResponse.json({
        success: true,
        thread: {
          id: thread.id,
          slug: thread.slug,
          title: thread.title,
          replyCount: thread.replyCount || 0,
          imageCount: thread.imageCount || 0,
          videoCount: thread.videoCount || 0,
          createdAt: thread.createdAt,
          lastActivity: thread.lastActivity,
        }
      });
    } catch (createError: any) {
      console.error(`CRITICAL: Failed to create thread:`, createError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create thread',
          details: createError.message || 'Unknown error',
          // Keep stack in server logs only for production safety
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Create thread ultimate catch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create thread',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const slug = searchParams.get('slug');

    if (slug) {
      const { getThreadBySlug } = await import('@/lib/storage');
      const threadData = await getThreadBySlug(slug);
      if (!threadData) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
      }
      return NextResponse.json({
        threads: [threadData.thread],
        page: 1,
        totalPages: 1,
        totalThreads: 1,
      });
    }

    const { threads, totalThreads } = await getAllThreads({ page, limit });

    const totalPages = Math.ceil(totalThreads / limit);

    return NextResponse.json({
      threads,
      page,
      totalPages,
      totalThreads,
    });

  } catch (error) {
    console.error('Get threads error:', error);
    return NextResponse.json(
      { error: 'Failed to get threads' },
      { status: 500 }
    );
  }
}
