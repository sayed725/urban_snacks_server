
import { QueryBuilder } from "../../utils/QueryBuilder";
import { orderFilterableFields, orderSearchableFields } from "./order.constant";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { itemServices } from "../item/item.service";
import { orderStatusServices } from "./order.status.service";
import { IOrderPayload } from "./order.type";
import { OrderStatus, Prisma, UserRole } from "../../generated/client";
import { couponServices } from "../coupon/coupon.service";


const getOrders = async (queries: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.order, queries, {
    searchableFields: orderSearchableFields,
    filterableFields: orderFilterableFields,
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
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
              mainImage: true,
              image: true,
            },
          },
        },
      },
      user: {
        select: { id: true, name: true, email: true, image: true },
      },

    })
    .omit({
      userId: true,
    })
    .where({ isDeleted: false });

  const result = await queryBuilder.execute();
  return result;
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
              mainImage: true,
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
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
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
  queries: IQueryParams
) => {
  const queryBuilder = new QueryBuilder(prisma.order, queries, {
    searchableFields: orderSearchableFields,
    filterableFields: orderFilterableFields,
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
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
              mainImage: true,
              image: true,
            },
          },
        },
      },
    })
    .omit({
      userId: true,
    })
    .where({ userId, isDeleted: false });

  const result = await queryBuilder.execute();
  return result;
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
    paymentStatus,
    additionalInfo,
    extrainfo,
    couponCode,
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
    const subTotalAmount = items.reduce((sum, item) => sum + item.subTotal, 0);

    let finalTotalAmount = subTotalAmount;
    let appliedDiscountAmount = 0;
    let couponId = null;

    // 0. Handle Coupon
    if (couponCode) {
      const couponResult = await couponServices.verifyCoupon(couponCode, subTotalAmount);
      appliedDiscountAmount = couponResult.discountAmount;
      finalTotalAmount = subTotalAmount - appliedDiscountAmount;
      couponId = couponResult.coupon.id;

      // Increment coupon used count
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // 1. Create order
    const newOrder = await tx.order.create({
      data: {
        userId,
        orderNumber,
        totalAmount: finalTotalAmount,
        discountAmount: appliedDiscountAmount,
        couponId,
        shippingName,
        shippingPhone,
        shippingEmail,
        shippingAddress,
        shippingCity,
        shippingPostalCode,
        paymentMethod,
        paymentStatus: paymentStatus || "UNPAID",
        ...(additionalInfo && { additionalInfo }),
        ...(extrainfo && { extrainfo }),
      },
      select: { id: true },
    });

    // 2. Create order items
    await tx.orderItem.createMany({
      data: items.map((item) => ({ ...item, orderId: newOrder.id })),
    });

    // 4. Create initial UNPAID payment
    await tx.payment.create({
      data: {
        orderId: newOrder.id,
        amount: finalTotalAmount,
        status: paymentStatus || "UNPAID",
        ...(paymentStatus === "PAID" && { transactionId: `MANUAL-${orderNumber}-${Date.now()}` })
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

const cancelOrder = async (userId: string, role: UserRole, orderId: string, cancelReason?: string) => {
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

    if (role !== UserRole.ADMIN && order.userId !== userId) {
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
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED, cancelReason: cancelReason ?? null },
    });

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

    // 2. Soft delete related payment
    await tx.payment.updateMany({
      where: { orderId: orderId, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return { id: orderId, success: true };
  });

  return result;
};

const updatePaymentMethod = async (orderId: string, userId: string, paymentMethod: string) => {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found!`);
    }

    if (order.userId !== userId) {
      throw new Error("You are not authorized to update this order!");
    }

    if (order.paymentStatus === "PAID") {
      throw new Error("Order is already paid and cannot be updated.");
    }

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { paymentMethod },
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
  deleteOrder,
  updatePaymentMethod,
};
