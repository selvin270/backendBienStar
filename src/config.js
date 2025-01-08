import { config as dotenv } from "dotenv";
dotenv();

export const config = {
  host: process.env.DB_HOST || "131.107.5.86",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Kappa1105$",
  database: process.env.DB_DATABASE || "BienStar",
};
