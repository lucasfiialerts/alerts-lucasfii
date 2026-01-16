#!/bin/bash

# 🔧 Script de Configuração Universal do Monitor FII
# Suporta Linux, macOS e Windows (via WSL)

echo "🔧 Configurando Monitor FII para execução automática..."

# Detectar sistema operacional
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    CRON_SERVICE="cron"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    CRON_SERVICE="cron"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    OS="windows"
else
    OS="unknown"
fi

echo "🖥️ Sistema detectado: $OS"

# Função para configurar no Linux/Ubuntu
setup_linux() {
    echo "🐧 Configurando para Linux..."
    
    # Verificar se cron está instalado
    if ! command -v crontab &> /dev/null; then
        echo "📦 Instalando cron..."
        sudo apt-get update
        sudo apt-get install -y cron
    fi
    
    # Iniciar serviço cron
    sudo service cron start
    sudo systemctl enable cron
    
    echo "✅ Cron configurado no Linux"
}

# Função para configurar no macOS
setup_macos() {
    echo "🍎 Configurando para macOS..."
    
    # Verificar se cron está disponível (já vem por padrão)
    if ! command -v crontab &> /dev/null; then
        echo "❌ Cron não encontrado no macOS"
        return 1
    fi
    
    # No macOS, o cron pode precisar de permissões especiais
    echo "⚠️ IMPORTANTE (macOS):"
    echo "   Se houver problemas, adicione o Terminal às permissões em:"
    echo "   System Preferences > Security & Privacy > Privacy > Full Disk Access"
    
    echo "✅ Cron disponível no macOS"
}

# Função para configurar no Windows (WSL)
setup_windows() {
    echo "🪟 Configurando para Windows (WSL)..."
    
    # Verificar se está no WSL
    if ! grep -qi microsoft /proc/version 2>/dev/null; then
        echo "❌ Este script requer WSL (Windows Subsystem for Linux)"
        echo "   Instale o WSL e execute novamente"
        return 1
    fi
    
    # Instalar cron no WSL se necessário
    if ! command -v crontab &> /dev/null; then
        echo "📦 Instalando cron no WSL..."
        sudo apt-get update
        sudo apt-get install -y cron
    fi
    
    # Configurar cron para iniciar automaticamente no WSL
    if ! sudo service cron status &>/dev/null; then
        echo "🚀 Iniciando cron no WSL..."
        sudo service cron start
    fi
    
    echo "✅ Cron configurado no Windows (WSL)"
    echo "⚠️ IMPORTANTE (Windows):"
    echo "   Para manter o cron rodando, adicione ao ~/.bashrc:"
    echo "   sudo service cron start"
}

# Configurar baseado no OS
case $OS in
    "linux")
        setup_linux
        ;;
    "macos")
        setup_macos
        ;;
    "windows")
        setup_windows
        ;;
    *)
        echo "❌ Sistema operacional não suportado: $OS"
        echo "   Configure manualmente os cron jobs"
        exit 1
        ;;
esac

# Configurar o diretório atual
PROJECT_DIR=$(pwd)
echo "📁 Diretório do projeto: $PROJECT_DIR"

# Criar diretório de logs
mkdir -p logs
chmod 755 logs

# Configurar as variáveis de ambiente no script
echo "🔧 Configurando variáveis..."

# Criar arquivo de configuração
cat > scripts/monitor-config.env << EOF
# Configuração do Monitor FII - Auto-detecta ambiente

# URLs da aplicação (auto-detectado se não especificado)
# Em desenvolvimento: http://localhost:3000
# Em produção: https://lucasfiialerts.com ou \$NEXT_PUBLIC_APP_URL
API_URL_AUTO_DETECT="true"

# Se quiser forçar uma URL específica, descomente:
# API_URL="https://meudominio.com"

PROJECT_DIR="$PROJECT_DIR"
LOG_LEVEL="INFO"
MAX_FUNDS_CHECK=100
CHECK_INTERVAL_HOURS=2
ENABLE_NOTIFICATIONS=true
ENABLE_TEST_MODE=false

# Configurações de horários (formato cron)
MAIN_CHECK_TIME="0 6 * * *"         # 6:00 AM todos os dias
DAY_CHECK_TIMES="0 8,10,12,14,16,18,20 * * *"  # A cada 2h das 8h às 20h
NIGHT_CHECK_TIME="0 22 * * *"       # 22:00 PM

# Retenção de logs (dias)
LOG_RETENTION_DAYS=7
EOF

# Criar script de monitoramento inteligente
cat > scripts/smart-monitor.sh << 'EOF'
#!/bin/bash

# Monitor Inteligente FII - Executa verificações baseadas no horário

# Carregar configurações
if [ -f "scripts/monitor-config.env" ]; then
    source scripts/monitor-config.env
else
    echo "❌ Arquivo de configuração não encontrado"
    exit 1
fi

