import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import authRoutes from "../features/auth/auth.routes.js";

const router = Router();

// TODO: Import and use feature routes
router.use("/auth", authRoutes);

router.get("/", asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, null, "API is working"));
}));

export default router;
