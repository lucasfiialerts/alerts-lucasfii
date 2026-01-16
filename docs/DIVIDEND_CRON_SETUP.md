# 🎯 Configuração EasyCron - Alertas de Dividendos

## 📋 Informações do Cron Job

### 🔗 **URL do Endpoint**
```
https://lucasfiialerts.com.br/api/cron/dividend-alerts
```

### ⏰ **Frequência Recomendada**
- **Diário às 09:00 (horário comercial)**
- **Expressão Cron:** `0 9 * * *`

### 🔐 **Autenticação**
- **Header:** `X-Webhook-Secret`
- **Valor:** Mesmo secret usado nos outros cron jobs

---

## 🚀 Passos para Configurar

### 1. **Acessar EasyCron Dashboard**
- Entre em: https://www.easycron.com/
- Faça login na sua conta

### 2. **Criar Novo Cron Job**
- Clique em **"Add Cron Job"**
- Ou **"Create New"**

### 3. **Configurações do Job**

#### **📝 Nome/Descrição:**
```
Alertas de Dividendos - Lucas FII Alerts
```

#### **🔗 URL:**
```
https://lucasfiialerts.com.br/api/cron/dividend-alerts
```

#### **📊 Método:**
```
POST
```

#### **⏰ Schedule (Cron Expression):**
```
0 9 * * *
```
> Executa todos os dias às 09:00 (horário do servidor)

#### **🔐 Headers:**
```
X-Webhook-Secret: SEU_SECRET_AQUI
Content-Type: application/json
```

#### **⚙️ Configurações Avançadas:**
- **Timeout:** 30 segundos
- **Retry:** 2 tentativas
- **Enable:** ✅ Ativado

---

## 🧪 Teste Manual

Antes de ativar, teste o endpoint:

```bash
curl -X POST "https://lucasfiialerts.com.br/api/cron/dividend-alerts?test=true" \
  -H "X-Webhook-Secret: SEU_SECRET" \
  -H "Content-Type: application/json"
```

---

## 📊 Monitoramento

### **✅ Sucesso Esperado:**
```json
{
  "success": true,
  "alertsSent": 0,
  "testMode": false,
  "timestamp": "2025-11-21T12:00:00.000Z",
  "results": []
}
```

### **❌ Possíveis Erros:**
- **401:** Header de autenticação incorreto
- **500:** Erro no processamento
- **Timeout:** Endpoint demorou mais que 30s

---

## 🔧 Configuração Alternativa (Se quiser executar mais vezes)

### **Duas vezes por dia (09:00 e 15:00):**
```
0 9,15 * * *
```

### **Uma vez por semana (Segunda às 09:00):**
```
0 9 * * 1
```

---

## 📱 Como Funciona

1. **09:00 diariamente** → EasyCron chama a API
2. **API verifica** → Busca novos dividendos dos FIIs seguidos
3. **Se encontrar** → Envia WhatsApp automaticamente
4. **Registra no banco** → Evita alertas duplicados
5. **Retorna status** → EasyCron recebe confirmação

---

## ⚠️ Importante

- Use a **mesma chave secreta** dos outros cron jobs
- **Teste primeiro** com `?test=true`
- **Monitor logs** no EasyCron dashboard
- Dividendos são verificados apenas nos **últimos 30 dias**
- Sistema **evita duplicatas** automaticamente

---

## 🎯 Pronto!

Após configurar, o sistema vai:
✅ Detectar novos dividendos automaticamente
✅ Enviar alertas via WhatsApp
✅ Registrar no banco de dados
✅ Evitar spam/duplicatas

**O sistema de dividendos ficará 100% automático!** 🚀💰