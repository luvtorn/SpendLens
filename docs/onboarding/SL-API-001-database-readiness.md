# SL-API-001: Database readiness endpoint

## Статус

`Ready for development`

## Тип задачи

Backend / NestJS / onboarding

## Приоритет

Medium

## Оценка

4–6 часов с изучением документации и написанием тестов.

## Контекст

SpendLens развёртывается как три независимых компонента:

```text
Browser
↓
Next.js на Vercel
↓ HTTPS
NestJS API на Render
↓
PostgreSQL в Neon
```

Сейчас backend предоставляет публичный endpoint:

```http
GET /api/health
```

Он отвечает `200`, если процесс NestJS запущен. Такой endpoint является
`liveness`-проверкой: он подтверждает работу процесса, но не подтверждает, что
API может обратиться к PostgreSQL.

Во время недавнего запуска production окружения API успешно стартовал, но
регистрация возвращала `500`, потому что проблема проявлялась только при первом
запросе к базе данных. Отдельная `readiness`-проверка позволит отличать работающий
процесс от приложения, готового обслуживать запросы, зависящие от PostgreSQL.

## Цель

Добавить публичный endpoint:

```http
GET /api/health/ready
```

Endpoint должен выполнить минимальный запрос к PostgreSQL и сообщить, готово ли
приложение обслуживать запросы, зависящие от базы данных.

## Ожидаемое поведение

### База данных доступна

```http
GET /api/health/ready
```

