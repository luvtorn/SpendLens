# Рабочий процесс разработки

## Получение задачи

Перед кодом:

1. Прочитай task и acceptance criteria.
2. Прочитай `AGENTS.md`.
3. Найди существующий implementation path.
4. Проверь `git status` и не присваивай чужие изменения.
5. Опиши минимальный design и security implications.
6. Уточни только решения, которые существенно меняют scope.

## Branches

Используй короткое имя с типом и областью:

```text
feat/api-database-readiness
fix/web-auth-proxy
docs/developer-handbook
```

Не смешивай несколько независимых задач в одной branch.

## Реализация

Предпочитаемый порядок:

1. Добавь или измени test для ожидаемого behavior.
2. Реализуй минимальный production code.
3. Запусти targeted test.
4. Проверь typecheck/lint изменённого workspace.
5. Удали debug code и временные logs.
6. Проверь diff целиком.

Не переписывай рабочий feature только из-за личного предпочтения архитектуры.

## Commits

Проект использует Conventional Commits:

```text
feat(api): add database readiness endpoint
fix(auth): reject reused refresh session
test(matching): cover ambiguous candidates
docs: add developer onboarding guide
```

Commit должен быть focused и не содержать:

- `node_modules`;
- `.env`;
- build output;
- unrelated formatting;
- реальные пользовательские/финансовые данные.

## Pull request

Описание PR должно содержать:

```markdown
## Что изменилось

- ...

## Почему

- ...

## Архитектура и безопасность

- ...

## Проверка

- lint: ...
- typecheck: ...
- tests: ...
- build: ...

## Ограничения

- ...
```

Не пиши «tests pass», если команды не запускались.

## Review expectations

Reviewer проверяет:

- соответствие acceptance criteria;
- boundary между controller/service/domain/database;
- authorization и ownership;
- validation external data;
- money/currency correctness;
- safe errors и logging;
- test quality;
- отсутствие unnecessary dependencies и abstractions;
- актуальность документации.

Автор PR должен понимать решение и уметь объяснить trade-offs.

## Database changes

При изменении Prisma schema:

1. Измени `schema.prisma`.
2. Создай development migration.
3. Просмотри generated SQL.
4. Проверь data loss и backward compatibility.
5. Обнови seed/tests при необходимости.
6. Закоммить schema и migration вместе.

Не редактируй уже применённую migration для создания другого production state.

## API contract changes

При изменении response:

1. Обнови backend explicit response type.
2. Обнови mapping в service.
3. Обнови frontend Zod schema.
4. Обнови tests.
5. Обнови consumer UI.
6. Проверь безопасную сериализацию money/date.

## Dependency policy

Перед новой dependency ответь:

- Нельзя ли решить platform API или существующим package?
- Активно ли dependency поддерживается?
- Бесплатна ли лицензия для проекта?
- Не требует ли она paid hosted service?
- Каков security и bundle/runtime impact?

Lockfile обновляется и коммитится вместе с package.json.

## Definition of Done

- Requested behavior работает.
- Strict TypeScript сохранён.
- Inputs validated.
- Authorization/ownership enforced.
- Financial precision сохранена.
- Sensitive data защищены.
- Tests добавлены для critical logic.
- Relevant lint/typecheck/tests/build выполнены.
- Documentation обновлена.
- Diff не содержит unrelated changes.
