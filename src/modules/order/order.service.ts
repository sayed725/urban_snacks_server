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
    isDeleted: false,
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
    where: { id: orderId, isDeleted: false },
    select: { id: true, userId: true },
  });

  if (!orderCheck) {
    throw new Error(`Order with ID ${orderId} not found!`);
  }

  if (!isAdmin && orderCheck.userId !== userId) {
    throw new Error("You are not authorized to view this order!");
  }

  const result = await prisma.order.findUnique({
    where: { id: orderId, isDeleted: false },
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
    where: { userId, isDeleted: false },
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

  const total = await prisma.order.count({ where: { userId, isDeleted: false } });

  return { data: result, total };
};


export function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  return `ORD-${year}${month}${day}-${random}`;
}

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

  const orderNumber = generateOrderNumber();



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
        orderNumber,
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

    // 4. Create initial UNPAID payment
    await tx.payment.create({
      data: {
        orderId: newOrder.id,
        amount: totalAmount,
        status: "UNPAID",
      },
    });

    // 5. Get order data
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
    // 1. Fetch current order state
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, paymentMethod: true, totalAmount: true, orderNumber: true },
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found!`);
    }

    // 2. Prevent redundant updates
    if (order.status === updatedStatus) {
      throw new Error(`Order status is already ${updatedStatus}!`);
    }

    // 3. Safety Check: Don't allow changes to CANCELLED or DELIVERED orders
    if (order.status === "CANCELLED" || order.status === "DELIVERED") {
      throw new Error(`Cannot change status of a ${order.status.toLowerCase()} order.`);
    }

    // 4. Handle Logic for DELIVERED (Update Payment Status)
    if (updatedStatus === "DELIVERED") {
      await tx.order.update({
        where: { id: orderId },
        data: { 
          status: updatedStatus, 
          paymentStatus: "PAID" // Mark as PAID automatically on delivery
        },
       });
      
      // Update Payment record if it exists or create one if it doesn't (e.g. for COD)
      const existingPayment = await tx.payment.findUnique({
        where: { orderId: orderId },
      });

      if (existingPayment) {
        await tx.payment.update({
          where: { orderId: orderId },
          data: { 
            status: "PAID",
            ...(!existingPayment.transactionId && { transactionId: `MANUAL-${order.orderNumber}-${Date.now()}` })
          },
        });
      } else {
        // create a manual payment record
        await tx.payment.create({
          data: {
            orderId: orderId,
            amount: order.totalAmount,
            status: "PAID",
            transactionId: `MANUAL-${order.orderNumber}-${Date.now()}`,
          },
        });
      }
      
    } else {
      // Standard status update
      await tx.order.update({
        where: { id: orderId },
        data: { status: updatedStatus },
      });
    }

    // 5. Call your status tracking service (if you use one to log history)
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

const deleteOrder = async (orderId: string) => {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: { select: { itemId: true, quantity: true } },
      },
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found!`);
    }

    if (order.isDeleted) {
      throw new Error("Order is already deleted!");
    }

    // 1. Soft delete order
    await tx.order.update({
      where: { id: orderId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    // 2. Restore stock if the order was not already CANCELLED
    if (order.status !== OrderStatus.CANCELLED) {
      await Promise.all(
        order.orderItems.map((item) =>
          itemServices.updateItemStock(item.itemId, "INC", item.quantity, tx),
        ),
      );
    }

    return { id: orderId, success: true };
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
  deleteOrder,
};
