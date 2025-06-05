import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { getUserByClerkId } from "@/lib/mongo";

export async function POST(req: NextRequest) {
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { returnUrl } = await req.json();
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create portal session" },
      { status: 500 }
    );
  }
}
