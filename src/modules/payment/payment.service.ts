import { prisma } from "../../lib/prisma";
import { IPaymentPayload } from "./payment.type";

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

    // Create payment record
    const payment = await tx.payment.create({
      data: {
        orderId,
        transactionId,
        ...(stripeEventId && { stripeEventId }),
        amount,
        status: "PAID",
        ...(invoiceUrl && { invoiceUrl }),
        ...(paymentGatewayData && { paymentGatewayData }),
      },
    });

    // Update order payment status
    await tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID" },
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
};
