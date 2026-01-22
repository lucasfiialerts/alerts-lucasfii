# 📱 Configuração do Webhook WhatsApp - Cotação Sob Demanda

## 🎯 Funcionalidade

Permite que usuários solicitem cotações de FIIs via WhatsApp usando comandos simples.

## 📝 Comandos Aceitos

```
HGLG11
cotacao VISC11
preco MXRF11
valor BTLG11
```

## 🔧 Configuração no UltraMsg

### 1. Acessar Configurações

1. Entre no painel do UltraMsg
2. Vá em **Settings** → **Webhooks**

### 2. Configurar Webhook de Mensagens

**URL do Webhook:**
```
https://seu-dominio.vercel.app/api/webhooks/whatsapp
```

**Eventos para ativar:**
- ✅ **on.message** - Quando receber nova mensagem

**Método:** POST

### 3. Testar

Envie uma mensagem para o número do bot:
```
HGLG11
```

## 📊 Resposta Esperada

```
📈 HGLG11

💰 Cotação: R$ 157,71
🟢 Variação: +R$ 1,89 (+1,21%)

📊 Hoje:
   Máxima: R$ 158,50
   Mínima: R$ 156,20
   Volume: 1.25M

⏰ Atualizado às 17:30
```

## ⏱️ Rate Limiting

- **Limite:** 1 consulta a cada 2 minutos por ticker
- **Objetivo:** Evitar spam e uso excessivo
- **Mensagem:** Usuário recebe aviso se tentar consultar muito rápido

## 🔐 Segurança

- Apenas usuários cadastrados podem usar
- Precisa ter WhatsApp verificado
- Recurso precisa estar ativado nas configurações
- Plano ativo necessário

## 🐛 Troubleshooting

### Webhook não funciona

1. Verifique se a URL está correta
2. Confirme que o evento `on.message` está ativo
3. Teste o endpoint manualmente:

```bash
curl -X POST https://seu-dominio.vercel.app/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"from": "5521999999999", "body": "HGLG11"}'
```

### Usuário não recebe resposta

1. Verificar se o número está cadastrado
2. Confirmar que `alertPreferencesOnDemandQuote` está ativo
3. Ver logs do Vercel para erros

## 📝 Logs

O webhook registra todos os eventos:
```
📱 Mensagem recebida: { from: '5521999999999', body: 'HGLG11' }
   🎯 Ticker detectado: HGLG11
   🔍 Buscando cotação de HGLG11...
   ✅ Cotação enviada com sucesso!
```

## 🚀 Deploy

Após fazer deploy no Vercel, a URL será:
```
https://seu-projeto.vercel.app/api/webhooks/whatsapp
```

Use essa URL no UltraMsg!
