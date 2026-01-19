# 📁 Reorganização da Pasta Scripts

## 🎯 Estrutura Proposta

```
scripts/
├── core/                    # Módulos essenciais usados pelas APIs
├── crons/                   # Scripts executados por cron jobs
├── tests/                   # Scripts de teste (mover para lá)
├── deprecated/              # Scripts antigos/não usados (backup)
└── [arquivos root]          # Manter apenas essenciais
```

---

## ✅ CORE - Módulos Essenciais (MANTER E ORGANIZAR)

**Usados ativamente pelas APIs:**

### 1. **core/investidor10.js** (atual: relatorio-investidor10-ia.js)
- ✅ Usado por: `/api/fii/investidor10-check`
- Funções: buscarComunicados, obterLinkPDF, baixarPDF, extrairTextoPDF

### 2. **core/gemini-resumo.js** (atual: gemini-resumo.js)
- ✅ Usado por: múltiplos scripts (investidor10, resumos diários)
- Função: Gerar resumos com IA Gemini

### 3. **core/controle-alertas.js** (atual: controle-alertas.js)
- ✅ Usado por: investidor10-processar-todos.js
- Função: Controlar alertas enviados (evitar duplicatas)

### 4. **core/status-invest-scraper.js** (atual: buscar-comunicados-statusinvest.js)
- ✅ Utilitário para: Buscar comunicados do Status Invest via scraping
- Função: Web scraping de comunicados (usado como CLI tool)

---

## 📡 APIs PRINCIPAIS (NÃO SÃO SCRIPTS, estão em `src/app/api/cron/`)

**Estas APIs NÃO estão na pasta scripts, estão em `src/app/api/cron/`:**

1. **`/api/cron/fii-alerts`** → Alertas de variação de preço
   - Usa: `@/lib/fii-alerts` (em src/lib/)
   
2. **`/api/cron/auto-updates`** → Lista de acompanhamento automática
   - Usa: BrapiService, WhatsApp API
   
3. **`/api/cron/fii-reports`** → Comunicados sem IA (só link)
   - Usa: `/api/fii/monitor-follows` → `/api/fii/investidor10-check`
   - Depende de: `relatorio-investidor10-ia.js`
   
4. **`/api/cron/statusinvest-comunicados`** → Comunicados Status Invest
   - Usa: `@/lib/status-invest-service` (em src/lib/)

5. **`/api/cron/investidor10-relatorios`** → Relatórios COM resumo IA
   - Executa: `scripts/investidor10-processar-todos.js`

---

## 🔄 CRONS - Scripts de Cron Jobs

### 1. **crons/investidor10-processar.js** (atual: investidor10-processar-todos.js)
- ✅ Chamado por: `/api/cron/investidor10-relatorios`
- Função: Processar FIIs e enviar resumos IA

### 2. **crons/resumos-diarios.js** (atual: cron-resumos-diarios.js)
- ✅ Chamado por: `/api/cron/resumos-fii`
- Função: Resumos diários

### 3. **crons/pdf-summary.js** (atual: pdf-summary-cron.js)
- ✅ Chamado por: `/api/cron/pdf-summary`
- Função: Processar PDFs

---

## 🧪 TESTS - Scripts de Teste (MOVER TODOS)

**Mover para `scripts/tests/`:**
- test-bitcoin-alerts.js
- test-complete-fnet-system.js
- test-conditional-alerts.js
- test-dividend-alerts.js
- test-dividend-system.js
- test-fii-alerts.js
- test-fnet-alerts.js
- test-fnet-base-url.js
- test-fnet-correct-url.js
- test-fnet-date-fix.js
- test-fnet-direct.js
- test-fnet-document-access.js
- test-fnet-real-api.js
- test-fnet-relatorios.js
- test-gemini-resumo.js
- test-ia-resumo.js
- test-new-database.js
- test-notify-api.js
- test-pdf-download.js
- test-pdf-system.js
- test-statusinvest-alerts.ts
- test-statusinvest-service.ts
- test-ticker-extraction.js
- test-ultramsg-price.js
- test-user-fii-dividends.js
- test-whatsapp-alerts.js
- test-whatsapp-debug.js
- test-xml-extraction.js
- test-real-dividends.js
- test-report-system.js
- test-db.sh

