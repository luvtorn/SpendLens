# Архитектура SpendLens

## Контекст

SpendLens обрабатывает чувствительные финансовые данные. Архитектура оптимизируется
в следующем порядке: correctness, security, data integrity, simplicity и только
затем performance и extensibility.

## Компоненты

```text
┌──────────────────────┐
│ Browser              │
│ UI + cookies         │
└──────────┬───────────┘
           │ HTTPS
┌──────────▼───────────┐
│ Next.js              │
│ apps/web             │
│                      │
│ Server Components    │
│ Forms                │
│ Narrow auth proxy    │
└──────────┬───────────┘
           │ REST / JSON
┌──────────▼───────────┐
│ NestJS               │
│ apps/api             │
│                      │
│ Auth + authorization │
│ Domain services      │
│ Validation           │
│ Financial analytics  │
└──────────┬───────────┘
           │ Prisma
┌──────────▼───────────┐
│ PostgreSQL           │
│ Structured data      │
└──────────────────────┘
```

Frontend и backend не предполагают общий процесс, домен, hosting provider или
filesystem. Их адреса задаются через `NEXT_PUBLIC_API_URL` и `FRONTEND_URL`.

## Границы ответственности

### Next.js

- рендерит страницы;
- обрабатывает формы login/register;
- форматирует строки денег и дат для UI;
- получает server state из NestJS;
- валидирует API responses перед отображением;
- защищает frontend routes через `proxy.ts`;
- проксирует только auth routes, необходимые browser-клиенту.

Next.js не должен:

- импортировать Prisma;
- выполнять SQL или database queries;
- пересчитывать финансовую аналитику;
- принимать решения об ownership;
- хранить JWT в `localStorage` или `sessionStorage`.

### NestJS

- аутентифицирует пользователя;
- применяет authorization и ownership filtering;
- валидирует request payloads через Zod;
- управляет access/refresh sessions и CSRF;
- читает и изменяет PostgreSQL через Prisma;
- сериализует API DTO;
- выполняет merchant normalization, matching и analytics;
- скрывает внутренние ошибки от клиента.

### PostgreSQL

- хранит persistent state;
- обеспечивает relations, uniqueness и indexes;
- хранит финансовые значения как `Decimal`;
- хранит только hash refresh token, а не raw token.

## Backend request flow

Типичный authenticated read request:

```text
HTTP request
↓
ThrottlerGuard
↓
CsrfGuard (для GET ничего не делает)
↓
AccessTokenGuard
↓
Controller
↓
Service
↓
Prisma query с where: { userId }
↓
Explicit response model
↓
JSON response
```

Типичный mutation request:

```text
HTTP request
↓
Rate limit
↓
CSRF cookie + X-CSRF-Token verification
↓
ZodValidationPipe
↓
Controller
↓
Service / transaction boundary
↓
Safe response or ApiExceptionFilter
```

## Frontend data flow

Страницы dashboard, transactions, receipts и statements являются Server
Components. Они вызывают централизованные функции из `apps/web/lib/api/client.ts`.

```text
Server Component
↓
API client
↓ forwards request cookies
NestJS endpoint
↓
Zod response validation
↓
UI or ApiErrorState
```

Browser mutations authentication используют same-origin Next.js route:

```text
Browser form
↓ /api/backend/auth/*
Next.js narrow auth proxy
↓
NestJS /api/auth/*
```

Proxy использован для корректной передачи HttpOnly cookies между независимо
развёрнутыми frontend и backend. Он имеет allowlist auth routes и не является
универсальным API gateway.

## Domain boundaries

Функции с детерминированной domain logic по возможности не зависят от NestJS и
Prisma:

- `merchants/normalize-merchant.ts`;
- `matching/receipt-matcher.ts`;
- `analytics/spending.ts`;
- parser contracts в `parsers/`.

Это позволяет тестировать критическую логику как обычные TypeScript functions.
NestJS services оркестрируют получение данных и применение этой логики.

## Persistent и ephemeral state

Persistent state находится в PostgreSQL. Backend должен переживать restart без
потери пользовательских данных.

Допустимый ephemeral state:

- request-local objects;
- кэш CSRF token в browser-клиенте;
- in-memory rate limiter для одного MVP instance.

Текущий rate limiter не распределён между несколькими backend instances. Это
известное ограничение, а не основание преждевременно добавлять Redis.

## Provider independence

Текущий deployment может использовать Vercel, Render и Neon, но application code
не должен зависеть от их proprietary API:

- frontend использует обычный Next.js runtime;
- backend запускается командой `node dist/main.js`;
- database задаётся стандартным PostgreSQL `DATABASE_URL`;
- будущий production storage должен находиться за provider-independent boundary.

## Architectural invariants

Следующие правила нельзя нарушать без отдельного архитектурного решения:

1. NestJS — единственный владелец Prisma.
2. Финансовая арифметика не использует floating point.
3. Суммы разных currencies не складываются.
4. Original imported values сохраняются рядом с normalized values.
5. User-owned queries ограничиваются authenticated user ID.
6. API не возвращает Prisma entities автоматически.
7. External input и API responses проходят Zod validation.
8. Секреты и финансовые данные не попадают в logs.
