import { Router } from "express";
import { userRouter } from "../modules/user/user.route";
import { reviewRouter } from "../modules/review/review.route";
import { categoryRouter } from "../modules/category/category.route";
import { itemRouter } from "../modules/item/item.route";
import { orderRouter } from "../modules/order/order.route";
import { paymentRouter } from "../modules/payment/payment.route";
import { statsRouter } from "../modules/stats/stats.route";
import { bannerRouter } from "../modules/banner/banner.route";
import { couponRouter } from "../modules/coupon/coupon.route";



const router = Router();



router.use("/users", userRouter);
router.use("/reviews", reviewRouter);

router.use("/categories", categoryRouter);
router.use("/items", itemRouter);
router.use("/orders", orderRouter);
router.use("/payments", paymentRouter);
router.use("/stats", statsRouter);
router.use("/banners", bannerRouter);
router.use("/coupons", couponRouter);



export const IndexRoutes = router;