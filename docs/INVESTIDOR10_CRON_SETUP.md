# 🔄 Configuração de Cron - Investidor10 Relatórios

Automatize o processamento de **Relatórios Gerenciais** de FIIs do Investidor10 com envio automático via WhatsApp.

## 📡 API Endpoint

```
GET /api/cron/investidor10-relatorios
```

### Parâmetros

| Parâmetro | Tipo | Descrição | Obrigatório |
|-----------|------|-----------|-------------|
| `secret` | string | Chave de segurança (WEBHOOK_SECRET) | ✅ Sim |
| `limite` | number | Quantidade de FIIs a processar | ❌ Não (padrão: todos) |
| `teste` | boolean | Modo teste (não envia mensagens) | ❌ Não |

### Exemplos de URLs

```bash
# Processar 10 FIIs e enviar alertas
https://seu-dominio.com/api/cron/investidor10-relatorios?secret=seu_secret&limite=10

# Processar todos os 50 FIIs
https://seu-dominio.com/api/cron/investidor10-relatorios?secret=seu_secret

# Modo teste (não envia WhatsApp)
https://seu-dominio.com/api/cron/investidor10-relatorios?secret=seu_secret&limite=5&teste=true
```

## ⚙️ Configuração no EasyCron

### 1. Criar Novo Cron Job

1. Acesse: https://www.easycron.com/user/cronjob
2. Clique em **"+ Add Cron Job"**

### 2. Configurações Recomendadas

**Para Relatórios Mensais:**
```
Nome: Investidor10 - Relatórios Gerenciais
URL: https://seu-dominio.vercel.app/api/cron/investidor10-relatorios?secret=seu_webhook_secret&limite=10
Cron Expression: 0 19 * * * (Diariamente às 19h)
Timeout: 1800 (30 minutos)
```

**Cron Expressions:**
```bash
# Diariamente às 19h (verificar novos relatórios)
0 19 * * *

# Segunda a Sexta às 19h (apenas dias úteis)
0 19 * * 1-5

# Toda segunda às 20h (processamento semanal)
0 20 * * 1

# Primeiro dia do mês às 10h (mensal)
0 10 1 * *
```

### 3. Configurações Avançadas

```
HTTP Method: GET
Timeout: 1800 segundos (30 min)
Email Notifications: On Failure
Retry on Failure: 2 vezes com intervalo de 5 min
```

## 🌐 Alternativas ao EasyCron

### **1. Cron-Job.org** (Gratuito)
```
URL: https://cron-job.org
Plano Free: 5 minutos de intervalo mínimo
Configuração:
  - URL: sua API
  - Interval: Custom (cron expression)
  - Notifications: Email on failure
```

### **2. UptimeRobot** (Gratuito com limitações)
```
URL: https://uptimerobot.com
Plano Free: Intervalo mínimo de 5 minutos
Tipo: HTTP(s)
URL: sua API endpoint
Intervalo: Custom (5-60 min)
```

### **3. GitHub Actions** (Gratuito)
```yaml
# .github/workflows/investidor10-relatorios.yml
name: Investidor10 Relatórios
on:
  schedule:
    - cron: '0 19 * * *'  # Diariamente às 19h UTC
  workflow_dispatch:

jobs:
  processar:
    runs-on: ubuntu-latest
    steps:
      - name: Processar Relatórios
        run: |
          curl -f "https://seu-dominio.com/api/cron/investidor10-relatorios?secret=${{ secrets.WEBHOOK_SECRET }}&limite=10"
```

### **4. Vercel Cron** (Nativo)
```ts
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/investidor10-relatorios?secret=$WEBHOOK_SECRET&limite=10",
      "schedule": "0 19 * * *"
    }
  ]
}
```

## 🔧 Configuração Local (Para Desenvolvimento)

### Usando crontab (Linux/Mac)

```bash
# Editar crontab
crontab -e

# Adicionar linha (exemplo: diariamente às 19h)
0 19 * * * cd /caminho/projeto && node scripts/investidor10-processar-todos.js --enviar --limite=10 >> logs/cron.log 2>&1
```

### Usando PM2 (Recomendado para servidor próprio)

```bash
# Instalar PM2
npm install -g pm2

# Criar arquivo de config
cat > ecosystem-investidor10.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'investidor10-relatorios',
    script: 'scripts/investidor10-processar-todos.js',
    args: '--enviar --limite=10',
    cron_restart: '0 19 * * *',  // Diariamente às 19h
    autorestart: false,
    watch: false,
    max_memory_restart: '500M'
  }]
};
EOF

# Iniciar com PM2
pm2 start ecosystem-investidor10.config.js

# Ver logs
pm2 logs investidor10-relatorios

# Salvar configuração
pm2 save
pm2 startup
```

