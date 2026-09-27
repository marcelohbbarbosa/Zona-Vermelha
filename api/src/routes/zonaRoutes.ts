import { Router } from "express";
import { autenticar } from "../middlewares/auth";
import { criarZona, listarZonas, atualizarStatusZona } from "../controllers/zonaController";

const router = Router();

router.get("/zonas", autenticar, listarZonas);
router.post("/zonas", autenticar, criarZona);
router.put("/zonas/:id/status", autenticar, atualizarStatusZona);

export default router;