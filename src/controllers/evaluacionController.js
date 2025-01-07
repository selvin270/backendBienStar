import axios from "axios";
import { connect } from "../database.js";

const GOOGLE_TRANSLATE_API_URL =
  "https://translate.googleapis.com/translate_a/single";

// Función para traducir texto usando la API de Google Translate gratuita
const traducirTexto = async (texto, idiomaDestino) => {
  try {
    const response = await axios.get(GOOGLE_TRANSLATE_API_URL, {
      params: {
        client: "gtx",
        sl: "auto", // Detecta automáticamente el idioma original
        tl: idiomaDestino, // Idioma de destino
        dt: "t", // Tipo de traducción
        q: texto, // Texto a traducir
      },
    });
    return response.data[0][0][0]; // Retorna el texto traducido
  } catch (error) {
    console.error("Error al traducir texto:", error);
    return texto; // Retorna el texto original en caso de error
  }
};

export const getEvaluaciones = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { idioma } = req.query; // Idioma destino recibido desde el frontend

    const connection = await connect();
    const [rows] = await connection.query(
      `
      SELECT 
        a.id_actividad,
        m.descripcion AS descripcion_meta,
        o.descripcion AS descripcion_objetivo,
        a.fecha_terminado
      FROM actividad a
      INNER JOIN meta_objetivo mo ON a.id_meta_objetivo = mo.id_meta_objetivo
      INNER JOIN meta m ON mo.id_meta = m.id_meta
      INNER JOIN objetivo o ON mo.id_objetivo = o.id_objetivo
      WHERE a.id_usuario = ?
        AND a.fecha_terminado <= CURDATE()
        AND NOT EXISTS (
          SELECT 1
          FROM evaluacion e
          WHERE e.id_actividad = a.id_actividad
            AND e.fecha_evaluacion = CURDATE()
        )
      `,
      [id_usuario]
    );

    // Traducir metas y objetivos
    const evaluaciones = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        descripcion_meta: await traducirTexto(row.descripcion_meta, idioma),
        descripcion_objetivo: await traducirTexto(
          row.descripcion_objetivo,
          idioma
        ),
      }))
    );

    res.json(evaluaciones);
  } catch (error) {
    console.error("Error al obtener evaluaciones:", error);
    res.status(500).json({ error: "Error al obtener evaluaciones." });
  }
};

// Guardar respuesta de evaluación
export const guardarEvaluacion = async (req, res) => {
  const { id_actividad, id_respuesta, comentario, fecha_evaluacion } = req.body;

  if (!id_actividad || !id_respuesta || !fecha_evaluacion) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    const connection = await connect();
    await connection.query(
      `INSERT INTO evaluacion (id_actividad, id_respuesta, comentario, fecha_evaluacion) VALUES (?, ?, ?, ?)`,
      [id_actividad, id_respuesta, comentario || null, fecha_evaluacion]
    );
    res.status(201).json({ message: "Evaluación guardada exitosamente" });
  } catch (error) {
    console.error("Error al guardar evaluación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener historial de evaluaciones
export const getHistorialEvaluaciones = async (req, res) => {
  const { id_usuario, id_idioma } = req.params;
  const { pagina = 1, limite = 5 } = req.query;

  if (!id_usuario || !id_idioma) {
    return res
      .status(400)
      .json({ error: "El id_usuario y el id_idioma son requeridos." });
  }

  const offset = (pagina - 1) * limite;

  try {
    const connection = await connect();

    const [evaluaciones] = await connection.query(
      `
      SELECT 
        e.id_evaluacion,
        me.descripcion AS des_meta,
        ob.descripcion AS des_objetivo,
        e.fecha_evaluacion AS fecha_inicio,
        a.fecha_creacion AS fecha_creacion,
        a.fecha_terminado AS fecha_terminado,
        DATE_ADD(e.fecha_evaluacion, INTERVAL 1 DAY) AS fecha_fin,
        r.descripcion AS respuesta,
        e.comentario
      FROM evaluacion e
      INNER JOIN actividad a ON e.id_actividad = a.id_actividad
      INNER JOIN meta_objetivo mo ON a.id_meta_objetivo = mo.id_meta_objetivo
      INNER JOIN meta me ON mo.id_meta = me.id_meta
      INNER JOIN objetivo ob ON mo.id_objetivo = ob.id_objetivo
      INNER JOIN respuesta r ON e.id_respuesta = r.id_respuesta
      WHERE a.id_usuario = ?
      ORDER BY e.fecha_evaluacion DESC
      LIMIT ? OFFSET ?;
      `,
      [id_usuario, parseInt(limite), parseInt(offset)]
    );

    const [[{ total }]] = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM evaluacion e
      INNER JOIN actividad a ON e.id_actividad = a.id_actividad
      INNER JOIN meta_objetivo mo ON a.id_meta_objetivo = mo.id_meta_objetivo
      WHERE a.id_usuario = ?;
      `,
      [id_usuario]
    );

    // Traducir metas y objetivos
    const idiomaDestino = id_idioma === "2" ? "en" : "es"; // "2" para inglés
    const evaluacionesTraducidas = await Promise.all(
      evaluaciones.map(async (evaluacion) => ({
        ...evaluacion,
        des_meta: await traducirTexto(evaluacion.des_meta, idiomaDestino),
        des_objetivo: await traducirTexto(
          evaluacion.des_objetivo,
          idiomaDestino
        ),
      }))
    );

    const totalPaginas = Math.ceil(total / limite);

    res.json({ evaluaciones: evaluacionesTraducidas, totalPaginas });
  } catch (error) {
    console.error("Error al obtener el historial de evaluaciones:", error);
    res
      .status(500)
      .json({ error: "Error al obtener el historial de evaluaciones." });
  }
};

// Verificar si el usuario tiene evaluaciones pendientes
export const tieneEvaluacionesPendientes = async (req, res) => {
  const { id_usuario } = req.params;

  try {
    const connection = await connect();
    const [rows] = await connection.query(
      `
      SELECT COUNT(*) AS pendientes
      FROM actividad a
      INNER JOIN meta_objetivo mo ON a.id_meta_objetivo = mo.id_meta_objetivo
      WHERE a.id_usuario = ?
        AND a.fecha_terminado <= CURDATE()
        AND NOT EXISTS (
          SELECT 1
          FROM evaluacion e
          WHERE e.id_actividad = a.id_actividad
            AND e.fecha_evaluacion = CURDATE()
        )
      `,
      [id_usuario]
    );

    const pendientes = rows[0].pendientes > 0;
    res.json({ pendientes });
  } catch (error) {
    console.error("Error al verificar evaluaciones pendientes:", error);
    res
      .status(500)
      .json({ error: "Error al verificar evaluaciones pendientes" });
  }
};
