import { Router } from "express";
import {
  register,
  login,
  verify,
  createResponsable,
} from "../controllers/auth.controller.js";
import { authenticateJWT, authorizeRole } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify", verify);
router.post(
  "/create-responsable",
  authenticateJWT,
  authorizeRole(["RESPONSABLE"]),
  createResponsable,
);

export default router;
