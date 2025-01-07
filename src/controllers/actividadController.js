import { connect } from "../database";
import axios from "axios";

// URL base de la API de Google Translate gratuita
const GOOGLE_TRANSLATE_API_URL =
  "https://translate.googleapis.com/translate_a/single";

// Función para traducir texto usando Google Translate
const traducirTexto = async (texto, idiomaDestino) => {
  try {
    const response = await axios.get(GOOGLE_TRANSLATE_API_URL, {
      params: {
        client: "gtx",
        sl: "auto", // Detecta automáticamente el idioma original
        tl: idiomaDestino, // Idioma de destino
        dt: "t",
        q: texto, // Texto a traducir
      },
    });
    return response.data[0][0][0];
  } catch (error) {
    console.error("Error al traducir texto:", error);
    return texto; // Retorna el original si hay error
  }
};

// Traducción de días de la semana
const traducirDias = async (dias, idiomaDestino) => {
  try {
    // Separa los días en un array si están en formato concatenado
    const diasArray = dias.split("\n");

    // Traduce cada día individualmente
    const diasTraducidos = await Promise.all(
      diasArray.map(async (dia) => {
        return await traducirTexto(dia, idiomaDestino);
      })
    );

    // Vuelve a unir los días traducidos en el mismo formato
    return diasTraducidos.join("\n");
  } catch (error) {
    console.error("Error al traducir los días de la semana:", error);
    return dias; // Retorna los días originales si hay error
  }
};

// Obtener actividades y traducir las metas y objetivos
export const getActividades = async (req, res) => {
  try {
    const connection = await connect();
    const { id_usuario, id_categoria, id_idioma } = req.params;

    // Consulta de actividades
    const [rows] = await connection.query(
      `
      SELECT 
        a.id_actividad,
        a.id_usuario,
        a.fecha_creacion,
        a.fecha_terminado,
        mo.id_categoria,
        c.descripcion AS categoria_descripcion,
        m.descripcion AS meta_descripcion,
        o.descripcion AS objetivo_descripcion,
        GROUP_CONCAT(DISTINCT CONCAT(h.hora_inicio, ' - ', h.hora_fin) ORDER BY h.id_horario ASC SEPARATOR '\n') AS horarios,
        GROUP_CONCAT(DISTINCT s.descripcion ORDER BY s.id_semana ASC) AS dias_semana, -- Agrega los días seleccionados
        MAX(e.fecha_evaluacion) AS fecha_evaluacion,
        MAX(r.descripcion) AS evaluacion_respuesta,
        MAX(e.comentario) AS evaluacion_comentario
      FROM actividad a
      LEFT JOIN meta_objetivo mo ON a.id_meta_objetivo = mo.id_meta_objetivo
      LEFT JOIN categoria c ON mo.id_categoria = c.id_categoria
      LEFT JOIN meta m ON mo.id_meta = m.id_meta
      LEFT JOIN objetivo o ON mo.id_objetivo = o.id_objetivo
      LEFT JOIN horario h ON a.id_actividad = h.id_actividad
      LEFT JOIN actividad_semana asw ON a.id_actividad = asw.id_actividad
      LEFT JOIN semana s ON asw.id_semana = s.id_semana
      LEFT JOIN evaluacion e ON a.id_actividad = e.id_actividad
      LEFT JOIN respuesta r ON e.id_respuesta = r.id_respuesta
      WHERE a.id_usuario = ? AND mo.id_categoria = ?
      GROUP BY a.id_actividad
      ORDER BY a.fecha_creacion DESC;
      `,
      [id_usuario, id_categoria]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        tipo: "error",
        msj: `No se encontraron actividades para el usuario con id_usuario=${id_usuario}, id_categoria=${id_categoria}.`,
      });
    }

    // Traducción de metas y objetivos
    const idiomaDestino = id_idioma === "2" ? "en" : "es"; // Mapea el id_idioma
    const actividadesTraducidas = await Promise.all(
      rows.map(async (actividad) => {
        const metaTraducida = await traducirTexto(
          actividad.meta_descripcion,
          idiomaDestino
        );
        const objetivoTraducido = await traducirTexto(
          actividad.objetivo_descripcion,
          idiomaDestino
        );
        const diasTraducidos = await traducirDias(
          actividad.dias_semana,
          idiomaDestino
        );

        return {
          ...actividad,
          meta_descripcion: metaTraducida,
          objetivo_descripcion: objetivoTraducido,
          dias_semana: diasTraducidos,
        };
      })
    );

    res.json(actividadesTraducidas);
  } catch (error) {
    console.error("Error al obtener actividades:", error);
    res.status(500).json({
      tipo: "error",
      msj: "Error interno del servidor",
    });
  }
};

