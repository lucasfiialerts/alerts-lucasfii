# 🔍 APIs e seus Scripts - Análise Detalhada

## ❌ APIs que NÃO USAM scripts da pasta scripts/

### 1. `/api/cron/fii-alerts` - Alertas de Variação ⚡
```typescript
// Localização: src/app/api/cron/fii-alerts/route.ts

import { fiiAlertService } from '@/lib/fii-alerts';
// ⬆️ USA APENAS src/lib/fii-alerts.ts (NÃO é script)

❌ NÃO USA nenhum script da pasta scripts/
✅ USA código interno: src/lib/fii-alerts.ts
✅ USA código interno: src/lib/brapi.ts
```

**Por que é importante:**
- Monitora variação de preço dos FIIs
- Envia alertas quando ultrapassa threshold configurado
- Roda durante horário de pregão (9h-17h)

---

### 2. `/api/cron/auto-updates` - Lista Automática 🔄
```typescript
// Localização: src/app/api/cron/auto-updates/route.ts

import { db } from '@/db';
import { BrapiService } from '@/lib/brapi';
// ⬆️ USA APENAS código interno TypeScript

❌ NÃO USA nenhum script da pasta scripts/
✅ USA código interno: src/lib/brapi.ts (BrapiService)
✅ USA código interno: src/db/schema.ts
```

**Por que é importante:**
- Envia lista de acompanhamento automática
- Busca preços atuais via BRAPI
- Envia resumo dos FIIs que o usuário segue

---

## ✅ APIs que USAM scripts da pasta scripts/

### 3. `/api/cron/fii-reports` - Comunicados SEM IA 📄
```
Fluxo completo:

/api/cron/fii-reports
  ↓
/api/fii/monitor-follows
  ↓
/api/fii/investidor10-check ← AQUI USA O SCRIPT!
  ↓
require('scripts/relatorio-investidor10-ia.js')
  ├─ buscarComunicados()
  ├─ obterLinkPDF()
  └─ (NÃO baixa PDF, NÃO extrai texto)
```

**Scripts usados:**
```javascript
✅ scripts/relatorio-investidor10-ia.js
   ├─ buscarComunicados(ticker)
   └─ obterLinkPDF(url)
   
❌ NÃO USA: baixarPDF()
❌ NÃO USA: extrairTextoPDF()
❌ NÃO USA: gemini-resumo.js
```

**Por que é importante:**
- Busca novos relatórios no Investidor10
- Envia apenas o link do PDF (sem IA)
- Rápido e direto

---

### 4. `/api/cron/investidor10-relatorios` - Relatórios COM IA 🤖
```typescript
// Localização: src/app/api/cron/investidor10-relatorios/route.ts

execAsync('node scripts/investidor10-processar-todos.js --enviar')
// ⬆️ EXECUTA SCRIPT EXTERNO!
```

**Scripts usados (cadeia completa):**
```javascript
✅ scripts/investidor10-processar-todos.js (PRINCIPAL)
   │
   ├─ require('./relatorio-investidor10-ia.js')
   │   ├─ buscarComunicados(ticker)
   │   ├─ obterLinkPDF(url)
   │   ├─ baixarPDF(linkPDF) ← BAIXA O PDF
   │   └─ extrairTextoPDF(buffer) ← EXTRAI TEXTO
   │
   ├─ require('./gemini-resumo.js')
   │   └─ gerarResumoInteligente(ticker, texto) ← IA GEMINI
   │
   └─ require('./controle-alertas.js')
       ├─ jaEnviouAlerta()
       └─ registrarAlertaEnviado()
```

**Por que é importante:**
- Baixa e lê o PDF completo
- Gera resumo inteligente com IA
- Envia análise detalhada
- Sistema mais completo

---

### 5. `/api/cron/statusinvest-comunicados` - Status Invest 📊
```typescript
// Localização: src/app/api/cron/statusinvest-comunicados/route.ts

import { getComunicadosRecentes } from '@/lib/status-invest-service';
// ⬆️ USA APENAS código TypeScript interno

❌ NÃO USA nenhum script da pasta scripts/
✅ USA código interno: src/lib/status-invest-service.ts
```

**Por que é importante:**
- Busca comunicados no Status Invest
- Scraping direto via TypeScript
- Não precisa de scripts externos

---

## 📊 Resumo: Scripts Necessários

### Scripts CRÍTICOS (usados por APIs):
```
1. ✅ relatorio-investidor10-ia.js
   └─ Usado por: /api/fii/investidor10-check
   └─ Usado por: investidor10-processar-todos.js
   
2. ✅ investidor10-processar-todos.js
   └─ Usado por: /api/cron/investidor10-relatorios
   
3. ✅ gemini-resumo.js
   └─ Usado por: investidor10-processar-todos.js
   
4. ✅ controle-alertas.js
   └─ Usado por: investidor10-processar-todos.js
```

### APIs que NÃO precisam de scripts:
```
❌ /api/cron/fii-alerts → usa src/lib/fii-alerts.ts
❌ /api/cron/auto-updates → usa src/lib/brapi.ts
❌ /api/cron/statusinvest-comunicados → usa src/lib/status-invest-service.ts
```

---

## 🎯 Conclusão

### APIs com Scripts (2):
1. **fii-reports** → usa `relatorio-investidor10-ia.js` (parcial)
2. **investidor10-relatorios** → usa 4 scripts (completo com IA)

### APIs sem Scripts (3):
1. **fii-alerts** → código TypeScript interno
2. **auto-updates** → código TypeScript interno
3. **statusinvest-comunicados** → código TypeScript interno

### Scripts Essenciais (4):
1. `relatorio-investidor10-ia.js` - Scraping + PDF
2. `investidor10-processar-todos.js` - Orquestrador
3. `gemini-resumo.js` - IA Gemini
4. `controle-alertas.js` - Anti-duplicatas

**Total de scripts na pasta**: 87 arquivos
**Scripts realmente usados**: 4 arquivos (4.6%)
**Scripts que podem ir para deprecated**: ~50 arquivos (~57%)
**Scripts de teste que podem ir para tests/**: ~30 arquivos (~34%)
