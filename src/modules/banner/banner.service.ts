import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { IQueryParams } from "../../interfaces/query.interface";
import { bannerFilterableFields, bannerSearchableFields } from "./banner.constant";

const createBanner = async (payload: any) => {
  const result = await prisma.banner.create({
    data: payload,
  });
  return result;
};

const getBanners = async (queries: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.banner, queries, {
    searchableFields: bannerSearchableFields,
    filterableFields: bannerFilterableFields,
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .where({ isDeleted: false });

  const result = await queryBuilder.execute();
  return result;
};

const getBannerById = async (id: string) => {
  // @ts-ignore
  const result = await prisma.banner.findUnique({
    where: { id, isDeleted: false },
  });
  if (!result) {
    throw new Error("Banner not found!");
  }
  return result;
};

const updateBanner = async (id: string, payload: any) => {
  await getBannerById(id);
  // @ts-ignore
  const result = await prisma.banner.update({
    where: { id },
    data: payload,
  });
  return result;
};

const deleteBanner = async (id: string) => {
  await getBannerById(id);
  // @ts-ignore
  const result = await prisma.banner.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  return result;
};

export const bannerServices = {
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
};
