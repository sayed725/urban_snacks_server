export interface IPaymentPayload {
  orderId: string;
  transactionId: string;
  stripeEventId?: string;
  amount: number;
  status?: "PAID" | "UNPAID";
  invoiceUrl?: string;
  paymentGatewayData?: Record<string, unknown>;
}
