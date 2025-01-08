import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";

import swaggerJSDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import { options } from "./swaggerOptions";
const specs = swaggerJSDoc(options);

import actividadRoutes from "./routes/actividadRoute";
import metaObjetivoRoutes from "./routes/metaObjetivoRoute";
import usuarioRoute from "./routes/usuarioRoute";
import horarioRoute from "./routes/horarioRoute";
import evaluacionRoute from "./routes/evaluacionRoute";

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Middleware para configurar COOP y COEP
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// Rutas principales
app.use(actividadRoutes);
app.use(metaObjetivoRoutes);
app.use(usuarioRoute);
app.use(horarioRoute);
app.use(evaluacionRoute);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Documentación con Swagger
app.use("/docs", swaggerUI.serve, swaggerUI.setup(specs));

// Endpoint para la ruta raíz
app.get("/", (req, res) => {
  res.send(`
    <h1>Bienvenido al backend de BienStar</h1>
    <p>Accede a la <a href="/docs">documentación Swagger</a> para explorar los endpoints disponibles.</p>
  `);
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).send({
    message: "Endpoint no encontrado. Por favor, verifica la URL.",
  });
});

export default app;
