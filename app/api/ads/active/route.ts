import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ads } from '@/lib/schema';
import { and, eq, lte, gte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const placement = searchParams.get('placement');

        if (!placement) {
            return NextResponse.json(
                { error: 'Placement is required' },
                { status: 400 }
            );
        }

        const now = new Date();

        // Find an active ad for this placement where current time is within duration
        const activeAds = await db.select().from(ads).where(
            and(
                eq(ads.placement, placement),
                eq(ads.status, 'active'),
                lte(ads.startDate, now),
                gte(ads.endDate, now)
            )
        ).limit(1);

        if (activeAds.length === 0) {
            return NextResponse.json({ ad: null });
        }

        // Return the first match (randomization could be added if we allowed multiple per slot)
        return NextResponse.json({ ad: activeAds[0] });

    } catch (error) {
        console.error('Error fetching active ad:', error);
        return NextResponse.json(
            { error: 'Failed to fetch active ad' },
            { status: 500 }
        );
    }
}
