# Troubleshooting

## `Invalid API environment configuration`

Backend завершает process при startup, если environment не проходит Zod schema.

Проверь:

- присутствует ли `DATABASE_URL` с PostgreSQL protocol;
- `FRONTEND_URL` является exact origin без trailing slash/path;
- каждый secret содержит минимум 32 символа;
- access и refresh secrets различаются;
- duration имеет формат `15m` или `30d`;
- `COOKIE_SAME_SITE=none` используется только с `COOKIE_SECURE=true`.

Не выводи values secrets в logs для диагностики.

## Render возвращает `502 Bad Gateway`

Возможные причины:

- deployment ещё не создан;
- build/start command неверна;
- backend упал при environment validation;
- Prisma Client не сгенерирован;
- database connection не установлена;
- free instance ещё просыпается;
- у Render текущий platform incident.

Сначала смотри Deploy logs и официальный provider status, затем application logs.

## Registration возвращает `500 Internal server error`

Если `/api/health` работает, а первый Prisma request падает, проверь применение
migrations:

```bash
cd apps/api
npx prisma migrate deploy
```

Production database должна содержать initial и authentication migrations. Не
используй `migrate reset`.

## Frontend показывает `Unable to initialize secure request`

Это означает failure при вызове frontend auth proxy CSRF endpoint.

Проверь:

```text
GET backend/api/health
GET backend/api/auth/csrf
GET frontend/api/backend/auth/csrf
```

Если первые два работают, а третий возвращает `503`, проверь
`NEXT_PUBLIC_API_URL` на Vercel:

```env
NEXT_PUBLIC_API_URL=https://backend.example/api
```

После изменения environment сделай новый frontend deployment.

## Vercel: `Module not found`

Убедись, что workspace `node_modules` не закоммичены. `.gitignore` должен
игнорировать nested directories:

```gitignore
**/node_modules/
```

Если они уже tracked:

```bash
git rm -r --cached apps/web/node_modules apps/api/node_modules
```

Команда удаляет файлы из Git index, но не обязана удалять локальные packages.
Проверь diff перед commit.

## Vercel proxy возвращает `503 Authentication service unavailable`

Route handler возвращает этот ответ только когда server-side fetch к NestJS
завершился network exception.

Проверь:

- API URL не указывает на localhost;
- URL содержит `/api`;
- backend public URL доступен;
- environment применена к нужным Production/Preview targets;
- после изменения был выполнен redeploy.

## API возвращает `401 Unauthorized`

- Проверь наличие access cookie.
- Попробуй refresh flow.
- Убедись, что access/refresh secrets не изменились без invalidation sessions.
- Проверь `Secure`/`SameSite` cookie settings.
- Не вставляй токены в localStorage для обхода проблемы.

## API возвращает `403 Invalid CSRF token`

- Сначала вызови `/api/auth/csrf`.
- Убедись, что CSRF cookie сохранена.
- Передай тот же token в `X-CSRF-Token`.
- Проверь, что proxy forward-ит cookie и header.
- После смены `CSRF_SECRET` получи новый token.

## CORS error в browser

Backend `FRONTEND_URL` должен содержать exact browser origin:

```env
FRONTEND_URL=https://frontend.example
```

Без path и trailing slash. Для нескольких approved origins используется
comma-separated list. Не устанавливай `*`.

## Локальный `npm` не запускается

Проверь:

```bash
node --version
npm --version
```

Если Node установлен некорректно, переустанови supported LTS version. Не меняй
project files, чтобы компенсировать сломанный global npm installation.

## Как собирать диагностические данные

Безопасно передавать:

- HTTP status;
- route и method;
- timestamp;
- deployment/build stage;
- sanitized error category;
- commit SHA.

Нельзя передавать:

- `DATABASE_URL`;
- JWT/CSRF secrets;
- cookies и tokens;
- full request body регистрации;
- bank/receipt contents;
- Prisma error с credentials или SQL.

