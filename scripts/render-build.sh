#!/usr/bin/env bash
set -euo pipefail

echo "[1/5] Installing dependencies"
npm install

echo "[2/5] Generating Prisma client"
npm run db:generate

echo "[3/5] Creating/updating PostgreSQL tables"
npx prisma db push

echo "[4/5] Seeding starter vocabulary"
npm run db:seed

echo "[5/5] Building Next.js"
npm run build
