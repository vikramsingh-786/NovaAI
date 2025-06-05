// app/api/stripe/webhooks/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import {
  getUserByStripeCustomerId,
  updateUserSubscription,
  // findOrCreateUser, // Removed as it's not used in this file
} from "@/lib/mongo";
import { headers } from "next/headers";
import type { UserDocument } from "@/types";

async function buffer(readable: ReadableStream<Uint8Array>): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function mapStripeStatusToUserStatus(
  stripeStatus: Stripe.Subscription.Status
): UserDocument["subscriptionStatus"] {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due": // Treat unpaid as past_due until resolved or canceled
      return "past_due";
    case "canceled": // Covers explicit cancellations
      return "canceled";
    case "unpaid": // Could also lead to 'canceled' after Stripe's dunning process
        return "past_due"; // Or 'canceled' depending on your desired immediate effect
    case "incomplete":
      return "incomplete";
    case "incomplete_expired":
      return "incomplete_expired";
    default:
      // Log the unhandled status to potentially add it later
      console.warn(
        `STRIPE_WEBHOOK_WARN: Unmapped Stripe subscription status: ${stripeStatus}. Defaulting to 'canceled'.`
      );
      return "canceled"; // A safe default
  }
}

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted", // Stripe sends this for cancellations
  "invoice.paid",
  "invoice.payment_failed",
]);

