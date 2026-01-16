# Sistema de Alertas de FIIs via WhatsApp

Este sistema permite que usuários recebam alertas automatizados no WhatsApp sobre variações nas cotações de Fundos Imobiliários (FIIs).

## 🚀 Funcionalidades Implementadas

### 1. **Estrutura de Banco de Dados**

**Novas Tabelas:**
- `fii_price_history` - Histórico de cotações dos FIIs
- `fii_alert_log` - Log de alertas enviados
- Campos adicionais em `user_fii_follow` para configurações de alertas

### 2. **API de Integração com BRAPI**

- **Serviço:** `src/lib/brapi.ts`
- **API Route:** `/api/fii/quotes`
- **Funcionalidades:**
  - Busca cotações em tempo real
  - Formata preços e variações
  - Calcula emojis baseados na variação
  - Suporte a múltiplos FIIs por requisição

### 3. **Sistema de Alertas Inteligente**

- **Serviço:** `src/lib/fii-alerts.ts`
- **Funcionalidades:**
  - Monitora variações percentuais configuráveis
  - Previne spam (mínimo 1 hora entre alertas)
  - Salva histórico de preços
  - Gera mensagens personalizadas

### 4. **Integração com WhatsApp**

- **APIs:** UltraMsg (principal) + Z-API (fallback)
- **Mensagem de exemplo:**
```
� Alerta de Alta!

📊 KNIP11 - Kinea Indices Precos FII
💰 Cotação atual: R$ 87,57
📈 Variação: +2,01%

🚀 Subiu!

Acompanhe em: https://lucasfiialerts.com.br

Este é um alerta automático baseado nas suas configurações.
```

**Para quedas:**
```
📉 Alerta de Baixa!

📊 GGRC11 - GGR Covepi Renda FII
💰 Cotação atual: R$ 9,90
📈 Variação: -0,30%

🔻 Caiu!

Acompanhe em: https://lucasfiialerts.com.br

Este é um alerta automático baseado nas suas configurações.
```

### 5. **Sistema de Monitoramento**

**Scripts disponíveis:**
```bash
# Verificar alertas uma vez (modo teste)
npm run monitor:fii:test

# Enviar alertas uma vez
npm run monitor:fii

# Monitoramento contínuo (a cada 15 minutos)
npm run monitor:fii:watch
```

### 6. **Gerenciamento de Watchlist**

- **Actions:** Adicionar/buscar FIIs da watchlist
- **Componente:** `FiiWatchlistManager` para interface do usuário
- **Validações:** Verifica se FII existe na BRAPI antes de adicionar

## 📊 Como Funciona

### Fluxo de Alertas:

1. **Monitoramento** → Script executa periodicamente
2. **Busca de Usuários** → Identifica usuários com alertas ativos
3. **Consulta BRAPI** → Busca cotações atuais dos FIIs
4. **Análise de Variação** → Compara com threshold configurado
5. **Filtro Anti-spam** → Verifica último alerta enviado
6. **Envio WhatsApp** → Envia mensagem formatada
7. **Log** → Registra alerta no banco de dados

### Configurações por Usuário:

- **Threshold de Variação:** Padrão 2% (configurável)
- **Frequência:** Daily, Hourly, Realtime
- **Ativar/Desativar:** Por FII individual
- **WhatsApp:** Deve estar verificado

## 🔧 APIs Criadas

### 1. `/api/fii/quotes`
```typescript
GET /api/fii/quotes?tickers=KNIP11,VTLT11
POST /api/fii/quotes { "tickers": ["KNIP11", "VTLT11"] }
```

### 2. `/api/fii/send-alerts`
```typescript
GET  /api/fii/send-alerts  // Verificar alertas
POST /api/fii/send-alerts // Processar e enviar alertas
```

### 3. `/api/whatsapp/send-alert`
```typescript
POST /api/whatsapp/send-alert {
  "phoneNumber": "5511999999999",
  "message": "...",
  "userId": "...",
  "ticker": "KNIP11"
}
```

### 4. `/api/user/[userId]/whatsapp-data`
```typescript
GET /api/user/123/whatsapp-data
```

## 🎯 Server Actions

### 1. `addFiiToWatchlist`
```typescript
import { addFiiToWatchlist } from '@/actions/add-fii-to-watchlist';

const result = await addFiiToWatchlist('KNIP11');
```

### 2. `getUserFiiWatchlist`
```typescript
import { getUserFiiWatchlist } from '@/actions/get-user-fii-watchlist';

const { fiis } = await getUserFiiWatchlist();
```

## 📱 Exemplo de Uso

### 1. Adicionar FII à Watchlist
```typescript
const result = await addFiiToWatchlist('KNIP11');
if (result.success) {
  console.log('FII adicionado!', result.fii);
}
```

### 2. Buscar Cotações
```typescript
const response = await fetch('/api/fii/quotes?tickers=KNIP11,VTLT11');
const { data } = await response.json();
// data[0].formattedPrice = "R$ 87,57"
// data[0].emoji = "🚀"
```

### 3. Executar Monitoramento
```bash
# Teste (sem enviar WhatsApp)
MONITOR_TEST_MODE=true npm run monitor:fii

# Produção (envia WhatsApp)
npm run monitor:fii
```

## 🔒 Segurança e Validações

- **Autenticação:** Todas as actions verificam sessão do usuário
- **Validação de Ticker:** Formato XXXX11 obrigatório
- **Verificação BRAPI:** Confirma se FII existe antes de adicionar
- **Anti-spam:** Máximo 1 alerta por FII por hora
- **WhatsApp Verificado:** Só envia para números verificados

## 🚀 Deploy e Configuração

### Variáveis de Ambiente Necessárias:
```env
# BRAPI
BRAPI_TOKEN=seu_token_brapi
NEXT_PUBLIC_BRAPI_TOKEN=seu_token_brapi

# WhatsApp (UltraMsg recomendado)
ULTRAMSG_TOKEN=seu_token
ULTRAMSG_INSTANCE=sua_instancia

# Opcional (Z-API como fallback)
ZAPI_TOKEN=seu_token
ZAPI_INSTANCE=sua_instancia

# URL da aplicação
NEXT_PUBLIC_APP_URL=https://seusite.com
```

### Configuração do Monitoramento Automático:

**Usando PM2:**
```bash
npm run monitor:pm2  # Inicia o monitor automático
```

**Usando Cron:**
```bash
# A cada 15 minutos durante horário de pregão (9h-17h)
*/15 9-17 * * 1-5 cd /caminho/do/projeto && npm run monitor:fii
```

## 📈 Resultados Esperados

Com este sistema, o usuário poderá:

1. ✅ Adicionar FIIs para acompanhar facilmente
2. ✅ Receber alertas automáticos no WhatsApp
3. ✅ Configurar threshold de variação personalizado
4. ✅ Ver cotações em tempo real na interface
5. ✅ Histórico completo de preços e alertas

Exemplo da mensagem que chegará no WhatsApp:
```
🚀 Alerta de Alta!

📊 KNIP11 - Kinea Indices Precos FII
💰 Cotação atual: R$ 87,17
📈 Variação: +2.01%

🚀 Subiu!

Acompanhe em: https://lucasfiialerts.com.br

Este é um alerta automático baseado nas suas configurações.
```