export const getActividad = async (req, res) => {
  try {
    const connection = await connect();

    const [rows] = await connection.query(
      `
      SELECT 
        a.id_actividad,
        a.id_meta_objetivo,
        a.id_usuario,
        a.fecha_creacion,
        a.fecha_terminado,
        mo.id_categoria,
        m.descripcion AS meta_descripcion,
        m.id_meta,
        o.descripcion AS objetivo_descripcion,
        mo.id_objetivo,
        GROUP_CONCAT(DISTINCT s.id_semana) AS dias_semana
      FROM actividad a
      LEFT JOIN meta_objetivo mo ON a.id_meta_objetivo = mo.id_meta_objetivo
      LEFT JOIN meta m ON mo.id_meta = m.id_meta
      LEFT JOIN objetivo o ON mo.id_objetivo = o.id_objetivo
      LEFT JOIN actividad_semana asw ON a.id_actividad = asw.id_actividad
      LEFT JOIN semana s ON asw.id_semana = s.id_semana
      WHERE a.id_actividad = ?;
      `,
      [req.params.id_actividad]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        tipo: "error",
        msj: "Actividad no encontrada.",
      });
    }

    const actividad = rows[0];

    const [horarios] = await connection.query(
      `
      SELECT 
        id_horario,
        hora_inicio,
        hora_fin
      FROM horario
      WHERE id_actividad = ?;
      `,
      [req.params.id_actividad]
    );

    actividad.horarios = horarios;
    res.json(actividad);
  } catch (error) {
    console.error("Error al obtener actividad:", error);
    res.status(500).json({
      tipo: "error",
      msj: "Error interno del servidor.",
    });
  }
};

//crear una actividad
export const saveActividad = async (req, res) => {
  try {
    const connection = await connect();

    // Validar los datos recibidos
    const {
      id_meta_objetivo,
      id_usuario,
      fecha_creacion,
      fecha_terminado,
      diasSeleccionados,
    } = req.body;

    console.log("Datos recibidos en el backend:", {
      id_meta_objetivo,
      id_usuario,
      fecha_creacion,
      fecha_terminado,
      diasSeleccionados,
    });

    if (
      !id_meta_objetivo ||
      !id_usuario ||
      !fecha_creacion ||
      !fecha_terminado ||
      !diasSeleccionados
    ) {
      return res.status(400).json({
        tipo: "error",
        msj: "Todos los campos obligatorios deben estar presentes: id_meta_objetivo, id_usuario, fecha_creacion, diasSeleccionados, y fecha_terminado.",
      });
    }

    const [results] = await connection.query(
      `INSERT INTO actividad (id_meta_objetivo, id_usuario, fecha_creacion, fecha_terminado) VALUES (?, ?, ?, ?)`,
      [id_meta_objetivo, id_usuario, fecha_creacion, fecha_terminado]
    );

    const id_actividad = results.insertId;

    // Insertar días en la tabla actividad_semana
    for (const id_dia of diasSeleccionados) {
      await connection.query(
        `INSERT INTO actividad_semana (id_actividad, id_semana) VALUES (?, ?)`,
        [id_actividad, id_dia]
      );
    }

    res.status(201).json({
      tipo: "success",
      msj: "Actividad creada exitosamente",
      id_actividad: results.insertId,
    });
  } catch (error) {
    console.error("Error al guardar la actividad:", error);
    res.status(500).json({
      tipo: "error",
      msj: "Error interno del servidor al guardar la actividad",
    });
  }
};

//borrar una actividad
export const deleteActividad = async (req, res) => {
  try {
    const connection = await connect();
    const [result] = await connection.query(
      "DELETE FROM actividad WHERE id_actividad = ?",
      [req.params.id_actividad]
    );

    // Verifica si se eliminó alguna fila
    if (result.affectedRows === 0) {
      return res.status(404).json({
        tipo: "error",
        msj: "Actividad no encontrada o ya eliminada.",
      });
    }

    res.json({
      tipo: "success",
      msj: "Actividad eliminada exitosamente.",
      id_actividad: req.params.id_actividad,
    });
  } catch (error) {
    console.error("Error al borrar la actividad:", error);
    res.status(500).json({
      tipo: "error",
      msj: "Error al borrar la actividad.",
    });
  }
};

