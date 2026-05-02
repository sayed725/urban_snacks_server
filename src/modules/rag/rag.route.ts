import { Router } from "express";
import { RagController } from "./rag.controller";

const router = Router();

router.get("/stats", RagController.getStats);

//index item data
router.post("/ingest-items", RagController.ingestItems)

//index category data
router.post("/ingest-categories", RagController.ingestCategories)


// query rag
router.post("/query", RagController.queryRag);

export const ragRouter = router;