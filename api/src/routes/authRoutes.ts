import { Router } from "express";
import { autenticar } from "../middlewares/auth";
import {
  login,
  paginaRedefinirSenha,
  perfil,
  redefinirSenha,
  reenviarConfirmacao,
  registrar,
  solicitarRedefinicao,
  verificarEmail,
} from "../controllers/authController";

const router = Router();

router.post("/auth/registrar", registrar);
router.post("/auth/login", login);
router.get("/auth/perfil", autenticar, perfil);
router.get("/auth/verificar-email", verificarEmail);
router.post("/auth/reenviar-confirmacao", reenviarConfirmacao);
router.post("/auth/solicitar-redefinicao", solicitarRedefinicao);
router.get("/auth/redefinir-senha", paginaRedefinirSenha);
router.post("/auth/redefinir-senha", redefinirSenha);

export default router;
