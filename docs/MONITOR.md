# 🤖 Monitor Automático de FII - LucasFIIAlerts

Sistema de monitoramento contínuo que verifica novos relatórios de FII e envia notificações WhatsApp automaticamente.

## 🚀 Configuração Rápida

### 1. Configuração Inicial
```bash
# Executar script de configuração
npm run monitor:setup

# Ou manualmente:
./scripts/setup-monitor.sh
```

### 2. Teste Rápido
```bash
# Teste único (uma verificação)
npm run monitor:test

# Monitor contínuo em modo teste
MONITOR_TEST_MODE=true npm run monitor
```

### 3. Produção
```bash
# Executar direto (logs na tela)
npm run monitor

# Ou com PM2 (recomendado para produção)
npm run monitor:pm2

# Ver logs do PM2
npm run monitor:logs
```

## ⚙️ Configuração

### Variáveis de Ambiente

Crie o arquivo `.env.monitor`:

```bash
# Intervalo entre verificações (em minutos)
MONITOR_INTERVAL_MINUTES=60

# Máximo de fundos para verificar por ciclo
MONITOR_MAX_FUNDS=100

# Modo de teste (true = não envia WhatsApp real)
MONITOR_TEST_MODE=false

# URL base da aplicação
MONITOR_WEBHOOK_URL=http://localhost:3000
```

### Configuração Avançada

O monitor pode ser personalizado através de variáveis de ambiente:

```bash
# Exemplo de configuração personalizada
export MONITOR_INTERVAL_MINUTES=30    # Verifica a cada 30 minutos
export MONITOR_MAX_FUNDS=200          # Verifica até 200 fundos
export MONITOR_TEST_MODE=true         # Modo teste ativo
export MONITOR_WEBHOOK_URL=https://meusite.com  # URL personalizada
```

## 🛠️ Comandos Disponíveis

### NPM Scripts
```bash
npm run monitor:setup      # Script de configuração interativo
npm run monitor           # Executar monitor normal
npm run monitor:test      # Executar em modo teste
npm run monitor:pm2       # Iniciar com PM2
npm run monitor:pm2:stop  # Parar PM2
npm run monitor:logs      # Ver logs PM2
```

### Comandos Diretos
```bash
# Executar direto
node scripts/fii-monitor.js

# Com configurações customizadas
MONITOR_INTERVAL_MINUTES=30 node scripts/fii-monitor.js

# Modo debug (mais logs)
DEBUG=1 node scripts/fii-monitor.js
```

## 📊 Como Funciona

### Fluxo do Monitor

1. **⏰ Timer**: Executa a cada N minutos (configurável)
2. **🔍 Descoberta**: Busca todos os FII em relatoriosfiis.com.br
3. **📊 Comparação**: Compara com relatórios já conhecidos no banco
4. **🆕 Detecção**: Identifica novos relatórios por URL/data
5. **🤖 IA**: Gera resumo automático com Gemini
6. **📱 WhatsApp**: Envia notificação formatada para usuários

### Verificações Realizadas

- ✅ **Novos PDFs**: Detecta relatórios inéditos
- ✅ **Usuários Ativos**: Apenas para quem segue o FII
- ✅ **WhatsApp Verificado**: Só envia se número confirmado
- ✅ **Notificações Ativas**: Respeita preferências do usuário
- ✅ **Rate Limiting**: Não sobrecarrega APIs

## 🚦 Status e Logs

### Durante Execução
```
🚀 INICIANDO MONITOR DE FII - LucasFIIAlerts
==============================================

⚙️  Configuração:
   • Intervalo: 60 minutos
   • Máx. Fundos: 100
   • Modo Teste: false
   • URL Base: http://localhost:3000

🔄 O script vai verificar novos relatórios a cada 60 minutos...
```

### Logs de Verificação
```
🔍 [15/11/2025 14:30:00] Iniciando verificação #1...
📊 Resultados da verificação:
   • Tickers verificados: 50
   • Usuários com follows: 25
   • Novos relatórios: 3
   • Notificações enviadas: 8
   • Falhas: 0

📋 Novos relatórios detectados:
   📄 HGLG11 - HEDGE TOP FOFII 3 FUNDO DE INVESTIMENTO...
      Data: Nov/2025
      PDF: https://relatoriosfiis.com.br/downloadDocumento...

📱 Notificações WhatsApp:
   ✅ HGLG11 → +5511999999999
   ✅ HGLG11 → +5511888888888
```

