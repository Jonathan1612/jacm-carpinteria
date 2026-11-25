#!/bin/sh
set -e
mkdir -p /app/data/uploads /app/prisma
export DATABASE_URL="${DATABASE_URL:-file:/app/prisma/prod.db}"
cd /app
npx prisma db push
if [ "${RUN_DB_SEED}" = "true" ]; then
  npx prisma db seed || true
fi
exec npm run start