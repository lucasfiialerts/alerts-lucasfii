# Cotação Sob Demanda via WhatsApp

Funcionalidade que permite aos usuários consultarem cotações de FIIs em tempo real através de comandos no WhatsApp.

## 🚀 Como usar

Envie uma mensagem para o bot com o ticker do ativo:

```
HGLG11
```

Ou use os comandos:

```
cotacao MXRF11
preco VISC11
valor KNRI11
```

## 📋 Resposta

O bot retorna:
- 💰 Cotação atual
- 📈/📉 Variação do dia (R$ e %)
- 📊 Máxima, mínima e volume
- ⏱️ Rate limit: 1 consulta a cada 2 minutos por ticker

## ⚙️ Configuração

1. Acesse as **Configurações** no app
2. Ative o card **"Cotação Sob Demanda"** (ciano com ícone TrendingUp)
3. Pronto! Envie mensagens para o bot

## 🔧 Tecnologias

- **Webhook UltraMsg**: Recebe mensagens em tempo real
- **Brapi API**: Fornece dados de mercado
- **Rate Limiting**: Previne uso excessivo (cache em memória)
- **PostgreSQL**: Armazena preferências do usuário

## 📡 Webhook

**Endpoint**: `POST /api/webhooks/whatsapp`

**Payload** (UltraMsg):
```json
{
  "event_type": "message_received",
  "instanceId": "158952",
  "data": {
    "from": "5521998579960@c.us",
    "body": "HGLG11",
    "fromMe": false
  }
}
```

## 🎯 Features

- ✅ Suporta **qualquer ticker** válido (não precisa seguir o ativo)
- ✅ Rate limiting por ticker e usuário
- ✅ Mensagens formatadas com emojis
- ✅ Validação de preferências do usuário
- ✅ Ignora mensagens enviadas pelo próprio bot
