import { Router } from "express";
import { registrar, login } from "../controllers/authController";

const router = Router();

router.post("/auth/registrar", registrar);
router.post("/auth/login", login);

export default router;