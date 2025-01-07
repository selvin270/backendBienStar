import { connect } from "../database";

// Guardar horario
export const setHorario = async (req, res) => {
  try {
    const connection = await connect();
    const [results] = await connection.query(
      "INSERT INTO horario (id_actividad, hora_inicio, hora_fin) VALUES (?, ?, ?)",
      [req.body.id_actividad, req.body.hora_inicio, req.body.hora_fin]
    );
    res.json({
      tipo: "success",
      msj: "Horario añadido exitosamente",
      id_horario: results.insertId,
      ...req.body,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      tipo: "error",
      msj: "Error al guardar el horario",
    });
  }
};

// Actualizar horario
export const updateHorario = async (req, res) => {
  try {
    const connection = await connect();
    const [results] = await connection.query(
      "UPDATE horario SET ? WHERE id_horario = ?",
      [req.body, req.params.id_horario]
    );

    if (results.affectedRows === 0) {
      return res.status(404).json({
        tipo: "error",
        msj: `No se encontró el horario con id_horario=${req.params.id_horario}.`,
      });
    }

    res.json({
      tipo: "success",
      msj: "Horario actualizado exitosamente",
      id_horario: req.params.id_horario,
      ...req.body,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      tipo: "error",
      msj: "Error al actualizar horario",
    });
  }
};

//borrar un horario
export const deleteHorario = async (req, res) => {
  try {
    const connection = await connect();
    const [result] = await connection.query(
      "DELETE FROM horario WHERE id_horario = ?",
      [req.params.id_horario]
    );

    // Verifica si se eliminó alguna fila
    if (result.affectedRows === 0) {
      return res.status(404).json({
        tipo: "error",
        msj: "Horario no encontrado o ya eliminado.",
      });
    }

    res.json({
      tipo: "success",
      msj: "Horario eliminado exitosamente.",
      id_horario: req.params.id_horario,
    });
  } catch (error) {
    console.error("Error al borrar horario:", error);
    res.status(500).json({
      tipo: "error",
      msj: "Error al borrar horario.",
    });
  }
};
