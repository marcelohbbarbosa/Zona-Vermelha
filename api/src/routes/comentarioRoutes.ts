import { Router } from "express";
import {
  listarComentarios,
  criarComentario,
  atualizarComentario,
  deletarComentario
} from "../controllers/comentarioController";

const router = Router();

router.get("/comentarios", listarComentarios);
router.post("/comentarios", criarComentario);
router.put("/comentarios/:id", atualizarComentario);
router.delete("/comentarios/:id", deletarComentario);

export default router;
