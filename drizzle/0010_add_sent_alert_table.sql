-- Migração para criar tabela de alertas enviados (evitar duplicatas)
-- Criado em: 2026-01-15

CREATE TABLE IF NOT EXISTS "sent_alert" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "alert_key" text NOT NULL,
  "alert_type" text NOT NULL,
  "sent_at" timestamp DEFAULT now() NOT NULL
);

-- Índice para busca rápida por usuário e chave do alerta
CREATE INDEX IF NOT EXISTS "idx_sent_alert_user_key" ON "sent_alert" ("user_id", "alert_key");

-- Índice para busca por tipo de alerta
CREATE INDEX IF NOT EXISTS "idx_sent_alert_type" ON "sent_alert" ("alert_type");
