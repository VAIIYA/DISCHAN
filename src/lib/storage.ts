// @ts-nocheck
import { db } from './db';
import { threads, posts, files, userProfiles, tags, threadTags } from './schema';
import { eq, desc, and, sql, asc, inArray } from 'drizzle-orm';
import { getUserProfiles } from './profiles';
import { put, del } from '@vercel/blob';
import { BlobStore } from './blobStore';
import { Readable } from 'stream';

// Thread operations
export async function getAllThreads({ page = 1, limit = 10 }: { page?: number, limit?: number } = {}) {
  const skip = (page - 1) * limit;

  // Get total count
  const totalCountResult = await db.select({ count: sql<number>`count(*)` }).from(threads).where(eq(threads.archived, false));
  const totalThreads = totalCountResult[0]?.count || 0;

  // Get threads with OP posts and author profiles
  const threadResults = await db.query.threads.findMany({
    where: eq(threads.archived, false),
    orderBy: [asc(threads.saged), desc(threads.lastActivity)],
    limit: limit,
    offset: skip,
  });

  const threadsWithData = await Promise.all(threadResults.map(async (thread) => {
    const opPost = await db.query.posts.findFirst({
      where: eq(posts.id, thread.opPostId),
    });

    let authorProfile = null;
    if (opPost?.authorId) {
      authorProfile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.walletAddress, opPost.authorId),
      });
    }

    // Get tags for this thread
    const associations = await db.select({ tagName: tags.name })
      .from(threadTags)
      .innerJoin(tags, eq(threadTags.tagId, tags.id))
      .where(eq(threadTags.threadId, thread.id));

    return {
      id: thread.id,
      slug: thread.slug,
      title: thread.title,
      hashtags: associations.map(a => a.tagName).filter(Boolean),
      ipnsLink: thread.ipnsLink,
      ipfsCid: thread.ipfsCid,
      op: {
        id: opPost?.id,
        content: opPost?.content,
        image: opPost?.imageFileId ? `/api/files/${opPost.imageFileId}` : undefined,
        imageThumb: opPost?.imageFileId ? `/api/files/${opPost.imageFileId}` : undefined,
        video: opPost?.videoFileId ? `/api/files/${opPost.videoFileId}` : undefined,
        ipfsCid: opPost?.ipfsCid,
        authorWallet: opPost?.authorId,
        authorDisplayName: authorProfile?.username || 'Anonymous',
        timestamp: opPost?.timestamp,
        isAnonymous: opPost?.isAnonymous ?? true,
      },
      replies: [],
      lastReply: thread.lastActivity,
      replyCount: thread.replyCount,
      imageCount: thread.imageCount,
      videoCount: thread.videoCount,
      board: 'general',
      page: page,
      createdAt: thread.createdAt,
      lastActivity: thread.lastActivity,
      authorWallet: thread.authorId,
      saged: thread.saged,
    };
  }));

  return {
    threads: threadsWithData,
    totalThreads: totalThreads,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getThreadById(threadId: string) {
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
  });

  if (!thread) return null;

  const opPost = await db.query.posts.findFirst({
    where: eq(posts.id, thread.opPostId),
  });

  const replies = await db.query.posts.findMany({
    where: eq(posts.threadId, threadId),
    orderBy: [asc(posts.timestamp)],
  });

  // Filter out OP if it's in the replies list
  const filteredReplies = replies.filter(r => r.id !== thread.opPostId);

  // Get all author wallet addresses
  const authorWallets = new Set<string>();
  if (opPost?.authorId) authorWallets.add(opPost.authorId);
  filteredReplies.forEach(reply => {
    if (reply.authorId) authorWallets.add(reply.authorId);
  });

  // Fetch all profiles at once
  let profilesMap = new Map<string, string>();
  if (authorWallets.size > 0) {
    const profiles = await getUserProfiles(Array.from(authorWallets));
    profiles.forEach(profile => {
      profilesMap.set(profile.walletAddress, profile.username || 'Anonymous');
    });
  }

  // Get tags for the thread
  const threadTagsList = await db.query.threadTags.findMany({
    where: eq(threadTags.threadId, thread.id),
    with: {
      tag: true,
    },
  });

  // Get OP author display name
  const opAuthorDisplayName = opPost?.authorId
    ? (profilesMap.get(opPost.authorId) || 'Anonymous')
    : 'Anonymous';

  return {
    ...thread,
    ipnsLink: thread.ipnsLink,
    op: opPost ? {
      id: opPost.id,
      content: opPost.content || null,
      image: opPost.imageFileId ? `/api/files/${opPost.imageFileId}` : undefined,
      imageThumb: opPost.imageFileId ? `/api/files/${opPost.imageFileId}` : undefined,
      video: opPost.videoFileId ? `/api/files/${opPost.videoFileId}` : undefined,
      ipfsCid: opPost.ipfsCid || undefined,
      authorWallet: opPost.authorId || 'anonymous',
      authorDisplayName: opAuthorDisplayName,
      timestamp: opPost.timestamp || thread.createdAt,
      isAnonymous: opPost.isAnonymous !== false,
    } : {
      id: `fallback_${thread.id}`,
      content: null,
      image: undefined,
      imageThumb: undefined,
      video: undefined,
      authorWallet: 'anonymous',
      authorDisplayName: 'Anonymous',
      timestamp: thread.createdAt || new Date(),
      isAnonymous: true,
    },
    replies: filteredReplies.map(reply => ({
      id: reply.id,
      timestamp: reply.timestamp,
      content: reply.content,
      image: reply.imageFileId ? `/api/files/${reply.imageFileId}` : undefined,
      video: reply.videoFileId ? `/api/files/${reply.videoFileId}` : undefined,
      ipfsCid: reply.ipfsCid || undefined,
      authorWallet: reply.authorId || 'anonymous',
      authorDisplayName: reply.authorId ? (profilesMap.get(reply.authorId) || 'Anonymous') : 'Anonymous',
      isAnonymous: reply.isAnonymous,
      mediaFiles: [],
    })),
    hashtags: threadTagsList.map(tt => tt.tag?.name).filter(Boolean),
    ipnsLink: thread.ipnsLink,
  };
}

