import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { IPaymentPayload } from "./payment.type";
import { stripe } from "../../config/stripe.config";
import { env } from "../../config/env";

import { CURRENCY_CODE, USD_TO_BDT_RATE } from "../../constants/currency.constant";

const createCheckoutSession = async (orderId: string, userId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId, isDeleted: false },
    include: {
      orderItems: {
        include: {
          item: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found!");
  }

  if (order.userId !== userId) {
    throw new Error("You are not authorized to pay for this order!");
  }

  if (order.paymentStatus === "PAID") {
    throw new Error("Order is already paid!");
  }

  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      ...order.orderItems.map((orderItem: any) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: orderItem.item.name,
            images: orderItem.item.image ? [orderItem.item.image] : [],
          },
          unit_amount: Math.round((orderItem.unitPrice / USD_TO_BDT_RATE) * 100),
        },
        quantity: orderItem.quantity,
      })),
      ...(order.deliveryCharge && order.deliveryCharge > 0 ? [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "Delivery Charge",
          },
          unit_amount: Math.round((order.deliveryCharge / USD_TO_BDT_RATE) * 100),
        },
        quantity: 1,
      }] : []),
    ],
    success_url: `${env.APP_ORIGIN}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
    cancel_url: `${env.APP_ORIGIN}/payment/cancel?order_id=${orderId}`,
    client_reference_id: orderId,
    customer_email: order.shippingEmail,
    metadata: {
      orderId: order.id,
    },
  };

  // If there is a discount applied to the order, create an ephemeral Stripe coupon for it
  if (order.discountAmount && order.discountAmount > 0) {
    const stripeCoupon = await stripe.coupons.create({
      amount_off: Math.round((order.discountAmount / USD_TO_BDT_RATE) * 100),
      currency: "usd",
      duration: "once",
      name: "Order Discount",
    });
    sessionConfig.discounts = [{ coupon: stripeCoupon.id }];
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);

  return { url: session.url };
};

const handleStripeWebhookEvent = async (
  signature: string,
  rawBody: string | Buffer,
) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    throw new Error(`Webhook Error: ${err.message}`);
  }

  const existingPayment = await prisma.payment.findFirst({
    where: { stripeEventId: event.id },
  });

  if (existingPayment) {
    console.log(`Event ${event.id} already processed. Skipping`);
    return { message: `Event ${event.id} already processed. Skipping` };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.client_reference_id;

      if (!orderId) {
        console.error("No orderId found in session client_reference_id");
        break;
      }

      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
        });

        if (!order) {
          throw new Error(`Order ${orderId} not found`);
        }

        if (order.paymentStatus === "PAID") {
          return;
        }

        await tx.payment.upsert({
          where: { orderId: orderId },
          update: {
            transactionId: session.id,
            stripeEventId: event.id,
            amount: (session.amount_total || 0) / 100,
            status: "PAID",
            paymentGatewayData: session as any,
          },
          create: {
            orderId,
            transactionId: session.id,
            stripeEventId: event.id,
            amount: (session.amount_total || 0) / 100,
            status: "PAID",
            paymentGatewayData: session as any,
          },
        });

        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: "PAID", paymentMethod: "STRIPE" },
        });
      });
      break;
    }
    case "checkout.session.expired": {
      // Handle expired session if needed
      break;
    }
    case "payment_intent.payment_failed": {
      // Handle failed payment if needed
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return { message: "Webhook processed successfully" };
};





const createPayment = async (payload: IPaymentPayload) => {
  const {
    orderId,
    transactionId,
    stripeEventId,
    amount,
    invoiceUrl,
    paymentGatewayData,
  } = payload;

  const result = await prisma.$transaction(async (tx) => {
    // Verify order exists
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, paymentStatus: true },
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found!`);
    }

    if (order.paymentStatus === "PAID") {
      throw new Error("Order is already paid!");
    }

    // Upsert payment record
    const payment = await tx.payment.upsert({
      where: { orderId: orderId },
      update: {
        transactionId,
        ...(stripeEventId && { stripeEventId }),
        amount,
        status: "PAID",
        ...(invoiceUrl && { invoiceUrl }),
        ...(paymentGatewayData && { paymentGatewayData: paymentGatewayData as any }),
      },
      create: {
        orderId,
        transactionId,
        ...(stripeEventId && { stripeEventId }),
        amount,
        status: "PAID",
        ...(invoiceUrl && { invoiceUrl }),
        ...(paymentGatewayData && { paymentGatewayData: paymentGatewayData as any }),
      },
    });

    // Update order payment status
    await tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID", paymentMethod: "STRIPE" },
    });

    return payment;
  });

  return result;
};

const getPaymentByOrderId = async (orderId: string, userId: string, isAdmin: boolean) => {
  // Verify order ownership
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true },
  });

  if (!order) {
    throw new Error("Order not found!");
  }

  if (!isAdmin && order.userId !== userId) {
    throw new Error("You are not authorized to view this payment!");
  }

  const payment = await prisma.payment.findUnique({
    where: { orderId },
  });

  if (!payment) {
    throw new Error("Payment not found for this order!");
  }

  return payment;
};

const getAllPayments = async () => {
  const result = await prisma.payment.findMany({
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          shippingName: true,
          shippingEmail: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return result;
};

export const paymentServices = {
  createPayment,
  getPaymentByOrderId,
  getAllPayments,
  createCheckoutSession,
  handleStripeWebhookEvent,
};
