import express from "express";
import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { addToCartSchema, updateCartSchema } from "../utils/validation.js";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";

const router = express.Router();

// All cart routes are protected
router.get("/", auth, getCart);
router.post("/add", auth, validate(addToCartSchema), addToCart);
router.put("/update", auth, validate(updateCartSchema), updateCartItem);
router.delete("/remove/:itemId", auth, removeFromCart);
router.delete("/clear", auth, clearCart);

export default router;
