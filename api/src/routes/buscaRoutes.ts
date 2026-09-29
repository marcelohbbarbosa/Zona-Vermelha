import { Router } from "express";
import { buscarLocais } from "../controllers/buscaController";

const router = Router();
router.get("/locais/buscar", buscarLocais);

export default router;