## 📊 Monitoramento e Logs

### Ver logs da API

```bash
# Vercel
vercel logs

# Logs locais
tail -f logs/investidor10-processamento-*.json
```

### Resposta de Sucesso

```json
{
  "success": true,
  "message": "Relatórios processados com sucesso",
  "stats": {
    "fiis_processados": 10,
    "mensagens_enviadas": 3,
    "duracao_segundos": 245.67,
    "modo": "producao",
    "timestamp": "2026-01-05T19:00:00.000Z"
  },
  "output": "..."
}
```

### Resposta de Erro

```json
{
  "success": false,
  "error": "Script execution failed",
  "stderr": "...",
  "stdout": "..."
}
```

## 🎯 Estratégias Recomendadas

### **Estratégia 1: Processamento Incremental** (Recomendado)
```
Frequência: Diária (19h)
FIIs por execução: 10
Rodadas: Rotacionar entre grupos de FIIs
Benefício: Menor carga, mais confiável
```

### **Estratégia 2: Processamento Completo Semanal**
```
Frequência: Semanal (Segunda 20h)
FIIs por execução: Todos (50)
Benefício: Garante que todos sejam processados
```

### **Estratégia 3: Sob Demanda**
```
Frequência: Manual via API
Uso: Processar FIIs específicos quando necessário
Benefício: Controle total
```

## 🔒 Segurança

### Variáveis de Ambiente (.env)

```bash
# Adicionar ao .env
WEBHOOK_SECRET="sua-chave-secreta-aqui-123456"
ULTRAMSG_TOKEN="seu_token"
ULTRAMSG_INSTANCE="instance123"
GOOGLE_GENERATIVE_AI_API_KEY="sua_api_key"
```

### Headers de Segurança (Opcional)

```ts
// Adicionar header customizado
const response = await fetch(url, {
  headers: {
    'X-API-Key': process.env.API_KEY,
    'User-Agent': 'LucasFII-Cron/1.0'
  }
});
```

## 🧪 Testar API

### cURL

```bash
# Teste simples (3 FIIs, modo teste)
curl "http://localhost:3000/api/cron/investidor10-relatorios?secret=fii-alerts-webhook-2025-secure-key&limite=3&teste=true"

# Produção (10 FIIs, enviar alertas)
curl "https://seu-dominio.com/api/cron/investidor10-relatorios?secret=seu_secret&limite=10"
```

### Postman

```
Method: GET
URL: http://localhost:3000/api/cron/investidor10-relatorios
Params:
  - secret: fii-alerts-webhook-2025-secure-key
  - limite: 5
  - teste: true
```

## 📈 Otimizações

### Processar em Paralelo (Para muitos FIIs)

```ts
// Dividir em batches
const batches = [
  ['HGLG11', 'KNRI11', 'BTLG11'],
  ['XPLG11', 'VISC11', 'MXRF11'],
  // ...
];

// Processar cada batch em horários diferentes
// Batch 1: 19h
// Batch 2: 21h
// Batch 3: 23h
```

### Cache de Relatórios Já Processados

```ts
// Salvar hash do PDF para evitar reprocessamento
const processedCache = new Map();
if (processedCache.has(pdfHash)) {
  console.log('Relatório já processado, pulando...');
  return;
}
```

## ❓ Troubleshooting

### Timeout
```
Problema: API retorna timeout
Solução: 
  - Reduzir --limite (processar menos FIIs)
  - Aumentar timeout no EasyCron (1800s)
  - Usar strategy incremental
```

### Erro 401 Unauthorized
```
Problema: Secret inválido
Solução: Verificar WEBHOOK_SECRET no .env
```

### Erro 500 Internal Error
```
Problema: Script falhou
Solução: 
  - Verificar logs: tail -f logs/*.json
  - Testar manualmente: npm run investidor10:processar
  - Verificar credenciais UltraMsg
```

## 📚 Recursos Relacionados

- [INVESTIDOR10_RELATORIOS.md](./INVESTIDOR10_RELATORIOS.md) - Documentação completa
- [EASYCRON_AUTO_UPDATES.md](./EASYCRON_AUTO_UPDATES.md) - Config geral EasyCron
- [FNET_B3_INTEGRATION.md](./FNET_B3_INTEGRATION.md) - Sistema FNET alternativo

---

**Desenvolvido para LucasFII Alerts** 🚀