export async function getArchivedThreads() {
  const threadResults = await db.query.threads.findMany({
    where: eq(threads.archived, true),
    orderBy: [desc(threads.archivedAt)],
    limit: 100,
  });

  const threadsWithOP = await Promise.all(threadResults.map(async (thread) => {
    const opPost = await db.query.posts.findFirst({
      where: eq(posts.id, thread.opPostId),
    });

    let authorDisplayName = 'Anonymous';
    if (opPost?.authorId) {
      const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.walletAddress, opPost.authorId),
      });
      authorDisplayName = profile?.username || 'Anonymous';
    }

    const threadTagsList = await db.query.threadTags.findMany({
      where: eq(threadTags.threadId, thread.id),
      with: {
        tag: true,
      },
    });

    return {
      ...thread,
      hashtags: threadTagsList.map(tt => tt.tag?.name).filter(Boolean),
      ipnsLink: thread.ipnsLink,
      op: opPost ? {
        id: opPost.id,
        content: opPost.content || null,
        image: opPost.imageFileId ? `/api/files/${opPost.imageFileId}` : undefined,
        imageThumb: opPost.imageFileId ? `/api/files/${opPost.imageFileId}` : undefined,
        video: opPost.videoFileId ? `/api/files/${opPost.videoFileId}` : undefined,
        ipfsCid: opPost.ipfsCid || undefined,
        authorWallet: opPost.authorId || 'anonymous',
        authorDisplayName: authorDisplayName,
        timestamp: opPost.timestamp || thread.createdAt,
        isAnonymous: opPost.isAnonymous !== false,
      } : {
        id: `fallback_${thread.id}`,
        content: null,
        image: undefined,
        imageThumb: undefined,
        video: undefined,
        authorWallet: 'anonymous',
        authorDisplayName: 'Anonymous',
        timestamp: thread.createdAt || new Date(),
        isAnonymous: true,
      },
    };
  }));

  return {
    threads: threadsWithOP,
    totalThreads: threadsWithOP.length,
    lastUpdated: new Date().toISOString(),
  };
}

