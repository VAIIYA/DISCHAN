import { NextRequest, NextResponse } from 'next/server';
import { createThread, getThreadBySlug } from '@/lib/storage';
import { revalidatePath } from 'next/cache';

const HASHCUBE_API_URL = 'https://hashcube.vercel.app/api/threads';

export async function GET(_request: NextRequest) {
    try {
        console.log('Fetching threads from Hashcube...');

        const response = await fetch(HASHCUBE_API_URL, {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch from Hashcube: ${response.status}`);
        }

        const hashcubeThreads = await response.json();

        if (!Array.isArray(hashcubeThreads)) {
            throw new Error('Invalid response format from Hashcube: expected an array');
        }

        console.log(`Found ${hashcubeThreads.length} threads on Hashcube.`);

        let addedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const remoteThread of hashcubeThreads) {
            try {
                // Construct a slug if it doesn't exist, though Hashcube usually has them 
                // or we use the id as a fallback for slug if needed.
                // Let's use the remote id or a slugified title if slug is missing.
                const slug = remoteThread.slug || remoteThread.id ||
                    remoteThread.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                // Check if thread already exists by slug
                const existingThread = await getThreadBySlug(slug);

                if (existingThread) {
                    skippedCount++;
                    continue;
                }

                // Create thread data
                const threadId = `thread_auto_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

                const newThreadData = {
                    id: threadId,
                    slug: slug,
                    title: remoteThread.title,
                    op: {
                        content: remoteThread.description || remoteThread.op?.content || 'Auto-fetched from Hashcube',
                        image: undefined,
                        video: undefined,
                        authorId: remoteThread.authorId || 'hashcube_bot',
                        timestamp: new Date(remoteThread.createdAt || Date.now())
                    },
                    authorId: remoteThread.authorId || 'hashcube_bot',
                    hashtags: remoteThread.hashtags || [],
                    ipnsLink: remoteThread.ipnsLink,
                    ipfsCid: remoteThread.value || remoteThread.ipfsCid || remoteThread.op?.ipfsCid,
                    isAnonymous: true
                };

                await createThread(newThreadData);
                addedCount++;
                console.log(`Successfully auto-fetched thread: ${remoteThread.title}`);
            } catch (innerError) {
                console.error(`Error processing thread ${remoteThread.id}:`, innerError);
                errorCount++;
            }
        }

        if (addedCount > 0) {
            revalidatePath('/');
            revalidatePath('/catalog');
        }

        return NextResponse.json({
            success: true,
            addedCount,
            skippedCount,
            errorCount,
            message: `Sync completed. Added ${addedCount} threads, skipped ${skippedCount}, errors: ${errorCount}.`
        });

    } catch (error) {
        console.error('Auto-fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to auto-fetch from Hashcube', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// Allow POST for cron jobs
export async function POST(_request: NextRequest) {
    return GET(_request);
}
