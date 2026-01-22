-- Adiciona coluna para preferência de cotação sob demanda
ALTER TABLE "user" ADD COLUMN "alert_preferences_on_demand_quote" boolean DEFAULT false;
