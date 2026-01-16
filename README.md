# FII Alerts - Sistema de Monitoramento de Fundos Imobiliários

Sistema avançado para monitoramento e análise de Fundos de Investimento Imobiliário (FII) com múltiplas fontes de dados, sistema de fallback automático e **análise inteligente por IA**.

## 📊 APIs de Descoberta de FII

### 🔍 Busca Completa com Paginação
Descobre **TODOS** os FII do relatoriosfiis.com.br percorrendo todas as páginas:

```bash
# Busca limitada (teste)
GET /api/fii/paginated-discovery?maxPages=10&save=true

# Busca completa (pode demorar)  
GET /api/fii/paginated-discovery?maxPages=100&save=true

# Busca específica
GET /api/fii/paginated-discovery?startPage=50&maxPages=10
```

**Descoberta Atual**: 1.421 páginas com ~21.000 fundos FII únicos!

### 📋 Outras APIs de Descoberta

```bash
# Busca básica (HTMX)
GET /api/fii/reports-htmx-all

# Descoberta com múltiplas estratégias
GET /api/fii/discover-all
```

## 🤖 IA - Análise de Relatórios com Gemini

### Recursos de IA:
- **Resumos Inteligentes**: Análise automática de relatórios PDF
- **Múltiplos Tipos de Análise**: Gerencial, Executiva, Setorial  
- **Processamento em Lote**: Análise de múltiplos FII simultaneamente
- **Comparações Automáticas**: IA compara diferentes fundos
- **Validação Automática**: Verifica se o PDF é realmente um relatório FII

### 🔧 Configuração IA:
```bash
# .env.local
GEMINI_API_KEY=sua_api_key_do_gemini
```

**Obter API Key**: https://ai.google.dev/

### 📊 Endpoints de IA:

#### 1. Resumo Individual
```bash
POST /api/fii/summary
```
```json
{
  "url": "https://relatoriosfiis.com.br/relatorio/HGLG11_2024.pdf",
  "ticker": "HGLG11",
  "promptType": "RELATORIO_GERENCIAL"
}
```

#### 2. Processamento em Lote
```bash
POST /api/fii/batch-summary
```
```json
{
  "tickers": ["HGLG11", "BTLG11", "XPML11"],
  "generateComparison": true
}
```

#### 3. Verificar Status da IA
```bash
GET /api/fii/summary
```

## 📱 Sistema de Notificações WhatsApp

### 🔔 Notificações Automáticas para FIIs Seguidos

O sistema monitora automaticamente novos relatórios dos FIIs que você segue e envia resumos por WhatsApp formatados com IA:

#### 1. Testar Notificação Completa
```bash
POST /api/fii/test-notification
```
```json
{
  "ticker": "HGLG11",
  "userPhone": "+5511999999999"
}
```

#### 2. Enviar Notificação Manual
```bash
POST /api/fii/notify-followers
```
```json
{
  "ticker": "HGLG11",
  "pdfUrl": "https://relatoriosfiis.com.br/report.pdf",
  "reportDate": "15/11/2025",
  "userPhone": "+5511999999999",
  "testMode": true
}
```

#### 3. Monitoramento Automático
```bash
POST /api/fii/monitor-follows
```
```json
{
  "checkLastHours": 24,
  "maxFundsToCheck": 50,
  "sendNotifications": true,
  "testMode": false
}
```

### 📱 Formato da Mensagem WhatsApp:
```
🤖 Resumo feito pela IA do LucasFIIAlerts!
A leitura do documento é obrigatória.

•⁠  ⁠HGLG11 aprovou a 6ª emissão primária de cotas.
•⁠  ⁠Montante: R$ 100 milhões (1.000.000 de cotas).
•⁠  ⁠Preço: R$ 100 por cota; custo de distribuição estimado.
•⁠  ⁠Direito de preferência: fator 0,1937982618233.
•⁠  ⁠Período de preferência: negociação 25/11–03/12.

📱 Acesse lucasfiialerts.com e configure seus alertas.
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
