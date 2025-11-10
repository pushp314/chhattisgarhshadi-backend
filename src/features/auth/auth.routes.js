import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { authValidation } from "./auth.validation.js";
import { authController } from "./auth.controller.js";

const router = Router();

router.post("/google", validate(authValidation.googleLoginSchema), authController.googleLogin);

export default router;
