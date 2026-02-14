import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tags, threadTags } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get tags with their thread counts
    const result = await db.select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      count: sql<number>`count(${threadTags.threadId})`
    })
      .from(tags)
      .leftJoin(threadTags, eq(tags.id, threadTags.tagId))
      .groupBy(tags.id);

    return NextResponse.json({ tags: result });
  } catch (error) {
    console.error('Hashtag fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch hashtags' }, { status: 500 });
  }
}
