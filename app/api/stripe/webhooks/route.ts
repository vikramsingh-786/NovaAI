import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import {
  getUserByStripeCustomerId,
  updateUserSubscription,
  findOrCreateUser,
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
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "past_due";
    case "incomplete":
      return "incomplete";
    case "incomplete_expired":
      return "incomplete_expired";
    default:
      console.warn(
        `STRIPE_WEBHOOK_WARN: Unmapped Stripe subscription status: ${stripeStatus}`
      );
      return "canceled";
  }
}
const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
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
    return NextResponse.json(
      { error: "Missing Stripe-Signature header." },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured on the server." },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signatureHeader,
      webhookSecret
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (
            session.mode === "subscription" &&
            session.subscription &&
            session.customer &&
            session.metadata?.clerkUserId
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

            const subscription = await stripe.subscriptions.retrieve(
              subscriptionId
            );

            if (subscription && subscription.items.data.length > 0) {
              await updateUserSubscription(clerkUserId, {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: stripeCustomerId,
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(
                  subscription.current_period_end * 1000
                ),
                subscriptionStatus: mapStripeStatusToUserStatus(
                  subscription.status
                ),
              });
            } else {
              console.error(
                `STRIPE_WEBHOOK_ERROR: Subscription details or items missing in checkout.session.completed for session: ${session.id}`
              );
            }
          } else {
            let reason = "Not a subscription session";
            if (!session.subscription) reason = "Subscription ID missing";
            else if (!session.customer) reason = "Customer ID missing";
            else if (!session.metadata?.clerkUserId)
              reason = "clerkUserId missing in metadata";
          }
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;

          if (!subscription.customer) {
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
          } else if (!user) {
            console.warn(
              `STRIPE_WEBHOOK_WARN: User not found for stripeCustomerId: ${stripeCustomerId} during ${event.type} for sub ${subscription.id}.`
            );
          } else {
            console.warn(
              `STRIPE_WEBHOOK_WARN: Subscription items missing for ${event.type}, sub ID ${subscription.id}, Stripe Customer ${stripeCustomerId}`
            );
            await updateUserSubscription(user.clerkUserId, {
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: mapStripeStatusToUserStatus(
                subscription.status
              ),
            });
          }
          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;
          if (
            invoice.subscription &&
            invoice.customer &&
            invoice.billing_reason === "subscription_cycle"
          ) {
            // or 'subscription_create'
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
              const subscription = await stripe.subscriptions.retrieve(
                subscriptionId
              );

              await updateUserSubscription(user.clerkUserId, {
                subscriptionStatus: mapStripeStatusToUserStatus(
                  subscription.status
                ),
                stripeCurrentPeriodEnd: new Date(
                  subscription.current_period_end * 1000
                ),
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
              `STRIPE_WEBHOOK_INFO: invoice.paid event for invoice ${invoice.id} ignored. Reason: Not a subscription cycle or missing IDs. Billing reason: ${invoice.billing_reason}`
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
              const subscription = await stripe.subscriptions.retrieve(
                subscriptionId
              );

              await updateUserSubscription(user.clerkUserId, {
                subscriptionStatus: mapStripeStatusToUserStatus(
                  subscription.status
                ),
              });
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
    } catch (error: any) {
      return NextResponse.json(
        { error: "Webhook handler failed internally. Event logged." },
        { status: 200 }
      );
    }
  } else {
    console.log(
      `STRIPE_WEBHOOK_INFO: Received event ${event.type} (ID: ${event.id}) - Not in relevantEvents set. Skipping.`
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
