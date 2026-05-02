import { Request, Response } from "express";

import { RAGService } from "./rag.service";
import { asyncHandler } from "../../middlewares";


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





  // Cache miss - process normally
  const result = await ragService.generateAnswer(
    query,
    limit ?? 5,
    sourceType,
    true,
  );

  


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