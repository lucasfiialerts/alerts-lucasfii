# 🤖 Sistema de Resumos Inteligentes de FIIs com IA

Sistema automatizado que combina múltiplas APIs e usa IA para gerar resumos completos de FIIs e enviar via WhatsApp.

## 🎯 Funcionalidades

- ✅ Busca dados de múltiplas fontes (BRAPI + FNET + Status Invest)
- ✅ Gera resumos inteligentes com IA (Gemini)
- ✅ Envia automático via WhatsApp
- ✅ Processamento em lote de múltiplos FIIs
- ✅ Cron diário para FIIs mais seguidos
- ✅ Logs detalhados de todas as operações

## 📊 Fontes de Dados

### 1. **BRAPI** (Principal)
```
https://brapi.dev/api/quote/{ticker}?dividends=true
```
**Dados fornecidos:**
- Preço atual e variação
- Volume de negociação
- Máximas e mínimas
- **Histórico de dividendos** ✨
- Dividend yield
- P/VP

### 2. **FNET B3** (Documentos Oficiais)
```
https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados
```
**Dados fornecidos:**
- Relatórios gerenciais
- Informes mensais
- Fatos relevantes oficiais
- Assembleias
- Eventos corporativos

### 3. **Status Invest** (Complementar)
```
https://statusinvest.com.br/fii/companytickerprovents?ticker={ticker}
```
**Dados fornecidos:**
- Proventos detalhados
- Análises adicionais
- Indicadores fundamentalistas

## 🚀 Como Usar

### Uso Manual

```bash
# Processar um FII específico
node scripts/resumo-fii-ia.js VTLT11

# Processar múltiplos FIIs
node scripts/resumo-fii-ia.js VTLT11 SAPI11 HGLG11

# Executar cron manual (processa top FIIs)
node scripts/cron-resumos-diarios.js
```

### Uso Programático

```javascript
const { processarFII } = require('./scripts/resumo-fii-ia');

// Processar um FII
const resultado = await processarFII('VTLT11');
console.log(resultado.resumo);
```

## ⚙️ Configuração

### Variáveis de Ambiente

```bash
# Token da BRAPI (obrigatório)
BRAPI_TOKEN=seu-token-aqui

# URL da aplicação
NEXT_PUBLIC_APP_URL=https://seu-dominio.com

# Google AI (para resumos)
GOOGLE_GENERATIVE_AI_API_KEY=sua-chave-aqui

# WhatsApp (ZAPI)
ZAPI_INSTANCE_ID=seu-instance-id
ZAPI_TOKEN=seu-token

# Cron (opcional)
CRON_SECRET=seu-secret-seguro
CRON_FII_LIMIT=10  # Quantos FIIs processar por vez
```

### Obter Token da BRAPI

1. Acesse: https://brapi.dev/
2. Crie uma conta
3. Gere seu token
4. Adicione ao `.env`: `BRAPI_TOKEN=seu-token`

## 🔄 Configuração do Cron (EasyCron)

### 1. Criar Job no EasyCron

**URL do Endpoint:**
```
https://seu-dominio.com/api/cron/resumos-fii
```

**Configurações:**
- **Method**: POST
- **Header**: `Authorization: Bearer seu-cron-secret`
- **Frequency**: Diariamente às 18:00 (após fechamento do mercado)
- **Timeout**: 300 segundos

### 2. Horários Recomendados

```
Segunda a Sexta:
- 18:00 - Resumo pós-mercado (PRINCIPAL)
- 09:00 - Análise pré-mercado (opcional)

Sábado:
- 10:00 - Resumo semanal (opcional)
```

### 3. Exemplo de Configuração EasyCron

```json
{
  "url": "https://seu-dominio.com/api/cron/resumos-fii",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer SEU_CRON_SECRET_AQUI",
    "Content-Type": "application/json"
  },
  "schedule": "0 18 * * 1-5",
  "timezone": "America/Sao_Paulo",
  "timeout": 300,
  "retry": 2
}
```

## 📋 Exemplo de Resumo Gerado

