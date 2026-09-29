import "dotenv/config";
import { Pool } from "pg";

const ssl = { rejectUnauthorized: false };
const databaseUrl = process.env.DATABASE_URL;

if (process.env.NODE_ENV === "production" && !databaseUrl) {
  throw new Error("DATABASE_URL precisa estar configurada no ambiente de produção.");
}

export const pool = new Pool(
  databaseUrl
    ? { connectionString: databaseUrl, ssl }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl,
      },
);
