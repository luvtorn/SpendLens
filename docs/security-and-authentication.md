# Security и authentication

## Threat model

SpendLens хранит чувствительные финансовые данные. Основные риски:

- account takeover;
- IDOR и cross-user data access;
- утечка bank/receipt contents через API или logs;
- token theft;
- CSRF;
- injection через untrusted payloads/files;
- accidental secret exposure во frontend или Git.

Security является частью Definition of Done, а не отдельным будущим этапом.

## Passwords

- Password length: 8–128 символов при регистрации.
- Passwords хэшируются Argon2id.
- Plaintext password не сохраняется и не логируется.
- Login использует dummy hash при неизвестном email, уменьшая timing leakage.

## Sessions

Authentication использует два JWT:

### Access token

- short-lived;
- содержит `sub` с user ID;
- подписан `JWT_ACCESS_SECRET`;
- хранится в HttpOnly cookie `spendlens_access`.

### Refresh token

- long-lived;
- содержит `sub` и random session ID `sid`;
- подписан отдельным `JWT_REFRESH_SECRET`;
- хранится в HttpOnly cookie `spendlens_refresh`;
- raw value не сохраняется в database.

PostgreSQL хранит SHA-256 hash refresh token. Rotation атомарно revoke-ит старую
session и создаёт новую внутри Prisma transaction. Повторное использование
старого token не должно создать ещё одну session.

## Cookies

Cookie names определены в `apps/api/src/common/cookies.ts`.

Access и refresh cookies:

- `HttpOnly`;
- `Secure` в production;
- configurable `SameSite`;
- `Path=/`;
- expiry соответствует token lifetime.

CSRF cookie `spendlens_csrf` намеренно не HttpOnly: browser client должен отправить
соответствующий token в header. Сам token signed и не является session credential.

`COOKIE_DOMAIN` следует оставлять unset, если нет явно общего parent domain.

## CSRF

State-changing requests требуют signed double-submit token:

```text
spendlens_csrf cookie
         == constant-time compare ==
X-CSRF-Token header
         + valid HMAC signature
```

`CsrfGuard` пропускает только safe methods `GET`, `HEAD`, `OPTIONS`. Даже public
login/register endpoints требуют CSRF для POST.

## Route authorization

`AccessTokenGuard` применяется глобально. Route public только при наличии
`@Public()`.

Authenticated current user строится из проверенного access token. Backend не
принимает произвольный `userId` клиента как доказательство authorization.

Frontend route redirects улучшают UX, но не являются security boundary.

## Ownership

Каждый user-owned query должен ограничиваться current user ID на server side.

Проверяй ownership для:

- statements;
- bank accounts;
- transactions;
- receipts и items;
- matches;
- analytics;
- будущих uploaded files.

Предпочтительно включать ownership непосредственно в Prisma `where`, а не
загружать объект глобально и проверять после чтения.

## Validation

Все external inputs считаются untrusted. Backend request schemas находятся рядом
с feature и применяются до service logic.

Frontend form validation нужна для UX, но attacker может обойти frontend, поэтому
backend validation обязательна.

## CORS

NestJS разрешает только origins из `FRONTEND_URL` и включает credentials.
Wildcard `*` запрещён environment validation.

Разрешённые methods:

```text
GET, POST, OPTIONS
```

Разрешённые custom headers:

```text
Content-Type, X-CSRF-Token
```

## Rate limiting

Global limit:

```text
100 requests / 60 seconds
```

Auth limits:

- register: 5/minute;
- login: 5/minute;
- refresh: 10/minute.

Текущий limiter хранится в памяти NestJS process. Он подходит только для одного
MVP instance и сбрасывается при restart.

## Safe errors

Client не должен получать:

- stack traces;
- Prisma errors;
- SQL;
- filesystem paths;
- environment values;
- provider credentials.

`ApiExceptionFilter` маскирует сообщения `5xx`. Технический log содержит только
method, route и status.

## Secret placement

### Только backend hosting

- `DATABASE_URL`;
- `JWT_ACCESS_SECRET`;
- `JWT_REFRESH_SECRET`;
- `CSRF_SECRET`;
- cookie configuration.

### Frontend hosting

- `NEXT_PUBLIC_API_URL`.

Database credentials и JWT secrets не нужны Vercel frontend project, даже если
они не имеют prefix `NEXT_PUBLIC_`. Минимизация secret distribution снижает риск.

## File security

Upload пока не реализован. Будущая реализация обязана:

- проверять MIME, signature, extension и size;
- генерировать storage key на server;
- хранить documents private;
- не использовать user filename как path;
- не сохранять production files на application filesystem;
- выдавать authenticated access или short-lived signed URLs;
- учитывать malicious PDF/image input.

## Review checklist

Для любого backend feature проверь:

- Кто authenticated user?
- Где enforced ownership?
- Какие inputs untrusted?
- Какие поля могут утечь в response?
- Что попадёт в logs при error?
- Нужна ли database transaction?
- Можно ли повторить request безопасно?
- Может ли один пользователь обратиться к ID другого пользователя?
