# 📊 Configuração EasyCron - Comunicados de FIIs (Status Invest)

## 📋 Informações do Cron Job

### 🔗 **URL do Endpoint**
```
https://lucasfiialerts.com.br/api/cron/statusinvest-comunicados
```

### ⏰ **Frequência Recomendada**
- **2x por dia: 09:00 e 18:00 (horário comercial)**
- **Expressão Cron (manhã):** `0 9 * * *`
- **Expressão Cron (tarde):** `0 18 * * *`

### 🔐 **Autenticação**
- **Header:** `X-Webhook-Secret`
- **Valor:** Mesmo secret usado nos outros cron jobs

---

## 🎯 O que este Cron faz?

Este cron busca **comunicados oficiais** dos FIIs que cada usuário acompanha via **Status Invest** e envia alertas pelo WhatsApp.

### **Tipos de documentos alertados:**
- 📊 **Relatórios Gerenciais** - Análises mensais do fundo
- ⚠️ **Fatos Relevantes** - Informações importantes
- 📋 **Informes Mensais** - Dados periódicos obrigatórios

### **Fluxo:**
1. Busca usuários com `alertPreferencesStatusInvest = true`
2. Para cada usuário, obtém os FIIs que ele segue
3. Faz scraping no Status Invest para cada FII
4. Filtra comunicados das últimas 24h
5. Verifica se já foi enviado (evita duplicatas)
6. Envia via WhatsApp

---

## 🚀 Passos para Configurar no EasyCron

### 1. **Acessar EasyCron Dashboard**
- Entre em: https://www.easycron.com/
- Faça login na sua conta

### 2. **Criar Novo Cron Job**
- Clique em **"Add Cron Job"**

### 3. **Configurações do Job**

#### **📝 Nome/Descrição:**
```
Comunicados FIIs (Status Invest) - Manhã
```

#### **🔗 URL:**
```
https://lucasfiialerts.com.br/api/cron/statusinvest-comunicados
```

#### **📊 Método:**
```
POST
```

#### **⏰ Schedule (Cron Expression):**
```
0 9 * * *
```
> Executa todos os dias às 09:00

#### **🔐 Headers:**
```
X-Webhook-Secret: SEU_SECRET_AQUI
Content-Type: application/json
```

#### **⚙️ Configurações Avançadas:**
- **Timeout:** 120 segundos (pode demorar para muitos FIIs)
- **Retry:** 2 tentativas
- **Enable:** ✅ Ativado

---

### 4. **Criar segundo job para a tarde (opcional)**

Repita os passos acima com:

#### **📝 Nome/Descrição:**
```
Comunicados FIIs (Status Invest) - Tarde
```

#### **⏰ Schedule:**
```
0 18 * * *
```
> Executa todos os dias às 18:00

---

## 🧪 Teste Manual

### Testar busca de comunicados (GET):
```bash
curl "https://lucasfiialerts.com.br/api/cron/statusinvest-comunicados?ticker=KNRI11&dias=7"
```

### Testar envio de alertas (POST):
```bash
curl -X POST "https://lucasfiialerts.com.br/api/cron/statusinvest-comunicados" \
  -H "X-Webhook-Secret: SEU_SECRET" \
  -H "Content-Type: application/json"
```

---

## 📊 Resposta Esperada

### **✅ Sucesso:**
```json
{
  "success": true,
  "totalAlertsSent": 3,
  "results": [
    {
      "userId": "abc123",
      "phone": "1234",
      "comunicados": 2,
      "status": "sent"
    }
  ]
}
```

### **ℹ️ Sem usuários ativos:**
```json
{
  "success": true,
  "message": "Nenhum usuário com alertas de Comunicados habilitados"
}
```

---

## 🔧 Configuração do Usuário

Para receber os alertas, o usuário precisa:

1. ✅ Ter **WhatsApp verificado**
2. ✅ Ter **plano ativo**
3. ✅ Ativar **"Comunicados de FIIs"** na página de Configuração
4. ✅ Ter pelo menos **1 FII** na lista de acompanhamento

---

## 📈 Monitoramento

### Logs esperados no console:
```
[StatusInvest Cron] Iniciando busca de comunicados...
[StatusInvest] Encontrados 5 usuários com alertas de Comunicados
[StatusInvest] Buscando comunicados para 3 FIIs do usuário abc123: KNRI11, HGLG11, MXRF11
[StatusInvest] Encontrados 10 comunicados para KNRI11
[StatusInvest] 2 novos comunicados relevantes para usuário abc123
```

---

## 🆚 Diferença dos outros alertas

| Alerta | Fonte | Conteúdo |
|--------|-------|----------|
| **Comunicados de FIIs** | Status Invest | Relatórios, Fatos Relevantes, Informes (sem IA) |
| **Resumos feitos pela IA** | FNET B3 | Documentos com resumo gerado por IA |
| **Anúncios de Rendimentos** | FNET B3 | Apenas rendimentos/dividendos |

---

## 🗓️ Expressões Cron Alternativas

| Frequência | Expressão | Descrição |
|------------|-----------|-----------|
| 1x/dia manhã | `0 9 * * *` | 09:00 todos os dias |
| 2x/dia | `0 9,18 * * *` | 09:00 e 18:00 |
| 3x/dia | `0 9,14,18 * * *` | 09:00, 14:00 e 18:00 |
| Dias úteis | `0 9 * * 1-5` | 09:00, segunda a sexta |
| A cada 4h | `0 */4 * * *` | 00:00, 04:00, 08:00... |

---

## ✅ Checklist Final

- [ ] Cron job criado no EasyCron
- [ ] URL correta configurada
- [ ] Método POST selecionado
- [ ] Headers configurados (X-Webhook-Secret)
- [ ] Timeout de 120 segundos
- [ ] Teste manual funcionando
- [ ] Job ativado

