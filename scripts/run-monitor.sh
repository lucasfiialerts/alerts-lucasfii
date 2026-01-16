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
