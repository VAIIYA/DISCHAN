import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ads } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { paymentService } from '@/lib/payments';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { adId, signature } = body;

        if (!adId || !signature) {
            return NextResponse.json(
                { error: 'Ad ID and signature are required' },
                { status: 400 }
            );
        }

        // Verify transaction on-chain
        const isValid = await paymentService.verifyPayment(signature);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid transaction signature' },
                { status: 400 }
            );
        }

        // Check if signature is already used
        const existing = await db.select().from(ads).where(eq(ads.transactionSignature, signature));
        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'Transaction signature already used' },
                { status: 400 }
            );
        }

        // Update ad status
        await db.update(ads)
            .set({
                status: 'active',
                transactionSignature: signature,
                updatedAt: new Date()
            })
            .where(eq(ads.id, adId));

        return NextResponse.json({
            success: true,
            message: 'Payment verified and ad activated'
        });

    } catch (error) {
        console.error('Error verifying payment:', error);
        return NextResponse.json(
            { error: 'Failed to verify payment' },
            { status: 500 }
        );
    }
}
