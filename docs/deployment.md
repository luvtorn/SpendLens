# Deployment

## Production topology

```text
Browser
↓ HTTPS
Next.js frontend
↓ HTTPS REST
NestJS backend
↓ TLS PostgreSQL connection
PostgreSQL
```

Текущие бесплатные provider choices могут быть:

- frontend: Vercel;
- backend: Render;
- database: Neon.

Application architecture не зависит от этих providers. Recurring target остаётся
`0 PLN/month` в пределах free tiers.

## Перед deployment

Запусти из корня:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Убедись, что:

- `node_modules`, `.env`, `.next` и `dist` не tracked Git;
- migrations закоммичены;
- production secrets отсутствуют в repository;
- frontend не импортирует Prisma;
- target commit находится в remote branch.

## Vercel frontend

Рекомендуемые project settings:

```text
Framework Preset: Next.js
Root Directory: apps/web
Build Command: Next.js default / npm run build
Install Command: npm install
```

Root `package-lock.json` должен оставаться доступным как workspace lockfile.

Environment:

```env
NEXT_PUBLIC_API_URL=https://your-render-service.example/api
```

После изменения environment variable требуется новый deployment. Значение
должно включать `/api`, не должно содержать quotes, whitespace или localhost.

Frontend project не нуждается в `DATABASE_URL`, JWT secrets или CSRF secret.

## Render backend

Рекомендуемые settings при пустом Root Directory:

```text
Runtime: Node
Build Command:
npm install && cd apps/api && npx prisma generate && npx prisma migrate deploy && npm run build

Start Command:
npm run start --workspace @spendlens/api
```

`prisma migrate deploy` применяет уже закоммиченные migrations. Не используй
`prisma migrate dev` в production build.

Backend environment:

```env
DATABASE_URL=postgresql://...
FRONTEND_URL=https://your-vercel-domain.example
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
CSRF_SECRET=...
COOKIE_SAME_SITE=lax
COOKIE_SECURE=true
```

Render передаёт `PORT`; вручную задавать его обычно не нужно. Backend слушает
`0.0.0.0`.

Не добавляй `COOKIE_DOMAIN`, если frontend и backend не используют подходящий
общий parent domain. Текущий Next.js auth proxy позволяет использовать cookies
на frontend origin.

## Neon database

- Используй standard PostgreSQL `DATABASE_URL` с TLS settings провайдера.
- Не связывай domain code с Neon SDK/API.
- Production migrations запускаются через Prisma CLI из backend build/release
  process.
- Seed не является обязательной частью production deploy.
- Не подключай frontend напрямую к Neon.

## Проверка deployment

### Backend

```text
GET https://backend.example/api/health
```

Ожидается:

```json
{"status":"ok"}
```

Затем проверь CSRF endpoint и registration/login через frontend. Health endpoint
пока подтверждает только работу process; database readiness является отдельной
onboarding-задачей.

### Frontend proxy

```text
GET https://frontend.example/api/backend/auth/csrf
```

Ожидается `200`, JSON с `csrfToken` и CSRF cookie. `503 Authentication service
unavailable` означает, что Vercel function не может обратиться к configured API
URL.

### User flow

1. Открой `/register`.
2. Создай тестового пользователя с фиктивными данными.
3. Убедись, что произошёл redirect на dashboard.
4. Проверь authenticated pages.
5. Выполни logout и убедись, что protected route ведёт на login.

Не используй реальную банковскую информацию для smoke test.

## Free tier behavior

Render free instance может засыпать и медленно отвечать на первый request. Это
ожидаемый cold start, но стабильный `502` или немедленный `503` требует
диагностики.

Не добавляй платный uptime monitor только для предотвращения sleep без отдельного
решения о стоимости.

## Rollback

- Application rollback выполняется deployment предыдущего известного commit.
- Database migration нельзя «откатить» удалением migration file.
- Destructive database rollback требует отдельного проверенного plan и backup.
- Никогда не запускай `prisma migrate reset` против production.

## Cost

Текущая документация не требует новых внешних сервисов:

```text
New paid services: none
Development cost: 0 PLN
Recurring target: 0 PLN/month
```

