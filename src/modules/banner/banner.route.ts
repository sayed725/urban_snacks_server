import { Router } from "express";
import requireAuth from "../../middlewares/auth";
import { UserRole } from "../../generated/client";
import { bannerControllers } from "./banner.controller";
// import { validateRequest } from "../../middlewares/validate-request"; 
// import { bannerValidations } from "./banner.validation";

const router = Router();

// Public route to fetch active banners for frontend
router.get("/", bannerControllers.getBanners);

// Admin routes
router.post(
  "/",
  requireAuth(UserRole.ADMIN),
  bannerControllers.createBanner
);

router.get(
  "/:id",
  requireAuth(UserRole.ADMIN),
  bannerControllers.getBannerById
);

router.patch(
  "/:id",
  requireAuth(UserRole.ADMIN),
  bannerControllers.updateBanner
);

router.delete(
  "/:id",
  requireAuth(UserRole.ADMIN),
  bannerControllers.deleteBanner
);

export const bannerRouter = router;
