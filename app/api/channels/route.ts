import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { channels } from '@/lib/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const allChannels = await db.select().from(channels).orderBy(desc(channels.createdAt));

        return NextResponse.json({
            success: true,
            channels: allChannels
        });
    } catch (error) {
        console.error('API Error in GET /api/channels:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
