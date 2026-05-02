
import { Prisma } from "../../generated/client";
import { prisma } from "../../lib/prisma";
import { EmbeddingService } from "./embedding.service";

const toVectorLiteral = (vector: number[]) => `[${vector.join(",")}]`;

export class IndexingService {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  async indexDocument(
    chunkKey: string,
    sourceType: string,
    sourceId: string,
    content: string,
    sourceLabel?: string,
    metadata?: Record<string, unknown>,
  ) {
    try {
      const embedding = await this.embeddingService.generateEmbedding(content);
      const vectorLiteral = toVectorLiteral(embedding);

      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO "document_embeddings"
        (
          "id",
          "chunkKey",
          "sourceType",
          "sourceId",
          "sourceLabel",
          "content",
          "metadata",
          "embedding",
          "updatedAt"
        )
        VALUES
        (
          ${Prisma.raw("gen_random_uuid()")},
          ${chunkKey},
          ${sourceType},
          ${sourceId},
          ${sourceLabel || null},
          ${content},
          ${JSON.stringify(metadata || {})} :: jsonb,
          CAST(${vectorLiteral} AS vector),
          NOW()
        )
        ON CONFLICT ("chunkKey")
        DO UPDATE SET
          "sourceType" = EXCLUDED."sourceType",
          "sourceId" = EXCLUDED."sourceId",
          "sourceLabel" = EXCLUDED."sourceLabel",
          "content" = EXCLUDED."content",
          "metadata" = EXCLUDED."metadata",
          "embedding" = EXCLUDED."embedding",
          "isDeleted" = false,
          "deletedAt" = null,
          "updatedAt" = NOW()
        `);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async indexItemsData() {
    try {
      console.log("Fetching item data for indexing....");
      const items = await prisma.item.findMany({
        where: { isDeleted: false, isActive: true },
        include: {
          category: true,
        },
      });

      let indexedCount = 0;

      for (const item of items) {
        const content = `Item Name: ${item.name}
            Category: ${item.category.name}
            Price: $${item.price}
            Weight: ${item.weight}
            Pack Size: ${item.packSize || "N/A"}
            Spicy: ${item.isSpicy ? "Yes" : "No"}
            Description: ${item.description || "No description available."}
            Category Description: ${item.category.description || "N/A"}`;

        const metadata = {
          itemId: item.id,
          name: item.name,
          category: item.category.name,
          price: item.price,
          weight: item.weight,
        };

        const chunkKey = `item-${item.id}`;

        await this.indexDocument(
          chunkKey,
          "ITEM",
          item.id,
          content,
          item.name,
          metadata,
        );

        indexedCount++;
      }

      console.log(`Successfully Indexed ${indexedCount} items.`);

      return {
        success: true,
        message: `Successfully Indexed ${indexedCount} items.`,
        indexedCount,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async indexCategoriesData() {
    try {
      console.log("Fetching category data for indexing....");
      const categories = await prisma.category.findMany({
        where: { isDeleted: false, isActive: true },
        include: {
          items: true,
        },
      });

      let indexedCount = 0;

      for (const category of categories) {
        const itemNames = category.items.map((i) => i.name).join(", ");
        const content = `Category Name: ${category.name}
            Description: ${category.description || "No description available."}
            Featured: ${category.isFeatured ? "Yes" : "No"}
            Sub Name: ${category.subName || "N/A"}
            Available Items: ${itemNames || "None"}`;

        const metadata = {
          categoryId: category.id,
          name: category.name,
        };

        const chunkKey = `category-${category.id}`;

        await this.indexDocument(
          chunkKey,
          "CATEGORY",
          category.id,
          content,
          category.name,
          metadata,
        );

        indexedCount++;
      }

      console.log(`Successfully Indexed ${indexedCount} categories.`);

      return {
        success: true,
        message: `Successfully Indexed ${indexedCount} categories.`,
        indexedCount,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

}