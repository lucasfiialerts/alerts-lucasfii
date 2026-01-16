import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

// Configuração mais robusta do pool de conexões
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 10, // Reduzindo o máximo de conexões
  idleTimeoutMillis: 60000, // 1 minuto
  connectionTimeoutMillis: 10000, // 10 segundos
  allowExitOnIdle: false, // Não permitir que o pool feche automaticamente
});

// Tratamento de erros do pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = drizzle(pool, {
  schema,
});
