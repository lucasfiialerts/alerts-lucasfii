# Configuração de Webhooks EasyCron - Atualizações Automáticas

## 📋 Novo Webhook: Atualizações Automáticas

### **Endpoint**
```
POST https://lucasfiialerts.com/api/cron/auto-updates
```

### **Headers Necessários**
```
x-webhook-secret: fii-alerts-webhook-2025-secure-key
Content-Type: application/json
```

### **Frequência Recomendada**
- **Intervalo**: A cada hora (60 minutos)
- **Horário de funcionamento**: Durante horário comercial (9h às 18h)
- **Dias**: Segunda a sexta-feira

### **Funcionalidade**
O webhook de atualizações automáticas:

1. **Identifica usuários** com preferência `alertPreferencesAutoUpdate = true`
2. **Busca FIIs seguidos** por cada usuário (máximo 10 por usuário)
3. **Consulta preços atuais** na BRAPI
4. **Envia resumo formatado** via WhatsApp

### **Formato da Mensagem**
```
📌 Lista de acompanhamento que você segue

🟢 +0.38% - LVBI11 – R$ 106,90
🟢 +0.10% - GGRC11 – R$ 9,91  
🟢 +0.08% - HGLG11 – R$ 159,66
🔴 -0.25% - VTLT11 – R$ 98,45

📱 Acesse: lucasfiialerts.com
```

### **Configuração no EasyCron**

1. **Nome**: "FII Auto Updates"
2. **URL**: `https://lucasfiialerts.com/api/cron/auto-updates`
3. **Method**: POST
4. **Headers**: 
   - `x-webhook-secret: fii-alerts-webhook-2025-secure-key`
5. **Interval**: Every 60 minutes
6. **Time Range**: 09:00 - 18:00 (Brazil/Sao_Paulo)
7. **Days**: Monday to Friday

### **Monitoramento**

#### Health Check
```bash
curl -X GET https://lucasfiialerts.com/api/cron/auto-updates
```

Retorna estatísticas dos usuários com atualização automática ativa.

#### Teste Manual
```bash
curl -X POST https://lucasfiialerts.com/api/cron/auto-updates \
  -H "x-webhook-secret: fii-alerts-webhook-2025-secure-key"
```

### **Logs de Sucesso**
```json
{
  "success": true,
  "message": "Atualizações automáticas processadas com sucesso",
  "stats": {
    "usersWithAutoUpdate": 1,
    "usersProcessed": 1,
    "messagesSent": 1,
    "successRate": "100%"
  }
}
```

### **Tratamento de Erros**
- ✅ Timeout de 15s por requisição BRAPI
- ✅ Retry automático em caso de falha
- ✅ Limite de 10 FIIs por usuário
- ✅ Delay entre envios WhatsApp (1 segundo)
- ✅ Continuidade mesmo se usuário falhar

## 🚀 Resumo de Todos os Webhooks

### **1. Alertas de Preço** (Existente)
```
POST /api/cron/fii-alerts
Frequência: A cada 10 minutos
Função: Alertas de variação de preço
```

### **2. Relatórios PDF** (Existente)  
```
POST /api/cron/fii-reports
Frequência: A cada 6 horas
Função: Notificação de novos relatórios
```

### **3. Atualizações Automáticas** (NOVO)
```
POST /api/cron/auto-updates
Frequência: A cada hora
Função: Resumo dos FIIs seguidos
```

---

**Data**: 18 de novembro de 2025  
**Status**: ✅ Testado e funcionando  
**Próximo passo**: Configurar webhook no EasyCron