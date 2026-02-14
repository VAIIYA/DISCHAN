import 'server-only';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { posts, threads } from '@/lib/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Get user's posts
    const userPosts = await db.query.posts.findMany({
      where: eq(posts.authorId, walletAddress),
      orderBy: [desc(posts.timestamp)],
      limit: 50,
    });

    if (userPosts.length === 0) {
      return NextResponse.json({
        success: true,
        posts: [],
      });
    }

    // Get thread titles for the posts
    const threadIds = [...new Set(userPosts.map(p => p.threadId))];
    const threadResults = await db.query.threads.findMany({
      where: inArray(threads.id, threadIds),
      columns: {
        id: true,
        title: true,
      },
    });

    const threadMap = new Map(threadResults.map(t => [t.id, t.title]));

    // Format posts for response
    const formattedPosts = userPosts.map(post => ({
      id: post.id,
      threadId: post.threadId,
      content: post.content,
      image: post.imageFileId ? `/api/files/${post.imageFileId}` : undefined,
      video: post.videoFileId ? `/api/files/${post.videoFileId}` : undefined,
      timestamp: post.timestamp?.toISOString(),
      threadTitle: threadMap.get(post.threadId) || 'Unknown Thread',
    }));

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
    });

  } catch (error) {
    console.error('Error fetching user posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user posts' },
      { status: 500 }
    );
  }
}