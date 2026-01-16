-- SQL para reduzir o threshold de alertas para 0.1% (para ver mais alertas)
UPDATE user_fii_follow 
SET min_variation_percent = '0.1' 
WHERE min_variation_percent = '0.5';

-- Verificar configurações atuais
SELECT 
    u.email,
    f.ticker,
    uff.min_variation_percent,
    uff.notifications_enabled,
    uff.price_alert_enabled
FROM user_fii_follow uff
JOIN user_table u ON uff.user_id = u.id  
JOIN fii_fund f ON uff.fund_id = f.id
ORDER BY u.email, f.ticker;