---

## 🗑️ DEPRECATED - Scripts Antigos (MOVER PARA BACKUP)

**Provavelmente não usados mais:**

### Bitcoin (antigos, substituídos)
- bitcoin-alerts-database.js
- bitcoin-alerts-smart.js
- bitcoin-auto-monitor.js
- bitcoin-monitor.js
- send-bitcoin-alerts-real.js
- send-bitcoin-with-env.js
- setup-bitcoin-cron.sh

### FII Monitor (antigos)
- fii-alert-monitor.js
- fii-monitor.js
- fii-monitor.service
- run-monitor.sh
- setup-auto-monitor.sh
- setup-monitor.sh
- setup-universal-monitor.sh

### Debug/Check (usar se necessário, senão mover)
- check-data-inconsistency.js
- check-fnet-users.js
- check-user-preferences.js
- check-vtlt11-users.js
- check-whatsapp-user.js
- debug-database.js
- debug-fnet-complete.js
- debug-user-fnet-flow.js

### Outros
- verificar-rngo11.js
- verificar-total-documentos-fnet.js
- verificar-usuarios-fnet.js

### Scrapers antigos
- scraper-clubefii-puppeteer.js
- scraper-clubefii.js
- scraper-investidor10.js

### Database/Migration (verificar antes de mover)
- add-test-fii-dividends.js
- apply-dividend-migration.js
- run-dividend-migration.js
- setup-production-db.sh

### Envios diretos (verificar se ainda usa)
- enviar-fnet-direto.js
- enviar-fnet-usuarios-reais.js
- executar-alerta-fnet-real.js
- force-dividend-alert.js
- force-user-fnet-alert.js
- simulate-dividend-alert.js

### Relatórios/Exploração
- buscar-relatorio-fundo.js
- explorar-status-invest.js
- extrair-comunicados-investidor10.js
- extrair-relatorios-statusinvest.js
- fatos-relevantes-ia.js
- resumo-fii-ia.js

### Report Server
- report-server.js
- generate-pdf-report.js

---

## 📋 Arquivos a Manter na Raiz

- **ecosystem.config.json** - Config PM2 (se usar)
- **README.md** - Documentação
- **REORGANIZACAO.md** - Este arquivo

---

## 🚀 Plano de Ação

### Passo 1: Mover Testes (SEGURO)
```bash
mv scripts/test-*.js scripts/tests/
mv scripts/test-*.ts scripts/tests/
mv scripts/test-*.sh scripts/tests/
```

### Passo 2: Mover Deprecated (BACKUP)
```bash
# Revisar lista acima e mover um por um
mv scripts/bitcoin-alerts-database.js scripts/deprecated/
# ... etc
```

### Passo 3: Organizar Core
```bash
mv scripts/relatorio-investidor10-ia.js scripts/core/investidor10.js
mv scripts/gemini-resumo.js scripts/core/gemini-resumo.js
mv scripts/controle-alertas.js scripts/core/controle-alertas.js
mv scripts/buscar-comunicados-statusinvest.js scripts/core/status-invest.js
```

### Passo 4: Organizar Crons
```bash
mv scripts/investidor10-processar-todos.js scripts/crons/investidor10-processar.js
mv scripts/cron-resumos-diarios.js scripts/crons/resumos-diarios.js
mv scripts/pdf-summary-cron.js scripts/crons/pdf-summary.js
```

### Passo 5: Atualizar Imports
- Atualizar `/api/fii/investidor10-check/route.ts`
- Atualizar `/api/cron/investidor10-relatorios/route.ts`
- Atualizar `/api/cron/resumos-fii/route.ts`
- Atualizar `/api/cron/pdf-summary/route.ts`
- Atualizar imports entre scripts

---

## ⚠️ ATENÇÃO

**Antes de deletar qualquer arquivo:**
1. ✅ Verificar se não é usado por nenhuma API
2. ✅ Fazer backup completo da pasta scripts
3. ✅ Testar após cada mudança
4. ✅ Manter deprecated/ por 30 dias antes de deletar

**Scripts para NÃO deletar sem verificar:**
- Qualquer script que apareça em `grep -r "require.*scripts" src/`
- Scripts mencionados em documentação
- Scripts usados manualmente em produção
