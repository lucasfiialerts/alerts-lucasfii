-- Tabela para rastrear alertas enviados
CREATE TABLE IF NOT EXISTS investidor10_alertas_enviados (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    ticker TEXT NOT NULL,
    documento_tipo TEXT NOT NULL,
    documento_data TEXT NOT NULL,
    documento_url TEXT NOT NULL,
    documento_hash TEXT,
    enviado_em TIMESTAMP DEFAULT NOW(),
    
    -- Índices para busca rápida
    UNIQUE(user_id, ticker, documento_data, documento_tipo)
);

CREATE INDEX IF NOT EXISTS idx_alertas_user_ticker ON investidor10_alertas_enviados(user_id, ticker);
CREATE INDEX IF NOT EXISTS idx_alertas_enviado_em ON investidor10_alertas_enviados(enviado_em);
