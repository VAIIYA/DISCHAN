import { db } from '@/lib/db';
import { threads, threadTags, tags, posts } from '@/lib/schema';
import { eq, like, or, and, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('query')?.toLowerCase() || '';
    const hashtagsParam = url.searchParams.get('hashtags') || '';
    const hashtags = hashtagsParam.split(',').map(h => h.trim()).filter(Boolean);

    // If no query and no hashtags, return empty or all?
    // The previous implementation returned all if no filters applied.

    let threadIdsFromHashtags: string[] | null = null;
    if (hashtags.length > 0) {
      const tagResults = await db.select({ threadId: threadTags.threadId })
        .from(threadTags)
        .innerJoin(tags, eq(threadTags.tagId, tags.id))
        .where(inArray(tags.name, hashtags));

      threadIdsFromHashtags = tagResults.map(r => r.threadId);
      if (threadIdsFromHashtags.length === 0) {
        return NextResponse.json({ threads: [] });
      }
    }

    // Now query threads with optional text search and hashtag filter
    const queryBuilder = db.select({
      id: threads.id,
      slug: threads.slug,
      title: threads.title,
      replyCount: threads.replyCount,
      imageCount: threads.imageCount,
      videoCount: threads.videoCount,
      createdAt: threads.createdAt,
      lastActivity: threads.lastActivity,
      authorId: threads.authorId,
    })
      .from(threads)
      .leftJoin(posts, eq(threads.id, posts.threadId));

    const conditions = [];
    if (q) {
      conditions.push(or(
        like(threads.title, `%${q}%`),
        like(posts.content, `%${q}%`)
      ));
    }

    if (threadIdsFromHashtags) {
      conditions.push(inArray(threads.id, threadIdsFromHashtags));
    }

    if (conditions.length > 0) {
      queryBuilder.where(and(...conditions));
    }

    const searchResults = await queryBuilder.groupBy(threads.id);


    // Load full thread data (OP, hashtags, etc.) for each result
    // To match the expected format of getAllThreads
    const { getThreadById } = await import('@/lib/storage');
    const fullThreads = await Promise.all(searchResults.map(async (t) => {
      const full = await getThreadById(t.id);
      return full;
    }));

    return NextResponse.json({ threads: fullThreads });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
