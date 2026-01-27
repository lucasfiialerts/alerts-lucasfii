import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function addPartsColumn() {
  try {
    console.log("Adicionando coluna 'parts' à tabela chat_message...");
    
    await db.execute(sql`
      ALTER TABLE chat_message 
      ADD COLUMN IF NOT EXISTS parts jsonb;
    `);
    
    console.log("✅ Coluna 'parts' adicionada com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao adicionar coluna:", error);
  }
  
  process.exit(0);
}

addPartsColumn();