# Função de log melhorada
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_file="logs/fii-monitor-$(date +%Y-%m-%d).log"
    
    echo "[$timestamp] [$level] $message" | tee -a "$log_file"
}

# Verificar se é horário de trabalho (6h às 22h)
current_hour=$(date +%H)
is_business_hours=$((current_hour >= 6 && current_hour <= 22))

# Determinar configuração baseada no horário
if [ $is_business_hours -eq 1 ]; then
    check_hours=2  # Verificar últimas 2 horas durante o dia
    max_funds=100
else
    check_hours=12  # Verificar últimas 12 horas durante a madrugada
    max_funds=50
fi

log "INFO" "Iniciando verificação inteligente (horário: ${current_hour}h)"
log "INFO" "Configuração: verificar últimas ${check_hours}h, máx ${max_funds} fundos"

# Executar verificação
response=$(curl -s -X POST "${API_URL}/api/fii/monitor-follows" \
    -H "Content-Type: application/json" \
    -d "{
        \"checkLastHours\": $check_hours,
        \"maxFundsToCheck\": $max_funds,
        \"sendNotifications\": $ENABLE_NOTIFICATIONS,
        \"testMode\": $ENABLE_TEST_MODE
    }" 2>&1)

# Processar resposta
if echo "$response" | grep -q '"success": true'; then
    new_reports=$(echo "$response" | jq -r '.data.monitoring.newReportsFound // 0' 2>/dev/null || echo "0")
    notifications_sent=$(echo "$response" | jq -r '.data.notifications.sent // 0' 2>/dev/null || echo "0")
    
    if [ "$new_reports" -gt 0 ]; then
        log "INFO" "✅ $new_reports novos relatórios | $notifications_sent notificações enviadas"
        
        # Log detalhado dos novos relatórios
        echo "$response" | jq -r '.data.newReports[]? | "  📄 \(.ticker): \(.reportDate)"' 2>/dev/null >> "logs/fii-monitor-$(date +%Y-%m-%d).log"
    else
        log "INFO" "ℹ️ Nenhum novo relatório encontrado"
    fi
else
    log "ERROR" "❌ Falha na verificação: $response"
fi

# Limpeza de logs antigos
find logs -name "fii-monitor-*.log" -mtime +$LOG_RETENTION_DAYS -delete 2>/dev/null

log "INFO" "Verificação concluída"
EOF

chmod +x scripts/smart-monitor.sh

# Configurar cron jobs com o script inteligente
echo "⏰ Configurando cron jobs inteligentes..."

# Backup e criação do crontab
TEMP_CRON=$(mktemp)
crontab -l 2>/dev/null | grep -v "fii-monitor" | grep -v "FII Monitor" > "$TEMP_CRON" || true

cat >> "$TEMP_CRON" << EOF

# 🤖 Monitor FII Inteligente - Auto-configurado em $(date)
# Configuração adaptativa baseada no horário

# Principal: 6:00 AM (verificação completa)
0 6 * * * cd $PROJECT_DIR && ./scripts/smart-monitor.sh

# Durante o dia: A cada 2 horas
0 8,10,12,14,16,18,20 * * * cd $PROJECT_DIR && ./scripts/smart-monitor.sh

# Noturno: 22:00 PM (última verificação do dia)
0 22 * * * cd $PROJECT_DIR && ./scripts/smart-monitor.sh

EOF

crontab "$TEMP_CRON"
rm "$TEMP_CRON"

echo ""
echo "🎉 MONITOR AUTOMÁTICO CONFIGURADO!"
echo ""
echo "📅 Agendamentos:"
echo "   • 06:00 - Verificação principal (completa)"
echo "   • 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00 - Durante o dia"
echo "   • 22:00 - Verificação noturna"
echo ""
echo "🧠 Recursos Inteligentes:"
echo "   • Ajusta automaticamente baseado no horário"
echo "   • Logs detalhados com rotação automática"
echo "   • Configuração via arquivo env"
echo ""
echo "🔧 Comandos úteis:"
echo "   • Teste manual: ./scripts/smart-monitor.sh"
echo "   • Ver logs: tail -f logs/fii-monitor-$(date +%Y-%m-%d).log"
echo "   • Ver cron jobs: crontab -l | grep fii"
echo "   • Editar config: nano scripts/monitor-config.env"
echo ""
echo "⚡ Próximos passos:"
echo "   1. Configure GEMINI_API_KEY para resumos IA"
echo "   2. Configure credenciais WhatsApp"
echo "   3. Mantenha o servidor rodando (npm run dev)"
echo "   4. Aguarde a próxima verificação ou teste manualmente"
echo ""

# Mostrar próxima execução
next_run=$(date -d "tomorrow 6:00" '+%d/%m/%Y às %H:%M' 2>/dev/null || date -v+1d -v6H -v0M -v0S '+%d/%m/%Y às %H:%M' 2>/dev/null || echo "06:00 de amanhã")
echo "⏰ Próxima verificação automática: $next_run"

echo "🚀 Monitor configurado e rodando automaticamente!"