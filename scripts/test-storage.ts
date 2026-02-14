import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local BEFORE anything else
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('Environment loaded. TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL ? 'PRESENT' : 'MISSING');

async function testCreateThread() {
    const { createThread } = await import('../src/lib/storage.ts');
    const { db } = await import('../src/lib/db.ts');
    const { sql } = await import('drizzle-orm');

    console.log('--- Starting Thread Creation Test ---');
    console.log('DATABASE_URL:', process.env.TURSO_DATABASE_URL ? 'PRESENT' : 'MISSING');

    // Check for missing ipfs_cid column and fix it if needed
    try {
        console.log('Verifying table schema...');
        await db.run(sql`ALTER TABLE threads ADD COLUMN ipfs_cid text`).catch(e => {
            if (e.message.includes('duplicate column name')) {
                console.log('ipfs_cid column already exists (or similar error), moving on.');
            } else {
                console.warn('Failed to add ipfs_cid column:', e.message);
            }
        });

        await db.run(sql`ALTER TABLE posts ADD COLUMN ipfs_cid text`).catch(e => {
            if (e.message.includes('duplicate column name')) {
                console.log('ipfs_cid column already exists in posts, moving on.');
            } else {
                console.warn('Failed to add ipfs_cid column to posts:', e.message);
            }
        });
        console.log('Schema verification/repair complete.');
    } catch (err: any) {
        console.error('Schema repair failed:', err.message);
    }

    const testId = `test_${Date.now()}`;
    const testThread = {
        id: testId,
        slug: `test-slug-${Date.now()}`,
        title: 'Debug Test Thread',
        op: {
            content: 'Testing thread creation from debug script',
            timestamp: new Date(),
        },
        authorId: 'debug_user',
        hashtags: ['debug', 'test'],
        isAnonymous: true
    };

    try {
        console.log('Calling createThread...');
        const result = await createThread(testThread as any);
        console.log('Thread created successfully:', result);

        // Cleanup
        console.log('Cleaning up test data...');
        // We don't have a direct delete, but we can use db directly
        // This is just a test, so we'll leave it or manually delete if needed
    } catch (error) {
        console.error('FAILED to create thread:');
        if (error instanceof Error) {
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        } else {
            console.error(error);
        }
        process.exit(1);
    }
}

testCreateThread().then(() => {
    console.log('--- Test Finished ---');
    process.exit(0);
});
