# SpendLens Developer Handbook

Этот раздел — основная точка входа для нового разработчика SpendLens. Документы
описывают фактическое состояние репозитория, а не предполагаемую будущую систему.

## Что такое SpendLens

SpendLens — приложение для детерминированного анализа личных финансов. Оно
хранит структурированные банковские транзакции и чеки, нормализует продавцов,
сопоставляет чеки с транзакциями и рассчитывает аналитику без использования AI
как источника финансовой истины.

Главный принцип проекта:

> Финансовые данные должны быть проверяемыми и воспроизводимыми. AI может
> помогать с интерпретацией, но не является авторитетным калькулятором.

## Система за одну минуту

```text
Browser
↓
Next.js frontend (`apps/web`)
↓ HTTPS REST
NestJS API (`apps/api`)
↓ Prisma
PostgreSQL
```

- Next.js отвечает за UI, маршрутизацию, формы и отображение данных.
- NestJS владеет authentication, authorization, бизнес-логикой и API.
- Только NestJS имеет право использовать Prisma и обращаться к PostgreSQL.
- Деньги передаются через API строками вместе с ISO 4217 currency.
- Все пользовательские финансовые запросы фильтруются по authenticated user ID.
- Frontend и backend развёртываются независимо и связываются через environment
  variables.

## Текущее состояние продукта

| Область | Состояние |
| --- | --- |
| Регистрация, login, logout | Реализовано |
| Access/refresh sessions | Реализовано |
| CSRF protection | Реализовано |
| Dashboard analytics | Реализовано |
| Списки transactions, receipts, statements | Реализовано |
| Merchant normalization | Реализовано и покрыто unit tests |
| Receipt matching | Реализовано и покрыто unit tests |
| Deterministic analytics | Реализовано и покрыто unit tests |
| Загрузка документов | Не реализована |
| Реальный statement parsing | Не реализован; есть demo parser |
| Реальный receipt/OCR parsing | Не реализован; есть demo parser |
| Редактирование и подтверждение matches | Не реализовано |
| Billing, AI, object storage | Не реализовано |

## Порядок чтения для нового разработчика

1. [Архитектура](architecture.md)
2. [Карта репозитория](repository-map.md)
3. [Локальная разработка](local-development.md)
4. [Backend: NestJS API](backend.md)
5. [Frontend: Next.js](frontend.md)
6. [Security и authentication](security-and-authentication.md)
7. [Данные и domain logic](data-and-domain.md)
8. [Deployment](deployment.md)
9. [Рабочий процесс](development-workflow.md)
10. [Troubleshooting](troubleshooting.md)

После этого переходи к своей первой задаче:

- [SL-API-001: Database readiness endpoint](onboarding/SL-API-001-database-readiness.md)

## Основные правила

Перед любым изменением прочитай корневой `AGENTS.md`. В сокращённом виде:

- correctness и security важнее скорости;
- не используй `any` и `as any`;
- не используй JavaScript `number` для финансовой арифметики;
- не смешивай суммы разных валют;
- не доверяй данным клиента, parser, OCR, AI или third-party API;
- не логируй финансовые данные, токены и credentials;
- не добавляй зависимости без необходимости;
- не создавай PrismaClient во frontend;
- не расширяй scope задачи сторонними рефакторами;
- запускай реальные проверки перед завершением работы.

## Быстрые ссылки

- Backend entrypoint: `apps/api/src/main.ts`
- Backend root module: `apps/api/src/app.module.ts`
- Frontend routes: `apps/web/app`
- Frontend auth proxy: `apps/web/app/api/backend/[...path]/route.ts`
- Prisma schema: `apps/api/prisma/schema.prisma`
- Migrations: `apps/api/prisma/migrations`
- Seed: `apps/api/prisma/seed.mjs`
- Workspace scripts: `package.json`
- Environment examples: `apps/api/.env.example`, `apps/web/.env.example`

## Если документация расходится с кодом

Код и migrations являются фактическим источником истины. Проверь поведение,
исправь документацию в том же pull request и укажи расхождение в описании PR.

