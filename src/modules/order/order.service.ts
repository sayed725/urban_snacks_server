import { OrderStatus, Prisma } from "../../../generated/prisma/client";
import { OrderWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { itemServices } from "../item/item.service";
import { orderStatusServices } from "./order.status.service";
import {
  IGetAllOrdersQueries,
  IGetUserOrdersQueries,
  IOrderPayload,
} from "./order.type";

const getOrders = async (payload: IGetAllOrdersQueries) => {
  const { skip, take, orderBy, status } = payload;

  const whereFilters: OrderWhereInput = {
    ...(status && {
      OR: [{ status: { in: status } }],
    }),
  };

  const result = await prisma.order.findMany({
    where: whereFilters,
    include: {
      orderItems: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          subTotal: true,
          item: {
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
            },
          },
        },
      },
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    omit: {
      userId: true,
    },
    skip,
    take,
    ...(orderBy && { orderBy }),
  });

  const total = await prisma.order.count({ where: whereFilters });

  return { data: result, total };
};

const getOrderById = async (orderId: string, userId: string, isAdmin: boolean) => {
  // Authorization check
  const orderCheck = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true },
  });

  if (!orderCheck) {
    throw new Error(`Order with ID ${orderId} not found!`);
  }

  if (!isAdmin && orderCheck.userId !== userId) {
    throw new Error("You are not authorized to view this order!");
  }

  const result = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          subTotal: true,
          item: {
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
      },
      payment: {
        select: {
          id: true,
          amount: true,
          transactionId: true,
          status: true,
          invoiceUrl: true,
          createdAt: true,
        },
      },
      ...(isAdmin && {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      }),
    },
    omit: {
      userId: true,
    },
  });

  return result;
};

const getUserOrders = async (
  userId: string,
  queries: IGetUserOrdersQueries,
) => {
  const { skip, take, orderBy } = queries;

  const result = await prisma.order.findMany({
    where: { userId },
    include: {
      orderItems: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          subTotal: true,
          item: {
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
            },
          },
        },
      },
    },
    omit: {
      userId: true,
    },
    skip,
    take,
    ...(orderBy && { orderBy }),
  });

  const total = await prisma.order.count({ where: { userId } });

  return { data: result, total };
};

const createOrder = async (userId: string, payload: IOrderPayload) => {
  const {
    shippingName,
    shippingPhone,
    shippingEmail,
    shippingAddress,
    shippingCity,
    shippingPostalCode,
    paymentMethod,
    additionalInfo,
    orderItems,
  } = payload;

  const getItems = async (tx: Prisma.TransactionClient) => {
    return Promise.all(
      orderItems.map(async (orderItem) => {
        const result = await tx.item.findUnique({
          where: { id: orderItem.itemId },
          select: {
            id: true,
            price: true,
            stockQuantity: true,
            isActive: true,
            isDeleted: true,
          },
        });

        if (!result) {
          throw new Error(`Item with ID ${orderItem.itemId} not found`);
        }

        if (!result.isActive || result.isDeleted) {
          throw new Error(`Item with ID ${orderItem.itemId} is not available`);
        }

        if (isNaN(orderItem.quantity)) {
          throw new Error(`Invalid quantity for item ID ${orderItem.itemId}`);
        }

        if (
          result.stockQuantity !== null &&
          orderItem.quantity > result.stockQuantity
        ) {
          throw new Error(`Insufficient stock for item ID ${orderItem.itemId}`);
        }

        const totalPrice = result.price * orderItem.quantity;

        return {
          itemId: result.id,
          quantity: orderItem.quantity,
          unitPrice: result.price,
          subTotal: totalPrice,
        };
      }),
    );
  };

  const result = await prisma.$transaction(async (tx) => {
    const items = await getItems(tx);

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.subTotal, 0);

    // 1. Create order
    const newOrder = await tx.order.create({
      data: {
        userId,
        totalAmount,
        shippingName,
        shippingPhone,
        shippingEmail,
        shippingAddress,
        shippingCity,
        shippingPostalCode,
        paymentMethod,
        ...(additionalInfo && { additionalInfo }),
      },
      select: { id: true },
    });

    // 2. Create order items
    await tx.orderItem.createMany({
      data: items.map((item) => ({ ...item, orderId: newOrder.id })),
    });

    // 3. Decrease item stock
    await Promise.all(
      items.map((item) =>
        itemServices.updateItemStock(item.itemId, "DEC", item.quantity, tx),
      ),
    );

    // 4. Get order data
    const orderData = await tx.order.findUnique({
      where: { id: newOrder.id },
      include: {
        orderItems: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            subTotal: true,
            itemId: true,
          },
        },
      },
    });

    return orderData;
  });

  return result;
};

const changeOrderStatus = async (
  orderId: string,
  updatedStatus: OrderStatus,
) => {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found!`);
    }

    if (order.status === updatedStatus) {
      throw new Error(`Order status is already ${updatedStatus}!`);
    }

    return await orderStatusServices.updateOrderStatus(orderId, updatedStatus, tx);
  });

  return result;
};

const cancelOrder = async (userId: string, orderId: string) => {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          select: { id: true, itemId: true, quantity: true },
        },
      },
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found!`);
    }

    if (order.userId !== userId) {
      throw new Error("You are not authorized to cancel this order!");
    }

    if (
      order.status === OrderStatus.PROCESSING ||
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.DELIVERED
    ) {
      throw new Error(
        `Order cannot be cancelled because it is already ${order.status}!`,
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new Error("Order is already CANCELLED!");
    }

    // 1. Cancel order
    await orderStatusServices.updateOrderStatus(orderId, OrderStatus.CANCELLED, tx);

    // 2. Restore item stock
    await Promise.all(
      order.orderItems.map((item) =>
        itemServices.updateItemStock(item.itemId, "INC", item.quantity, tx),
      ),
    );

    // 3. Get updated order
    const updatedOrder = await tx.order.findUnique({
      where: { id: orderId },
      omit: { userId: true },
    });

    return updatedOrder;
  });

  return result;
};

export const orderServices = {
  getOrders,
  getOrderById,
  getUserOrders,
  createOrder,
  changeOrderStatus,
  cancelOrder,
};
