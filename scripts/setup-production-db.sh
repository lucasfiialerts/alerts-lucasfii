#!/bin/bash

echo "🚀 Aplicando migrações no banco de produção..."

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL não configurada"
  exit 1
fi

echo "📊 Aplicando migrações..."
npx drizzle-kit push

echo "✅ Migrações aplicadas com sucesso!"
echo "🎯 Agora você pode fazer o deploy no Vercel"