export async function POST(req: NextRequest) {
  if (!req.body) {
    console.error("STRIPE_WEBHOOK_ERROR: Request body is null.");
    return NextResponse.json(
      { error: "Request body is missing." },
      { status: 400 }
    );
  }
  const rawBody = await buffer(req.body);

  const signatureHeader = headers().get("Stripe-Signature");
  if (!signatureHeader) {
    console.error("STRIPE_WEBHOOK_ERROR: Missing Stripe-Signature header.");
    return NextResponse.json(
      { error: "Missing Stripe-Signature header." },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_ERROR: Missing Stripe webhook secret environment variable.");
    return NextResponse.json(
      { error: "Webhook secret not configured on the server." },
      { status: 500 } // 500 for server configuration issue
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signatureHeader,
      webhookSecret
    );
  } catch (err: unknown) { // <--- FIXED: Use `unknown`
    let message = "Webhook signature verification failed.";
    if (err instanceof Stripe.errors.StripeError) {
      message = `Webhook signature verification failed: ${err.message}`;
    } else if (err instanceof Error) {
      message = `Webhook signature verification failed: ${err.message}`;
    }
    console.error(`STRIPE_WEBHOOK_ERROR: Error verifying webhook signature:`, err);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }

  console.log(`STRIPE_WEBHOOK_EVENT: Received event: ${event.type}, ID: ${event.id}`);

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (
            session.mode === "subscription" &&
            session.subscription &&
            session.customer &&
            session.metadata?.clerkUserId // Ensure clerkUserId exists
          ) {
            const clerkUserId = session.metadata.clerkUserId;
            const stripeCustomerId =
              typeof session.customer === "string"
                ? session.customer
                : session.customer.id;
            const subscriptionId =
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription.id;

            // It's good practice to retrieve the subscription object to get the latest details
            const subscription = await stripe.subscriptions.retrieve(
              subscriptionId
            );

            if (subscription && subscription.items.data.length > 0) {
              await updateUserSubscription(clerkUserId, {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: stripeCustomerId, // Use the one from session, it's reliable here
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(
                  subscription.current_period_end * 1000
                ),
                subscriptionStatus: mapStripeStatusToUserStatus(
                  subscription.status
                ),
              });
              console.log(`STRIPE_WEBHOOK_SUCCESS: checkout.session.completed for user ${clerkUserId}, sub ID ${subscription.id}, status ${subscription.status}`);
            } else {
              console.error(
                `STRIPE_WEBHOOK_ERROR: Subscription details or items missing in checkout.session.completed for session: ${session.id}`
              );
            }
          } else {
            // Log the reason for not processing
            let logReason = "Not a subscription session or missing critical data.";
            if (session.mode !== "subscription") logReason = "Not a subscription mode.";
            else if (!session.subscription) logReason = "Subscription ID missing in session.";
            else if (!session.customer) logReason = "Customer ID missing in session.";
            else if (!session.metadata?.clerkUserId) logReason = "clerkUserId missing in session metadata.";
            console.warn(`STRIPE_WEBHOOK_WARN: checkout.session.completed event for session ${session.id} ignored. Reason: ${logReason}`);
          }
          break;
        }

        case "customer.subscription.created": // Often handled by checkout.session.completed for new subs
        case "customer.subscription.updated":
        case "customer.subscription.deleted": { // Handles cancellations, including at period end
          const subscription = event.data.object as Stripe.Subscription;

          if (!subscription.customer) {
            console.error(`STRIPE_WEBHOOK_ERROR: Customer ID missing in ${event.type} for subscription ${subscription.id}`);
            break;
          }
          const stripeCustomerId =
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer.id;
          const user = await getUserByStripeCustomerId(stripeCustomerId);

          if (user && subscription.items.data.length > 0) {
            await updateUserSubscription(user.clerkUserId, {
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(
                subscription.current_period_end * 1000
              ),
              subscriptionStatus: mapStripeStatusToUserStatus(
                subscription.status
              ),
            });
            console.log(`STRIPE_WEBHOOK_SUCCESS: ${event.type} for user ${user.clerkUserId}, sub ID ${subscription.id}, status ${subscription.status}`);
          } else if (!user) {
            console.warn(
              `STRIPE_WEBHOOK_WARN: User not found for stripeCustomerId: ${stripeCustomerId} during ${event.type} for sub ${subscription.id}.`
            );
          } else { // User found, but no items (should be rare for active subs)
            console.warn(
              `STRIPE_WEBHOOK_WARN: Subscription items missing for ${event.type}, sub ID ${subscription.id}, Stripe Customer ${stripeCustomerId}. Updating status only.`
            );
            // Still update status, as it might be a cancellation or other status change
            // without item changes (though typically item price ID is good to keep)
            await updateUserSubscription(user.clerkUserId, {
              stripeSubscriptionId: subscription.id, // Keep sub ID
              subscriptionStatus: mapStripeStatusToUserStatus(
                subscription.status
              ),
              // Optionally nullify priceId and periodEnd if the subscription is truly empty/invalidated
              // stripePriceId: undefined, 
              // stripeCurrentPeriodEnd: undefined,
            });
          }
          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;
          if (
            invoice.subscription &&
            invoice.customer &&
            (invoice.billing_reason === "subscription_cycle" || invoice.billing_reason === "subscription_create")
          ) {
            const stripeCustomerId =
              typeof invoice.customer === "string"
                ? invoice.customer
                : invoice.customer.id;
            const user = await getUserByStripeCustomerId(stripeCustomerId);

            if (user) {
              const subscriptionId =
                typeof invoice.subscription === "string"
                  ? invoice.subscription
                  : invoice.subscription.id;
              // Retrieve the subscription to get its current status and period end
              const subscription = await stripe.subscriptions.retrieve(
                subscriptionId
              );

              await updateUserSubscription(user.clerkUserId, {
                subscriptionStatus: mapStripeStatusToUserStatus(
                  subscription.status // Use status from the subscription object
                ),
                stripeCurrentPeriodEnd: new Date(
                  subscription.current_period_end * 1000
                ),
                // Optionally update stripePriceId if it could change on renewal (rare)
                // stripePriceId: subscription.items.data[0]?.price.id,
              });
              console.log(
                `STRIPE_WEBHOOK_SUCCESS: invoice.paid for Clerk User ${user.clerkUserId}, Sub ID ${subscriptionId}, updated status to ${subscription.status}`
              );
            } else {
              console.warn(
                `STRIPE_WEBHOOK_WARN: User not found for stripeCustomerId: ${stripeCustomerId} during invoice.paid for invoice ${invoice.id}.`
              );
            }
          } else {
            console.log(
              `STRIPE_WEBHOOK_INFO: invoice.paid event for invoice ${invoice.id} ignored. Reason: Not a subscription cycle/create or missing IDs. Billing reason: ${invoice.billing_reason || 'N/A'}`
            );
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.subscription && invoice.customer) {
            const stripeCustomerId =
              typeof invoice.customer === "string"
                ? invoice.customer
                : invoice.customer.id;
            const user = await getUserByStripeCustomerId(stripeCustomerId);

            if (user) {
              const subscriptionId =
                typeof invoice.subscription === "string"
                  ? invoice.subscription
                  : invoice.subscription.id;
              // Retrieve the subscription to get its current status
              const subscription = await stripe.subscriptions.retrieve(
                subscriptionId
              );
              
              await updateUserSubscription(user.clerkUserId, {
                subscriptionStatus: mapStripeStatusToUserStatus(
                  subscription.status // e.g., 'past_due' or 'canceled'
                ),
              });
              console.log(`STRIPE_WEBHOOK_SUCCESS: invoice.payment_failed for user ${user.clerkUserId}, sub ID ${subscriptionId}, status set to ${subscription.status}`);
            } else {
              console.warn(
                `STRIPE_WEBHOOK_WARN: User not found for stripeCustomerId: ${stripeCustomerId} during invoice.payment_failed for invoice ${invoice.id}.`
              );
            }
          } else {
            console.warn(
              `STRIPE_WEBHOOK_WARN: invoice.payment_failed event for invoice ${invoice.id} ignored. Reason: Missing subscription or customer ID.`
            );
          }
          break;
        }
        default:
          console.warn(
            `STRIPE_WEBHOOK_WARN: Unhandled relevant event type: ${event.type}`
          );
      }
    } catch (error: unknown) { // <--- FIXED: Use `unknown`
        // Log the error properly
        let errorMessage = "Webhook handler failed internally.";
        let errorDetails: unknown = error;

        if (error instanceof Error) {
            errorMessage = error.message;
            errorDetails = { message: error.message, stack: error.stack, name: error.name };
        }
        console.error(`STRIPE_WEBHOOK_ERROR: Error handling event ${event.type} (ID: ${event.id}):`, errorMessage, errorDetails);
        // It's important to return a 200 to Stripe to acknowledge receipt, even if processing failed,
        // to prevent Stripe from retrying indefinitely for certain types of errors.
        // If it's a transient error you want Stripe to retry, you might return a 500.
        // For now, acknowledging receipt:
        return NextResponse.json(
            { error: "Webhook handler failed internally. Event logged." },
            { status: 200 } // Or 500 if you want Stripe to retry for this specific error
        );
    }
  } else {
    console.log(
      `STRIPE_WEBHOOK_INFO: Received event ${event.type} (ID: ${event.id}) - Not in relevantEvents set. Skipping.`
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}