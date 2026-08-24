# Локальная разработка

## Требования

- Node.js 20 или новее;
- npm;
- PostgreSQL 16-compatible database;
- Git.

PostgreSQL может быть локальным, запущенным в Docker или размещённым в отдельной
development database Neon. Docker не является обязательным.

## Первичная настройка

Из корня репозитория:

```bash
npm install
```

Создай локальные environment files.

PowerShell:

```powershell
Copy-Item apps\api\.env.example apps\api\.env
Copy-Item apps\web\.env.example apps\web\.env.local
```

Bash:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Эти файлы игнорируются Git. Никогда не коммить реальные credentials.

## Backend environment

Минимальный `apps/api/.env`:

```env
DATABASE_URL="postgresql://spendlens:spendlens@localhost:5432/spendlens?schema=public"
PORT="3001"
FRONTEND_URL="http://localhost:3000"
JWT_ACCESS_SECRET="local-access-secret-at-least-32-characters"
JWT_REFRESH_SECRET="different-local-refresh-secret-at-least-32-characters"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"
CSRF_SECRET="local-csrf-secret-at-least-32-characters"
COOKIE_SAME_SITE="lax"
COOKIE_SECURE="false"
```

Требования validation:

- `DATABASE_URL` использует `postgresql:` или `postgres:`;
- `FRONTEND_URL` содержит origin без path и завершающего slash;
- JWT secrets содержат минимум 32 символа и отличаются друг от друга;
- durations имеют формат `15m`, `30d`, `60s` или аналогичный;
- `COOKIE_SAME_SITE=none` допустим только вместе с `COOKIE_SECURE=true`.

## Frontend environment

`apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

Значение обязано включать глобальный prefix `/api`.

## PostgreSQL варианты

### Вариант A: установленный PostgreSQL

Создай database и пользователя, соответствующие `DATABASE_URL`. Конкретный способ
зависит от локальной установки PostgreSQL.

### Вариант B: Docker

```bash
docker run --name spendlens-postgres \
  -e POSTGRES_USER=spendlens \
  -e POSTGRES_PASSWORD=spendlens \
  -e POSTGRES_DB=spendlens \
  -p 5432:5432 \
  -d postgres:16
```

### Вариант C: Neon development database

Скопируй standard PostgreSQL connection string Neon в `DATABASE_URL`. Используй
отдельную development branch/database и не загружай реальные финансовые данные.

## Подготовка database

После настройки `DATABASE_URL`:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

- `db:generate` создаёт Prisma Client;
- `db:migrate` запускает `prisma migrate dev` и предназначен для development;
- `db:seed` загружает deterministic demo dataset.

Не используй `prisma migrate dev` в production. Production использует
`prisma migrate deploy`.

## Demo account

Seed создаёт локального пользователя:

```text
email: demo@spendlens.local
password: SpendLensDemo123!
```

Seed удаляет и пересоздаёт только пользователя с фиксированным ID `demo-user`.
Он не предназначен для production database с реальными данными.

## Запуск

Открой два терминала в корне репозитория.

Терминал 1:

```bash
npm run dev:api
```

Терминал 2:

```bash
npm run dev:web
```

Адреса:

- frontend: `http://localhost:3000`;
- API: `http://localhost:3001/api`;
- health: `http://localhost:3001/api/health`.

Health response:

```json
{
  "status": "ok"
}
```

## Проверки

Workspace-wide:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Только backend:

```bash
npm run lint --workspace @spendlens/api
npm run typecheck --workspace @spendlens/api
npm run test --workspace @spendlens/api
npm run build --workspace @spendlens/api
```

Только frontend:

```bash
npm run lint --workspace @spendlens/web
npm run typecheck --workspace @spendlens/web
npm run test --workspace @spendlens/web
npm run build --workspace @spendlens/web
```

## Обычный рабочий цикл

1. Синхронизируй ветку и проверь `git status`.
2. Установи dependencies, если изменился lockfile.
3. Примени новые development migrations.
4. Запусти только необходимые приложения.
5. Внеси минимальное изменение.
6. Запусти targeted tests.
7. Перед PR запусти lint, typecheck, tests и build для изменённого workspace.

## Безопасность development данных

- Не используй production database локально.
- Не вставляй реальные банковские выписки или чеки в seed/tests.
- Не копируй `DATABASE_URL` в issue, PR или logs.
- Не коммить `.env`, `.env.local`, database dumps и uploads.
- Используй фиктивные emails, account numbers и merchant records в tests.

