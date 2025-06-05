// app/api/user/status/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import * as mongoLib from '../../../../lib/mongo'; // Assuming this path and import style is intended
import type { UserDocument } from '@/types';

// Removed 'req: NextRequest' as it's not used in this GET handler
export async function GET() {
    try {
        const authResult = await auth();
        const userId = authResult.userId;

        if (!userId) {
            console.warn("API_USER_STATUS: Unauthorized attempt to fetch status.");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // This check might be redundant if your build/runtime ensures mongoLib is correctly loaded.
        // However, keeping it for safety if you've experienced issues.
        if (typeof mongoLib.getUserByClerkId !== 'function') {
            console.error("API_USER_STATUS_CRITICAL: getUserByClerkId is not a function in mongoLib.");
            return NextResponse.json({ error: 'Server configuration error', details: 'getUserByClerkId not available' }, { status: 500 });
        }

       let user: UserDocument | null = null;
        try {
            // console.log(`API_USER_STATUS: Attempting to get user by Clerk ID: ${userId}`);
            user = await mongoLib.getUserByClerkId(userId);
        } catch (dbError: unknown) { // <--- FIXED: Use `unknown`
            let detailMessage = "Unknown database error";
            if (dbError instanceof Error) {
                detailMessage = dbError.message;
            }
            console.error(`API_USER_STATUS_ERROR: Database error for user ${userId}:`, dbError);
            return NextResponse.json({ error: 'Database error while fetching user status', details: detailMessage }, { status: 500 });
        }
        
        if (!user) {
            // console.log(`API_USER_STATUS: User ${userId} not found in DB. Returning default free status.`);
            // It's important that the structure returned here matches what the client expects,
            // even if it's a placeholder for a non-existent or unsynced user.
            // Consider if UserDocument allows nullable fields or if this structure needs adjustment.
            // For UserDocument, _id is mandatory, but here we are not creating a full UserDocument.
            // The client (SubscriptionContext) expects a `user` object with at least `subscriptionStatus`.
            return NextResponse.json({
                user: { // This is a partial representation, not a full UserDocument
                    clerkUserId: userId,
                    subscriptionStatus: 'free',
                    email: 'N/A (User not fully synced)', // Or perhaps fetch email from Clerk if needed here
                    // Other fields might not be necessary if the client only cares about subscriptionStatus primarily
                    // messageCountToday: 0, 
                    // createdAt: new Date().toISOString(), 
                    // updatedAt: new Date().toISOString(),
                }
            }, { status: 200 }); // Return 200 as the request was successful, user just not in DB yet
        }

        // console.log(`API_USER_STATUS: User ${userId} found:`, user);
        return NextResponse.json({ user }); // `user` here is a full UserDocument

    } catch (error: unknown) { // <--- FIXED: Use `unknown`
        let detailMessage = "An unexpected error occurred";
        if (error instanceof Error) {
            detailMessage = error.message;
        }
        console.error("API_USER_STATUS_FATAL_ERROR: Failed to fetch user status:", error);
        return NextResponse.json({ error: 'Failed to fetch user status', details: detailMessage }, { status: 500 });
    }
}