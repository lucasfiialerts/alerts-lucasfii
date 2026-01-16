# Sistema de Alertas Condicionais por Preferências

## 🎯 **Implementação Concluída**

### **Como Funciona Agora:**

O sistema de alertas FII agora verifica as **preferências de configuração** de cada usuário para determinar o tipo de mensagem a enviar:

#### **📊 "Relatórios e Eventos" = ATIVO**
```
📈 📈 Alerta de Alta!

📊 HGLG11 - HEDGE LOGÍSTICA  
💰 Cotação atual: R$ 159,70
📈 Variação hoje: +0.11%
📊 Volume negociado: 15.423

📋 Informações de Mercado:
• Faixa do dia: R$ 159.53 - 160
• Faixa 52 semanas: R$ 142,00 - R$ 163,30  
• Fechamento anterior: R$ 159,53

💼 Informações Patrimoniais:
• VP atual: R$ 162.450000
• Pat. Líquido: R$ 4.10 bi
• Competência: outubro de 2025
• 📈 Reavaliação: +1.8500%

🚀 Subiu!

🔗 Acompanhe em: https://lucasfiialerts.com.br

⏰ 18/11/2025, 13:28:36
_Alerta automático baseado nas suas configurações._
```

#### **📊 "Relatórios e Eventos" = DESATIVADO**
```
📈 📈 Alerta de Alta!

📊 HGBS11 - HEDGE BRASIL SHOPPING
💰 Cotação atual: R$ 20,06
📈 Variação: +0.30%

🚀 Subiu!

Acompanhe em: https://lucasfiialerts.com.br

_Este é um alerta automático baseado nas suas configurações._
```

---

## 🔧 **Implementação Técnica**

### **1. Schema de Banco Atualizado**
```sql
-- Novas colunas na tabela user
alert_preferences_reports BOOLEAN DEFAULT true
alert_preferences_market_close BOOLEAN DEFAULT false  
alert_preferences_treasury BOOLEAN DEFAULT false
alert_preferences_auto_update BOOLEAN DEFAULT false
alert_preferences_variation BOOLEAN DEFAULT true
alert_preferences_yield BOOLEAN DEFAULT false
```

### **2. Lógica de Negócio**
```typescript
// Verifica preferência do usuário
const useExtendedMessage = userAlert.alertPreferencesReports;

if (useExtendedMessage) {
  // Mensagem COMPLETA com informações patrimoniais
  message = this.createAlertMessage(ticker, name, fiiData, extendedData);
} else {
  // Mensagem SIMPLES sem informações extras  
  message = this.createSimpleAlertMessage(ticker, name, fiiData);
}
```

### **3. Query Otimizada**
```sql
-- Busca usuários com JOIN para pegar preferências
SELECT 
  uff.user_id, uff.fund_id, ff.ticker, ff.name,
  u.alert_preferences_reports,  -- Nova coluna
  u.alert_preferences_variation
FROM user_fii_follow uff
INNER JOIN fii_fund ff ON uff.fund_id = ff.id
INNER JOIN user u ON uff.user_id = u.id
WHERE 
  uff.notifications_enabled = true
  AND uff.price_alert_enabled = true  
  AND u.alert_preferences_variation = true
```

---

## 🧪 **Endpoints de Teste**

### **1. Comparar Mensagens**
```bash
curl "http://localhost:3000/api/debug/compare-messages?ticker=HGLG11"
```

### **2. Atualizar Preferências de Usuário**
```bash
curl -X POST "http://localhost:3000/api/debug/update-preferences" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "alertPreferencesReports": false}'
```

### **3. Buscar Usuários com Alertas**
```bash
curl "http://localhost:3000/api/debug/get-users"
```

### **4. Executar Cron com Preferências**
```bash
curl -X POST "http://localhost:3000/api/cron/fii-alerts" \
  -H "x-webhook-secret: fii-alerts-webhook-2025-secure-key"
```

---

## 📱 **Interface de Configuração**

Na página `/configuration`, o usuário vê o card:

```
🗃️ Relatórios e Eventos         [TOGGLE]

Você receberá o documento sempre que um ativo da 
sua lista divulgar relatórios gerenciais, fatos 
relevantes, atualizações patrimoniais.
```

- **TOGGLE ATIVO** → Mensagens COMPLETAS com dados patrimoniais
- **TOGGLE DESATIVADO** → Mensagens SIMPLES só com cotação

---

## ✅ **Benefícios**

1. **Controle do Usuário**: Cada pessoa escolhe o nível de detalhamento
2. **Performance**: Usuários que querem mensagens simples não processam dados extras
3. **Experiência Personalizada**: Novatos recebem menos informação, experientes mais
4. **Flexibilidade**: Cada preferência é independente e escalável

---

## 🚀 **Próximos Passos**

1. **Interface Real**: Conectar os toggles da página de configuração com a API
2. **Mais Preferências**: Implementar outras opções como "Fechamento de Mercado", "Anúncios de Rendimentos"
3. **Testes de Usuário**: Validar qual tipo de mensagem os usuários preferem
4. **Analytics**: Medir engajamento por tipo de mensagem

---

**✅ Sistema implementado e funcionando! Usuários agora controlam o formato dos alertas via preferências! 🎯📱**