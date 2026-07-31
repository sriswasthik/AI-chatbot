import express from "express";

import {
  register,
  login,
  getCurrentUser,
} from "../controllers/auth.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public Routes
router.post("/register", register);
router.post("/login", login);

// Protected Route
router.get("/me", authenticate, getCurrentUser);

export default router;