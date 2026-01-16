-- Migração para reduzir threshold de alertas
-- Reduz de 0.5% para 0.1% para alertas mais frequentes

UPDATE user_fii_follow 
SET min_variation_percent = '0.1' 
WHERE min_variation_percent = '0.5';

-- Verificar quantos registros foram atualizados
SELECT 
    'Registros atualizados' as status,
    COUNT(*) as quantidade
FROM user_fii_follow 
WHERE min_variation_percent = '0.1';
