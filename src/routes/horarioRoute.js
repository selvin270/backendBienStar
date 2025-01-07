import { Router } from "express";
import {
  setHorario,
  updateHorario,
  deleteHorario,
} from "../controllers/horarioController";

const router = Router();

router.post("/horario", setHorario);
router.put("/horario/:id_horario", updateHorario);
router.delete("/horario/:id_horario", deleteHorario);

export default router;