//actualizar una actividad
export const updateActividad = async (req, res) => {
  try {
    const connection = await connect();

    const { id_meta_objetivo, fecha_terminado, diasSeleccionados } = req.body;
    const { id_actividad } = req.params;

    console.log("Datos recibidos:", {
      id_meta_objetivo,
      fecha_terminado,
      diasSeleccionados,
    });

    if (!Array.isArray(diasSeleccionados) || diasSeleccionados.length === 0) {
      console.error("Error: días seleccionados no son válidos.");
      return res.status(400).json({
        tipo: "error",
        msj: "Los días seleccionados deben ser un array y no pueden estar vacíos.",
      });
    }

    // Actualizar la actividad
    const [results] = await connection.query(
      `
      UPDATE actividad 
      SET id_meta_objetivo = ?, 
          fecha_terminado = ? 
      WHERE id_actividad = ?;
      `,
      [id_meta_objetivo, fecha_terminado, id_actividad]
    );

    if (results.affectedRows === 0) {
      return res.status(404).json({
        tipo: "error",
        msj: `No se encontró la actividad con id_actividad=${id_actividad}.`,
      });
    }

    // Eliminar días actuales asociados a la actividad
    await connection.query(
      `DELETE FROM actividad_semana WHERE id_actividad = ?`,
      [id_actividad]
    );

    // Insertar los nuevos días seleccionados
    const diasValidos = diasSeleccionados.filter((id) =>
      Number.isInteger(parseInt(id))
    );

    if (diasValidos.length > 0) {
      const valores = diasValidos.map((id_dia) => [id_actividad, id_dia]);
      await connection.query(
        `INSERT INTO actividad_semana (id_actividad, id_semana) VALUES ?`,
        [valores]
      );
    }

    res.json({
      tipo: "success",
      msj: "Actividad actualizada exitosamente",
      id_actividad,
      diasSeleccionados,
    });
  } catch (error) {
    console.error("Error al actualizar la actividad:", error);
    res.status(500).json({
      tipo: "error",
      msj: "Error interno del servidor",
    });
  }
};

export const getDiasSemana = async (req, res) => {
  try {
    const { id_idioma } = req.query; // Obtén el idioma desde los parámetros de consulta
    const idiomaDestino = id_idioma === "2" ? "en" : "es"; // Determina el idioma destino (1: español, 2: inglés)

    const connection = await connect();
    const [rows] = await connection.query(`SELECT * FROM semana`);

    // Traduce los días de la semana
    const diasTraducidos = await Promise.all(
      rows.map(async (dia) => ({
        ...dia,
        descripcion: await traducirTexto(dia.descripcion, idiomaDestino),
      }))
    );

    res.json(diasTraducidos);
  } catch (error) {
    console.error("Error al obtener días de la semana:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// export const getDiasSemana = async (req, res) => {
//   try {
//     const { id_idioma } = req.query; // Obtén el idioma como parámetro de consulta
//     const connection = await connect();

//     // Mapa de traducciones estático
//     const traducciones = {
//       en: {
//         Lunes: "Monday",
//         Martes: "Tuesday",
//         Miércoles: "Wednesday",
//         Jueves: "Thursday",
//         Viernes: "Friday",
//         Sábado: "Saturday",
//         Domingo: "Sunday",
//         "Todos los días": "All Days",
//       },
//       es: {
//         Monday: "Lunes",
//         Tuesday: "Martes",
//         Wednesday: "Miércoles",
//         Thursday: "Jueves",
//         Friday: "Viernes",
//         Saturday: "Sábado",
//         Sunday: "Domingo",
//         "All Days": "Todos los días",
//       },
//     };

//     const idiomaDestino = id_idioma === "2" ? "en" : "es"; // Determina el idioma (1 = español, 2 = inglés)

//     const [rows] = await connection.query(`SELECT * FROM semana`);

//     // Traduce las descripciones
//     const diasTraducidos = rows.map((dia) => ({
//       ...dia,
//       descripcion:
//         traducciones[idiomaDestino][dia.descripcion] || dia.descripcion,
//     }));

//     res.json(diasTraducidos);
//   } catch (error) {
//     console.error("Error al obtener días de la semana:", error);
//     res.status(500).json({ error: "Error interno del servidor" });
//   }
// };
