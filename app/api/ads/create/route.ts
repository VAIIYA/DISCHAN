import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ads } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            title,
            link,
            imageUrl,
            placement,
            startDate,
            duration,
            amount,
            advertiserWallet,
            email
        } = body;

        // Basic validation
        if (!title || !link || !imageUrl || !placement || !startDate || !duration || !amount || !advertiserWallet) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Calculate end date
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(startDateTime);
        endDateTime.setDate(endDateTime.getDate() + duration - 1); // Inclusive

        const id = uuidv4();

        // Create pending ad record
        await db.insert(ads).values({
            id,
            title,
            link,
            imageUrl,
            placement,
            startDate: startDateTime,
            endDate: endDateTime,
            duration,
            amount: Math.round(amount), // Ensure integer
            advertiserWallet,
            email,
            status: 'pending_payment',
            currency: 'USDC'
        });

        return NextResponse.json({
            success: true,
            adId: id,
            message: 'Ad created successfully, awaiting payment'
        });

    } catch (error) {
        console.error('Error creating ad:', error);
        return NextResponse.json(
            { error: 'Failed to create ad' },
            { status: 500 }
        );
    }
}
