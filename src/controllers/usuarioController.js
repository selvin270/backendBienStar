import { connect } from "../database";
import multer from "multer";
import path from "path";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/avatars");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limitar a 2MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Solo se permiten imágenes en formato JPEG, PNG o GIF"));
  },
});

// Lista de tokens revocados (ideal usar una base de datos o Redis para producción)
const revokedTokens = new Set();

// Middleware para verificar si el token es válido y no está revocado
export const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ mensaje: "Token no proporcionado" });
  }

  if (revokedTokens.has(token)) {
    return res.status(401).json({ mensaje: "Token revocado o inválido" });
  }

  try {
    const decoded = jwt.verify(token, "Stack");
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ mensaje: "Token no válido" });
  }
};

// Endpoint para cerrar sesión
export const logoutUsuario = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (token) {
    revokedTokens.add(token); // Revocar el token
  }

  res.json({ mensaje: "Sesión cerrada exitosamente" });
};

// Obtener un usuario y generar un token
export const getUsuario = async (req, res) => {
  try {
    const { correo, contrasenia } = req.body;

    const connection = await connect();
    const [rows] = await connection.query(
      "SELECT * FROM usuario WHERE correo = ? AND contrasenia = ?",
      [correo, contrasenia]
    );

    if (rows.length > 0) {
      const usuario = rows[0];

      // Generar el token
      const token = jwt.sign({ correo: usuario.correo }, "Stack", {
        expiresIn: "3m",
      });

      return res.status(200).json({
        token,
        id_usuario: usuario.id_usuario,
        mensaje: "Inicio de sesión exitoso",
      });
    } else {
      return res
        .status(401)
        .json({ mensaje: "Usuario o contraseña incorrectos" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// Crear nuevo usuario
export const crearUsuario = [
  upload.single("avatar"),
  async (req, res) => {
    try {
      const {
        nombre,
        apellido,
        correo,
        contrasenia,
        edad,
        genero,
        estatura,
        peso,
      } = req.body;

      if (
        !nombre ||
        !apellido ||
        !correo ||
        !contrasenia ||
        !edad ||
        !genero ||
        !estatura ||
        !peso
      ) {
        return res.status(400).json({
          tipo: "error",
          msj: "Todos los campos son obligatorios",
        });
      }

      const avatarPath = req.file
        ? `uploads/avatars/${req.file.filename}`
        : null;

      const connection = await connect();
      await connection.query(
        "INSERT INTO usuario (nombre, apellido, correo, contrasenia, edad, genero, estatura, peso, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          nombre,
          apellido,
          correo,
          contrasenia,
          edad,
          genero,
          estatura,
          peso,
          avatarPath,
        ]
      );

      res.json({
        tipo: "success",
        msj: "Usuario creado exitosamente",
      });
    } catch (error) {
      console.error("Error al crear usuario:", error);

      // Verificar si el error es por correo duplicado
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(400).json({
          tipo: "error",
          msj: "El correo ya está registrado. Por favor, usa otro.",
        });
      }

      res.status(500).json({
        tipo: "error",
        msj: "Error al crear el usuario",
      });
    }
  },
];

// Obtener información del perfil del usuario
export const getPerfil = async (req, res) => {
  const { id_usuario } = req.params;

  try {
    const connection = await connect();
    const [rows] = await connection.query(
      "SELECT * FROM usuario WHERE id_usuario = ?",
      [id_usuario]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener el perfil del usuario:", error);
    res.status(500).json({ error: "Error al obtener el perfil del usuario" });
  }
};

// Actualizar información del perfil del usuario
export const actualizarPerfil = [
  upload.single("avatar"),
  async (req, res) => {
    const { id_usuario } = req.params;
    const { nombre, apellido, correo, edad, genero, estatura, peso } = req.body;
    const avatar = req.file ? `uploads/avatars/${req.file.filename}` : null;

    try {
      const connection = await connect();

      // Obtener el avatar actual del usuario
      const [userRows] = await connection.query(
        "SELECT avatar FROM usuario WHERE id_usuario = ?",
        [id_usuario]
      );

      if (userRows.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const avatarActual = userRows[0].avatar;

      // Actualizar el usuario con la imagen nueva o conservar la existente
      const [results] = await connection.query(
        `
        UPDATE usuario 
        SET nombre = ?, apellido = ?, correo = ?, edad = ?, genero = ?, estatura = ?, peso = ?, avatar = ?
        WHERE id_usuario = ?`,
        [
          nombre,
          apellido,
          correo,
          edad,
          genero,
          estatura,
          peso,
          avatar || avatarActual, // Conservar la imagen actual si no se sube una nueva
          id_usuario,
        ]
      );

      if (results.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "No se actualizó ningún registro" });
      }

      res.json({
        tipo: "success",
        msj: "Perfil actualizado exitosamente",
        avatar: avatar || avatarActual,
      });
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      res.status(500).json({ error: "Error al actualizar el perfil" });
    }
  },
];

// Subir avatar del usuario
export const subirAvatar = [
  upload.single("avatar"),
  async (req, res) => {
    const { id_usuario } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No se subió ningún archivo" });
    }

    try {
      const avatarPath = `uploads/avatars/${req.file.filename}`;

      const connection = await connect();
      const [results] = await connection.query(
        `
        UPDATE usuario 
        SET avatar = ?, avatar_updated_at = NOW()
        WHERE id_usuario = ?`,
        [avatarPath, id_usuario]
      );

      if (results.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "Usuario no encontrado o no se pudo actualizar" });
      }

      res.json({
        tipo: "success",
        msj: "Avatar subido exitosamente",
        avatar: avatarPath,
      });
    } catch (error) {
      console.error("Error al subir el avatar:", error);
      res.status(500).json({ error: "Error al subir el avatar" });
    }
  },
];

