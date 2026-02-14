
import { db } from '../src/lib/db';
import { getThreadBySlug } from '../src/lib/storage';

async function test() {
    console.log('Testing Drizzle relations and slug fetching...');

    try {
        // 1. Get a random thread slug from the DB
        const firstThread = await db.query.threads.findFirst();

        if (!firstThread) {
            console.log('No threads found in DB. Please create one first.');
            process.exit(0);
        }

        console.log(`Testing with slug: ${firstThread.slug}`);

        // 2. Attempt to fetch by slug using the function that was failing
        const threadData = await getThreadBySlug(firstThread.slug);

        if (threadData) {
            console.log('SUCCESS: Thread data fetched correctly!');
            console.log('Thread title:', threadData.thread.title);
            console.log('Comment count:', threadData.comments.length);
            console.log('Hashtags:', threadData.thread.hashtags);
        } else {
            console.error('FAILED: getThreadBySlug returned null');
        }

    } catch (error) {
        console.error('FAILED with error:', error);
    }
}

test();
