# 📋 Regras e Comandos do Banco de Dados

Este documento contém regras essenciais e comandos importantes para gerenciar o banco de dados do projeto **LucasFiiAlerts**.

## 🗄️ Comandos Drizzle ORM

### Gerar Migração
```bash
npx drizzle-kit generate
```
- **Quando usar**: Após alterar o schema em `drizzle/schema.ts` ou `src/db/schema.ts`
- **O que faz**: Cria arquivos de migração SQL na pasta `drizzle/`

### Aplicar Migrações
```bash
npx drizzle-kit push
```
- **Quando usar**: Para aplicar mudanças do schema ao banco de dados
- **Cuidado**: Não usar em produção sem backup

### Forçar Aplicação (Desenvolvimento)
```bash
npx drizzle-kit push --force
```
- **Quando usar**: Quando há conflitos no desenvolvimento
- **NUNCA usar em produção**

### Visualizar Banco (Studio)
```bash
npx drizzle-kit studio
```
- **Acesso**: http://localhost:4983
- **Útil para**: Visualizar dados, testar queries

## 🛡️ Regras de Segurança

### ❌ NUNCA FAZER
1. **Nunca rodar migrations com --force em produção**
2. **Nunca alterar schema sem backup**
3. **Nunca commitar credentials no código**
4. **Nunca fazer DROP TABLE sem confirmar 3x**

### ✅ SEMPRE FAZER
1. **Sempre fazer backup antes de migrations**
2. **Sempre testar migrations em desenvolvimento primeiro**
3. **Sempre revisar arquivos SQL gerados**
4. **Sempre usar variáveis de ambiente para credentials**

## 📊 Comandos de Monitoramento

### Verificar Status do Banco
```bash
npm run db:check
```

### Backup Manual
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar Backup
```bash
psql $DATABASE_URL < backup_20241119_143000.sql
```

## 🔧 Scripts do Projeto

### Monitor FII
```bash
node scripts/fii-monitor.js
```
- **Função**: Monitora FIIs e envia alertas
- **Frequência**: A cada 15 minutos via cron

### Teste Alertas Condicionais
```bash
node scripts/test-conditional-alerts.js
```
- **Função**: Testa sistema de alertas condicionais

### Verificar Inconsistências
```bash
node scripts/check-data-inconsistency.js
```
- **Função**: Verifica integridade dos dados

### Teste WhatsApp
```bash
node scripts/test-notify-api.js
```
- **Função**: Testa integração com WhatsApp

## 🌐 Variáveis de Ambiente Essenciais

### Banco de Dados
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

### WhatsApp (Z-API)
```env
ZAPI_TOKEN=your_token_here
ZAPI_INSTANCE=your_instance_here
```

### Stripe (Pagamentos)
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🚀 Comandos de Deploy

### Verificar Ambiente
```bash
npm run build
```

### Aplicar Migrations em Produção
```bash
# 1. Fazer backup primeiro
pg_dump $PROD_DATABASE_URL > prod_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Aplicar migrations
DATABASE_URL=$PROD_DATABASE_URL npx drizzle-kit push

# 3. Verificar se funcionou
npm run db:check
```

## 📋 Checklist Pré-Deploy

- [ ] Backup do banco realizado
- [ ] Migrations testadas em desenvolvimento
- [ ] Variáveis de ambiente configuradas
- [ ] Build sem erros
- [ ] Testes passando
- [ ] Monitor funcionando

## 🔄 Schema Sync (Importante!)

Quando adicionar campos ao schema, **SEMPRE** atualizar ambos arquivos:
1. `drizzle/schema.ts` (usado pelas migrations)
2. `src/db/schema.ts` (usado pelo código TypeScript)

### Exemplo de Adição de Campo:
```typescript
// Em ambos os arquivos
export const userTable = pgTable("user", {
  // ... campos existentes
  novoCampo: boolean("novo_campo").default(false),
});
```

## 🆘 Comandos de Emergência

### Rollback de Migration
```bash
# Restaurar backup
psql $DATABASE_URL < backup_anterior.sql
```

### Reset Total (APENAS DEV)
```bash
npx drizzle-kit drop
npx drizzle-kit push
```

### Verificar Conexão
```bash
psql $DATABASE_URL -c "SELECT version();"
```

## 📱 Teste de Integrações

### FNet Alerts
```bash
curl -X GET http://localhost:3000/api/cron/fnet-alerts
```

### WhatsApp Test
```bash
curl -X POST http://localhost:3000/api/test-whatsapp \
  -H "Content-Type: application/json" \
  -d '{"phone":"5511999999999","message":"Teste"}'
```

## 📝 Logs Importantes

### Localização dos Logs
- `/logs/` - Logs da aplicação
- `/var/log/pm2/` - Logs do PM2 (produção)

### Monitorar Logs em Tempo Real
```bash
tail -f logs/fii-monitor.log
pm2 logs lucasfiialerts
```

## 🎯 Regras de Ouro

1. **Sempre ler este documento antes de mexer no banco**
2. **Backup é vida, migration sem backup é morte**
3. **Teste local primeiro, sempre**
4. **Documentar todas as mudanças importantes**
5. **Nunca fazer alterações diretas em produção sem approval**

---

> 💡 **Dica**: Salve este documento nos favoritos e consulte sempre que for fazer alterações no banco!

**Última atualização**: 19 de novembro de 2024