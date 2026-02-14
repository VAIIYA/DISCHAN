import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { channels, threads } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('Starting seed process via API...');

        const defaultChannels = [
            { id: uuidv4(), name: 'General', slug: 'general', description: 'General discussion', icon: 'Hash' },
            { id: uuidv4(), name: 'Music', slug: 'music', description: 'Share and discuss music', icon: 'Music' },
            { id: uuidv4(), name: 'Crypto', slug: 'crypto', description: 'Solana and crypto talk', icon: 'Coins' },
            { id: uuidv4(), name: 'Art', slug: 'art', description: 'Creative works and AI art', icon: 'Palette' },
            { id: uuidv4(), name: 'Gaming', slug: 'gaming', description: 'Game discussions', icon: 'Gamepad2' },
        ];

        // 1. Insert channels
        for (const channel of defaultChannels) {
            await db.insert(channels).values({
                id: channel.id,
                name: channel.name,
                slug: channel.slug,
                description: channel.description,
                icon: channel.icon
            }).onConflictDoNothing();
        }

        // 2. Get the ID of the general channel
        const generalChannel = await db.query.channels.findFirst({
            where: (channels, { eq }) => eq(channels.slug, 'general')
        });

        if (generalChannel) {
            // 3. Update threads without channel_id
            await db.update(threads)
                .set({ channelId: generalChannel.id })
                .where(sql`channel_id IS NULL`);
        }

        return NextResponse.json({
            success: true,
            message: 'Seeding completed successfully'
        });
    } catch (error) {
        console.error('API Error in GET /api/debug/seed:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
