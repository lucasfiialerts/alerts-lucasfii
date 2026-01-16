# 📱 Z-API - Passo a Passo Completo

## 🚀 **Passo 1: Criar Conta**
1. Vá para: **https://z-api.io**
2. Clique em **"Cadastre-se"** ou **"Criar Conta"**
3. Preencha seus dados
4. Confirme seu email

## 📱 **Passo 2: Criar Instância**
1. Faça login no painel da Z-API
2. Clique em **"Nova Instância"** ou **"Criar Instância"**
3. Dê um nome (ex: "LucasFiiAlerts")
4. Aguarde a criação (2-5 minutos)

## 🔑 **Passo 3: Copiar as Chaves**
Na sua instância criada, você verá:

```
📋 TOKEN: A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0
📋 INSTANCE: 3D2C1B0A9F8E7D6C5B4A3F2E1D0C9B8A7F6E5D4C
```

## ⚙️ **Passo 4: Configurar no Projeto**

Cole as chaves no arquivo `.env.local`:

```bash
ZAPI_TOKEN="A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0"
ZAPI_INSTANCE="3D2C1B0A9F8E7D6C5B4A3F2E1D0C9B8A7F6E5D4C"
```

## 📱 **Passo 5: Conectar WhatsApp**
1. No painel Z-API, clique em **"Conectar WhatsApp"**
2. Aponte a câmera do seu celular para o QR Code
3. Aguarde conectar (fica verde ✅)

## 🧪 **Passo 6: Testar**
1. Reinicie seu servidor: `npm run dev`
2. Vá na página de Configuração
3. Clique em "Conectar WhatsApp"
4. Digite seu número
5. Aguarde receber o código no WhatsApp! 🎉

## 💰 **Preços Z-API:**
- **Plano Gratuito**: 100 mensagens/mês
- **Planos Pagos**: A partir de R$ 19,90/mês

## 🆘 **Se der problema:**
1. Verifique se as chaves estão corretas
2. Confirme se o WhatsApp está conectado (verde)
3. Verifique o console do navegador (F12)
4. Reinicie o servidor

## 🔄 **Alternativa: UltraMsg**
Se preferir, pode usar UltraMsg em vez da Z-API:
- Site: https://ultramsg.com
- Configure `ULTRAMSG_TOKEN` e `ULTRAMSG_INSTANCE`

**Com isso, o WhatsApp funcionará 100%! 🚀**