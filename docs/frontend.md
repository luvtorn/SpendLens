# Frontend: Next.js

## Назначение

`apps/web` отвечает за отображение интерфейса и взаимодействие пользователя с
NestJS API. Это Next.js App Router application.

Технологии:

- Next.js 16;
- React 19;
- TypeScript strict;
- Tailwind CSS;
- React Hook Form;
- Zod;
- Vitest.

## Routes

| URL | Файл | Назначение |
| --- | --- | --- |
| `/` | `app/page.tsx` | Redirect на dashboard |
| `/login` | `app/(auth)/login/page.tsx` | Login form |
| `/register` | `app/(auth)/register/page.tsx` | Registration form |
| `/dashboard` | `app/(app)/dashboard/page.tsx` | Analytics summary |
| `/transactions` | `app/(app)/transactions/page.tsx` | Transaction table |
| `/receipts` | `app/(app)/receipts/page.tsx` | Receipt cards |
| `/statements` | `app/(app)/statements/page.tsx` | Statement list |
| `/settings` | `app/(app)/settings/page.tsx` | Placeholder settings UI |

`(app)` и `(auth)` — route groups и не появляются в URL.

## Server Components first

Dashboard и list pages являются async Server Components и получают данные через
`lib/api/client.ts`. Это уменьшает browser JavaScript и сохраняет server state на
server boundary.

Client Components используются там, где нужны browser interaction и form state:

- login form;
- registration form;
- logout button.

Не добавляй `"use client"` на страницу без необходимости.

## API client

`lib/api/client.ts` — централизованный server-side client для read endpoints.

Он:

- строит URL из `NEXT_PUBLIC_API_URL`;
- передаёт cookies текущего Next.js request;
- отключает caching для user financial data;
- проверяет HTTP status;
- валидирует JSON через Zod schemas;
- преобразует failure в `ApiUnavailableError`.

Страницы показывают `ApiErrorState` при backend failure и `EmptyState` для пустых
коллекций.

Не вызывай `fetch` хаотично из каждого component. Сначала расширяй существующий
API layer.

## Response validation

`lib/api/schemas.ts` содержит frontend-side schemas для фактических API
responses. Даже собственный backend рассматривается как external boundary.

Money schema требует:

- amount строкой с двумя decimal places;
- currency как три uppercase символа.

Если backend contract меняется, обнови backend response type, frontend Zod schema,
tests и consumer в одном pull request.

## Authentication routing

`proxy.ts` защищает application routes:

1. проверяет access cookie через `/api/auth/me`;
2. при необходимости пытается один refresh;
3. перенаправляет authenticated user с login/register на dashboard;
4. перенаправляет unauthenticated user на login;
5. forward-ит новые cookies после успешной rotation.

Это улучшает UX, но backend guards остаются окончательным authorization boundary.

## Auth proxy

Browser authentication mutations идут через:

```text
/api/backend/auth/*
```

Route handler имеет allowlist:

- `auth/csrf`;
- `auth/register`;
- `auth/login`;
- `auth/refresh`;
- `auth/logout`;
- `auth/me`.

Не расширяй его до unrestricted proxy. Обычные data reads Server Components
выполняют напрямую к configured NestJS URL.

## Forms

Login/register forms используют React Hook Form и Zod resolver. Frontend
validation предназначена для immediate feedback, но не заменяет backend
validation.

Перед mutation browser client:

1. получает signed CSRF token;
2. сохраняет его только в module memory;
3. отправляет token в `X-CSRF-Token`;
4. отправляет cookies с `credentials: include`.

JWT не доступен React code, поскольку session cookies имеют `HttpOnly`.

## Formatting

`lib/format.ts` отвечает за locale-aware presentation. UI получает raw money
строки и ISO date-only strings, а затем форматирует их через platform APIs.

Formatting не является financial calculation. Не превращай formatted text
обратно в authoritative monetary value.

## UI conventions

- Используй существующие `Card`, `Badge`, `PageHeader`, `EmptyState` и
  `ApiErrorState`.
- Сохраняй visible focus и semantic HTML.
- Не используй цвет как единственный способ передать status.
- Всегда учитывай loading, empty, error и disabled states.
- Не добавляй global state library без доказанной необходимости.

## Известное несоответствие

Текст `SettingsPage` всё ещё утверждает, что authentication будет подключена в
будущем, хотя authentication уже реализована. Это текущий documentation/UI debt,
который следует исправить отдельной небольшой задачей, не смешивая с несвязанным
feature.

## Добавление страницы

Перед реализацией определи:

1. Может ли страница быть Server Component?
2. Какой API endpoint уже существует или действительно необходим?
3. Где находится response Zod schema?
4. Какие loading/empty/error states нужны?
5. Защищён ли URL в `proxy.ts`?
6. Не дублируется ли backend financial logic?

