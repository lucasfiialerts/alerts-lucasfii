#!/bin/bash

# 🔄 Script de Reorganização da Pasta Scripts
# Execute com cuidado e faça backup antes!

set -e  # Parar em caso de erro

SCRIPTS_DIR="/Volumes/SSD SATA/GITHUB/alerts-lucasfii/scripts"
cd "$SCRIPTS_DIR"

echo "🚀 Iniciando reorganização dos scripts..."
echo "📁 Diretório: $SCRIPTS_DIR"
echo ""

# Verificar se as pastas existem
if [ ! -d "core" ] || [ ! -d "crons" ] || [ ! -d "tests" ] || [ ! -d "deprecated" ]; then
    echo "❌ Erro: Pastas core/, crons/, tests/ e deprecated/ devem existir!"
    echo "Execute: mkdir -p core crons tests deprecated"
    exit 1
fi

echo "📋 Leia o arquivo REORGANIZACAO.md antes de continuar!"
echo ""
read -p "❓ Você leu e quer continuar? (sim/nao): " resposta

if [ "$resposta" != "sim" ]; then
    echo "❌ Cancelado pelo usuário"
    exit 0
fi

echo ""
echo "🔄 Fase 1: Movendo arquivos de teste..."
echo "─────────────────────────────────────────"

# Mover testes
for file in test-*.js test-*.ts test-*.sh; do
    if [ -f "$file" ]; then
        echo "  📝 Movendo $file → tests/"
        mv "$file" tests/
    fi
done

echo "✅ Testes movidos"
echo ""
echo "🔄 Fase 2: Criando lista de arquivos deprecated..."
echo "─────────────────────────────────────────"

# Lista de arquivos para deprecated (você deve revisar esta lista!)
DEPRECATED_FILES=(
    "bitcoin-alerts-database.js"
    "bitcoin-alerts-smart.js"
    "bitcoin-auto-monitor.js"
    "bitcoin-monitor.js"
    "send-bitcoin-alerts-real.js"
    "send-bitcoin-with-env.js"
    "setup-bitcoin-cron.sh"
    "fii-alert-monitor.js"
    "fii-monitor.js"
    "fii-monitor.service"
    "run-monitor.sh"
    "setup-auto-monitor.sh"
    "setup-monitor.sh"
    "setup-universal-monitor.sh"
    "scraper-clubefii-puppeteer.js"
    "scraper-clubefii.js"
    "scraper-investidor10.js"
    "verificar-rngo11.js"
)

echo "⚠️  Os seguintes arquivos serão movidos para deprecated/:"
for file in "${DEPRECATED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  - $file"
    fi
done

echo ""
read -p "❓ Mover estes arquivos? (sim/nao): " resposta_dep

if [ "$resposta_dep" == "sim" ]; then
    for file in "${DEPRECATED_FILES[@]}"; do
        if [ -f "$file" ]; then
            echo "  📦 Movendo $file → deprecated/"
            mv "$file" deprecated/
        fi
    done
    echo "✅ Arquivos deprecated movidos"
else
    echo "⏭️  Pulando deprecated"
fi

echo ""
echo "✅ Reorganização concluída!"
echo ""
echo "📝 PRÓXIMOS PASSOS MANUAIS:"
echo "1. Revisar a lista de deprecated em REORGANIZACAO.md"
echo "2. Mover arquivos core/ manualmente após testar"
echo "3. Atualizar imports nas APIs"
echo "4. Testar todas as APIs"
echo ""
echo "⚠️  NÃO delete deprecated/ por pelo menos 30 dias!"
