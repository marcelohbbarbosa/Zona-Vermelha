import { Router } from "express";
import { autenticar } from "../middlewares/auth";
import {
  listarComentarios,
  criarComentario,
  atualizarComentario,
  deletarComentario
} from "../controllers/comentarioController";

const router = Router();

router.get("/comentarios", listarComentarios);
router.post("/comentarios", autenticar, criarComentario);
router.put("/comentarios/:id", autenticar, atualizarComentario);
router.delete("/comentarios/:id", autenticar, deletarComentario);

export default router;