export async function purgeThread(threadId: string) {
  try {
    console.log(`Purging thread ${threadId}...`);

    // Find all posts for this thread to find media files
    const threadPosts = await db.query.posts.findMany({
      where: eq(posts.threadId, threadId),
    });

    // Collect all media URLs
    const mediaUrls: string[] = [];
    for (const post of threadPosts) {
      if (post.imageFileId && post.imageFileId.startsWith('http')) {
        mediaUrls.push(post.imageFileId);
      }
      if (post.videoFileId && post.videoFileId.startsWith('http')) {
        mediaUrls.push(post.videoFileId);
      }

      // Also check if these IDs exist in the files table to get metadata
      if (post.imageFileId) {
        const fileRecord = await db.query.files.findFirst({
          where: eq(files.id, post.imageFileId),
        });
        if (fileRecord && fileRecord.gridFSFileId.startsWith('http')) {
          mediaUrls.push(fileRecord.gridFSFileId);
        }
      }
      if (post.videoFileId) {
        const fileRecord = await db.query.files.findFirst({
          where: eq(files.id, post.videoFileId),
        });
        if (fileRecord && fileRecord.gridFSFileId.startsWith('http')) {
          mediaUrls.push(fileRecord.gridFSFileId);
        }
      }
    }

    // Filter unique URLs
    const uniqueUrls = [...new Set(mediaUrls)];

    // Delete from Vercel Blob
    if (uniqueUrls.length > 0) {
      console.log(`Deleting ${uniqueUrls.length} media files from Vercel Blob...`);
      await del(uniqueUrls);
    }

    // Delete file metadata records
    for (const url of uniqueUrls) {
      await db.delete(files).where(eq(files.gridFSFileId, url));
    }

    // Delete thread-tags associations
    await db.delete(threadTags).where(eq(threadTags.threadId, threadId));

    // Delete posts
    await db.delete(posts).where(eq(posts.threadId, threadId));

    // Delete thread
    await db.delete(threads).where(eq(threads.id, threadId));

    console.log(`Successfully purged thread ${threadId} and its associated data.`);
    return true;
  } catch (error) {
    console.error(`Error purging thread ${threadId}:`, error);
    return false;
  }
}

export async function unarchiveThread(threadId: string) {
  await db.update(threads)
    .set({ archived: false, archivedAt: null })
    .where(and(eq(threads.id, threadId), eq(threads.archived, true)));

  return true;
}

export async function getThreadBySlug(slug: string) {
  const threadData = await db.query.threads.findFirst({
    where: eq(threads.slug, slug),
  });

  if (!threadData) return null;

  const fullThread: any = await getThreadById(threadData.id);
  if (!fullThread) return null;

  const { replies, ...threadInfo } = fullThread;

  return {
    thread: threadInfo,
    comments: replies,
  };
}

