
import { OrderStatus } from "../../generated/enums";
import { Prisma } from "../../generated/client";
import { prisma } from "../../lib/prisma";

const updateOrderStatus = async (
  orderId: string,
  updatedStatus: OrderStatus,
  tx?: Prisma.TransactionClient,
) => {


  const result = await (tx ?? prisma).order.update({
    where: { id: orderId },
    data: { status: updatedStatus },
    select: { id: true, status: true },
  });

  return result;
};

export const orderStatusServices = {
  updateOrderStatus,
};
