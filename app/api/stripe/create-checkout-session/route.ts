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
  
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId, successUrl, cancelUrl } = await req.json();

    if (!priceId || !successUrl || !cancelUrl) {
 
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
 
      return NextResponse.json(
        { error: "User email address is missing." },
        { status: 400 }
      );
    }
    const userName = `${clerkUser.firstName || ""} ${
      clerkUser.lastName || ""
    }`.trim();

    if (!userInDb) {
   
      userInDb = await findOrCreateUser(
        userId,
        userEmail,
        clerkUser.firstName || undefined,
        clerkUser.lastName || undefined,
        clerkUser.imageUrl || undefined
      );
 
    }

    let stripeCustomerId = userInDb.stripeCustomerId;

    if (!stripeCustomerId) {

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
        userInDb.stripeCustomerId = stripeCustomerId; // Update local variable for current request

      } catch (stripeError: any) {
 
        return NextResponse.json(
          { error: `Failed to create Stripe customer: ${stripeError.message}` },
          { status: 500 }
        );
      }
    } else {
      try {
        await stripe.customers.update(stripeCustomerId, {
          email: userEmail,
          name: userName || undefined,
        });
      } catch (updateError: any) {
        console.warn(
          `CREATE_CHECKOUT_SESSION_WARN: Failed to update existing Stripe customer ${stripeCustomerId}: ${updateError.message}. Proceeding with checkout.`
        );
      }
    }


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
      },
    };

    const session = await stripe.checkout.sessions.create(
      checkoutSessionParams
    );

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error(
      "CREATE_CHECKOUT_SESSION_ERROR: Outer catch block:",
      error.type ? `${error.type}: ${error.message}` : error.message,
      error.stack
    );
    let errorMessage = "Failed to create checkout session";
    if (error instanceof Stripe.errors.StripeError) {
      errorMessage = `Stripe error: ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
