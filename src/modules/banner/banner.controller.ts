import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { bannerServices } from "./banner.service";
import { IQueryParams } from "../../interfaces/query.interface";

const createBanner = asyncHandler(async (req: Request, res: Response) => {
  const result = await bannerServices.createBanner(req.body);
  res.status(201).json({
    success: true,
    message: "Banner created successfully",
    data: result,
  });
});

const getBanners = asyncHandler(async (req: Request, res: Response) => {
  const result = await bannerServices.getBanners(req.query as IQueryParams);
  res.status(200).json({
    success: true,
    message: "Banners retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getBannerById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await bannerServices.getBannerById(id as string);
  res.status(200).json({
    success: true,
    message: "Banner retrieved successfully",
    data: result,
  });
});

const updateBanner = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await bannerServices.updateBanner(id as string, req.body);
  res.status(200).json({
    success: true,
    message: "Banner updated successfully",
    data: result,
  });
});

const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await bannerServices.deleteBanner(id as string);
  res.status(200).json({
    success: true,
    message: "Banner deleted successfully",
    data: result,
  });
});

export const bannerControllers = {
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
};
