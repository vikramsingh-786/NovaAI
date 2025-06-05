// app/api/stripe/create-checkout-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import {
  findOrCreateUser,
  getUserByClerkId,
  updateUserSubscription,
} from "@/lib/mongo";
import type { UserDocument } from "@/types";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const authResult = await auth();
    const userId = authResult.userId;
    const clerkUser = await currentUser();

    if (!userId || !clerkUser) {
      console.error('CREATE_CHECKOUT_SESSION_ERROR: Unauthorized - userId or clerkUser missing.');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Explicitly type the request body if possible, or use a more generic type for now
    const body: { priceId?: string; successUrl?: string; cancelUrl?: string } = await req.json();
    const { priceId, successUrl, cancelUrl } = body;


    if (!priceId || !successUrl || !cancelUrl) {
      console.error('CREATE_CHECKOUT_SESSION_ERROR: Missing priceId, successUrl, or cancelUrl in request body.');
      return NextResponse.json(
        { error: "Missing priceId, successUrl, or cancelUrl" },
        { status: 400 }
      );
    }

    let userInDb: UserDocument | null = await getUserByClerkId(userId);
    const userEmail =
      clerkUser.emailAddresses.find(
        (email) => email.id === clerkUser.primaryEmailAddressId
      )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      console.error('CREATE_CHECKOUT_SESSION_ERROR: Clerk user has no email address.');
      return NextResponse.json(
        { error: "User email address is missing." },
        { status: 400 }
      );
    }
    const userName = `${clerkUser.firstName || ""} ${
      clerkUser.lastName || ""
    }`.trim();

    if (!userInDb) {
      console.log(`CREATE_CHECKOUT_SESSION_INFO: User ${userId} not found in DB, creating...`);
      userInDb = await findOrCreateUser(
        userId,
        userEmail,
        clerkUser.firstName || undefined,
        clerkUser.lastName || undefined,
        clerkUser.imageUrl || undefined
      );
      console.log(`CREATE_CHECKOUT_SESSION_INFO: User ${userId} created in DB.`);
    }

    let stripeCustomerId = userInDb.stripeCustomerId;

    if (!stripeCustomerId) {
      console.log(`CREATE_CHECKOUT_SESSION_INFO: Stripe customer ID not found for user ${userId}, creating Stripe customer...`);
      try {
        const customer = await stripe.customers.create({
          email: userEmail,
          name: userName || undefined,
          metadata: {
            clerkUserId: userId,
          },
        });
        stripeCustomerId = customer.id;
        await updateUserSubscription(userId, { stripeCustomerId });
        userInDb.stripeCustomerId = stripeCustomerId;
        console.log(`CREATE_CHECKOUT_SESSION_INFO: Stripe customer created for user ${userId} with ID ${stripeCustomerId}.`);
      } catch (stripeError: unknown) { // <--- FIXED: Use `unknown`
        let message = "Failed to create Stripe customer.";
        if (stripeError instanceof Stripe.errors.StripeError) {
          message = `Failed to create Stripe customer: ${stripeError.message}`;
        } else if (stripeError instanceof Error) {
          message = `Failed to create Stripe customer: ${stripeError.message}`;
        }
        console.error('CREATE_CHECKOUT_SESSION_ERROR: Stripe customer creation failed:', stripeError);
        return NextResponse.json(
          { error: message },
          { status: 500 }
        );
      }
    } else {
      try {
        await stripe.customers.update(stripeCustomerId, {
          email: userEmail,
          name: userName || undefined,
        });
        // console.log(`CREATE_CHECKOUT_SESSION_INFO: Updated existing Stripe customer ${stripeCustomerId} with latest details.`);
      } catch (updateError: unknown) { // <--- FIXED: Use `unknown`
        let message = "Unknown error updating Stripe customer.";
        if (updateError instanceof Error) {
            message = updateError.message;
        }
        console.warn(
          `CREATE_CHECKOUT_SESSION_WARN: Failed to update existing Stripe customer ${stripeCustomerId}: ${message}. Proceeding with checkout.`, updateError
        );
      }
    }

    console.log(`CREATE_CHECKOUT_SESSION_INFO: Creating Stripe Checkout session for user ${userId}, customer ${stripeCustomerId}, price ${priceId}.`);
    const checkoutSessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      billing_address_collection: "required",
      customer_update: {
        name: "auto",
        address: "auto",
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        clerkUserId: userId,
      }
    };

    const session = await stripe.checkout.sessions.create(
      checkoutSessionParams
    );
    console.log(`CREATE_CHECKOUT_SESSION_SUCCESS: Stripe Checkout session ${session.id} created successfully for user ${userId}.`);
    return NextResponse.json({ sessionId: session.id });

  } catch (error: unknown) { // <--- FIXED: Use `unknown`
    let errorMessage = "Failed to create checkout session";
    let errorType = "UnknownError"; // For logging

    if (error instanceof Stripe.errors.StripeError) {
      errorMessage = `Stripe error: ${error.message}`;
      errorType = error.type;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errorType = error.name;
    }
    // Log more detailed error information
    console.error(
      "CREATE_CHECKOUT_SESSION_ERROR: Outer catch block:",
      { type: errorType, message: errorMessage, originalError: error }
    );

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}