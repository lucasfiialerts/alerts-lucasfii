# 🚨 Comandos Perigosos vs Seguros no Banco de Dados

Este documento é um **GUIA DE SOBREVIVÊNCIA** para evitar desastres no banco de dados do projeto **LucasFiiAlerts**.

## 💀 COMANDOS QUE PODEM DESTRUIR TUDO

### ⚠️ **NÍVEL EXTINÇÃO - NUNCA USAR**

```sql
-- 💀💀💀 APOCALIPSE TOTAL - PERDE TUDO
DROP DATABASE lucasfiialerts;

-- 💀💀 DESTRUIÇÃO TOTAL DA TABELA
DROP TABLE users;
DROP TABLE user_fii_follow;

-- 💀💀 LIMPA TODOS OS DADOS DA TABELA
TRUNCATE TABLE users;
TRUNCATE TABLE orders;
```

**❌ CONSEQUÊNCIA**: **PERDA PERMANENTE DE TODOS OS DADOS**

### ⚠️ **NÍVEL CATÁSTROFE - MUITO PERIGOSO**

```sql
-- 💀 APAGA TODOS OS USUÁRIOS
DELETE FROM users;  -- SEM WHERE = DISASTER

-- 💀 TODOS FICAM COM O MESMO EMAIL
UPDATE users SET email = 'erro@erro.com';  -- SEM WHERE

-- 💀 REMOVE COLUNA E TODOS OS DADOS DELA
ALTER TABLE users DROP COLUMN email;
ALTER TABLE users DROP COLUMN whatsapp_number;
```

**❌ CONSEQUÊNCIA**: **PERDA MASSIVA DE DADOS CRÍTICOS**

### ⚠️ **NÍVEL PROBLEMA - PERIGOSO**

```sql
-- ⚠️ PODE PERDER DADOS SE INCOMPATÍVEL
ALTER TABLE users ALTER COLUMN email TYPE integer;

-- ⚠️ QUEBRA TODO O CÓDIGO
ALTER TABLE users RENAME COLUMN id TO user_id;

-- ⚠️ PODE QUEBRAR RELACIONAMENTOS
ALTER TABLE users ALTER COLUMN id TYPE varchar(50);
```

**❌ CONSEQUÊNCIA**: **DADOS CORROMPIDOS OU CÓDIGO QUEBRADO**

---

## ✅ COMANDOS SEGUROS - USE À VONTADE

### 🛡️ **NÍVEL SUPER SEGURO**

```sql
-- ✅ ADICIONA COLUNA SEM MEXER EM NADA
ALTER TABLE users ADD COLUMN alert_preferences_fnet boolean DEFAULT false;
ALTER TABLE users ADD COLUMN new_feature text DEFAULT '';

-- ✅ SÓ LÊ DADOS, NUNCA MODIFICA
SELECT * FROM users;
SELECT COUNT(*) FROM orders;

-- ✅ CRIA ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_date ON orders(created_at);

-- ✅ ADICIONA NOVOS DADOS
INSERT INTO users (name, email) VALUES ('Novo User', 'novo@email.com');
```

### 🛡️ **NÍVEL SEGURO (com WHERE)**

```sql
-- ✅ ATUALIZA USUÁRIO ESPECÍFICO
UPDATE users SET name = 'João Silva' WHERE id = 'user123';

-- ✅ REMOVE USUÁRIO ESPECÍFICO
DELETE FROM users WHERE id = 'user456';

-- ✅ ATUALIZA COM CONDIÇÃO SEGURA
UPDATE users SET whatsapp_verified = true WHERE whatsapp_number = '+5511999999999';
```

---

## 🎯 DRIZZLE COMMANDS - CLASSIFICAÇÃO DE RISCO

### ✅ **COMANDOS DRIZZLE SEGUROS**

```bash
# ✅ SUPER SEGURO - só adiciona colunas/tabelas
npx drizzle-kit push

# ✅ SEGURO - só visualiza
npx drizzle-kit studio

# ✅ SEGURO - só gera arquivos
npx drizzle-kit generate
```

### ⚠️ **COMANDOS DRIZZLE COM CUIDADO**

```bash
# ⚠️ CUIDADO - pode fazer alterações estruturais
npx drizzle-kit push --force

# 💀 PERIGOSO - reseta tudo
npx drizzle-kit drop
```

---

## 🚨 SINAIS DE ALERTA - PARE IMEDIATAMENTE

Se você ver estes comandos sendo executados ou sugeridos:

```sql
DROP TABLE...        -- 🚨 PARE!
DROP COLUMN...       -- 🚨 PARE!
TRUNCATE...          -- 🚨 PARE!
DELETE FROM users;   -- 🚨 PARE! (sem WHERE)
UPDATE users SET...  -- 🚨 PARE! (sem WHERE)
ALTER COLUMN...      -- 🚨 CUIDADO!
```

**🛑 AÇÃO IMEDIATA**: Fazer backup antes de continuar!

---

## 🛡️ PROCESSO SEGURO PARA MUDANÇAS

### **1. BACKUP OBRIGATÓRIO**
```bash
# Sempre fazer backup antes de QUALQUER alteração
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Verificar se backup foi criado
ls -la backup_*.sql
```

### **2. TESTAR EM DESENVOLVIMENTO**
```bash
# Testar mudanças em ambiente local primeiro
DATABASE_URL=$DEV_DATABASE_URL npx drizzle-kit push
```

### **3. VERIFICAR SQL GERADO**
```bash
# Ver exatamente o que será executado
npx drizzle-kit generate
cat drizzle/0008_new_migration.sql  # Revisar SQL
```

### **4. APLICAR EM PRODUÇÃO**
```bash
# Só depois de testar e verificar
DATABASE_URL=$PROD_DATABASE_URL npx drizzle-kit push
```

---

## 📋 CHECKLIST DE SEGURANÇA

Antes de executar QUALQUER comando no banco:

- [ ] 🛡️ Backup realizado?
- [ ] 🧪 Testado em desenvolvimento?
- [ ] 👁️ SQL revisado?
- [ ] ❓ Comando é seguro?
- [ ] 🚨 Não tem DROP, TRUNCATE ou DELETE sem WHERE?
- [ ] ✅ Equipe foi informada?

---

## 🆘 COMANDOS DE EMERGÊNCIA

### **Recuperar de Backup**
```bash
# Restaurar backup completo
psql $DATABASE_URL < backup_20241119_143000.sql

# Restaurar apenas uma tabela
pg_restore --data-only --table=users backup_20241119_143000.sql
```

### **Verificar Danos**
```bash
# Contar registros
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# Verificar estrutura
psql $DATABASE_URL -c "\d users"

# Ver últimas alterações
psql $DATABASE_URL -c "SELECT * FROM users ORDER BY updated_at DESC LIMIT 5;"
```

---

## 🏆 EXEMPLOS DE MUDANÇAS SEGURAS

### **✅ Adicionando Nova Preferência de Alerta**

```typescript
// 1. Alterar schema.ts
export const userTable = pgTable("user", {
  // ... campos existentes
  alertPreferencesNewFeature: boolean("alert_preferences_new_feature").default(false),
});
```

```bash
# 2. Gerar e aplicar migração
npx drizzle-kit generate
npx drizzle-kit push
```

**Por que é seguro?**
- ✅ Só adiciona coluna
- ✅ Tem valor padrão
- ✅ Não modifica dados existentes
- ✅ Todos os usuários ficam com `false`

### **✅ Adicionando Nova Tabela**

```typescript
// Nova tabela - sempre seguro
export const newFeatureTable = pgTable("new_feature", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id").references(() => userTable.id),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## 🎯 REGRAS DE OURO

### **🟢 SEMPRE SEGURO:**
- `ADD COLUMN` com DEFAULT
- `CREATE TABLE`
- `CREATE INDEX`
- `INSERT INTO`
- `SELECT` (qualquer consulta)

### **🟡 CUIDADO (usar WHERE):**
- `UPDATE` com WHERE específico
- `DELETE` com WHERE específico
- `ALTER COLUMN` (pode quebrar)

### **🔴 NUNCA USAR SEM BACKUP:**
- `DROP TABLE/COLUMN`
- `TRUNCATE`
- `DELETE` sem WHERE
- `UPDATE` sem WHERE
- `ALTER COLUMN TYPE` (incompatível)

---

## 💡 DICAS FINAIS

1. **Se tem dúvida, faça backup**
2. **Se é para adicionar, geralmente é seguro**
3. **Se é para remover, sempre perigoso**
4. **Se é para modificar, muito cuidado**
5. **WHERE é seu melhor amigo**
6. **DEFAULT salva vidas**

---

> 🚨 **LEMBRE-SE**: Um backup de 5 minutos pode evitar 5 horas de desespero!

**Criado em**: 19 de novembro de 2024  
**Mantenha este documento sempre visível durante operações no banco!**