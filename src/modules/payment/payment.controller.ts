import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { paymentServices } from "./payment.service";
import { env } from "../../config/env";

const createPayment = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentServices.createPayment(req.body);

  res.status(201).json({
    success: true,
    message: "Payment recorded successfully",
    data: result,
  });
});

const getPaymentByOrderId = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const userId = req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    const result = await paymentServices.getPaymentByOrderId(
      orderId as string,
      userId,
      isAdmin,
    );

    res.status(200).json({
      success: true,
      message: "Payment retrieved successfully",
      data: result,
    });
  },
);

const getAllPayments = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentServices.getAllPayments();

  res.status(200).json({
    success: true,
    message: "Payments retrieved successfully",
    data: result,
  });
});

const createCheckoutSession = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const userId = req.user!.id;

  const result = await paymentServices.createCheckoutSession(
    orderId as string,
    userId,
  );

  res.status(200).json({
    success: true,
    message: "Checkout session created successfully",
    data: result,
  });
});

const webhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;

  const result = await paymentServices.handleStripeWebhookEvent(
    signature,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Webhook processed successfully",
    data: result,
  });
});


const initiateSslCheckout = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const userId = req.user!.id;

  const result = await paymentServices.createSslCheckoutSession(orderId as string, userId);

  res.status(200).json({
    success: true,
    message: "SSL Checkout session created",
    data: result,
  });
});

const sslSuccess = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.query;
  const { val_id } = req.body;

  const result = await paymentServices.verifySslPayment(val_id, orderId as string);

  if (result.success) {
    res.redirect(`${env.APP_ORIGIN}/payment/success?orderId=${orderId}`);
  } else {
    res.redirect(`${env.APP_ORIGIN}/payment/fail?orderId=${orderId}`);
  }
});

const sslFail = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.query;
  res.redirect(`${env.APP_ORIGIN}/payment/fail?orderId=${orderId}`);
});

const sslCancel = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.query;
  res.redirect(`${env.APP_ORIGIN}/payment/cancel?orderId=${orderId}`);
});

export const paymentControllers = {
  createPayment,
  getPaymentByOrderId,
  getAllPayments,
  createCheckoutSession,
  webhook,
  initiateSslCheckout,
  sslSuccess,
  sslFail,
  sslCancel,
};
