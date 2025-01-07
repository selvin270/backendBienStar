import { Router } from "express";
import {
  getActividades,
  getActividad,
  saveActividad,
  deleteActividad,
  updateActividad,
  getDiasSemana,
} from "../controllers/actividadController";

const router = Router();

router.get("/actividad/:id_usuario/:id_categoria/:id_idioma", getActividades);
router.get("/actividad/:id_actividad", getActividad);
router.post("/actividad", saveActividad);
router.delete("/actividad/:id_actividad", deleteActividad);
router.put("/actividad/:id_actividad", updateActividad);
router.get("/semana", getDiasSemana);

export default router;
