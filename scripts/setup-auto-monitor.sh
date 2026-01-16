#!/bin/bash

# 🚀 Script de Configuração Automática do Monitor FII
# Configura cron jobs para execução automática sem intervenção manual

echo "🚀 Configurando Monitor Automático FII..."

# 1. Verificar se o projeto está funcionando
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

# Detectar URL da aplicação baseado no ambiente
detect_app_url() {
    # 1. SEMPRE verificar arquivo .env primeiro (prioridade máxima)
    if [ -f ".env" ]; then
        local env_url=$(grep "^NEXT_PUBLIC_APP_URL" .env | cut -d '=' -f2 | tr -d '"' | tr -d ' ')
        if [ ! -z "$env_url" ]; then
            echo "🔍 URL encontrada no .env: $env_url" >&2
            echo "$env_url"
            return
        else
            echo "⚠️ Arquivo .env existe mas NEXT_PUBLIC_APP_URL não está configurada" >&2
        fi
    else
        echo "⚠️ Arquivo .env não encontrado" >&2
    fi
    
    # 2. Verificar variável de ambiente do sistema
    if [ ! -z "$NEXT_PUBLIC_APP_URL" ]; then
        echo "🔍 URL encontrada na variável de ambiente: $NEXT_PUBLIC_APP_URL" >&2
        echo "$NEXT_PUBLIC_APP_URL"
        return
    fi
    
    # 3. Fallback baseado no ambiente
    if [ "$NODE_ENV" = "production" ]; then
        echo "🔍 Usando URL padrão de produção (NODE_ENV=production)" >&2
        echo "https://lucasfiialerts.com"
    else
        echo "🔍 Usando URL padrão de desenvolvimento" >&2
        echo "http://localhost:3000"
    fi
}

APP_URL=$(detect_app_url)
echo "🌐 URL da aplicação detectada: $APP_URL"

# Verificar explicitamente o arquivo .env
if [ -f ".env" ]; then
    echo "📝 Arquivo .env encontrado:"
    if grep -q "^NEXT_PUBLIC_APP_URL" .env; then
        echo "   ✅ NEXT_PUBLIC_APP_URL: $(grep "^NEXT_PUBLIC_APP_URL" .env | cut -d '=' -f2 | tr -d '"')"
    else
        echo "   ⚠️ NEXT_PUBLIC_APP_URL não está definida no .env"
        echo "   💡 Recomendação: Adicione NEXT_PUBLIC_APP_URL=sua-url ao arquivo .env"
    fi
else
    echo "📝 Arquivo .env não encontrado"
    echo "   💡 Recomendação: Crie um arquivo .env com NEXT_PUBLIC_APP_URL=sua-url"
fi

# 2. Verificar se o servidor está rodando
echo "🔍 Verificando se o servidor está disponível..."
if ! curl -s "$APP_URL/api/fii/monitor-follows" > /dev/null 2>&1; then
    echo "⚠️ Aviso: Servidor não está rodando em $APP_URL"
    echo "   Em desenvolvimento: Execute 'npm run dev'"
    echo "   Em produção: Execute 'npm start' ou configure seu servidor"
fi

# 3. Criar script de execução do monitor
echo "📝 Criando script de execução..."
cat > scripts/run-monitor.sh << 'EOF'
#!/bin/bash

# Script que executa o monitor FII
# Este script é chamado pelo cron

# Definir variáveis
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/fii-monitor-$(date +%Y-%m-%d).log"

# Criar diretório de logs se não existir
mkdir -p "$LOG_DIR"

