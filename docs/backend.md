# Backend: NestJS API

## Назначение

`apps/api` — единственный backend SpendLens и единственный владелец Prisma,
PostgreSQL и финансовой domain logic.

Технологии:

- NestJS 11;
- TypeScript strict;
- Prisma;
- PostgreSQL;
- Zod;
- REST/JSON;
- Vitest.

## Bootstrap

`src/main.ts` выполняет:

1. validation environment variables;
2. создание `AppModule`;
3. установку prefix `/api`;
4. explicit CORS для `FRONTEND_URL`;
5. подключение глобального `ApiExceptionFilter`;
6. запуск на `0.0.0.0` и configured `PORT`.

Backend собирается в `dist` и запускается как обычное Node.js приложение:

```bash
npm run build --workspace @spendlens/api
npm run start --workspace @spendlens/api
```

## Root module

`AppModule` подключает:

- `ConfigModule`;
- `ThrottlerModule`;
- `PrismaModule`;
- `AuthModule`;
- `HealthModule`;
- `TransactionsModule`;
- `ReceiptsModule`;
- `StatementsModule`;
- `AnalyticsModule`.

`ThrottlerGuard`, `CsrfGuard` и `AccessTokenGuard` зарегистрированы глобально.
Public routes должны быть явно отмечены `@Public()`.

## API endpoints

Все paths имеют prefix `/api`.

| Method | Path | Access | Назначение |
| --- | --- | --- | --- |
| GET | `/health` | Public | Process liveness |
| GET | `/auth/csrf` | Public | Создать signed CSRF token/cookie |
| POST | `/auth/register` | Public + CSRF | Создать user и session |
| POST | `/auth/login` | Public + CSRF | Проверить password и создать session |
| POST | `/auth/refresh` | Public + CSRF | Rotate refresh session |
| POST | `/auth/logout` | Public + CSRF | Revoke refresh session и очистить cookies |
| GET | `/auth/me` | Authenticated | Получить safe current user |
| GET | `/transactions` | Authenticated | Список transactions текущего user |
| GET | `/receipts` | Authenticated | Список receipts текущего user |
| GET | `/statements` | Authenticated | Список statements текущего user |
| GET | `/analytics/dashboard` | Authenticated | Deterministic dashboard analytics |

CRUD и upload endpoints намеренно отсутствуют, поскольку UI их ещё не использует.

## Controller, service и repository

### Controller

Controller отвечает за HTTP boundary:

- decorators и route;
- получение current user;
- validation pipe;
- вызов service;
- safe response type.

Controller не должен содержать financial calculations или Prisma queries.

### Service

Service реализует application use case:

- выбирает необходимые database fields;
- применяет ownership constraint;
- вызывает domain functions;
- формирует explicit response model.

### Repository

Repository создаётся только при реальной необходимости. Текущий
`RefreshSessionRepository` оправдан transaction boundary атомарной rotation.
Простой `findMany` не требует отдельного one-to-one wrapper.

## Prisma lifecycle

`PrismaModule` является global module. `PrismaService` наследует `PrismaClient`,
подключается в `onModuleInit` и отключается в `onModuleDestroy`.

Нельзя:

- создавать ещё один `PrismaClient` в feature;
- экспортировать Prisma во frontend;
- обращаться к user-owned model без ownership filtering;
- возвращать полную Prisma entity без анализа.

## Ownership

`AccessTokenGuard` проверяет access cookie и добавляет в request только user ID из
проверенного JWT. Controller получает его через `@CurrentUserDecorator()`.

Правильный запрос:

```ts
where: { userId }
```

Неправильный подход:

```text
получить resource глобально → потом предположить ownership
```

Client-supplied `userId` не является authorization mechanism.

## Validation

Request bodies auth endpoints проходят `ZodValidationPipe` до service logic.
Schemas используют `.strict()`, нормализуют email и ограничивают длину полей.

Validation нужна для:

- body;
- route/query params;
- parser output;
- OCR/AI output;
- third-party responses.

Не смешивай Zod и `class-validator` для одного payload без конкретной причины.

## Response models

API возвращает explicit types из feature `*.types.ts`. Internal fields, например
`passwordHash`, `fileKey`, relations и timestamps, не попадают в response
автоматически.

Money response:

```json
{
  "amount": "84.37",
  "currency": "PLN"
}
```

Prisma Decimal не преобразуется через JavaScript floating point.

## Error handling и logging

`ApiExceptionFilter`:

- сохраняет HTTP status известных `HttpException`;
- маскирует сообщения всех ошибок `5xx`;
- возвращает `{ statusCode, message }`;
- логирует только method, route и status.

Нельзя логировать request body, cookies, токены, financial records или Prisma
error целиком.

## Tests

Критические pure functions тестируются независимо от NestJS transport:

- merchant normalization;
- receipt matching;
- analytics;
- ownership helpers;
- auth services и schemas;
- token refresh/CSRF behavior.

Предпочитай unit test e2e test, если для проверки не нужен реальный HTTP stack.
Database-dependent test не должен случайно подключаться к production Neon.

## Добавление нового feature

Перед созданием module ответь:

1. Есть ли реальный use case и consumer?
2. Можно ли расширить существующий feature?
3. Какие external inputs требуют Zod?
4. Как enforced ownership?
5. Есть ли financial precision или currency edge cases?
6. Какие internal fields нельзя возвращать?
7. Какая часть должна быть pure и unit-testable?
