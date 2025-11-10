import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { authService } from "./auth.service.js";

const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const data = await authService.googleLogin(idToken);
  res.status(200).json(new ApiResponse(200, data, "User logged in successfully"));
});

export const authController = {
  googleLogin,
};
