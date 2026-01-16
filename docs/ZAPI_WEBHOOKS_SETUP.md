# 🔧 Configuração de Webhooks Z-API - Passo a Passo

## 📝 **URLs para configurar na Z-API:**

### **⚠️ IMPORTANTE: Use sua URL pública**
Se estiver em desenvolvimento local, você precisa de uma URL pública. Use **ngrok**:

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta local
ngrok http 3001
```

Vai gerar uma URL como: `https://abc123.ngrok.io`

### **📋 URLs dos Webhooks:**

1. **Ao enviar**: `https://sua-url.ngrok.io/api/webhooks/zapi/message-sent`
2. **Ao receber**: `https://sua-url.ngrok.io/api/webhooks/zapi/message-received`
3. **Presença do chat**: `https://sua-url.ngrok.io/api/webhooks/zapi/presence`
4. **Receber status da mensagem**: `https://sua-url.ngrok.io/api/webhooks/zapi/message-status`
5. **Ao conectar**: `https://sua-url.ngrok.io/api/webhooks/zapi/connect`

## 🎯 **Como configurar na Z-API:**

### **1. Acesse o painel Z-API**
- Entre em: https://app.z-api.io
- Vá na sua instância criada

### **2. Vá em "Webhooks e configurações gerais"**
- Na aba "Webhooks e configurações gerais"

### **3. Configure cada webhook:**

#### **Ao enviar:**
- Cole: `https://sua-url.ngrok.io/api/webhooks/zapi/message-sent`

#### **Ao receber:**
- Cole: `https://sua-url.ngrok.io/api/webhooks/zapi/message-received`

#### **Presença do chat:**
- Cole: `https://sua-url.ngrok.io/api/webhooks/zapi/presence`

#### **Receber status da mensagem:**
- Cole: `https://sua-url.ngrok.io/api/webhooks/zapi/message-status`

#### **Ao conectar:**
- Cole: `https://sua-url.ngrok.io/api/webhooks/zapi/connect`

### **4. Configurações do WhatsApp (recomendadas):**
- ✅ **Ler mensagens automaticamente** (ON)
- ✅ **Ler status automaticamente** (ON)
- ❌ **Rejeitar chamadas automáticas** (OFF - opcional)

### **5. Salvar configurações**
- Clique em **"Salvar"** no final da página

## 🧪 **Para testar:**

### **1. Verifique os logs:**
- No terminal onde roda `npm run dev`
- Você verá logs dos webhooks quando:
  - Enviar uma mensagem via sistema
  - Receber resposta do usuário
  - Mudanças de status

### **2. Teste prático:**
- Configure webhook "Ao receber"
- Envie uma mensagem para a instância Z-API
- Veja o log no console do seu projeto

### **3. Verificação automática "OK":**
- Quando usuário responder "OK" ao código
- Sistema detectará automaticamente
- (Função já implementada no webhook)

## 🚀 **Produção:**
- Substitua ngrok pela sua URL de produção
- Ex: `https://seudominio.com/api/webhooks/zapi/...`

## 📞 **Suporte Z-API:**
- Documentação: https://developer.z-api.io
- Suporte: Pelo painel da Z-API

**Pronto! Webhooks configurados e funcionando! 🎉**