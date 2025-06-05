// app/api/user/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import * as mongoLib from '../../../../lib/mongo'; // Assuming this path and import style is intended

// Define an interface for the expected request body for better type safety
interface SyncRequestBody {
    email?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
    // clerkUserId is not needed here as it's taken from auth()
}

export async function POST(req: NextRequest) {
    try {
        const authResult = await auth();
        const authenticatedUserId = authResult.userId;

        if (!authenticatedUserId) {
            console.warn("API_SYNC: Unauthenticated attempt to sync user.");
            return NextResponse.json({ error: 'Unauthenticated request' }, { status: 401 });
        }

        // Type the request body
        const body: SyncRequestBody = await req.json();
        const { email, firstName, lastName, imageUrl } = body;

        if (!email) {
            console.warn(`API_SYNC: Missing email for user ${authenticatedUserId}.`);
            return NextResponse.json({ error: 'Missing email' }, { status: 400 });
        }

        // This check might be redundant if your build/runtime ensures mongoLib is correctly loaded.
        if (typeof mongoLib.findOrCreateUser !== 'function') {
            console.error("API_SYNC_CRITICAL: findOrCreateUser is not a function in mongoLib.");
            return NextResponse.json({ error: 'Server configuration error', details: 'findOrCreateUser not available via namespace' }, { status: 500 });
        }

        // console.log(`API_SYNC: Syncing user ${authenticatedUserId} with email ${email}`);
        const user = await mongoLib.findOrCreateUser(authenticatedUserId, email, firstName, lastName, imageUrl);
        // console.log(`API_SYNC: User ${authenticatedUserId} synced/found:`, user);
        return NextResponse.json({ user });

    } catch (error: unknown) { // <--- FIXED: Use `unknown`
        let detailMessage = "An unexpected error occurred during user sync.";
        let specificRuntimeError = false;

        if (error instanceof Error) {
            detailMessage = error.message;
            // Your specific check for findOrCreateUser not being a function
            if (error.message && error.message.includes('is not a function') && error.message.includes('findOrCreateUser')) {
                 console.error("API_SYNC_RUNTIME_ERROR: Caught error indicating findOrCreateUser is not a function at runtime.", error);
                 specificRuntimeError = true; // Flag it to potentially avoid overwriting detailMessage below
            }
        } else if (typeof error === 'string') {
            detailMessage = error;
        }
        
        // Log the full error for better debugging
        console.error("API_SYNC_ERROR: Failed to sync user:", error);

        // If it wasn't the specific runtime error, use the extracted or default message
        if (!specificRuntimeError && error instanceof Error) {
            detailMessage = error.message;
        }


        return NextResponse.json({ error: 'Failed to sync user', details: detailMessage }, { status: 500 });
    }
}