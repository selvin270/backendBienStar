import { Router } from "express";
import {
  getUsuario,
  crearUsuario,
  getPerfil,
  actualizarPerfil,
  logoutUsuario,
  recuperarContrasenia,
  restablecerContrasenia,
  googleLogin,
  facebookLogin,
} from "../controllers/usuarioController";

const router = Router();

router.post("/inicio-sesion", getUsuario);
router.post("/crear-usuario", crearUsuario);
router.get("/usuarios/:id_usuario", getPerfil);
router.put("/usuarios/:id_usuario", actualizarPerfil);
router.post("/cerrar-sesion", logoutUsuario); // Nueva ruta para cerrar sesión
router.post("/recuperar-contrasenia", recuperarContrasenia);
router.post("/restablecer-contrasenia", restablecerContrasenia);
router.post("/google-login", googleLogin);
router.post("/facebook-login", facebookLogin);

export default router;
