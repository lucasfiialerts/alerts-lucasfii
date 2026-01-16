# 📄 Sistema de Resumo de PDFs com IA

Sistema automatizado para processar PDFs, extrair texto e gerar resumos inteligentes usando Gemini AI.

## 🎯 Funcionalidades

- ✅ Upload de PDFs via API
- ✅ Extração automática de texto
- ✅ Geração de resumos estruturados com IA
- ✅ Processamento em lote via cron
- ✅ Notificações via WhatsApp (opcional)
- ✅ Histórico de PDFs processados

## 📋 API Endpoint

### POST `/api/chat-ia`

#### Upload de PDF

```bash
curl -X POST http://localhost:3000/api/chat-ia \
  -F "file=@documento.pdf"
```

#### Resposta

```json
{
  "success": true,
  "fileName": "documento.pdf",
  "pageCount": 15,
  "textLength": 8542,
  "summary": "📋 RESUMO EXECUTIVO\n\n[Resumo estruturado gerado pela IA]...",
  "fullText": "Texto completo extraído..."
}
```

## 🔄 Configuração do Cron

### Opção 1: EasyCron (Recomendado)

1. Acesse [EasyCron](https://www.easycron.com/)
2. Crie novo job:
   - **URL**: `https://seu-dominio.com/api/cron/pdf-summary`
   - **Frequency**: A cada 1 hora (ou conforme necessário)
   - **HTTP Method**: POST
   - **Timeout**: 300 segundos

3. Configure webhook para chamar o script:

```javascript
// /api/cron/pdf-summary/route.ts
export async function POST() {
  // Executar script de processamento
  const result = await runPdfProcessing();
  return Response.json(result);
}
```

### Opção 2: Node Cron Local

```javascript
// Adicionar ao seu servidor
const cron = require('node-cron');

// Executar a cada hora
cron.schedule('0 * * * *', () => {
  require('./scripts/pdf-summary-cron').main();
});
```

### Opção 3: Crontab do Sistema

```bash
# Editar crontab
crontab -e

# Adicionar linha (executa a cada hora)
0 * * * * cd /caminho/do/projeto && node scripts/pdf-summary-cron.js >> logs/pdf-cron.log 2>&1
```

## ⚙️ Variáveis de Ambiente

Adicione ao seu `.env`:

```bash
# Pasta onde os PDFs serão monitorados
PDF_WATCH_FOLDER=./public/reports

# URL da API
API_URL=https://seu-dominio.com

# Ativar notificações WhatsApp
WHATSAPP_PDF_ALERTS=true

# Credenciais ZAPI (se usar WhatsApp)
ZAPI_INSTANCE_ID=seu-instance-id
ZAPI_TOKEN=seu-token
```

## 🚀 Uso Manual

### 1. Processar PDF via Script

```bash
# Colocar PDFs em ./public/reports
# Executar script
node scripts/pdf-summary-cron.js
```

### 2. Upload via Frontend

```typescript
// Componente React
async function uploadPdf(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/chat-ia', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  console.log('Resumo:', result.summary);
}
```

### 3. Upload via cURL

```bash
curl -X POST http://localhost:3000/api/chat-ia \
  -H "Content-Type: multipart/form-data" \
  -F "file=@relatorio.pdf"
```

## 📊 Estrutura do Resumo Gerado

A IA gera resumos estruturados com:

1. **📋 RESUMO EXECUTIVO** - Visão geral em 2-3 parágrafos
2. **🔑 PONTOS-CHAVE** - Bullets com tópicos importantes
3. **📊 DADOS E NÚMEROS** - Informações quantitativas
4. **💡 INSIGHTS** - Análises e conclusões
5. **⚠️ PONTOS DE ATENÇÃO** - Alertas importantes

## 📁 Estrutura de Arquivos

```
├── src/app/api/chat-ia/
│   └── route.ts                    # Endpoint principal
├── scripts/
│   └── pdf-summary-cron.js         # Script de processamento
├── logs/
│   ├── processed-pdfs.json         # PDFs já processados
│   └── pdf-summaries/              # Resumos salvos
│       └── documento-summary.json
└── public/reports/                 # Pasta de PDFs
```

## 🔍 Monitoramento

### Ver logs do cron

```bash
tail -f logs/pdf-cron.log
```

### Ver PDFs processados

```bash
cat logs/processed-pdfs.json
```

### Ver resumos gerados

```bash
ls -la logs/pdf-summaries/
cat logs/pdf-summaries/documento-summary.json
```

## 🛠️ Troubleshooting

### PDF não está sendo processado

1. Verificar se o arquivo está na pasta correta
2. Verificar permissões da pasta
3. Conferir logs: `logs/pdf-cron.log`

### Erro ao extrair texto

- Alguns PDFs são imagens escaneadas (precisam OCR)
- Verificar se o PDF não está protegido por senha

### Resumo muito genérico

- Ajustar o prompt no arquivo `route.ts`
- Usar modelo mais avançado: `gemini-2.5-pro-exp`

## 📱 Integração WhatsApp

Para ativar notificações:

1. Configure as variáveis ZAPI no `.env`
2. Ative: `WHATSAPP_PDF_ALERTS=true`
3. O script enviará resumo automático

## 🎛️ APIs de Cron Recomendadas

### 1. **EasyCron** (Já usado no projeto)
- ✅ Interface visual
- ✅ Logs detalhados
- ✅ Retry automático
- 💰 Plano grátis: 10 jobs

### 2. **Cron-job.org**
- ✅ Simples de usar
- ✅ Notificações por email
- 💰 100% gratuito

### 3. **GitHub Actions**
```yaml
# .github/workflows/pdf-summary.yml
name: Process PDFs
on:
  schedule:
    - cron: '0 * * * *'  # A cada hora
  workflow_dispatch:

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: node scripts/pdf-summary-cron.js
```

### 4. **Vercel Cron** (Se usar Vercel)
```typescript
// vercel.json
{
  "crons": [{
    "path": "/api/cron/pdf-summary",
    "schedule": "0 * * * *"
  }]
}
```

## 📈 Melhorias Futuras

- [ ] OCR para PDFs escaneados
- [ ] Suporte para múltiplos idiomas
- [ ] Dashboard de PDFs processados
- [ ] Categorização automática
- [ ] Busca em resumos antigos
- [ ] Export para Notion/Obsidian

## 🔐 Segurança

- ✅ Validar tipo de arquivo
- ✅ Limitar tamanho (max 10MB)
- ✅ Sanitizar nomes de arquivo
- ✅ Usar autenticação na API
- ✅ Rate limiting

## 📚 Dependências

```json
{
  "pdf-parse": "^2.4.5",    // ✅ Já instalado
  "ai": "^5.0.95",           // ✅ Já instalado
  "@ai-sdk/google": "^2.0.38" // ✅ Já instalado
}
```

## 💡 Casos de Uso

1. **Relatórios Financeiros** - Resumos automáticos de demonstrativos
2. **Relatórios FII** - Análise de relatórios gerenciais
3. **Notícias** - Digest de artigos em PDF
4. **Contratos** - Extração de pontos principais
5. **Papers** - Resumos de artigos acadêmicos

---

**Data de Criação:** Janeiro 2026  
**Status:** ✅ Ativo  
**Manutenção:** Automática via EasyCron
