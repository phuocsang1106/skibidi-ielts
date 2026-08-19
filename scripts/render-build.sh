#!/usr/bin/env bash
set -euo pipefail

echo "Installing dependencies..."
npm install --include=dev --no-audit --no-fund

echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

echo "Building Next.js..."
npx next build