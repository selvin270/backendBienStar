import { Router } from "express";
import {
  getObjetivosByMeta,
  getMetas,
  getMetaById,
  getObjetivoById,
  getMetaObjetivoByIdMetaIdObjetivo,
} from "../controllers/metaObjetivoController";

const router = Router();

router.get("/metas/:id_categoria/:idioma", getMetas);
router.get("/objetivos/:id_meta/:idioma", getObjetivosByMeta);
router.get("/meta/:id_actividad", getMetaById);
router.get("/objetivo/:id_actividad", getObjetivoById);
router.get(
  "/metaobjetivo/:id_meta/:id_objetivo",
  getMetaObjetivoByIdMetaIdObjetivo
);

export default router;
