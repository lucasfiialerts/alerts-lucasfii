# 📊 Sistema de Alertas de Bitcoin

Sistema completo de monitoramento e alertas de Bitcoin via WhatsApp integrado ao FiiAlerts.

## 🚀 Funcionalidades

- ✅ **Detecção automática** de variações significativas (±4%)
- ✅ **Envio seletivo** apenas para usuários com preferência ativada
- ✅ **Interface de configuração** integrada
- ✅ **Monitoramento contínuo** com cooldown inteligente
- ✅ **Mensagens formatadas** profissionalmente

## 📱 Como Ativar (Usuário)

1. Acesse **Configurações** no app
2. Encontre a seção **Bitcoin**
3. Ative o toggle ⚠️ (agora funcional!)
4. Certifique-se que seu WhatsApp está verificado

## 🛠️ Scripts Disponíveis

### 1. Teste Básico
```bash
node scripts/test-bitcoin-alerts.js
```
Testa o sistema básico de alertas.

### 2. Alerta Inteligente
```bash
# Envia apenas se variação > 4%
node scripts/bitcoin-alerts-smart.js

# Força envio independente da variação
node scripts/bitcoin-alerts-smart.js --force
```

### 3. Monitor Automático
```bash
node scripts/bitcoin-auto-monitor.js
```
Monitor contínuo que verifica a cada 5 minutos.

### 4. Consulta Banco Real
```bash
node scripts/bitcoin-alerts-database.js
```
Consulta usuários reais do PostgreSQL (requer banco ativo).

## 📊 Configuração de Alertas

### Thresholds
- **Variação mínima:** ±4% em 24h
- **Intervalo de verificação:** 5 minutos  
- **Cooldown entre alertas:** 1 hora

### Critérios de Envio
✅ `alertPreferencesBitcoin = true`  
✅ `whatsappVerified = true`  
✅ `whatsappNumber` válido  
✅ Variação ≥ 4% (ou modo `--force`)

## 🎯 Formato da Mensagem

```
₿ Bitcoin Alert - Variação Significativa

📉 O Bitcoin DESCEU 8.48%

💰 Preço Atual:
🇺🇸 USD: $83,954
🇧🇷 BRL: R$451,043

📊 Variação 24h: -8.48%
⏰ 21/11/2025, 10:21:24

_Alerta automático - Variação significativa detectada_ ₿

Para gerenciar alertas: Configurações > Bitcoin
```

## 🔧 Configuração Técnica

### Banco de Dados
```sql
-- Nova coluna adicionada
ALTER TABLE "user" ADD COLUMN alert_preferences_bitcoin BOOLEAN DEFAULT false;
```

### API Endpoints
- `GET /api/user/alert-preferences` - Buscar preferências
- `POST /api/user/alert-preferences` - Atualizar preferências

### Variáveis de Ambiente
```env
ULTRAMSG_TOKEN=seu_token
ULTRAMSG_INSTANCE=sua_instancia
```

## 📈 Monitoramento

### Status em Tempo Real
O monitor automático exibe:
```
🔍 [10:21:24] Verificando Bitcoin...
   💰 $83,954 | -8.48%
   🚨 VARIAÇÃO SIGNIFICATIVA: -8.48%
   📤 Enviando para 1 usuário(s)...
   ✅ alanrochaarg2001@gmail.com - Enviado
```

### Logs Importantes
- ✅ Alertas enviados com sucesso
- ⏳ Cooldown ativo
- 📊 Variação normal
- ❌ Erros de conexão/API

## 🎛️ Controle Manual

### Forçar Alerta (Teste)
```bash
node scripts/bitcoin-alerts-smart.js --force
```

### Verificar Status
```bash
# Ver usuários com Bitcoin ativo
node scripts/bitcoin-alerts-database.js

# Teste de conectividade
node scripts/test-whatsapp-debug.js
```

## 🔄 Integração com Outros Alertas

O sistema de Bitcoin segue o mesmo padrão dos alertas FII:
- ✅ Mesmo formato de mensagem
- ✅ Mesma lógica de preferências
- ✅ Mesmo sistema de WhatsApp
- ✅ Mesma interface de configuração

## 🎉 Status Atual

✅ **Totalmente funcional**  
✅ **Testado e validado**  
✅ **Integrado à interface**  
✅ **Enviando alertas reais**

**Última atualização:** 21/11/2025  
**Bitcoin:** $83,954 (-8.48% - Alerta enviado)