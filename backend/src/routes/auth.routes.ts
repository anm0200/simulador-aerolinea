import { Router } from "express";
import {
  register,
  login,
  verify,
  createResponsable,
  googleAuth,
  recoverPassword,
} from "../controllers/auth.controller.js";
import { authenticateJWT, authorizeRole } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/verify", verify);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/recover-password", recoverPassword);
router.post(
  "/create-responsable",
  authenticateJWT,
  authorizeRole(["RESPONSABLE"]),
  createResponsable,
);

export default router;
