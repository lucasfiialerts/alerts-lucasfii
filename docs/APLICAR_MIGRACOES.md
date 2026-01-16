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