# Carregar variáveis de ambiente se existir arquivo .env
if [ -f "$PROJECT_DIR/.env" ]; then
    # Carregar apenas variáveis válidas (sem espaços problemáticos)
    while IFS= read -r line; do
        # Pular comentários e linhas vazias
        [[ $line =~ ^[[:space:]]*# ]] && continue
        [[ -z "${line// }" ]] && continue
        
        # Exportar apenas se a linha contém =
        if [[ $line == *"="* ]]; then
            export "$line" 2>/dev/null || true
        fi
    done < "$PROJECT_DIR/.env"
fi

# Detectar URL da aplicação
detect_app_url() {
    # 1. SEMPRE verificar arquivo .env primeiro (prioridade máxima)
    if [ -f "$PROJECT_DIR/.env" ]; then
        local env_url=$(grep "^NEXT_PUBLIC_APP_URL" "$PROJECT_DIR/.env" | cut -d '=' -f2 | tr -d '"' | tr -d ' ')
        if [ ! -z "$env_url" ]; then
            echo "$env_url"
            return
        fi
    fi
    
    # 2. Verificar variável de ambiente do sistema
    if [ ! -z "$NEXT_PUBLIC_APP_URL" ]; then
        echo "$NEXT_PUBLIC_APP_URL"
        return
    fi
    
    # 3. Fallback baseado no ambiente
    if [ "$NODE_ENV" = "production" ]; then
        echo "https://lucasfiialerts.com"
    else
        echo "http://localhost:3000"
    fi
}

APP_URL=$(detect_app_url)

# Função de log com timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🚀 Iniciando verificação automática de FIIs..."
log "🌐 URL da aplicação: $APP_URL"
log "📁 Diretório do projeto: $PROJECT_DIR"

# Executar monitor via API
response=$(curl -s -X POST "$APP_URL/api/fii/monitor-follows" \
    -H "Content-Type: application/json" \
    -d '{
        "checkLastHours": 24,
        "maxFundsToCheck": 100,
        "sendNotifications": true,
        "testMode": false
    }' 2>&1)

# Verificar se a API retornou sucesso
if echo "$response" | grep -q '"success": true'; then
    # Extrair estatísticas do retorno
    new_reports=$(echo "$response" | grep -o '"newReportsFound": [0-9]*' | grep -o '[0-9]*')
    notifications_sent=$(echo "$response" | grep -o '"sent": [0-9]*' | grep -o '[0-9]*' | head -1)
    
    if [ "$new_reports" -gt 0 ]; then
        log "✅ Sucesso: $new_reports novos relatórios encontrados"
        log "📱 $notifications_sent notificações enviadas"
    else
        log "ℹ️ Nenhum novo relatório encontrado"
    fi
else
    log "❌ Erro na execução: $response"
    log "🔧 Verifique se o servidor está rodando em: $APP_URL"
fi

log "🏁 Verificação concluída"
echo "---" >> "$LOG_FILE"

# Limpar logs antigos (manter últimos 7 dias)
find "$LOG_DIR" -name "fii-monitor-*.log" -mtime +7 -delete 2>/dev/null
EOF

chmod +x scripts/run-monitor.sh

# 4. Configurar cron jobs automaticamente
echo "⏰ Configurando agendamentos automáticos..."

# Backup do crontab atual
crontab -l > /tmp/crontab_backup_$(date +%s) 2>/dev/null || true

# Criar novo crontab temporário
TEMP_CRON=$(mktemp)

# Manter cron jobs existentes (removendo os antigos do FII se existirem)
crontab -l 2>/dev/null | grep -v "fii-monitor" | grep -v "FII Monitor" > "$TEMP_CRON" || true

# Adicionar novos cron jobs
cat >> "$TEMP_CRON" << EOF

# 🤖 FII Monitor Automático - LucasFIIAlerts
# Gerado automaticamente em $(date)

# Execução principal: Todos os dias às 6:00 AM
0 6 * * * cd $(pwd) && ./scripts/run-monitor.sh

# Verificações durante o dia: A cada 2 horas das 8h às 20h
0 8,10,12,14,16,18,20 * * * cd $(pwd) && ./scripts/run-monitor.sh

# Verificação noturna: 22:00 PM
0 22 * * * cd $(pwd) && ./scripts/run-monitor.sh

EOF

# Instalar o novo crontab
crontab "$TEMP_CRON"
rm "$TEMP_CRON"

echo "✅ Cron jobs configurados com sucesso!"

# 5. Mostrar configuração atual
echo ""
echo "📅 Agendamentos configurados:"
echo "   • 06:00 - Verificação principal (todos os dias)"
echo "   • 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00 - Durante o dia"
echo "   • 22:00 - Verificação noturna"
echo ""

# 6. Verificar se o cron está rodando
if ! pgrep -x "cron" > /dev/null && ! pgrep -x "crond" > /dev/null; then
    echo "⚠️ Aviso: Serviço cron não está rodando!"
    echo "   Execute: sudo service cron start (Linux) ou sudo launchctl load -w /System/Library/LaunchDaemons/com.vixie.cron.plist (macOS)"
fi

# 7. Criar comando para teste manual
echo "🧪 Para testar manualmente, execute:"
echo "   ./scripts/run-monitor.sh"
echo ""

# 8. Criar comando para ver logs
echo "📋 Para ver os logs em tempo real:"
echo "   tail -f logs/fii-monitor-$(date +%Y-%m-%d).log"
echo ""

# 9. Mostrar crontab atual
echo "📊 Cron jobs atuais relacionados ao FII:"
crontab -l | grep -E "(fii-monitor|FII Monitor)" || echo "   (Nenhum encontrado - algo pode ter dado errado)"

echo ""
echo "🎉 Monitor automático configurado!"
echo "   O sistema agora verificará novos relatórios automaticamente"
echo "   e enviará notificações WhatsApp quando encontrar atualizações."
echo ""
echo "⚡ IMPORTANTE:"
echo "   • Configure o arquivo .env com NEXT_PUBLIC_APP_URL correto:"
echo "     - Desenvolvimento: NEXT_PUBLIC_APP_URL=\"http://localhost:3000\""
echo "     - Produção: NEXT_PUBLIC_APP_URL=\"https://seu-dominio.com\""
echo "   • Mantenha o servidor Next.js rodando (npm run dev ou npm start)"
echo "   • Configure GEMINI_API_KEY para resumos com IA"
echo "   • Configure credenciais WhatsApp (ULTRAMSG_TOKEN, etc.)"
echo ""
echo "📋 Para criar o arquivo .env, copie de .env.example:"
echo "   cp .env.example .env"
echo "   # Em seguida edite o .env com suas configurações"
echo ""