# Карта репозитория

## Корень workspace

```text
SpendLens/
├── apps/
│   ├── api/                 NestJS backend
│   └── web/                 Next.js frontend
├── docs/                    Developer documentation
├── AGENTS.md                Обязательные engineering rules
├── README.md                Краткий запуск проекта
├── package.json             npm workspaces и общие scripts
└── package-lock.json        Единый lockfile workspace
```

Проект использует npm workspaces без Nx, Turborepo или другого orchestration
framework.

## `apps/api`

```text
apps/api/
├── prisma/
│   ├── migrations/         Versioned PostgreSQL migrations
│   ├── schema.prisma       Database schema
│   └── seed.mjs            Deterministic demo data
├── src/
│   ├── analytics/          Dashboard calculations и endpoint
│   ├── auth/               Passwords, JWT, cookies, CSRF, sessions, guards
│   ├── common/             Shared backend-only helpers и error filter
│   ├── config/             Environment validation и matching constants
│   ├── health/             Public liveness endpoint
│   ├── matching/           Deterministic receipt matching
│   ├── merchants/          Merchant normalization
│   ├── parsers/            Parser contracts и demo implementations
│   ├── prisma/             Prisma lifecycle и global module
│   ├── receipts/           Receipt list API
│   ├── statements/         Statement list API
│   ├── transactions/       Transaction list API
│   ├── users/              User persistence used by auth
│   ├── app.module.ts       Root NestJS module
│   └── main.ts             Application bootstrap
├── .env.example            Backend environment template
├── package.json            API scripts и dependencies
├── prisma.config.ts        Prisma schema/migration/seed paths
└── tsconfig.json           Strict TypeScript configuration
```

### Feature layout

Feature обычно содержит только необходимые элементы:

```text
feature/
├── feature.module.ts
├── feature.controller.ts
├── feature.service.ts
├── feature.types.ts
└── feature.test.ts
```

Не каждый feature обязан иметь все эти файлы. Pure domain functions, например
receipt matcher, не нуждаются в controller или module, пока отсутствует HTTP use
case.

## `apps/web`

```text
apps/web/
├── app/
│   ├── (app)/              Authenticated application pages
│   ├── (auth)/             Login/register pages
│   ├── api/backend/        Narrow auth proxy to NestJS
│   ├── layout.tsx          Root layout
│   └── page.tsx            Redirect to dashboard
├── components/
│   ├── auth/               Interactive authentication forms
│   └── ui/                 Small reusable UI primitives
├── lib/
│   ├── api/                Server API client и response schemas
│   ├── auth/               Browser auth client, schemas, cookie forwarding
│   └── format.ts           Locale-aware presentation formatting
├── public/                 Static non-sensitive assets
├── proxy.ts                Route authentication/refresh logic
├── .env.example            Frontend environment template
├── package.json            Web scripts и dependencies
└── next.config.ts          Next.js configuration
```

Route groups `(app)` и `(auth)` не являются частью URL. Например:

```text
app/(app)/dashboard/page.tsx → /dashboard
app/(auth)/login/page.tsx    → /login
```

## Где искать изменение

| Задача | Начальная точка |
| --- | --- |
| Новый API endpoint | Соответствующий module/controller в `apps/api/src` |
| Database model | `apps/api/prisma/schema.prisma` и новая migration |
| Auth behavior | `apps/api/src/auth` и `apps/web/lib/auth` |
| Financial calculation | `apps/api/src/analytics` или отдельный domain module |
| Matching rule | `apps/api/src/matching` и `apps/api/src/config/matching.ts` |
| Merchant normalization | `apps/api/src/merchants` |
| Dashboard UI | `apps/web/app/(app)/dashboard` |
| API response validation | `apps/web/lib/api/schemas.ts` |
| Shared page layout | `apps/web/components/app-shell.tsx` |
| Environment validation | `apps/api/src/config/environment.ts` |
| Demo data | `apps/api/prisma/seed.mjs` |

## Что не должно появляться

- `node_modules` внутри Git;
- Prisma schema/client во frontend;
- production secrets в `.env` или documentation;
- persistent uploads в `public/`;
- business calculations внутри React components;
- универсальный proxy, позволяющий browser вызвать любой backend path;
- provider-specific database code вне deployment configuration.

