# Como Aplicar Migrações no Banco de Dados

## Quando você faz alterações no schema

### 1️⃣ Gerar a migração
```bash
npx drizzle-kit generate
```
Cria os arquivos SQL na pasta `drizzle/` baseado nas mudanças em `src/db/schema.ts`

---

### 2️⃣ Aplicar no banco de DEV
```bash
npx drizzle-kit push
```
Aplica as mudanças no banco que está configurado no arquivo `.env`

---

### 3️⃣ Aplicar no banco de PRODUÇÃO
```bash
DATABASE_URL="postgresql://neondb_owner:npg_bd0rXFQzoi2H@ep-frosty-poetry-a4g6l8pt-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" npx drizzle-kit push
```
Aplica as mudanças diretamente no banco de produção sem alterar o `.env`

---

## 📋 Resumo Rápido

| Ambiente | Comando |
|----------|---------|
| **DEV** (configurado no .env) | `npx drizzle-kit push` |
| **PROD** (via variável temporária) | `DATABASE_URL="[URL_PROD]" npx drizzle-kit push` |

---

## ⚠️ Importante

1. **Sempre teste no DEV primeiro** antes de aplicar em produção
2. Se o `.env` está configurado para DEV, o comando simples aplica apenas no DEV
3. Para PROD, use o comando completo com `DATABASE_URL=` para não mexer no `.env`

---

## 🔍 Verificar se há mudanças pendentes

```bash
npx drizzle-kit push --dry-run
```
Mostra o que seria aplicado sem executar de fato

---

## 🆚 Script Manual vs Drizzle-Kit Push

### Duas Formas de Aplicar Migrações

#### 1️⃣ **Script Manual** (Pontual)
```bash
node scripts/apply-migration-especifica.js
```

**Quando usar:**
- 🚨 Emergência: precisa aplicar UMA mudança específica rápido
- 🔒 Quer controle total do SQL executado
- ⚡ Aplicar apenas uma coluna sem tocar no resto do schema

**Características:**
- ✅ Controle total do que é executado
- ✅ Rápido para mudanças pontuais
- ❌ **NÃO sincroniza** com o `schema.ts` completo
- ❌ Pode deixar banco desincronizado se houver outras mudanças
- ❌ Drizzle não registra no histórico de migrations

**Exemplo:**
```javascript
// scripts/apply-migration-campo.js
await client.query(`
  ALTER TABLE "user" ADD COLUMN "novo_campo" boolean DEFAULT false
`);
```

---

#### 2️⃣ **Drizzle-Kit Push** (Recomendado)
```bash
npx drizzle-kit push
```

**Quando usar:**
- ✨ Desenvolvimento normal (99% dos casos)
- 🔄 Quer garantir que banco = código
- 📦 Tem múltiplas mudanças no schema
- 🎯 Jeito "oficial" e seguro

**Características:**
- ✅ **Sincroniza TODO o schema** automaticamente
- ✅ Detecta TODAS as diferenças entre `schema.ts` e banco
- ✅ Aplica múltiplas mudanças de uma vez
- ✅ Verifica conflitos antes de aplicar
- ✅ Registra no histórico do Drizzle
- ⚠️ Pode aplicar mudanças extras se o schema tiver outras alterações

---

### 📊 Comparação

| Aspecto | Script Manual | Drizzle-Kit Push |
|---------|--------------|------------------|
| **Mudanças aplicadas** | Apenas uma específica | Todas detectadas |
| **Sincronização** | Manual | Automática |
| **Controle** | Total | Drizzle decide |
| **Segurança** | Você valida | Drizzle verifica |
| **Histórico** | Não registra | Registra tudo |
| **Uso** | Emergências | Dia a dia |

---

### 🎯 Fluxo Recomendado

**Para desenvolvimento normal:**
```bash
# 1. Altere o schema.ts
# 2. Gere a migration
npx drizzle-kit generate

# 3. Aplique no DEV
npx drizzle-kit push

# 4. Teste localmente
# 5. Aplique no PROD
DATABASE_URL="[URL_PROD]" npx drizzle-kit push
```

**Para emergência (banco já em produção):**
```bash
# 1. Crie script pontual
node scripts/apply-migration-urgente.js

# 2. DEPOIS, gere a migration oficial
npx drizzle-kit generate

# 3. Isso mantém o histórico correto
```

---

### ⚠️ Importante

- **Script manual** é útil para resolver rápido, mas pode desincronizar
- **Drizzle-kit** é o jeito correto e deve ser usado sempre que possível
- Se usar script manual, depois rode `npx drizzle-kit generate` para registrar no histórico
- Sempre teste no DEV antes de aplicar no PROD!