```
📊 *Análise Inteligente - VTLT11*

🎯 **RESUMO EXECUTIVO**
O VTLT11 apresenta desempenho sólido com cotação estável e 
dividend yield atrativo de 10,5% ao ano. Fundo focado em 
lajes corporativas de alto padrão em São Paulo.

📊 **ANÁLISE DE DESEMPENHO**
• Cotação atual: R$ 94,50 (+0,8% no dia)
• Tendência: Alta consolidação
• Volume: 485.320 cotas negociadas
• Máxima 52 semanas: R$ 98,20
• Mínima 52 semanas: R$ 87,30

💰 **DIVIDENDOS E YIELD**
• Último pagamento: R$ 0,85 (15/12/2025)
• Média mensal: R$ 0,83
• Yield anualizado: 10,5%
• Consistência: Excelente (120 meses consecutivos)

📈 **PONTOS POSITIVOS**
• Portfólio premium em localização nobre
• Dividend yield acima da média do setor
• Baixa vacância (3,2%)
• Gestão experiente e transparente
• Liquidez elevada

⚠️ **PONTOS DE ATENÇÃO**
• Concentração em São Paulo (risco geográfico)
• Dependência do mercado de escritórios
• P/VP ligeiramente acima de 1,0

💡 **RECOMENDAÇÃO**
FII adequado para investidores que buscam renda passiva 
consistente com bom histórico de pagamentos. Preço justo 
considerando a qualidade do portfólio.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Análise gerada automaticamente com IA_ ✨
_Data: 05/01/2026 18:35_
```

## 📱 Integração WhatsApp

O sistema envia automaticamente para usuários que:
- Seguem o FII específico
- Têm WhatsApp verificado
- Ativaram preferência de alertas

Mensagens são enviadas com:
- Resumo completo da IA
- Dados atualizados
- Formatação clara para WhatsApp
- Delay de 2s entre envios (evitar bloqueio)

## 📊 Logs e Monitoramento

### Ver logs do cron

```bash
tail -f logs/cron-resumos.log
```

### Estrutura do log

```json
{
  "timestamp": "2026-01-05T18:00:00.000Z",
  "fiisProcessados": 10,
  "sucessos": 9,
  "falhas": 1,
  "totalNotificados": 47,
  "detalhes": [...]
}
```

## 🔧 Troubleshooting

### Erro: "FII não encontrado na BRAPI"
- Verificar se o ticker está correto
- Confirmar se é um FII ativo na B3
- Testar na BRAPI manualmente: `https://brapi.dev/api/quote/VTLT11`

### Erro: "Não foi possível gerar resumo com IA"
- Verificar GOOGLE_GENERATIVE_AI_API_KEY no .env
- Confirmar quota da API não excedida
- Sistema gera resumo básico automaticamente

### WhatsApp não envia
- Verificar credenciais ZAPI no .env
- Confirmar que usuário tem WhatsApp verificado
- Testar envio manual: `node scripts/test-whatsapp.js`

## 🎛️ Comandos Úteis

```bash
# Processar FII específico
npm run fii:resumo VTLT11

# Executar cron manual
npm run fii:cron

# Testar com modo debug
DEBUG=true node scripts/resumo-fii-ia.js VTLT11

# Ver últimos logs
tail -20 logs/cron-resumos.log

# Limpar cache
rm -rf logs/fnet-cache/*
```

## 📈 Performance

- **Tempo médio por FII**: 8-12 segundos
- **APIs simultâneas**: 3 (BRAPI + FNET + Status Invest)
- **Geração de resumo (IA)**: 3-5 segundos
- **Envio WhatsApp**: 1-2 segundos por usuário
- **Total para 10 FIIs**: ~2-3 minutos

## 🔐 Segurança

- ✅ Autenticação via Bearer token no cron
- ✅ Validação de dados de entrada
- ✅ Rate limiting nas APIs externas
- ✅ Logs não expõem dados sensíveis
- ✅ Credenciais em variáveis de ambiente

## 🚀 Melhorias Futuras

- [ ] Cache inteligente de dados (Redis)
- [ ] Dashboard web de resumos
- [ ] Notificações por email
- [ ] Resumos personalizados por perfil
- [ ] Alertas de oportunidades
- [ ] Análise comparativa entre FIIs
- [ ] Integração com Telegram

---

**Criado em:** Janeiro 2026  
**Última atualização:** 05/01/2026  
**Status:** ✅ Ativo e em produção
