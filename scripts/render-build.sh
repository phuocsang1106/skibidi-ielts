#!/usr/bin/env bash
set -euo pipefail

npm install
npx prisma generate
npx prisma db push
npm run db:seed
npx tsx prisma/seed-level3.ts
npm run build
