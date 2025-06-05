// app/api/stripe/create-portal-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { getUserByClerkId } from "@/lib/mongo";
import Stripe from "stripe"; // Import Stripe for its error types

export async function POST(req: NextRequest) {
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Type the request body
    const body: { returnUrl?: string } = await req.json();
    const { returnUrl } = body;

    if (!returnUrl) {
      return NextResponse.json({ error: "Missing returnUrl" }, { status: 400 });
    }

    const user = await getUserByClerkId(userId);
    if (!user || !user.stripeCustomerId) {
      return NextResponse.json(
        { error: "Stripe customer ID not found for user." },
        { status: 404 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });

  } catch (error: unknown) { // <--- FIXED: Use `unknown`
    let errorMessage = "Failed to create portal session";
    let errorType = "UnknownPortalError";

    if (error instanceof Stripe.errors.StripeError) {
      errorMessage = `Stripe error: ${error.message}`;
      errorType = error.type;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errorType = error.name;
    }
    
    console.error(
        "STRIPE_PORTAL_SESSION_ERROR:",
        { type: errorType, message: errorMessage, originalError: error }
      );

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}