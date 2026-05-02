import { Request, Response } from "express";

import { RAGService } from "./rag.service";
import { asyncHandler } from "../../middlewares";
import { redisService } from "../../lib/redis";


const ragService = new RAGService();

const getStats = asyncHandler(async (req: Request, res: Response) => {
  const result = await ragService.getStats();

  res.status(200).json({
    success: true,
    message: "RAG stats retrieved successfully",
    data: result,
  });
});

const ingestItems = asyncHandler(async (req: Request, res: Response) => {
  const result = await ragService.ingestItemsData();

  res.status(200).json({
    success: true,
    message: "Items data ingestion completed",
    data: result,
  });
});

const ingestCategories = asyncHandler(async (req: Request, res: Response) => {
  const result = await ragService.ingestCategoriesData();

  res.status(200).json({
    success: true,
    message: "Categories data ingestion completed",
    data: result,
  });
});


const queryRag = asyncHandler(async (req: Request, res: Response) => {
  const { query, limit, sourceType } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Query is required",
    });
  }

  // Generate cache key from query parameters
  const cacheKey = `rag:query:${query}:${limit ?? 5}:${sourceType || 'all'}`;

  try {
    // Try to get from cache first
    const cachedResult = await redisService.get(cacheKey);

    if (cachedResult) {
      // Cache hit - parse and return cached data
      const parsedData = JSON.parse(cachedResult);

      res.status(200).json({
        success: true,
        message: "Answer retrieved from cache",
        data: parsedData,
      });
      return;
    }
  } catch (cacheError) {
    // Log cache error but continue with normal processing
    console.warn('Cache read error, proceeding with normal processing:', cacheError);
  }





  // Cache miss - process normally
  const result = await ragService.generateAnswer(
    query,
    limit ?? 5,
    sourceType,
    true,
  );

  // Store result in cache with 30-minute TTL (1800 seconds)
  try {
    await redisService.set(cacheKey, result, 1800);
  } catch (cacheError) {
    // Log cache error but don't fail the request
    console.warn('Cache write error:', cacheError);
  }




  res.status(200).json({
    success: true,
    message: "Answer generated successfully",
    data: result,
  });
});

export const RagController = {
  getStats,
  ingestItems,
  ingestCategories,
  queryRag,
};