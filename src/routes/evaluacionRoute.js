import { Router } from "express";
import {
  getEvaluaciones,
  guardarEvaluacion,
  getHistorialEvaluaciones,
  tieneEvaluacionesPendientes,
} from "../controllers/evaluacionController.js";

const router = Router();

router.get("/evaluaciones/:id_usuario", getEvaluaciones);
router.post("/evaluacion", guardarEvaluacion);

router.get(
  "/evaluaciones-historial/:id_usuario/:id_idioma",
  getHistorialEvaluaciones
);

router.get("/evaluaciones/pendientes/:id_usuario", tieneEvaluacionesPendientes);

export default router;