Ответ:

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "status": "ok"
}
```

### База данных недоступна

Endpoint должен вернуть:

```http
HTTP/1.1 503 Service Unavailable
Content-Type: application/json
```

Ответ не должен раскрывать:

- строку подключения;
- название или адрес database provider;
- SQL;
- Prisma error;
- stack trace;
- filesystem path.

Существующий глобальный `ApiExceptionFilter` может сформировать безопасное тело
ошибки. Не обходи его и не возвращай внутреннюю ошибку вручную.

## Scope

В рамках задачи нужно:

1. Оставить `GET /api/health` существующей лёгкой liveness-проверкой.
2. Создать `HealthService` внутри текущего `health` feature.
3. Подключить `HealthService` через dependency injection NestJS.
4. Реализовать в service минимальную проверку соединения с PostgreSQL.
5. Добавить `GET /api/health/ready` в `HealthController`.
6. Оставить оба health endpoint публичными через существующий `@Public()`.
7. Добавить unit tests для успешной и неуспешной проверки базы данных.
8. Обновить `README.md` коротким описанием двух health endpoint.

## Out of scope

Не нужно:

- менять frontend;
- добавлять Docker;
- добавлять `@nestjs/terminus` или другую dependency;
- добавлять Redis, очередь или мониторинг;
- проверять Neon-specific API;
- возвращать версию базы данных;
- возвращать latency, hostname или environment variables;
- менять существующую authentication architecture;
- менять Prisma schema или создавать migration;
- настраивать Render health check в Dashboard.

## Архитектурные требования

Ожидаемый поток:

```text
HealthController
↓
HealthService
↓
PrismaService
↓
PostgreSQL
```

Контроллер должен оставаться тонким. SQL/Prisma-вызов, обработка сбоя соединения и
решение о `503` должны находиться в service, а не в controller.

Используй уже существующий глобальный `PrismaModule`. Не создавай второй
`PrismaClient` и не добавляй repository, который нужен только для одного
простого запроса.

Проверка должна быть read-only и не должна изменять данные. Используй безопасный
статический запрос наподобие `SELECT 1` через Prisma. Не используй raw SQL API,
который принимает динамически собранную строку.

## Безопасность и приватность

- Не логируй `DATABASE_URL`.
- Не логируй объект Prisma error целиком.
- Не добавляй детали database failure в HTTP response.
- Не принимай никаких параметров от клиента.
- Не делай endpoint authenticated: hosting provider должен иметь возможность
  проверить readiness без пользовательской сессии.
- Не превращай readiness endpoint в способ исследовать инфраструктуру.

## Предлагаемая структура файлов

```text
apps/api/src/health/
├── health.controller.ts
├── health.module.ts
├── health.service.ts
└── health.service.test.ts
```

Это рекомендация, а не требование создать дополнительные слои. Если выберешь
другую структуру, объясни решение в описании pull request.

## Acceptance criteria

- [ ] `GET /api/health` продолжает возвращать `200` и `{ "status": "ok" }`.
- [ ] `GET /api/health` не обращается к PostgreSQL.
- [ ] `GET /api/health/ready` возвращает `200` и `{ "status": "ok" }`, когда
      PostgreSQL доступен.
- [ ] `GET /api/health/ready` возвращает `503`, когда database probe завершается
      ошибкой.
- [ ] Ответ `503` не содержит Prisma error, SQL, credentials или stack trace.
- [ ] Controller не содержит Prisma-запросов и database error handling.
- [ ] Используется существующий `PrismaService` через NestJS dependency injection.
- [ ] Не добавлены новые npm dependencies.
- [ ] Есть unit test успешного database probe.
- [ ] Есть unit test, подтверждающий преобразование database failure в `503`.
- [ ] TypeScript остаётся strict; `any` и `as any` отсутствуют.
- [ ] README кратко объясняет разницу между liveness и readiness endpoints.

## Что изучить перед началом

Сначала прочитай эти файлы:

1. `AGENTS.md` — обязательные правила проекта.
2. `apps/api/src/app.module.ts` — корневой NestJS module.
3. `apps/api/src/health/health.module.ts` — текущий feature module.
4. `apps/api/src/health/health.controller.ts` — текущий controller.
5. `apps/api/src/prisma/prisma.module.ts` — глобальный Prisma module.
6. `apps/api/src/prisma/prisma.service.ts` — database client lifecycle.
7. `apps/api/src/common/api-exception.filter.ts` — безопасные API errors.
8. Один существующий service test, например
   `apps/api/src/auth/auth.service.test.ts`.

После чтения попробуй своими словами ответить:

1. Зачем NestJS нужен `@Module()`?
2. Чем controller отличается от service?
3. Как NestJS понимает, какой объект передать в constructor service?
4. Почему нельзя создать новый `PrismaClient` непосредственно в controller?
5. Чем liveness отличается от readiness?
6. Почему readiness failure должен быть `503`, а не `500`?

## План выполнения

### Шаг 1. Создай ветку

```bash
git switch -c feat/api-database-readiness
```

Перед изменениями проверь:

```bash
git status
```

Не включай в commit посторонние локальные изменения.

### Шаг 2. Сначала опиши дизайн

Перед написанием кода запиши в pull request draft или в рабочие заметки:

- какой класс отвечает за HTTP;
- какой класс отвечает за database probe;
- как service получает `PrismaService`;
- какую NestJS exception ты используешь для `503`;
- как протестировать ошибку без реального отключения Neon.

### Шаг 3. Реализуй минимальное изменение

Не копируй весь существующий health endpoint. Сохрани liveness простой, добавив
отдельный путь для readiness.

Подсказки для поиска в документации NestJS:

- Controllers;
- Providers;
- Dependency injection;
- Modules;
- Built-in HTTP exceptions;
- Unit testing providers.

### Шаг 4. Напиши unit tests

Тесты не должны обращаться к реальной Neon database. Передай service тестовый
database dependency или mock существующей зависимости согласно паттернам
проекта.

Минимальные сценарии:

1. Database probe завершается успешно — service возвращает `{ status: "ok" }`.
2. Database probe выбрасывает неизвестную ошибку — service выбрасывает
   `ServiceUnavailableException`.

Не проверяй внутреннее сообщение Prisma и не привязывай тест к конкретному
database provider.

### Шаг 5. Проверь изменение

Используй реальные workspace scripts:

```bash
npm run lint --workspace @spendlens/api
npm run typecheck --workspace @spendlens/api
npm run test --workspace @spendlens/api
npm run build --workspace @spendlens/api
```

Если локальная PostgreSQL/Neon development database доступна, дополнительно
запусти API и проверь оба endpoint вручную. Этот ручной шаг не заменяет tests.

## Definition of Done

Задача считается завершённой, когда:

- выполнены все acceptance criteria;
- lint, typecheck, tests и build проходят;
- в commit нет generated build output и `node_modules`;
- изменение не затрагивает frontend и financial domain logic;
- README обновлён только в необходимом объёме;
- подготовлено короткое описание архитектурного решения;
- автор может объяснить код на review, а не только показать, что он работает.

## Ожидаемый commit

```text
feat(api): add database readiness endpoint
```

## Шаблон описания pull request

```markdown
## Что сделано

- ...

## Архитектурное решение

- Controller отвечает за ...
- Service отвечает за ...
- PrismaService внедряется через ...

## Безопасность

- Database errors не раскрываются, потому что ...

## Проверка

- api lint: ...
- api typecheck: ...
- api tests: ...
- api build: ...

## Ограничения

- ...
```

## Формат review со мной

Когда закончишь, не проси сразу исправить код за тебя. Пришли:

1. ссылку на commit или список изменённых файлов;
2. результаты четырёх verification-команд;
3. ответы на шесть вопросов из раздела «Что изучить перед началом»;
4. один момент в NestJS, который остался непонятным.

Я сначала проведу code review и объясню замечания. После этого ты самостоятельно
внесёшь исправления — так задача даст практику, а не только готовый результат.
