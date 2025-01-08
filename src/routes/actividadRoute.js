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

router.get("/:id_usuario/:id_categoria/:id_idioma", getActividades);
router.get("/:id_actividad", getActividad);
router.post("/", saveActividad);
router.delete("/:id_actividad", deleteActividad);
router.put("/:id_actividad", updateActividad);
router.get("/semana", getDiasSemana);

export default router;
