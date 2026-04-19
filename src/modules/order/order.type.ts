import { OrderStatus } from "../../generated/enums";

export interface IOrderItemPayload {
  itemId: string;
  quantity: number;
}

export interface IOrderPayload {
  shippingName: string;
  shippingPhone: string;
  shippingEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  paymentMethod: string; // "STRIPE" | "COD" | "MANUAL"
  paymentStatus?: "PAID" | "UNPAID";
  additionalInfo?: string;
  extrainfo?: string;
  couponCode?: string;

  orderItems: IOrderItemPayload[];
}

export interface IGetAllOrdersQueries {
  skip: number;
  take: number;
  orderBy: { [key: string]: "asc" | "desc" } | undefined;
  status: OrderStatus[] | undefined;
}

export interface IGetUserOrdersQueries {
  skip: number;
  take: number;
  orderBy: { [key: string]: "asc" | "desc" } | undefined;
}
