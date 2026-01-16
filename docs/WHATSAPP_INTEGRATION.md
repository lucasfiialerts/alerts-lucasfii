# Integração WhatsApp - Guia de Implementação

## APIs Suportadas

### 1. Z-API (Recomendada)
```typescript
// Configuração no .env.local
ZAPI_TOKEN=seu_token_aqui
ZAPI_INSTANCE=sua_instancia_aqui

// Implementação
const response = await fetch(`https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: phoneNumber,
    message: message,
  }),
});
```

### 2. UltraMsg
```typescript
// Configuração no .env.local
ULTRAMSG_TOKEN=seu_token_aqui
ULTRAMSG_INSTANCE=sua_instancia_aqui

// Implementação
const response = await fetch(`https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: ULTRAMSG_TOKEN,
    to: phoneNumber,
    body: message,
  }),
});
```

### 3. Twilio
```typescript
// Configuração no .env.local
TWILIO_ACCOUNT_SID=seu_account_sid
TWILIO_AUTH_TOKEN=seu_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

// Implementação (requer instalação: npm install twilio)
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const message = await client.messages.create({
  from: process.env.TWILIO_WHATSAPP_NUMBER,
  to: `whatsapp:+${phoneNumber}`,
  body: messageText,
});
```

## Implementação Atual

O sistema está preparado para receber qualquer uma dessas integrações. Para ativar:

1. **Escolha sua API** (Z-API recomendada para Brasil)
2. **Configure as variáveis de ambiente**
3. **Atualize o arquivo** `src/lib/whatsapp-api.ts`
4. **Substitua a implementação** em `src/app/api/send-whatsapp/route.ts`

## Fluxo Implementado

1. ✅ **Usuário insere número** → Salvo no banco
2. ✅ **Sistema gera código** → 6 dígitos aleatórios
3. ✅ **Envio via API** → Usando função configurável
4. ✅ **Usuário verifica** → Código validado
5. ✅ **Status atualizado** → WhatsApp marcado como verificado

## Próximos Passos

- [ ] Escolher e configurar API de WhatsApp
- [ ] Adicionar webhook para respostas automáticas
- [ ] Implementar lógica de "OK" automático
- [ ] Adicionar rate limiting
- [ ] Configurar templates de mensagem