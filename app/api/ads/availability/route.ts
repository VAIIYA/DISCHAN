import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ads } from '@/lib/schema';
import { and, eq, gte, lte, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const placement = searchParams.get('placement');
        const month = searchParams.get('month'); // YYYY-MM

        if (!placement || !month) {
            return NextResponse.json(
                { error: 'Placement and month are required' },
                { status: 400 }
            );
        }

        const [year, monthStr] = month.split('-');

        if (!year || !monthStr) {
            return NextResponse.json(
                { error: 'Invalid month format. Expected YYYY-MM' },
                { status: 400 }
            );
        }

        const startDate = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(monthStr), 0); // Last day of month

        // Fetch all active or pending ads for this placement in this month
        const existingAds = await db.select().from(ads).where(
            and(
                eq(ads.placement, placement),
                or(
                    eq(ads.status, 'active'),
                    eq(ads.status, 'pending_payment') // Reserve pending spots too
                ),
                or(
                    and(
                        gte(ads.startDate, startDate),
                        lte(ads.startDate, endDate)
                    ),
                    and(
                        gte(ads.endDate, startDate),
                        lte(ads.endDate, endDate)
                    ),
                    and(
                        lte(ads.startDate, startDate),
                        gte(ads.endDate, endDate)
                    )
                )
            )
        );

        // Calculate booked dates
        const bookedDates: string[] = [];

        existingAds.forEach(ad => {
            let current = new Date(ad.startDate);
            const end = new Date(ad.endDate);

            while (current <= end) {
                const dateStr = current.toISOString().split('T')[0];
                if (dateStr) {
                    bookedDates.push(dateStr);
                }
                current.setDate(current.getDate() + 1);
            }
        });

        // Deduplicate
        const uniqueBookedDates = [...new Set(bookedDates)];

        return NextResponse.json({ bookedDates: uniqueBookedDates });

    } catch (error) {
        console.error('Error checking availability:', error);
        return NextResponse.json(
            { error: 'Failed to check availability' },
            { status: 500 }
        );
    }
}
