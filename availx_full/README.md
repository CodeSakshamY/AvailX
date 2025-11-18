# AVAILX — Full Advanced Scaffold

This is the full advanced scaffold for the AVAILX project (Universal Real-Time Availability Grid).
Contains backend API, mobile Expo app, Next.js web, infra, Prisma schema, OpenAPI spec, and CI.

See `infra/.env.example` for env variables. Use Docker Compose to run Postgres locally.

## Quickstart (local)
1. Start Postgres:
   ```
   cd infra
   docker-compose up -d
   ```
2. Backend:
   ```
   cd services/api
   cp .env.example .env
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   node prisma/seed.js
   npm run dev
   ```
3. Mobile:
   ```
   cd apps/mobile
   npm install
   npx expo start
   ```
4. Web:
   ```
   cd apps/web
   npm install
   npm run dev
   ```

## Contents
- apps/mobile: Expo React Native app (Auth, Home, Search, Provider)
- apps/web: Next.js admin + marketing
- services/api: Node.js + Express + Prisma
- infra: docker-compose + env example
- docs/openapi.yaml: OpenAPI spec for the core endpoints
- .github/workflows: basic CI for backend tests and deploy

