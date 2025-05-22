import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  if (req.method !== "POST") {
    return NextResponse.json({ messsage: "Not Allowed" }, { status: 405 });
  }
  const body = await req.text();

  const signature = (await headers()).get("Stripe-Signature") as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_SECRET_WEBHOOK as string
    );
  } catch (error: unknown) {
    return new Response("Webhook Error", { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (!session.metadata?.orderId) {
      return new Response(null, { status: 503 });
    }
    await connectToDatabase();
    const order = await Order.findById(session.metadata?.orderId);
    order.isPaid = true;
    order.paidAt = Date.now();
    await order.save();
  } else {
    console.log("unhandled event");
  }
  return new Response(null, { status: 200 });
}
