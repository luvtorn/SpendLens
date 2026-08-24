# Данные и domain logic

## Источник истины

После parsing финансовые операции должны существовать как structured database
records. Uploaded documents не должны оставаться единственным источником данных
для analytics.

Bank statements являются первичным источником transaction history. Receipts
добавляют item-level detail и сопоставляются с transactions отдельно.

## Основные entities

```text
User
├── RefreshSession
├── BankAccount
│   ├── Statement
│   │   └── Transaction
│   └── Transaction
└── Receipt
    ├── ReceiptItem
    └── ReceiptMatch ── Transaction

Merchant
├── MerchantAlias
├── Transaction
└── Receipt

Category
├── child Category
├── Transaction
└── ReceiptItem
```

Полная schema находится в `apps/api/prisma/schema.prisma`.

## Ownership model

Прямо принадлежат пользователю:

- `BankAccount`;
- `Statement`;
- `Transaction`;
- `Receipt`;
- `RefreshSession`.

`ReceiptItem` и `ReceiptMatch` получают ownership через parent relations.
`Merchant` и `Category` сейчас являются общими справочниками.

API queries для user-owned данных должны включать `userId` из authenticated
request context.

## Деньги

Database representation:

```text
Prisma Decimal / PostgreSQL DECIMAL
```

Domain analytics representation:

```text
bigint minor units
```

HTTP representation:

```json
{
  "amount": "84.37",
  "currency": "PLN"
}
```

`decimalToMinorUnits` преобразует persisted Decimal в `bigint`, а
`minorUnitsToDecimal` возвращает canonical decimal string.

Нельзя:

- использовать `parseFloat` или `Number(amount)` для calculation;
- суммировать разные currencies;
- предполагать PLN, если currency есть в record;
- сериализовать Prisma Decimal как случайный JavaScript number.

## Валюты

Каждая monetary record имеет ISO 4217-like currency field. Analytics группирует
totals, merchants и categories отдельно для каждой currency.

Конвертация валют сейчас не реализована. Добавлять суммы разных currencies без
exchange rate запрещено.

## Даты

Schema различает:

- statement `periodFrom` и `periodTo`;
- transaction `transactionDate`;
- optional `postingDate`;
- receipt `receiptDate`.

Финансовые date-only values хранятся как PostgreSQL `DATE` и возвращаются в API
как `YYYY-MM-DD`. Не превращай их в local datetime, способный сдвинуть календарный
день.

## Original и normalized data

Original imported fields сохраняются отдельно:

- `merchantRaw` рядом с `merchantId`;
- `descriptionRaw`;
- `nameRaw` рядом с `nameNormalized`;
- original dates и amounts.

Нормализация не должна уничтожать raw value. Пользователь должен иметь
возможность понять и позже исправить derived data.

## Merchant normalization

`normalizeMerchantName`:

- применяет Unicode NFKC;
- trim-ит whitespace;
- переводит строку в uppercase для `pl-PL`;
- нормализует punctuation и пробелы;
- удаляет некоторые legal suffixes.

Aliases превращаются в lookup map. Merchant-specific checks не должны быть
разбросаны по codebase.

## Receipt matching

Matching является deterministic и explainable.

Weights:

```text
amount:   50%
date:     25%
merchant: 25%
```

Thresholds:

```text
AUTO_MATCH_THRESHOLD   = 0.90
REVIEW_MATCH_THRESHOLD = 0.65
AMBIGUITY_SCORE_DELTA   = 0.02
```

Signals:

- amount требует точного совпадения и одинаковой currency;
- date учитывает transaction date и posting date;
- merchant сравнивает IDs, aliases или normalized raw names.

Ambiguous high-scoring candidates не auto-match-ятся. Matching result сохраняет
total score и component scores для объяснимости.

## Analytics

Dashboard analytics вычисляется в NestJS:

- total spending per currency;
- transaction count;
- unique merchant count;
- receipt coverage;
- top merchants per currency;
- spending by category per currency;
- category share в basis points.

Frontend только форматирует и отображает результат.

## Document processing state

Statements и receipts используют:

```text
UPLOADED → PROCESSING → PROCESSED
                    ↘ FAILED
```

Upload и production processing pipeline пока не реализованы. `fileKey` уже
моделирует private storage key, но persistent object storage provider ещё не
подключён.

## Parsers

Существуют contracts:

- `BankStatementParser`;
- `ReceiptParser`.

И demo implementations:

- `DemoBankStatementParser`;
- `DemoReceiptParser`.

Parser output проходит Zod validation. Реальные bank-specific parsers, OCR и PDF
processing ещё не реализованы.

## Migrations

Текущие migrations:

1. `20260820000000_initial` — основная financial schema;
2. `20260820010000_authentication` — password hash и refresh sessions.

Изменения schema всегда оформляются migration. Не редактируй production database
вручную.

## Seed

Seed создаёт deterministic demo dataset: user, account, statement, transactions,
merchants, aliases, categories, receipts, items и matches.

При изменении seed:

- не добавляй реальные финансовые данные;
- сохраняй deterministic IDs и values;
- не удаляй данные других users;
- хэшируй demo password установленным Argon2id service/package.

