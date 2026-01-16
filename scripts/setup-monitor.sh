#!/bin/bash

# Script de Inicialização do Monitor FII
# 
# Este script configura e inicia o monitoramento automático
# de novos relatórios FII com notificações WhatsApp

set -e

echo "🚀 CONFIGURAÇÃO DO MONITOR FII - LucasFIIAlerts"
echo "=============================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto (onde está o package.json)"
    exit 1
fi

# Criar diretório de scripts se não existir
mkdir -p scripts

# Verificar se o arquivo de monitoramento existe
if [ ! -f "scripts/fii-monitor.js" ]; then
    echo "❌ Arquivo scripts/fii-monitor.js não encontrado!"
    echo "   Execute primeiro o comando para criar o script de monitoramento."
    exit 1
fi

echo "📋 Configurando variáveis de ambiente..."

# Criar arquivo .env.monitor se não existir
ENV_MONITOR_FILE=".env.monitor"

if [ ! -f "$ENV_MONITOR_FILE" ]; then
    echo "📝 Criando arquivo de configuração $ENV_MONITOR_FILE..."
    
    cat > "$ENV_MONITOR_FILE" << 'EOF'
# Configurações do Monitor FII
# =============================

# Intervalo entre verificações (em minutos)
MONITOR_INTERVAL_MINUTES=60

# Máximo de fundos para verificar por ciclo
MONITOR_MAX_FUNDS=100

# Modo de teste (true = não envia WhatsApp real)
MONITOR_TEST_MODE=false

# URL base da aplicação
MONITOR_WEBHOOK_URL=http://localhost:3000

# Configurações do servidor de aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

    echo "✅ Arquivo $ENV_MONITOR_FILE criado!"
    echo "📝 Você pode editá-lo para personalizar as configurações."
    echo ""
fi

# Verificar dependências principais
echo "🔍 Verificando dependências..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado! Instale Node.js primeiro."
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js encontrado: $NODE_VERSION"

# Verificar se o servidor está rodando
echo "🌐 Verificando se o servidor está rodando..."

if curl -s "http://localhost:3000/api/fii/monitor-follows" > /dev/null 2>&1; then
    echo "✅ Servidor detectado em http://localhost:3000"
else
    echo "⚠️  Servidor não detectado em localhost:3000"
    echo "   Certifique-se de que a aplicação está rodando com 'npm run dev'"
    echo "   O monitor pode funcionar mesmo assim se você configurar MONITOR_WEBHOOK_URL"
fi

echo ""
echo "📋 OPÇÕES DE EXECUÇÃO:"
echo "======================"
echo ""

# Função para mostrar menu
show_menu() {
    echo "1) 🧪 Teste único (uma verificação)"
    echo "2) 🧪 Modo teste contínuo (não envia WhatsApp)"
    echo "3) 🚀 Executar em produção (envia WhatsApp)"
    echo "4) 🛠️  Configurar variáveis"
    echo "5) 📊 Ver logs em tempo real"
    echo "6) 🛑 Parar monitor rodando"
    echo "0) Sair"
    echo ""
}

# Loop principal do menu
while true; do
    show_menu
    read -p "Escolha uma opção (0-6): " choice
    
    case $choice in
        1)
            echo "🧪 Executando teste único..."
            source "$ENV_MONITOR_FILE"
            export MONITOR_TEST_MODE=true
            node scripts/fii-monitor.js &
            MONITOR_PID=$!
            echo "Monitor iniciado com PID: $MONITOR_PID"
            echo "Aguardando 2 minutos para teste..."
            sleep 120
            kill $MONITOR_PID 2>/dev/null || true
            echo "✅ Teste concluído!"
            ;;
        2)
            echo "🧪 Iniciando modo teste contínuo..."
            source "$ENV_MONITOR_FILE"
            export MONITOR_TEST_MODE=true
            echo "💡 Para parar: Ctrl+C"
            node scripts/fii-monitor.js
            ;;
        3)
            echo "🚀 Iniciando em PRODUÇÃO (enviará WhatsApp real)..."
            read -p "Tem certeza? (s/N): " confirm
            if [[ $confirm == [sS] ]]; then
                source "$ENV_MONITOR_FILE"
                export MONITOR_TEST_MODE=false
                echo "💡 Para parar: Ctrl+C"
                echo "📱 NOTIFICAÇÕES WHATSAPP ATIVAS!"
                node scripts/fii-monitor.js
            else
                echo "❌ Cancelado."
            fi
            ;;
        4)
            echo "🛠️  Editando configurações..."
            if command -v nano &> /dev/null; then
                nano "$ENV_MONITOR_FILE"
            elif command -v vim &> /dev/null; then
                vim "$ENV_MONITOR_FILE"
            else
                echo "📝 Edite o arquivo: $ENV_MONITOR_FILE"
                echo "   Conteúdo atual:"
                cat "$ENV_MONITOR_FILE"
            fi
            ;;
        5)
            echo "📊 Mostrando logs em tempo real..."
            echo "💡 Logs do monitor aparecerão aqui quando executado"
            echo "   Execute o monitor em outro terminal primeiro"
            tail -f /dev/null
            ;;
        6)
            echo "🛑 Parando monitores rodando..."
            pkill -f "fii-monitor.js" 2>/dev/null || true
            echo "✅ Monitores parados."
            ;;
        0)
            echo "👋 Saindo..."
            break
            ;;
        *)
            echo "❌ Opção inválida. Tente novamente."
            ;;
    esac
    
    echo ""
    read -p "Pressione Enter para continuar..." 
    echo ""
done

echo "✅ Script finalizado!"