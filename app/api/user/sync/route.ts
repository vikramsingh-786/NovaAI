import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import * as mongoLib from'../../../../lib/mongo'; 

export async function POST(req: NextRequest) {
    try {
        const authResult = await auth();
        const authenticatedUserId = authResult.userId;

        const body = await req.json();
        const { email, firstName, lastName, imageUrl } = body;

        if (!authenticatedUserId) {
            return NextResponse.json({ error: 'Unauthenticated request' }, { status: 401 });
        }

        if (!email) {
            return NextResponse.json({ error: 'Missing email' }, { status: 400 });
        }
        if (typeof mongoLib.findOrCreateUser !== 'function') {
            return NextResponse.json({ error: 'Server configuration error', details: 'findOrCreateUser not available via namespace' }, { status: 500 });
        }
        const user = await mongoLib.findOrCreateUser(authenticatedUserId, email, firstName, lastName, imageUrl);
        return NextResponse.json({ user });

    } catch (error: any) {
        if (error.message && error.message.includes('is not a function') && error.message.includes('findOrCreateUser')) {
             console.error("API_SYNC_RUNTIME_ERROR: Caught error indicating findOrCreateUser is not a function at runtime.");
        }
        return NextResponse.json({ error: 'Failed to sync user', details: error.message }, { status: 500 });
    }
}