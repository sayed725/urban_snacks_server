import { Prisma } from "../../generated/client";




export const itemSearchableFields = ['name', 'semiTitle', 'description', 'category.name'];

export const itemFilterableFields = ['isDeleted', 'isFeatured', 'isSpicy', 'weight', 'isActive', 'price', 'category.id', 'category.name'];

export const itemIncludeConfig : Prisma.ItemInclude ={
    category: true,
}