export const recuperarContrasenia = async (req, res) => {
  const { correo, idioma } = req.body;

  try {
    const connection = await connect();
    const [rows] = await connection.query(
      "SELECT * FROM usuario WHERE correo = ?",
      [correo]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        mensaje: idioma === "es" ? "Correo no registrado" : "Unregistered mail",
      });
    }

    const token = jwt.sign({ correo }, process.env.JWT_SECRET || "Stack", {
      expiresIn: "1h", // Token válido por 1 hora
    });

    const resetLink = `http://localhost:3000/restablecer-contrasenia/${token}`;

    // Configura el servicio de correo
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "selvinomarcastellanossolares@gmail.com",
        pass: "shgg wpgv xcmn szou",
      },
    });

    // Configura asunto y texto según el idioma
    const subject =
      idioma === "es" ? "Recuperación de Contraseña" : "Password Recovery";
    const text =
      idioma === "es"
        ? `Haz clic en el siguiente enlace para restablecer tu contraseña: ${resetLink}`
        : `Click the following link to reset your password: ${resetLink}`;

    const mailOptions = {
      from: "selvinomarcastellanossolares@gmail.com",
      to: correo,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      mensaje:
        idioma === "es"
          ? "Enlace de recuperación enviado al correo proporcionado"
          : "Recovery link sent to the provided email",
    });
  } catch (error) {
    console.error("Error al enviar el correo de recuperación:", error);
    res.status(500).json({
      mensaje:
        idioma === "es"
          ? "Error al enviar el correo de recuperación"
          : "Error sending recovery email",
    });
  }
};

export const restablecerContrasenia = async (req, res) => {
  const { token, nuevaContrasenia, idioma } = req.body; // Añadir idioma al cuerpo

  // Definir mensajes según el idioma
  const mensajes = {
    es: {
      tokenRequerido: "Token y nueva contraseña son requeridos",
      usuarioNoEncontrado: "Usuario no encontrado",
      contrasenaRestablecida: "Contraseña restablecida exitosamente",
      tokenInvalido: "Token inválido o expirado",
    },
    en: {
      tokenRequerido: "Token and new password are required",
      usuarioNoEncontrado: "User not found",
      contrasenaRestablecida: "Password reset successfully",
      tokenInvalido: "Invalid or expired token",
    },
  };

  const lang = mensajes[idioma] ? idioma : "es"; // Por defecto, español

  if (!token || !nuevaContrasenia) {
    return res.status(400).json({ mensaje: mensajes[lang].tokenRequerido });
  }

  try {
    // Verifica y decodifica el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "Stack");

    const connection = await connect();
    const [result] = await connection.query(
      "UPDATE usuario SET contrasenia = ? WHERE correo = ?",
      [nuevaContrasenia, decoded.correo]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ mensaje: mensajes[lang].usuarioNoEncontrado });
    }

    res.json({ mensaje: mensajes[lang].contrasenaRestablecida });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    res.status(400).json({ mensaje: mensajes[lang].tokenInvalido });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { correo, nombre, apellido, avatar } = req.body;

    if (!correo || !nombre || !apellido) {
      return res.status(400).json({
        tipo: "error",
        msj: "Faltan datos obligatorios: correo, nombre o apellido",
      });
    }

    const connection = await connect();

    // Verifica si el usuario ya existe
    const [rows] = await connection.query(
      "SELECT * FROM usuario WHERE correo = ?",
      [correo]
    );

    let id_usuario;

    if (rows.length > 0) {
      // Usuario existente: actualiza el avatar
      id_usuario = rows[0].id_usuario;
      await connection.query(
        "UPDATE usuario SET avatar = ?, avatar_updated_at = NOW() WHERE correo = ?",
        [avatar, correo]
      );
    } else {
      // Nuevo usuario: crea el registro
      const [result] = await connection.query(
        `INSERT INTO usuario (nombre, apellido, correo, contrasenia, edad, genero, estatura, peso, avatar) 
         VALUES (?, ?, ?, ?, 0, '', 0, 0, ?)`,
        [nombre, apellido, correo, "google-auth", avatar]
      );
      id_usuario = result.insertId;
    }

    res.json({
      tipo: "success",
      msj: "Usuario autenticado correctamente",
      id_usuario,
    });
  } catch (error) {
    console.error("Error en el inicio de sesión con Google:", error);
    res.status(500).json({
      tipo: "error",
      msj: "Error interno del servidor",
    });
  }
};
