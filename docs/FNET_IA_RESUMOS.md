# 📄 Sistema de Resumo Automático com IA - FNET

## 🎯 Como Funciona o `alertPreferencesFnet`

Quando o usuário ativa **"Resumos feitos pela IA"** nas configurações, o sistema:

### 1️⃣ **API Usada**: FNET B3 (API Oficial da B3)
```
https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados
```

**O que busca:**
- 📋 Fatos Relevantes
- 📊 Relatórios Gerenciais
- 📄 Informes Mensais/Trimestrais
- 🏛️ Documentos Oficiais dos FIIs

### 2️⃣ **Processamento Automático**

```javascript
// Script principal
scripts/fatos-relevantes-ia.js

// IA para resumos
scripts/gemini-resumo.js

// API do Cron
src/app/api/cron/fnet-alerts/route.ts
```

### 3️⃣ **Fluxo Completo**

```
┌─────────────────────┐
│  1. FNET B3 API     │
│  Busca documentos   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  2. Download        │
│  PDFs/XMLs          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  3. Extração        │
│  pdf-parse          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  4. IA - Gemini     │
│  Gera Resumo        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  5. WhatsApp        │
│  Envia para usuário │
└─────────────────────┘
```

### 4️⃣ **Exemplo de Resumo Gerado**

```
🏛️ *Novo Documento FNet B3*

📄 *Relatório Gerencial*
🏢 BTLG11 - BTG Pactual Logística
📅 11/2024

📋 RESUMO EXECUTIVO:
O fundo apresentou crescimento patrimonial de 5,2% 
no período, com vacância estável em 3,1%. Destaque 
para novos contratos de locação com empresas de 
e-commerce, fortalecendo o portfólio.

💰 DADOS FINANCEIROS:
• Patrimônio: R$ 1,2 bilhão
• Rendimento: R$ 0,95/cota
• Dividend Yield: 0,89%

⚠️ PONTOS DE ATENÇÃO:
• Renegociação de 2 contratos importantes
• Obras de manutenção previstas para Q1/2025

🤖 Resumo gerado automaticamente com IA ✨
```

## ⚙️ Configuração do Cron

### EasyCron (Recomendado - Você já usa!)

**Endpoint:**
```
POST https://seu-dominio.com/api/cron/fnet-alerts
```

**Configurações:**
- **Frequência**: A cada 2 horas (ou conforme preferir)
- **Timeout**: 300 segundos
- **Method**: POST
- **Header**: `Authorization: Bearer SEU_CRON_SECRET`

### Variáveis de Ambiente Necessárias

```bash
# API do Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=sua-chave-aqui

# WhatsApp (ZAPI)
ZAPI_TOKEN=seu-token
ZAPI_INSTANCE=sua-instancia

# Segurança do Cron
CRON_SECRET=seu-secret-para-autenticar-cron

# URL da aplicação
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

## 🚀 Como Testar

### 1. Testar localmente
```bash
npm run dev

# Em outro terminal
node scripts/fatos-relevantes-ia.js
```

### 2. Testar via API
```bash
curl -X POST http://localhost:3000/api/cron/fnet-alerts \
  -H "Authorization: Bearer SEU_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### 3. Verificar usuários com FNet ativo
```bash
node scripts/debug-fnet-complete.js
```

## 📊 Banco de Dados

### Tabela: users

```sql
-- Campo que controla o alerta
alertPreferencesFnet BOOLEAN DEFAULT FALSE
```

**Quando TRUE:**
- Sistema busca documentos automaticamente
- IA processa e resume
- Envia via WhatsApp

**Quando FALSE:**
- Usuário não recebe resumos de documentos

## 🎨 Interface do Usuário

Local: `src/app/configuration/components/configuration-page.tsx`

```tsx
<Switch
  checked={fnetDocumentos && hasActivePlan}
  onCheckedChange={setFnetDocumentos}
  disabled={!hasActivePlan}
/>
```

**Requisitos:**
- ✅ Plano ativo
- ✅ WhatsApp verificado
- ✅ Seguir pelo menos 1 FII

## 🔍 Logs e Monitoramento

### Ver documentos processados
```bash
cat logs/processed-fnet-docs.json
```

### Ver cache de documentos
```bash
ls -la logs/fnet-cache/
```

### Logs do cron
```bash
# Se usando PM2
pm2 logs fnet-alerts

# Se usando script direto
tail -f logs/fnet-cron.log
```

## 📈 Otimizações Ativas

1. **Cache de documentos** - Não processa o mesmo documento 2x
2. **Rate limiting** - 3 segundos entre documentos
3. **Batch processing** - Máximo 5 documentos por execução
4. **Fallback automático** - Se IA falhar, usa resumo baseado em regras

## 🛠️ Troubleshooting

### Usuário não recebe alertas

```bash
# Verificar se está ativo
SELECT email, alertPreferencesFnet, whatsappVerified 
FROM users 
WHERE id = 'USER_ID';

# Verificar FIIs seguidos
SELECT f.ticker 
FROM user_fii_follows uf
JOIN fii_funds f ON uf.fund_id = f.id
WHERE uf.user_id = 'USER_ID';
```

### IA não está gerando resumos

```bash
# Verificar chave do Gemini
echo $GOOGLE_GENERATIVE_AI_API_KEY

# Testar IA diretamente
node scripts/gemini-resumo.js
```

### FNET não retorna documentos

```bash
# Testar API manualmente
curl "https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados?tipoBusca=0&tipoDocumento=1&d=1&s=0&l=10"
```

## 📝 Próximas Melhorias

- [ ] Filtrar por tipo de documento (relatório, fato relevante, etc)
- [ ] Notificação em tempo real (webhook do FNET)
- [ ] Dashboard de documentos processados
- [ ] Histórico de resumos gerados
- [ ] Export de resumos para PDF

---

**Mantido por:** Sistema LucasFII Alerts  
**Última atualização:** Janeiro 2026  
**Status:** ✅ Ativo em Produção
