import express from "express";
import { UserRole } from "../../generated/enums";
import { requireAuth } from "../../middlewares";
import { itemControllers } from "./item.controller";

const router = express.Router();

router.get("/", itemControllers.getItems);
router.get("/:id", itemControllers.getItemById);

router.post("/", requireAuth(UserRole.ADMIN), itemControllers.createItem);
router.patch("/:id", requireAuth(UserRole.ADMIN), itemControllers.updateItem);
router.delete("/:id", requireAuth(UserRole.ADMIN), itemControllers.deleteItem);

export const itemRouter = router;
