import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import * as mongoLib from '../../../../lib/mongo';
import type { UserDocument } from '@/types';

export async function GET(req: NextRequest) {
    try {
        const authResult = await auth();
        const userId = authResult.userId;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
         if (typeof mongoLib.getUserByClerkId !== 'function') {
            return NextResponse.json({ error: 'Server configuration error', details: 'getUserByClerkId not available' }, { status: 500 });
        }

       let user: UserDocument | null = null;
        try {
            user = await mongoLib.getUserByClerkId(userId);
        } catch (dbError: any) {
            return NextResponse.json({ error: 'Database error while fetching user status', details: dbError.message }, { status: 500 });
        }
        
        if (!user) {
            return NextResponse.json({
                user: {
                    clerkUserId: userId,
                    subscriptionStatus: 'free',
                    email: 'N/A (User not fully synced)',
                    messageCountToday: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }
            }, { status: 200 });
        }
        return NextResponse.json({ user });

    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch user status', details: error.message }, { status: 500 });
    }
}