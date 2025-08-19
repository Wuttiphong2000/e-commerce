import express from "express";
import { requireAuth } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import {
  addProduct,
  getMyProducts,
  updateMyProduct,
  deleteMyProduct,
} from "../controllers/productController.js";

const productRouter = express.Router();

productRouter.post("/", requireAuth, upload.single("image"), addProduct);
productRouter.get("/me", requireAuth, getMyProducts);
productRouter.patch("/:id", requireAuth, updateMyProduct);
productRouter.delete("/:id", requireAuth, deleteMyProduct);

export default productRouter;