export async function createThread(threadData: {
  id: string;
  slug: string;
  title: string;
  op: {
    content?: string;
    image?: string;
    video?: string;
    authorId?: string;
    timestamp: Date;
  };
  authorId?: string;
  hashtags?: string[];
  ipnsLink?: string;
  ipfsCid?: string;
  isAnonymous?: boolean;
}) {
  try {
    console.log(`[storage] Creating thread: ${threadData.id} (${threadData.slug})`);
    const opPostId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;

    const imageFileId = threadData.op.image && !threadData.op.image.startsWith('http')
      ? threadData.op.image
      : null;
    const videoFileId = threadData.op.video && !threadData.op.video.startsWith('http')
      ? threadData.op.video
      : null;

    console.log(`[storage] Inserting thread record: ${threadData.id}`);
    const newThread = {
      id: threadData.id,
      slug: threadData.slug,
      title: threadData.title,
      ipnsLink: threadData.ipnsLink || null,
      ipfsCid: threadData.ipfsCid || null,
      opPostId: 'placeholder', // satisfy NOT NULL constraint temporarily
      authorId: threadData.authorId || 'anonymous',
      replyCount: 0,
      imageCount: imageFileId || threadData.ipfsCid ? 1 : 0,
      videoCount: videoFileId ? 1 : 0,
      lastActivity: new Date(),
      createdAt: new Date(),
    };

    await db.insert(threads).values(newThread);

    console.log(`[storage] Inserting OP post: ${opPostId}`);
    await db.insert(posts).values({
      id: opPostId,
      threadId: threadData.id,
      content: threadData.op.content || null,
      imageFileId,
      videoFileId,
      ipfsCid: threadData.ipfsCid || null,
      authorId: threadData.authorId || 'anonymous',
      isAnonymous: threadData.isAnonymous ?? true,
      timestamp: threadData.op.timestamp,
    });

    console.log(`[storage] Updating thread with final OP post ID`);
    await db.update(threads)
      .set({ opPostId })
      .where(eq(threads.id, threadData.id));

    // Persistence for hashtags
    if (threadData.hashtags && threadData.hashtags.length > 0) {
      console.log(`[storage] Processing ${threadData.hashtags.length} hashtags`);
      for (const tagName of threadData.hashtags) {
        const normalizedTag = tagName.trim().toLowerCase().replace(/^#/, '');
        if (!normalizedTag) continue;

        try {
          // Ensure tag exists
          let tag = await db.query.tags.findFirst({
            where: eq(tags.name, normalizedTag),
          });

          if (!tag) {
            const tagId = `tag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            await db.insert(tags).values({
              id: tagId,
              name: normalizedTag,
              slug: normalizedTag,
            });
            tag = { id: tagId, name: normalizedTag, slug: normalizedTag };
          }

          // Link thread to tag
          await db.insert(threadTags).values({
            threadId: threadData.id,
            tagId: tag.id,
          }).onConflictDoNothing();
        } catch (tagError) {
          console.error(`[storage] Error processing tag "${normalizedTag}":`, tagError);
          // Don't fail the whole thread creation if a tag fails
        }
      }
    }

    // Keep only the 100 most active threads (maintenance)
    try {
      const activeThreads = await db.query.threads.findMany({
        where: eq(threads.archived, false),
        orderBy: [asc(threads.lastActivity)],
      });

      if (activeThreads.length > 100) {
        const toPurge = activeThreads.slice(0, activeThreads.length - 100);
        console.log(`[storage] Purging ${toPurge.length} old threads`);
        for (const oldThread of toPurge) {
          await purgeThread(oldThread.id);
        }
      }
    } catch (maintenanceError) {
      console.error(`[storage] Maintenance error:`, maintenanceError);
    }

    return newThread;
  } catch (error) {
    console.error(`[storage] CRITICAL ERROR in createThread:`, error);
    throw error;
  }
}

export async function addCommentToThread(threadId: string, comment: {
  id: string;
  content?: string;
  image?: string;
  video?: string;
  authorId?: string;
  timestamp: Date;
  saged?: boolean;
  ipfsCid?: string;
  isAnonymous?: boolean;
}) {
  const imageFileId = comment.image && !comment.image.startsWith('http')
    ? comment.image
    : null;
  const videoFileId = comment.video && !comment.video.startsWith('http')
    ? comment.video
    : null;

  const newPost = {
    id: comment.id,
    threadId: threadId,
    content: comment.content || null,
    imageFileId,
    videoFileId,
    ipfsCid: comment.ipfsCid || null,
    authorId: comment.authorId || 'anonymous',
    isAnonymous: comment.isAnonymous ?? true,
    timestamp: comment.timestamp,
    saged: comment.saged || false,
  };

  await db.insert(posts).values(newPost);

  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
  });

  if (thread) {
    const updates: any = {
      replyCount: (thread.replyCount || 0) + 1,
      imageCount: (thread.imageCount || 0) + (imageFileId ? 1 : 0),
      videoCount: (thread.videoCount || 0) + (videoFileId ? 1 : 0),
    };

    if (!comment.saged) {
      updates.lastActivity = new Date();
    }

    if ((updates.replyCount >= 300) && !thread.saged) {
      updates.saged = true;
    }

    await db.update(threads).set(updates).where(eq(threads.id, threadId));
  }

  return newPost;
}

/**
 * Upload file to Vercel Blob Storage
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string,
  userId: string
): Promise<string> {
  try {
    console.log(`Uploading ${filename} to Vercel Blob...`);

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      contentType,
      access: 'public',
    });

    console.log(`File uploaded successfully to Vercel Blob: ${blob.url}`);

    // Save file metadata in Turso
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.insert(files).values({
      id: fileId,
      filename,
      contentType,
      size: buffer.length,
      uploadedAt: new Date(),
      uploadedBy: userId,
      gridFSFileId: blob.url, // Store the Blob URL instead of CID
      isDeleted: false,
    });

    return fileId;
  } catch (error) {
    console.error('Vercel Blob upload error:', error);
    throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Retrieve file from storage
 */
export async function getFile(fileId: string): Promise<{
  stream?: NodeJS.ReadableStream;
  url?: string;
  contentType: string;
  filename: string;
} | null> {
  const fileDoc = await db.query.files.findFirst({
    where: and(eq(files.id, fileId), eq(files.isDeleted, false)),
  }) || await db.query.files.findFirst({
    where: and(eq(files.gridFSFileId, fileId), eq(files.isDeleted, false)),
  });

  if (!fileDoc) return null;

  // If gridFSFileId is a URL (Vercel Blob), we can return it
  if (fileDoc.gridFSFileId.startsWith('http')) {
    return {
      url: fileDoc.gridFSFileId,
      contentType: fileDoc.contentType,
      filename: fileDoc.filename,
    };
  }

  // BlobStore-based retrieval
  const blob = BlobStore.get(fileDoc.gridFSFileId);
  if (blob) {
    const stream = Readable.from(blob.data);
    return {
      stream,
      contentType: blob.mime,
      filename: blob.filename,
    };
  }
  // If not found in blob store, fail gracefully
  return null;
}

export async function deleteFile(fileId: string): Promise<boolean> {
  await db.update(files)
    .set({ isDeleted: true })
    .where(eq(files.id, fileId));

  return true;
}

export async function cleanupOldFiles(): Promise<number> {
  return 0;
}
