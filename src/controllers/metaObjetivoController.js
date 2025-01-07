// Obtener todas las metas por categoría específica
import { connect } from "../database";
import axios from "axios";

// URL base de la API de Google Translate gratuita
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
    return response.data[0][0][0]; // El texto traducido
  } catch (error) {
    console.error("Error al traducir texto:", error);
    return texto; // Retorna el texto original en caso de error
  }
};

// Obtener todas las metas por categoría específica y traducirlas
export const getMetas = async (req, res) => {
  try {
    const connection = await connect();
    const { id_categoria, idioma } = req.params;
    console.log("Parámetro idioma recibido:", idioma);

    if (!id_categoria || !idioma) {
      return res.status(400).json({
        tipo: "error",
        msj: "Los parámetros id_categoria e idioma son obligatorios",
      });
    }

    // Consulta para obtener las metas por categoría
    const [rows] = await connection.query(
      `
      SELECT DISTINCT m.id_meta, m.descripcion 
      FROM meta m 
      JOIN meta_objetivo mo ON m.id_meta = mo.id_meta 
      WHERE mo.id_categoria = ?;
      `,
      [id_categoria]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        tipo: "error",
        msj: `No se encontraron metas para la categoría con id_categoria=${id_categoria}`,
      });
    }

    // Traducir las metas
    const metasTraducidas = await Promise.all(
      rows.map(async (meta) => {
        let descripcion;
        if (idioma == 1) {
          descripcion = meta.descripcion;
        } else {
          descripcion = await traducirTexto(meta.descripcion, idioma);
        }

        return {
          id_meta: meta.id_meta,
          descripcion,
          idioma,
        };
      })
    );

    res.json(metasTraducidas);
  } catch (error) {
    console.error(
      "Error al obtener y traducir las metas por categoría:",
      error
    );
    res.status(500).json({
      tipo: "error",
      msj: "Error al obtener las metas",
    });
  }
};

// Obtener todos los objetivos según una meta específica y traducirlos
export const getObjetivosByMeta = async (req, res) => {
  try {
    const connection = await connect();
    const { id_meta, idioma } = req.params;

    if (!id_meta || !idioma) {
      return res.status(400).json({
        tipo: "error",
        msj: "Los parámetros id_meta e idioma son obligatorios",
      });
    }

    // Consulta para obtener los objetivos relacionados con una meta
    const [rows] = await connection.query(
      `
      SELECT DISTINCT o.id_objetivo, o.descripcion 
      FROM objetivo o 
      JOIN meta_objetivo mo ON o.id_objetivo = mo.id_objetivo 
      WHERE mo.id_meta = ?;
      `,
      [id_meta]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        tipo: "error",
        msj: `No se encontraron objetivos para la meta con id_meta=${id_meta}`,
      });
    }

    // Traducir los objetivos
    const objetivosTraducidos = await Promise.all(
      rows.map(async (objetivo) => {
        let descripcion;
        if (idioma == 1) {
          descripcion = objetivo.descripcion;
        } else {
          descripcion = await traducirTexto(objetivo.descripcion, idioma);
        }

        return {
          id_objetivo: objetivo.id_objetivo,
          descripcion,
          idioma,
        };
      })
    );

    res.json(objetivosTraducidos);
  } catch (error) {
    console.error("Error al obtener y traducir los objetivos:", error);
    res.status(500).json({
      tipo: "error",
      msj: "Error al obtener los objetivos",
    });
  }
};

// Obtener una meta especifica
export const getMetaById = async (req, res) => {
  try {
    const pool = connect(); // Usa el pool de conexiones

    const [rows] = await pool.query(
      `
      SELECT me.*
      FROM actividad a 
      JOIN meta_objetivo mo ON a.id_meta_objetivo = mo.id_meta_objetivo
      JOIN meta me ON me.id_meta = mo.id_meta
      WHERE a.id_actividad = ?;
      `,
      [req.params.id_actividad]
    );
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener meta:", error);
    res.status(500).json({ tipo: "error", msj: "Error al obtener meta" });
  }
};

// Obtener un objetivo especifico
export const getObjetivoById = async (req, res) => {
  try {
    const pool = connect(); // Usa el pool de conexiones
    const [rows] = await pool.query(
      `
      SELECT ob.*
      FROM actividad a 
      JOIN meta_objetivo mo ON a.id_meta_objetivo = mo.id_meta_objetivo
      JOIN objetivo ob ON ob.id_objetivo = mo.id_objetivo
      WHERE a.id_actividad = ?;
      `,
      [req.params.id_actividad]
    );
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener objetivo:", error);
    res.status(500).json({ tipo: "error", msj: "Error al obtener objetivo" });
  }
};

// Obtener un meta objetivo id
export const getMetaObjetivoByIdMetaIdObjetivo = async (req, res) => {
  try {
    const pool = connect(); // Usa el pool de conexiones
    const [rows] = await pool.query(
      `
      SELECT mo.id_meta_objetivo
      FROM meta_objetivo mo
      WHERE mo.id_meta = ? and mo.id_objetivo = ?;
      `,
      [req.params.id_meta, req.params.id_objetivo]
    );
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener meta objetivo:", error);
    res
      .status(500)
      .json({ tipo: "error", msj: "Error al obtener meta objetivo" });
  }
};
