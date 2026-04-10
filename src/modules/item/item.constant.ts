import { Prisma } from "../../../generated/prisma/client";



export const itemSearchableFields = ['name', 'description', 'category.name'];

export const itemFilterableFields = ['isDeleted', 'isFeatured', 'isSpicy', 'weight', 'isActive', 'price', 'category.id', 'category.name'];

export const itemIncludeConfig : Partial<Record<keyof Prisma.ItemInclude, Prisma.ItemInclude[keyof Prisma.ItemInclude]>> ={
    category: true,
    reviews: true,
}