### Estatísticas
```bash
# Ver estatísticas em tempo real (Linux/Mac)
kill -USR1 $(pgrep -f fii-monitor.js)

# Ou aguardar exibição automática a cada 30 minutos
```

## 🎛️ Gerenciamento em Produção

### PM2 (Recomendado)
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar monitor
npm run monitor:pm2

# Comandos PM2
pm2 status               # Ver status
pm2 logs fii-monitor     # Ver logs em tempo real
pm2 restart fii-monitor  # Reiniciar
pm2 stop fii-monitor     # Parar
pm2 delete fii-monitor   # Remover
```

### Systemd (Servidores Linux)
```bash
# Copiar arquivo de serviço
sudo cp scripts/fii-monitor.service /etc/systemd/system/

# Ativar serviço
sudo systemctl daemon-reload
sudo systemctl enable fii-monitor
sudo systemctl start fii-monitor

# Comandos systemctl
sudo systemctl status fii-monitor     # Status
sudo systemctl restart fii-monitor    # Reiniciar
sudo journalctl -u fii-monitor -f     # Logs em tempo real
```

### Docker (Opcional)
```dockerfile
# Adicionar ao Dockerfile existente
COPY scripts/ scripts/
RUN chmod +x scripts/*.sh

# Comando para iniciar monitor
CMD ["node", "scripts/fii-monitor.js"]
```

## 🛡️ Tratamento de Erros

### Retry Automático
- **3 tentativas** com backoff exponencial
- **Pausa de 5s** entre tentativas
- **Log detalhado** de falhas

### Recuperação
- **Auto-restart** em caso de crash
- **Validação** de APIs antes da execução
- **Fallback graceful** se APIs estão indisponíveis

### Monitoramento
- **Logs estruturados** com timestamp
- **Estatísticas** de sucesso/falha
- **Health check** automático

## 🚨 Troubleshooting

### Problemas Comuns

#### Monitor não inicia
```bash
# Verificar se o servidor está rodando
curl http://localhost:3000/api/fii/monitor-follows

# Verificar permissões
chmod +x scripts/fii-monitor.js

# Verificar dependências
node --version  # Deve ser v16+
```

#### Notificações não enviadas
```bash
# Verificar configuração WhatsApp
curl -X POST http://localhost:3000/api/fii/test-notification

# Verificar se usuários estão seguindo FIIs
curl http://localhost:3000/api/fii/follow

# Verificar se GEMINI_API_KEY está configurado
```

#### Alto uso de CPU/Memória
```bash
# Reduzir intervalo e quantidade de fundos
export MONITOR_INTERVAL_MINUTES=120
export MONITOR_MAX_FUNDS=50
```

### Logs de Debug
```bash
# Executar com logs detalhados
DEBUG=1 npm run monitor

# Ou no código JavaScript:
console.log('Debug info:', data);
```

## 📈 Otimizações

### Performance
- **Paralelização limitada**: Evita sobrecarregar APIs
- **Cache inteligente**: Evita reprocessar mesmos dados
- **Rate limiting**: Respeita limites dos serviços

### Configurações Recomendadas

#### Desenvolvimento
```bash
MONITOR_INTERVAL_MINUTES=15   # Mais frequente para testes
MONITOR_MAX_FUNDS=20          # Menor quantidade
MONITOR_TEST_MODE=true        # Não envia WhatsApp real
```

#### Produção
```bash
MONITOR_INTERVAL_MINUTES=60   # Intervalo padrão
MONITOR_MAX_FUNDS=100         # Quantidade padrão
MONITOR_TEST_MODE=false       # WhatsApp real ativo
```

#### Alta Volume
```bash
MONITOR_INTERVAL_MINUTES=30   # Mais frequente
MONITOR_MAX_FUNDS=200         # Maior quantidade
# Requer servidor mais robusto
```

---

## 🎯 Próximos Passos

1. **Configurar GEMINI_API_KEY** para resumos por IA
2. **Testar com `monitor:test`** primeiro
3. **Configurar usuários** para seguir FIIs
4. **Iniciar em produção** com PM2 ou systemd
5. **Monitorar logs** regularmente

**Sistema pronto para detectar e notificar sobre novos relatórios FII automaticamente!** 🚀