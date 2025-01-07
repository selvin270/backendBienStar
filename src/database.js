// import mysql from "mysql2/promise";
// import { config } from "./config";

// export const connect = async () => {
//   return await mysql.createConnection(config);
// };

import mysql from "mysql2/promise";
import { config } from "./config";

// Crear un pool de conexiones
const pool = mysql.createPool({
  ...config,
  waitForConnections: true, // Esperar si no hay conexiones disponibles
  connectionLimit: 10, // Máximo de conexiones simultáneas
  queueLimit: 0, // Sin límite en la cola de conexiones
});

// Exportar el pool para reutilizarlo en todos los controladores
export const connect = () => pool;
