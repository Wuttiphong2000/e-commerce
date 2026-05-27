import express from "express";
import { requireAuth } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import {
  addProduct,
  getMyProducts,
  updateMyProduct,
  deleteMyProduct,
  getProducts,
  getProductBySlug,
} from "../controllers/productController.js";
import { getReviews, createReview } from "../controllers/reviewController.js";

const productRouter = express.Router();

// public
productRouter.get("/", getProducts);

// /me before /:slug to avoid conflict
productRouter.get("/me", requireAuth, getMyProducts);
productRouter.post("/", requireAuth, upload.single("image"), addProduct);
productRouter.patch("/:id", requireAuth, updateMyProduct);
productRouter.delete("/:id", requireAuth, deleteMyProduct);

// public product detail
productRouter.get("/:slug", getProductBySlug);

// reviews
productRouter.get("/:id/reviews", getReviews);
productRouter.post("/:id/reviews", requireAuth, createReview);

export default productRouter;
