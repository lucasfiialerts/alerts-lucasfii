#!/bin/bash

# 🚀 Setup Bitcoin Alerts Cron Job
# Configuração automática de cron jobs para alertas de Bitcoin

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Configurando Cron Job para Alertas de Bitcoin${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 1. Verificar se estamos no diretório correto
if [ ! -f "package.json" ] || [ ! -d "src/app/api/cron" ]; then
    echo -e "${RED}❌ Erro: Execute este script no diretório raiz do projeto${NC}"
    exit 1
fi

PROJECT_DIR=$(pwd)
echo -e "${GREEN}📁 Diretório do projeto: ${PROJECT_DIR}${NC}"

# 2. Verificar se o endpoint existe
if [ ! -f "src/app/api/cron/bitcoin-alerts/route.ts" ]; then
    echo -e "${RED}❌ Erro: Endpoint de Bitcoin alerts não encontrado${NC}"
    echo -e "${YELLOW}💡 Execute primeiro a configuração do sistema de alertas${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Endpoint Bitcoin alerts encontrado${NC}"

# 3. Testar o endpoint localmente (se servidor estiver rodando)
echo ""
echo -e "${BLUE}🧪 Testando endpoint Bitcoin alerts...${NC}"

if curl -s -f "http://localhost:3000/api/cron/bitcoin-alerts?test=true" > /dev/null; then
    echo -e "${GREEN}✅ Endpoint funcionando localmente${NC}"
else
    echo -e "${YELLOW}⚠️ Servidor local não está rodando ou endpoint indisponível${NC}"
    echo -e "${YELLOW}💡 Execute 'npm run dev' em outro terminal para testar${NC}"
fi

# 4. Backup do crontab atual
echo ""
echo -e "${BLUE}💾 Fazendo backup do crontab atual...${NC}"
BACKUP_FILE="/tmp/crontab_backup_bitcoin_$(date +%s)"
crontab -l > "$BACKUP_FILE" 2>/dev/null || echo "# Primeiro crontab" > "$BACKUP_FILE"
echo -e "${GREEN}✅ Backup salvo em: ${BACKUP_FILE}${NC}"

# 5. Criar novo crontab
TEMP_CRON=$(mktemp)

# Manter cron jobs existentes (removendo alertas Bitcoin antigos se existirem)
echo -e "${BLUE}🔄 Preparando novo crontab...${NC}"
crontab -l 2>/dev/null | grep -v "bitcoin-alerts" | grep -v "Bitcoin Alert" > "$TEMP_CRON" || true

# 6. Adicionar cron jobs para Bitcoin
cat >> "$TEMP_CRON" << EOF

# 🚀 Bitcoin Alerts - LucasFIIAlerts
# Gerado automaticamente em $(date)

# Bitcoin Alert: A cada 5 minutos (horário comercial: 8h-20h)
*/5 8-20 * * 1-5 curl -s "http://localhost:3000/api/cron/bitcoin-alerts" > /dev/null 2>&1

# Bitcoin Alert: A cada 15 minutos (final de semana e noturno)
*/15 * * * 0,6 curl -s "http://localhost:3000/api/cron/bitcoin-alerts" > /dev/null 2>&1
*/15 21-23,0-7 * * 1-5 curl -s "http://localhost:3000/api/cron/bitcoin-alerts" > /dev/null 2>&1

# Bitcoin Alert: Verificação manual diária às 9h
0 9 * * * curl -s "http://localhost:3000/api/cron/bitcoin-alerts?force=true" > /dev/null 2>&1

EOF

# 7. Instalar o novo crontab
echo -e "${BLUE}⚙️ Instalando novo crontab...${NC}"
crontab "$TEMP_CRON"
rm "$TEMP_CRON"

echo -e "${GREEN}✅ Cron jobs configurados com sucesso!${NC}"

# 8. Mostrar configuração atual
echo ""
echo -e "${PURPLE}📅 CRONOGRAMAS CONFIGURADOS:${NC}"
echo -e "${YELLOW}Horário Comercial (Segunda-Sexta, 8h-20h):${NC}"
echo "   • A cada 5 minutos - Verificação de variação de Bitcoin"
echo ""
echo -e "${YELLOW}Horário Não Comercial:${NC}"
echo "   • A cada 15 minutos - Verificação reduzida"
echo "   • Finais de semana e noite"
echo ""
echo -e "${YELLOW}Verificações Especiais:${NC}"
echo "   • 09:00 diariamente - Teste forçado do sistema"
echo ""

# 9. Verificar se o cron está rodando
echo -e "${BLUE}🔍 Verificando serviço cron...${NC}"
if pgrep -x "cron" > /dev/null || pgrep -x "crond" > /dev/null; then
    echo -e "${GREEN}✅ Serviço cron está rodando${NC}"
else
    echo -e "${RED}❌ Aviso: Serviço cron não está rodando!${NC}"
    echo -e "${YELLOW}💡 Inicie o cron com: sudo service cron start${NC}"
fi

# 10. Mostrar próximas execuções
echo ""
echo -e "${BLUE}⏰ Verificar próximas execuções:${NC}"
echo -e "${YELLOW}crontab -l${NC}  # Ver configuração atual"
echo -e "${YELLOW}sudo tail -f /var/log/cron.log${NC}  # Ver logs do cron"
echo ""

# 11. URLs úteis
echo -e "${PURPLE}🔗 ENDPOINTS DISPONÍVEIS:${NC}"
echo "• http://localhost:3000/api/cron/bitcoin-alerts"
echo "• http://localhost:3000/api/cron/bitcoin-alerts?test=true"
echo "• http://localhost:3000/api/cron/bitcoin-alerts?force=true"
echo ""

# 12. Comandos úteis
echo -e "${PURPLE}🛠️ COMANDOS ÚTEIS:${NC}"
echo -e "${YELLOW}# Testar manualmente:${NC}"
echo "curl \"http://localhost:3000/api/cron/bitcoin-alerts?test=true\" | jq"
echo ""
echo -e "${YELLOW}# Forçar alerta:${NC}"
echo "curl \"http://localhost:3000/api/cron/bitcoin-alerts?force=true\" | jq"
echo ""
echo -e "${YELLOW}# Ver logs do cron:${NC}"
echo "sudo tail -f /var/log/cron.log"
echo ""
echo -e "${YELLOW}# Remover cron jobs Bitcoin:${NC}"
echo "crontab -l | grep -v 'bitcoin-alerts' | crontab -"
echo ""

# 13. Configurações recomendadas
echo -e "${PURPLE}⚙️ CONFIGURAÇÕES RECOMENDADAS:${NC}"
echo "• Para produção: Use webhook services (EasyCron, etc.)"
echo "• Para desenvolvimento: Use os cron jobs locais configurados"
echo "• Monitore logs regularmente"
echo "• Teste endpoints manualmente antes do deploy"
echo ""

echo -e "${GREEN}🎉 Configuração do Bitcoin Alerts Cron Job concluída!${NC}"
echo -e "${BLUE}Seu sistema agora monitorará Bitcoin automaticamente.${NC}"
echo ""