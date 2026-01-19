# 🏗️ Arquitetura do Sistema de Alertas

## 📊 Visão Geral das APIs de Cron

```
┌─────────────────────────────────────────────────────────────┐
│                    APIS DE CRON (5 principais)              │
└─────────────────────────────────────────────────────────────┘

1. /api/cron/fii-alerts ⚡
   └─> Alertas de variação de preço
   └─> Usa: src/lib/fii-alerts.ts
   └─> Preferência: alertPreferencesVariation
   └─> Sem scripts externos

2. /api/cron/auto-updates 🔄
   └─> Lista de acompanhamento automática
   └─> Usa: BrapiService + WhatsApp API
   └─> Preferência: alertPreferencesAutoUpdate
   └─> Sem scripts externos

3. /api/cron/fii-reports 📄 (SEM IA)
   └─> Comunicados apenas com link do PDF
   └─> Fluxo: fii-reports → monitor-follows → investidor10-check
   └─> Script: scripts/relatorio-investidor10-ia.js
   └─> Preferência: alertPreferencesReports
   └─> Mensagem: Link direto do PDF (sem resumo)

4. /api/cron/statusinvest-comunicados 📊
   └─> Comunicados do Status Invest
   └─> Usa: src/lib/status-invest-service.ts
   └─> Preferência: alertPreferencesStatusInvest
   └─> Sem scripts externos na pasta scripts/

5. /api/cron/investidor10-relatorios 🤖 (COM IA)
   └─> Relatórios COM resumo inteligente
   └─> Script Principal: scripts/investidor10-processar-todos.js
   └─> Preferência: alertPreferencesFnet
   └─> Mensagem: Resumo IA Gemini + Link PDF
```

---

## 🔗 Dependências dos Scripts

```
scripts/investidor10-processar-todos.js (PRINCIPAL - usado por API)
├── scripts/relatorio-investidor10-ia.js
│   ├── buscarComunicados()
│   ├── obterLinkPDF()
│   ├── baixarPDF()
│   └── extrairTextoPDF()
├── scripts/gemini-resumo.js
│   └── gerarResumoInteligente() → IA Gemini
└── scripts/controle-alertas.js
    ├── jaEnviouAlerta()
    ├── registrarAlertaEnviado()
    └── buscarFIIsAcompanhados()

scripts/relatorio-investidor10-ia.js (CORE - usado por API fii-reports)
├── buscarComunicados() → Scraping Investidor10
├── obterLinkPDF() → Seguir redirects
├── baixarPDF() → Download do arquivo
└── extrairTextoPDF() → Extração (opcional, precisa pdfreader)

scripts/gemini-resumo.js (CORE - IA)
└── gerarResumoInteligente() → Google Gemini 2.5 Flash

scripts/controle-alertas.js (CORE - Sistema de controle)
└── Gerencia duplicatas de alertas

scripts/buscar-comunicados-statusinvest.js (UTILITÁRIO)
└── CLI tool para buscar comunicados (não usado por APIs)
```

---

## 📦 O que cada sistema envia para o usuário

### 1. **FII Alerts** (Variação de Preço)
```
🟢 Alerta de Alta!

📊 HGLG11
💰 Cotação atual: R$ 150,00
📈 Variação: +2,50%

🚀 Subiu!

Acompanhe em: https://lucasfiialerts.com.br
```

### 2. **Auto Updates** (Lista de Acompanhamento)
```
📌 Lista de acompanhamento que você segue

🟢 +2.50% - HGLG11 – R$ 150.00
🔴 -1.20% - VISC11 – R$ 95.50

Acompanhe em: https://lucasfiialerts.com.br

Este é um alerta automático baseado nas suas configurações.
```

### 3. **FII Reports** (SEM IA - Só Link)
```
📊 Relatório Gerencial
HGRU11

📅 Data: 16/01/2026

🔗 Acesse o documento:
https://fnet.bmfbovespa.com.br/...

Acompanhe em: https://lucasfiialerts.com.br

Este é um alerta automático baseado nas suas configurações.
```

### 4. **Status Invest Comunicados**
```
📊 Relatório Gerencial - HGLG11
📅 16/01/2026

📄 Descrição do comunicado...

🔗 https://statusinvest.com.br/...

Acompanhe em: https://lucasfiialerts.com.br
```

### 5. **Investidor10 Relatórios** (COM IA)
```
📊 Relatório Gerencial - HGRU11
📅 Data: 16/01/2026

🤖 RESUMO INTELIGENTE DA IA:

O fundo apresentou crescimento de 5% no patrimônio 
líquido no último trimestre, atingindo R$ 2,5 bilhões.
Os rendimentos distribuídos foram de R$ 1,20 por cota,
representando um yield de 0,8% no mês.

📌 Pontos principais:
• Patrimônio: R$ 2,5 bi (+5%)
• Rendimento: R$ 1,20/cota
• Ocupação: 98%

🤖 Resumo gerado pela IA da LucasFII Alerts

🔗 Documento: https://investidor10.com.br/...
```

--- 

## 🔧 Scripts que DEVEM permanecer

### Core (Essenciais para APIs)
```
✅ relatorio-investidor10-ia.js    → Scraping + PDF
✅ gemini-resumo.js                → IA Gemini
✅ controle-alertas.js             → Anti-duplicatas
✅ investidor10-processar-todos.js → Processador principal
```

### Crons (Executados periodicamente)
```
✅ cron-resumos-diarios.js  → Resumos diários
✅ pdf-summary-cron.js      → Processar PDFs
```

### Utilitários (Ferramentas CLI)
```
⚙️ buscar-comunicados-statusinvest.js → CLI para teste manual
```

---

## 🗑️ Scripts que podem ser movidos para deprecated/

- Tudo que começa com `test-*`
- Scripts de bitcoin antigos
- Scripts de monitor antigos
- Scripts de debug que não são mais usados
- Scrapers antigos (clubefii, etc)

**Total de arquivos**: 87
**Essenciais**: ~6-8 arquivos
**Testes**: ~30 arquivos
**Deprecated**: ~45-50 arquivos
