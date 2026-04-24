import { prisma } from "../../lib/prisma";

const getAdminStats = async () => {
  const [
    totalItems,
    totalOrders,
    totalPayments,
    totalReviews,
    totalUsers,
    totalCategories,
    totalCoupons,
    totalBanners,
    orderStatusCounts,
    paymentMethodCounts,
    totalRevenueResult,
    mostOrderedItemsRaw,
    recentOrders
  ] = await Promise.all([
    prisma.item.count({ where: { isDeleted: false } }),
    prisma.order.count({ where: { isDeleted: false } }),
    prisma.payment.count({ where: { isDeleted: false } }),
    prisma.review.count({ where: { isDeleted: false } }),
    prisma.user.count({ where: { isDeleted: false } }),
    prisma.category.count({ where: { isDeleted: false } }),
    prisma.coupon.count({ where: { isDeleted: false } }),
    prisma.banner.count({ where: { isDeleted: false } }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
      where: { isDeleted: false }
    }),
    prisma.order.groupBy({
      by: ['paymentMethod'],
      _count: { id: true },
      where: { isDeleted: false }
    }),
    prisma.payment.aggregate({
      where: { status: 'PAID', isDeleted: false },
      _sum: { amount: true }
    }),
    prisma.orderItem.groupBy({
      by: ['itemId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    }),
    prisma.order.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        user: { select: { name: true, email: true, image: true } }
      }
    })
  ]);

  // Fetch names for most ordered items
  const mostOrderedItems = await Promise.all(
    mostOrderedItemsRaw.map(async (item:any) => {
      const itemData = await prisma.item.findUnique({
        where: { id: item.itemId },
        select: { name: true }
      });
      return {
        name: itemData?.name || 'Unknown',
        count: item._sum.quantity || 0
      };
    })
  );

  // Revenue for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  
  const recentPayments = await prisma.payment.findMany({
    where: { 
      status: 'PAID',
      createdAt: { gte: thirtyDaysAgo },
      isDeleted: false
    },
    select: { amount: true, createdAt: true }
  });

  const revenueData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dailyRevenue = recentPayments
      .filter((p: any) => p.createdAt.toISOString().split('T')[0] === dateStr)
      .reduce((sum: number, p: any) => sum + p.amount, 0);
    return { date: dateStr, revenue: dailyRevenue };
  }).reverse();

  // Format order status counts
  const statusSummary = {
    PLACED: 0,
    CANCELLED: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0
  };
  orderStatusCounts.forEach((count: any) => {
    if (count.status in statusSummary) {
        statusSummary[count.status as keyof typeof statusSummary] = count._count.id;
    }
  });

  // Format payment method counts
  const paymentMethodSummary: Record<string, number> = {};
  paymentMethodCounts.forEach((count: any) => {
     paymentMethodSummary[count.paymentMethod] = count._count.id;
  });

  return {
    summary: {
      totalItems,
      totalOrders,
      totalPayments,
      totalRevenue: totalRevenueResult._sum.amount || 0,
      totalReviews,
      totalUsers,
      totalCategories,
      totalCoupons,
      totalBanners
    },
    orderStats: {
      byStatus: statusSummary,
      byPaymentMethod: paymentMethodSummary
    },
    mostOrderedItems,
    revenueData,
    recentOrders
  };
};

export const statsServices = {
  getAdminStats,
};
