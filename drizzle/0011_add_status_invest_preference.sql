-- Adicionar coluna para preferência de alertas do Status Invest (Comunicados de FIIs)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "alert_preferences_status_invest" BOOLEAN DEFAULT FALSE;
