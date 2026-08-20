# SpendLens AI Development Guide

## Project Overview

SpendLens is a production-oriented personal finance application that helps users understand where their money goes.

Users can upload:

- bank statements,
- receipts,
- transaction files.

The application extracts financial transactions, recognizes receipt contents, normalizes merchants, matches receipts to corresponding bank transactions, categorizes spending, and provides statistics and financial insights.

The core product principle is:

**Financial data must be deterministic and verifiable. AI enhances the data, but must not be the source of truth for calculations.**

SpendLens handles sensitive financial information. Security, privacy, correctness, and data isolation are primary requirements.

---

# Development Priorities

When implementing a task, optimize for this order:

1. Correctness
2. Security and privacy
3. Data integrity
4. Simplicity
5. Maintainability
6. User experience
7. Performance
8. Extensibility

Do not sacrifice correctness or security for faster implementation.

---

# Before Adding Code

Before making changes:

1. Read the task carefully.
2. Inspect the existing implementation and relevant files.
3. Reuse existing code before creating new abstractions.
4. Follow existing project conventions where they are reasonable.
5. Implement only what is required by the task.
6. Prefer platform APIs and existing dependencies.
7. Do not install a dependency when the task can be solved cleanly without it.
8. Avoid unrelated refactors.
9. Make the smallest complete change that solves the problem.
10. Verify the result before stopping.

Do not rewrite working functionality without a concrete reason.

---

# Tech Stack

## Application

- Next.js
- App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

## Data

- PostgreSQL
- Prisma ORM

## Client Data

- TanStack Query when client-side server state is required

## Forms

- React Hook Form
- Zod

## Validation

- Zod

## Charts

- Recharts

## File Storage

Use an S3-compatible storage provider or the storage solution configured in the project.

Never store uploaded financial documents inside the Git repository or public application directories.

## AI

AI integrations may be added through provider abstractions.

Do not couple business logic directly to a specific AI provider.

## Payments

Stripe may be used for subscriptions when billing is implemented.

Do not implement billing unless explicitly required by the current task.

---

# TypeScript

Always use strict TypeScript.

Requirements:

- Never use `any`.
- Avoid unsafe type assertions.
- Prefer `unknown` for untrusted data.
- Validate unknown external data before using it.
- Prefer `type` unless interface extension or declaration merging is specifically useful.
- Use discriminated unions for state with multiple known variants.
- Avoid duplicated domain types.
- Derive types from Zod or Prisma where appropriate.
- Do not weaken types just to silence TypeScript errors.

Never use:

```ts
as any
```

to bypass a type problem.

Fix the underlying type issue.

---

# Architecture

Keep the architecture pragmatic.

Do not create layers merely for the sake of having layers.

The general flow should be:

```text
UI
↓
Server Action / Route Handler
↓
Validation
↓
Domain / Service Logic
↓
Repository / Prisma
↓
Database
```

Complex business logic must not live inside:

- React components,
- Route Handlers,
- Server Actions.

Database access must never exist inside Client Components.

Route Handlers and Server Actions should primarily:

1. authenticate,
2. validate,
3. call application/domain logic,
4. return a result.

Simple database operations do not require unnecessary abstraction.

Create repositories when they provide real value, such as:

- repeated queries,
- ownership enforcement,
- complex persistence logic,
- transaction boundaries,
- testability.

Do not create empty architectural wrappers.

---

# Suggested Project Structure

Prefer feature-oriented organization.

```text
src/
├── app/
├── components/
│   └── ui/
│
├── features/
│   ├── dashboard/
│   ├── transactions/
│   ├── statements/
│   ├── receipts/
│   ├── merchants/
│   ├── matching/
│   ├── analytics/
│   └── billing/
│
├── server/
│   ├── auth/
│   ├── db/
│   ├── storage/
│   ├── services/
│   ├── repositories/
│   ├── parsers/
│   │   ├── statements/
│   │   └── receipts/
│   ├── matching/
│   ├── analytics/
│   └── ai/
│
├── lib/
├── hooks/
├── types/
└── config/
```

Do not create folders that are not currently needed.

Feature-specific code should remain close to its feature.

Shared code should only be extracted after it is genuinely shared.

---

# Domain Model

The core domain includes:

- User
- BankAccount
- Statement
- Transaction
- Merchant
- MerchantAlias
- Receipt
- ReceiptItem
- Category
- ReceiptMatch
- Subscription
- Usage

Do not treat uploaded documents as the primary source for analytics after parsing.

The application should convert documents into structured domain data.

Analytics should operate on structured database data whenever possible.

---

# Money Rules

Financial calculations require strict correctness.

## Never use floating-point numbers for money

Do not use JavaScript floating-point arithmetic for financial calculations.

Incorrect:

```ts
const total = 10.1 + 20.2;
```

Use Prisma `Decimal`, integer minor units, or another explicitly approved money representation.

For example:

```text
10.99 PLN
↓
1099 groszy
```

The chosen representation must remain consistent throughout the relevant domain.

Never silently convert financial values through JavaScript `number` when precision may be lost.

---

# Currency

Never assume all transactions use PLN.

Every monetary record must have an explicit currency.

Use ISO 4217 currency codes where possible:

```text
PLN
EUR
USD
GBP
```

Never add amounts with different currencies together unless an explicit conversion has been performed.

Exchange rates must include:

- source currency,
- target currency,
- rate,
- timestamp or effective date,
- source/provider when relevant.

---

# Dates

Financial dates have different meanings.

Do not treat them as interchangeable.

Transactions may contain:

- transaction date,
- posting date.

Receipts contain:

- purchase date,
- optionally purchase time.

Statements contain:

- period start,
- period end.

Matching logic must account for reasonable differences between purchase date and bank posting date.

Do not blindly convert date-only financial values through UTC in ways that can shift the calendar date.

---

# Financial Data Integrity

Never silently modify imported financial records.

Preserve original imported values when normalization occurs.

For example:

```text
merchantRaw:
JERONIMO MARTINS POLSKA S.A.

merchantNormalized:
Biedronka
```

Keep both values.

The same principle applies to:

- product names,
- transaction descriptions,
- dates,
- categories,
- OCR output.

When derived data changes, the original imported data should remain available where appropriate.

---

# Bank Statements

Bank statements are the primary source of transaction-level financial history.

The parsing pipeline should follow:

```text
Upload
↓
Validation
↓
Secure Storage
↓
Text / Data Extraction
↓
Bank Format Detection
↓
Parser
↓
Normalization
↓
Validation
↓
Database
↓
Matching
```

Each supported bank should have an isolated parser where appropriate.

Example:

```text
StatementParser
├── PkoBpStatementParser
├── SantanderStatementParser
├── IngStatementParser
└── MBankStatementParser
```

Do not create one giant parser containing bank-specific conditionals.

Parser output must use a normalized internal representation.

External parser output must always be validated before persistence.

---

# Receipt Processing

Receipt processing should follow:

```text
Upload
↓
File Validation
↓
Secure Storage
↓
OCR / Vision Extraction
↓
Schema Validation
↓
Merchant Normalization
↓
Item Normalization
↓
Categorization
↓
Matching
↓
User Review when necessary
```

Never assume OCR output is correct.

Preserve enough original data to allow the user to review parsing errors.

Users must be able to correct important extracted information.

---

# Receipt Matching

Receipt-to-transaction matching is critical business logic.

It must live in a dedicated matching module and must be independently testable.

Potential signals include:

- amount,
- currency,
- receipt date,
- transaction date,
- posting date,
- merchant identity,
- merchant aliases.

A typical deterministic scoring model may use:

```text
amount      50%
date        25%
merchant    25%
```

Weights and thresholds must be centralized configuration, not scattered magic numbers.

Example:

```ts
const AUTO_MATCH_THRESHOLD = 0.9;
const REVIEW_MATCH_THRESHOLD = 0.65;
```

Matching results should include enough information to explain why the match occurred.

Example:

```ts
type MatchCandidate = {
  transactionId: string;
  score: number;
  amountScore: number;
  dateScore: number;
  merchantScore: number;
};
```

Do not automatically match records below the approved confidence threshold.

Ambiguous matches must require additional verification or user confirmation.

---

# Merchant Normalization

Never rely only on raw bank merchant descriptions.

Preserve:

```text
merchantRaw
```

and map it separately to a normalized Merchant entity.

Example:

```text
JERONIMO MARTINS POLSKA S.A.
BIEDRONKA 1829
BIEDRONKA POZNAN
```

may all resolve to:

```text
Biedronka
```

Merchant aliases should be data-driven where practical.

Do not scatter merchant-specific string checks across the codebase.

---

# AI Rules

AI is an assistant, not the financial source of truth.

AI may be used for:

- ambiguous merchant recognition,
- receipt item normalization,
- spending categorization,
- ambiguous receipt matching,
- natural-language insights,
- explaining spending patterns.

AI must NOT be trusted to calculate authoritative totals when deterministic calculation is possible.

Incorrect architecture:

```text
Transactions
↓
LLM
↓
"How much did the user spend?"
```

Correct architecture:

```text
Transactions
↓
Deterministic analytics
↓
Structured result
↓
LLM
↓
Natural-language explanation
```

Never allow an AI model to silently mutate financial records.

AI-generated changes that affect financial data must either:

- pass deterministic validation,
- meet explicitly defined confidence requirements,
- or require user confirmation.

---

# AI Structured Output

Never parse arbitrary prose from an AI model when structured data is required.

Use schema-constrained structured output whenever supported.

All AI responses used by application logic must be validated with Zod before being trusted.

Treat AI output as untrusted external input.

---

# AI Privacy

Send the minimum necessary information to AI providers.

Prefer:

```json
{
  "merchant": "Biedronka",
  "amount": "84.37",
  "date": "2026-08-15"
}
```

over sending an entire bank statement.

Do not send unnecessary:

- names,
- account numbers,
- addresses,
- IBANs,
- card numbers,
- transaction histories,
- document metadata,
- unrelated transactions.

Redact sensitive information before sending data to external providers when possible.

---

# Security and Privacy

SpendLens processes highly sensitive financial information.

Security is a release requirement.

For every feature consider:

- authentication,
- authorization,
- ownership,
- validation,
- privacy,
- data exposure,
- file security,
- abuse prevention.

A feature is incomplete if it introduces an unresolved critical security or privacy issue.

---

# Authorization and Ownership

Every user-owned resource must enforce ownership on the server.

Examples:

- statements,
- bank accounts,
- transactions,
- receipts,
- receipt items,
- analytics,
- uploaded files.

Never rely on:

- hidden buttons,
- route visibility,
- client state,
- IDs generated by the client

for authorization.

Queries for user-owned resources should include ownership constraints whenever possible.

Never fetch a resource globally and then assume it belongs to the current user.

Prevent IDOR vulnerabilities.

---

# Validation

Every external input is untrusted.

Validate using Zod where appropriate:

- request bodies,
- query parameters,
- route parameters,
- forms,
- uploaded-file metadata,
- parser output,
- OCR output,
- AI output,
- webhook payloads,
- third-party API responses.

Validation must happen before business logic relies on the data.

---

# File Upload Security

Bank statements and receipts are untrusted files.

Validate:

- allowed MIME type,
- actual file signature where practical,
- maximum size,
- extension,
- ownership.

Do not trust the filename or MIME type supplied by the browser.

Generate server-controlled storage keys.

Never use user filenames directly as filesystem or object-storage paths.

Uploaded financial documents must be private by default.

Never expose a public permanent URL for a bank statement or receipt.

Use authenticated access or short-lived signed URLs when files need to be viewed.

Prevent path traversal.

Do not execute uploaded content.

Consider malicious PDFs and malformed image files when designing processing infrastructure.

---

# Sensitive Financial Information

Never log sensitive document contents.

Never log:

- full bank statements,
- receipt images,
- account numbers,
- IBANs,
- card numbers,
- authentication tokens,
- API keys,
- signed file URLs,
- raw AI prompts containing financial data.

Logs should contain identifiers and operational metadata only when necessary.

Example:

```text
receipt processing failed
receiptId=...
userId=...
parser=...
```

instead of logging the document contents.

---

# Authentication

Use the authentication architecture configured for the project.

Authentication implementation must use secure, established practices.

Requirements include:

- secure password hashing if passwords are supported,
- secure session handling,
- HttpOnly cookies where appropriate,
- Secure cookies in production,
- appropriate SameSite policy,
- session expiration,
- rotation/revocation where applicable.

Do not invent custom cryptographic algorithms.

Do not store plaintext passwords, tokens, or secrets.

---

# API and Server Actions

Use Route Handlers or Server Actions according to the feature's requirements.

Do not create an API endpoint merely because an endpoint can be created.

Route Handlers are appropriate when a real HTTP interface is useful, such as:

- file uploads,
- webhooks,
- external integrations,
- public API boundaries.

Server Actions may be appropriate for application-internal mutations.

Regardless of transport:

- authenticate,
- authorize,
- validate,
- execute domain logic,
- return safe errors.

---

# Error Handling

Never expose internal implementation details to users.

Do not return:

- stack traces,
- database errors,
- SQL,
- filesystem paths,
- secrets,
- provider credentials.

Use typed application errors where useful.

User-facing errors should be understandable and safe.

Operational logs may contain additional technical context as long as they do not contain sensitive financial data.

---

# Database

Use Prisma and PostgreSQL.

Requirements:

- use migrations,
- define relations explicitly,
- add indexes based on real query patterns,
- use transactions when multiple writes must succeed atomically,
- enforce important invariants at the database level where possible,
- avoid N+1 queries,
- select only required fields when handling sensitive data.

Never manually modify production database structure.

Do not create indexes speculatively without understanding the query pattern.

---

# Database Transactions

Use database transactions when consistency requires multiple related writes.

Examples:

- linking a receipt while updating match state,
- importing a statement and its transactions,
- deleting an account with dependent financial records,
- applying subscription usage changes.

Avoid leaving partially completed financial operations.

---

# Duplicate Imports

Statement and receipt imports should be designed with idempotency in mind.

The application should eventually detect accidental duplicate imports using appropriate signals such as:

- file hash,
- statement period,
- account,
- transaction identifiers,
- transaction fingerprint.

Never rely only on filename for duplicate detection.

---

# Analytics

Analytics must be deterministic.

Examples:

- total spending,
- category totals,
- merchant totals,
- monthly differences,
- average transaction,
- recurring payments,
- receipt coverage.

Calculate these using application/database logic.

Do not ask an LLM to calculate statistics that can be calculated deterministically.

Analytics functions should be independently testable.

---

# Categories

Categories should support future expansion.

Prefer hierarchical categories when useful.

Example:

```text
Food
├── Groceries
├── Restaurants
├── Delivery
└── Coffee

Transport
├── Public Transport
├── Taxi
└── Fuel
```

Do not overbuild the category system before it is required.

Always preserve the possibility for users to correct automatic categorization.

---

# React

Prefer Server Components by default.

Use Client Components only when browser APIs, local interaction, or client-side state require them.

Avoid unnecessary:

- `useEffect`,
- client components,
- global state,
- hydration,
- memoization.

Keep business logic outside React components.

Components should primarily handle presentation and interaction.

Break large components into meaningful pieces when doing so improves readability or reuse.

Do not split components merely to satisfy an arbitrary line count.

---

# State Management

Use the simplest appropriate state mechanism.

Preferred:

```text
Server Components → server-rendered data

TanStack Query → interactive server state

React Hook Form → forms

useState → local UI state

URL/search params → filter/sort/pagination state when appropriate
```

Do not introduce Redux unless a real requirement appears that cannot be solved cleanly with the existing architecture.

---

# UI

Use shadcn/ui and existing design primitives.

Maintain consistent:

- spacing,
- typography,
- border radius,
- colors,
- interaction states.

Every important interface should consider:

- loading state,
- empty state,
- error state,
- disabled state,
- success feedback.

Financial numbers must be easy to scan.

Do not rely only on color to communicate financial state.

---

# Accessibility

Use semantic HTML.

Requirements:

- keyboard navigation,
- visible focus states,
- proper labels,
- accessible dialogs,
- accessible forms,
- appropriate ARIA attributes when native semantics are insufficient,
- sufficient contrast.

Charts must not be the only way important financial information is communicated.

---

# Localization

The initial architecture should remain localization-friendly.

Do not mix formatting logic with raw financial data.

Use locale-aware formatting for:

- currency,
- dates,
- numbers,
- percentages.

Do not manually format money with string concatenation.

Prefer:

```ts
Intl.NumberFormat;
```

and appropriate date formatting APIs.

If localization is enabled, user-facing text should use the project's translation system rather than being scattered through components.

Do not translate:

- merchant names,
- user-created content,
- original transaction descriptions,
- original receipt item names.

---

# Performance

Prefer correctness and clarity before optimization.

When performance matters:

- avoid unnecessary client JavaScript,
- use Server Components,
- paginate large transaction lists,
- avoid N+1 database queries,
- select only necessary fields,
- lazy-load genuinely heavy client functionality,
- optimize images,
- cache only when invalidation rules are understood.

Never memoize automatically.

Measure before performing complex optimization.

---

# Background Processing

Document processing can become expensive.

Operations such as:

- OCR,
- AI processing,
- large PDF parsing,
- statement imports,
- receipt matching,
- bulk categorization

should be designed so they can move to background jobs when necessary.

Do not introduce a queue before it is required.

Processing states should support asynchronous execution.

Example:

```text
UPLOADED
PROCESSING
PROCESSED
FAILED
```

Operations should be retry-safe where practical.

---

# Usage Limits

When subscription limits are implemented, enforce them on the server.

Examples:

```text
FREE
3 document uploads / month

PRO
higher or unlimited allowance
```

Never rely on the UI to enforce usage limits.

Usage checks and increments should be atomic when race conditions could exceed a limit.

---

# Environment Variables

Never hardcode:

- database credentials,
- authentication secrets,
- AI API keys,
- storage credentials,
- Stripe secrets,
- webhook secrets.

Use environment variables.

Validate required environment variables during application startup where practical.

Keep `.env` files containing secrets out of Git.

Maintain `.env.example` containing variable names without real secrets.

---

# Code Style

Prefer:

- early returns,
- small focused functions,
- descriptive names,
- explicit domain terminology,
- immutable transformations where practical,
- straightforward code.

Avoid:

- magic numbers,
- deeply nested conditions,
- giant utility files,
- duplicated logic,
- speculative abstractions,
- clever code that reduces readability.

KISS and DRY are guidelines, not excuses for unnecessary abstraction.

---

# Naming

Use:

```text
variables       camelCase
functions       camelCase
components      PascalCase
types           PascalCase
constants       UPPER_SNAKE_CASE
files           kebab-case
```

Use domain terminology consistently.

Prefer:

```text
transaction
receipt
statement
merchant
matchCandidate
```

over vague names such as:

```text
data
thing
item2
resultObject
```

when the domain concept is known.

---

# Imports

Prefer project aliases for cross-feature imports.

Keep imports organized and remove unused imports.

Avoid fragile deep relative paths such as:

```text
../../../../lib/example
```

when an established project alias is available.

---

# Comments

Prefer self-documenting code.

Comments should explain:

- why a non-obvious decision exists,
- financial edge cases,
- security reasoning,
- unusual parser behavior,
- matching assumptions.

Do not write comments that merely repeat the code.

---

# Testing

Critical business logic must be independently testable.

Prioritize tests for:

1. money calculations,
2. receipt matching,
3. merchant normalization,
4. statement parsing,
5. receipt parsing,
6. analytics,
7. authorization and ownership,
8. validation,
9. usage limits,
10. subscription/webhook logic when implemented.

Matching tests should include:

- exact matches,
- one-day date differences,
- posting-date differences,
- merchant aliases,
- same amount at different merchants,
- duplicate amounts,
- different currencies,
- ambiguous candidates,
- no valid candidate.

Financial calculations should include edge cases.

---

# External Integrations

Wrap important third-party integrations behind small project-owned boundaries.

Examples:

```text
AIProvider
StorageProvider
ReceiptParser
StatementParser
PaymentProvider
```

Do not leak provider-specific response structures throughout the application.

Validate third-party responses.

Use reasonable timeouts and safe retry strategies where applicable.

Do not create abstractions for integrations that do not yet exist.

---

# Git

Use Conventional Commits.

Examples:

```text
feat: add receipt matching engine
fix: prevent duplicate statement imports
refactor: extract merchant normalization
test: add matching edge cases
docs: update statement parser guide
chore: update dependencies
```

Keep commits focused.

Do not mix unrelated changes into one commit.

---

# AI Coding Agent Rules

When working on this repository:

1. Inspect before editing.
2. Understand the existing architecture before creating new patterns.
3. Do not replace working code merely because another implementation is preferred.
4. Make the smallest complete change.
5. Do not modify unrelated files.
6. Do not install dependencies unless necessary.
7. Never weaken TypeScript, validation, authorization, or security to make a task pass.
8. Never use `any` to bypass typing.
9. Never hardcode secrets.
10. Never expose financial documents publicly.
11. Never trust client, parser, OCR, AI, webhook, or third-party data without validation.
12. Never use AI as the authoritative calculator for financial statistics.
13. Preserve raw imported financial data when creating normalized representations.
14. Keep financial calculations deterministic.
15. Keep business logic outside UI and transport layers.
16. Add tests when changing critical domain logic.
17. Follow existing naming and project conventions.
18. Run relevant validation after implementation.
19. Fix errors caused by the change before considering the task complete.
20. Stop when the requested task is complete.

---

# Verification

After making changes, run the relevant available checks.

Typically:

```bash
npm run lint
npm run typecheck
npm test
```

Use the actual scripts defined in `package.json`.

Do not invent commands that the repository does not provide.

For changes affecting production builds, run:

```bash
npm run build
```

when practical.

Do not claim that tests, linting, type checking, or builds pass unless they were actually executed successfully.

---

# Backend Architecture

SpendLens uses NestJS as its dedicated backend.

The application architecture is:

```text
Next.js
↓
NestJS REST API
↓
Domain / Service Logic
↓
Prisma
↓
PostgreSQL
```

Next.js is responsible for:

- rendering the user interface;
- frontend routing;
- forms and user interaction;
- client-side state when required;
- calling the NestJS API.

NestJS is responsible for:

- authentication and authorization;
- business logic;
- validation;
- database access;
- transaction processing;
- receipt processing;
- statement processing;
- merchant normalization;
- receipt matching;
- analytics;
- file upload orchestration;
- usage limits;
- subscriptions;
- AI integration;
- external integrations.

## Backend Source of Truth

NestJS is the only application layer allowed to access Prisma and PostgreSQL directly.

Do not create Prisma clients or database queries inside the Next.js application.

Incorrect:

```text
Next.js → Prisma → PostgreSQL
Next.js → NestJS → Prisma → PostgreSQL
```

Correct:

```text
Next.js → NestJS → Prisma → PostgreSQL
```

All financial business logic must live in the backend.

Do not duplicate backend calculations in Next.js.

The frontend may format and display results but must not become a second implementation of financial domain logic.

---

# NestJS Architecture

Use standard NestJS concepts pragmatically:

```text
Module
↓
Controller
↓
Service
↓
Repository / Prisma
```

Controllers must remain thin.

Controllers should primarily:

1. receive requests;
2. authenticate and authorize;
3. validate input;
4. invoke application services;
5. return safe responses.

Business logic must not live inside controllers.

Use services for domain/application logic.

Create repositories only when they provide actual value such as:

- complex or repeated queries;
- ownership enforcement;
- persistence abstraction;
- database transactions;
- improved testability.

Do not create repositories that merely wrap every Prisma method one-to-one.

Avoid unnecessary enterprise-style abstractions.

---

# NestJS Modules

Prefer domain-oriented modules.

Expected modules may eventually include:

```text
auth
users
bank-accounts
statements
transactions
receipts
merchants
matching
categories
analytics
storage
billing
ai
```

Create modules only when required by the current feature.

Do not create empty modules in advance.

Keep feature-specific:

- DTOs;
- validators;
- controllers;
- services;
- repository logic;
- tests

close to their feature.

---

# Validation in NestJS

All external data must be validated before reaching business logic.

Use Zod as the primary validation solution unless the existing project establishes another approved approach.

Do not maintain duplicate validation schemas for frontend and backend unless necessary.

When shared schemas provide real value, they may be moved into a shared package.

Do not create a shared package prematurely.

Treat the following as untrusted:

- request bodies;
- query parameters;
- path parameters;
- uploaded files;
- OCR output;
- bank parser output;
- AI responses;
- webhook payloads;
- third-party API responses.

---

# API Design

NestJS exposes the application HTTP API.

Use REST conventions.

Examples:

```text
GET    /transactions
GET    /transactions/:id
POST   /receipts
GET    /receipts
GET    /receipts/:id
POST   /statements
GET    /statements
GET    /statements/:id
```

Use proper HTTP status codes.

Do not create endpoints that expose implementation details.

Do not return full Prisma entities by default.

Return explicit response DTOs when sensitive or unnecessary fields could otherwise leak.

---

# Frontend and Backend Contract

Next.js must communicate with NestJS through a clear API contract.

Do not import NestJS services directly into Next.js.

Do not share server-only implementation code between applications.

Only share:

- safe domain types;
- enums;
- validation schemas;
- API contracts

when sharing provides clear value.

Never place:

- Prisma client;
- database credentials;
- backend services;
- secrets

inside a shared frontend package.

---

# CORS and Cookies

When frontend and backend run on different origins, configure CORS explicitly.

Never use unrestricted production CORS such as:

```text
Access-Control-Allow-Origin: *
```

for authenticated financial APIs.

If cookie-based authentication is used:

- configure credentials correctly;
- use HttpOnly cookies;
- use Secure cookies in production;
- use an appropriate SameSite policy;
- protect state-changing requests against CSRF where applicable.

---

# Financial Logic Location

The following logic belongs exclusively to NestJS:

- money calculations;
- transaction aggregation;
- merchant normalization;
- receipt matching;
- statement parsing;
- receipt parsing;
- spending categorization;
- usage limits;
- subscription permissions;
- AI orchestration;
- analytics.

Next.js must consume calculated results through the API.

---

# Project Cost Constraint

SpendLens must be designed to remain extremely inexpensive to develop and operate during development and early MVP stages.

The default target is:

```text
Recurring infrastructure cost:
0 PLN/month
```

Paid services must be avoided whenever a reasonable free alternative exists.

## Hard Budget

Total one-time development-related spending should normally remain:

```text
<= 50 PLN
```

Recurring paid services should normally remain:

```text
<= 5 PLN/month total
```

This limit applies to the entire project, not individually to each service.

Do not introduce a paid dependency, API, hosting product, database, storage provider, monitoring system, email provider, OCR provider, AI provider, or SaaS service without evaluating its cost first.

---

# Cost-Aware Engineering

Before selecting an external service, prefer in this order:

1. local development;
2. open-source/self-hosted solution;
3. free tier;
4. free developer allowance;
5. one-time inexpensive purchase;
6. paid recurring service only when there is no reasonable alternative.

Do not choose infrastructure merely because it is popular.

Consider whether the current scale actually requires it.

---

# Development Infrastructure

Prefer free local infrastructure during development.

Examples:

```text
PostgreSQL → local Docker
Redis      → local Docker
NestJS     → local process
Next.js    → local process
Storage    → local filesystem or local S3-compatible emulator during development
```

Production-like cloud services should only be introduced when necessary for deployment or integration testing.

---

# Database Cost

Prefer PostgreSQL providers with a sufficient free tier for the MVP.

Do not require a paid PostgreSQL plan for development.

Local PostgreSQL through Docker is always an acceptable development option.

Never add a second database unless there is a concrete technical requirement.

---

# Redis and Queues

Do not introduce paid Redis infrastructure merely to support background jobs.

During early development:

- use local Redis through Docker if Redis is required;
- or keep processing synchronous while workloads are small.

Only introduce hosted Redis when background processing genuinely requires deployment.

Prefer providers with sufficient free tiers.

---

# File Storage Cost

During early development, uploaded files may use a local development storage adapter.

Production storage should use an inexpensive or free-tier S3-compatible service where possible.

Storage architecture must remain provider-independent.

Do not introduce a paid storage subscription during initial development.

---

# AI Cost Control

AI usage must be cost-aware.

Do not call an AI model when deterministic application logic can solve the task.

AI must not be used for:

- totals;
- arithmetic;
- basic matching;
- simple merchant aliases;
- deterministic analytics.

When AI is required:

- send the smallest possible payload;
- use structured output;
- avoid resending entire documents;
- cache or persist reusable results where appropriate;
- avoid repeated processing of unchanged input;
- use cheaper suitable models for simple classification.

Development should support mocked AI providers so features can be developed without API spending.

The application must remain usable without AI during early development.

---

# OCR Cost Control

Do not assume a paid OCR provider is required.

The OCR layer must be abstracted behind a provider boundary.

During development prefer:

- mock parsers;
- locally extractable PDF text;
- open-source/local OCR where appropriate;
- provider free tiers.

Paid OCR APIs must not become mandatory for local development.

---

# Email Cost

Do not introduce a paid email subscription during MVP development.

Use:

- development mail capture;
- provider free tiers;
- console/mock adapters

until real transactional email delivery is required.

---

# Monitoring and Analytics Cost

Do not introduce paid monitoring or product analytics by default.

Prefer:

- application logs;
- local development tools;
- free tiers

until production usage justifies additional infrastructure.

---

# Dependency Cost

Avoid dependencies that require paid licenses for core functionality.

Before adding any service or package with commercial limitations:

1. verify its license;
2. verify free-tier restrictions;
3. verify recurring cost;
4. ensure the project can function without unexpectedly crossing the project budget.

---

# No Hidden Paid Dependency

A feature is not considered complete if running it requires an undocumented paid external service.

If a future feature genuinely requires spending beyond the project budget:

1. do not automatically implement or purchase it;
2. provide a free or mocked development path;
3. document the expected cost;
4. clearly identify the paid dependency.

---

# Cost Review

When introducing a new external service, the coding agent must report:

```text
Service:
Purpose:
Free tier:
Expected development cost:
Expected recurring cost:
Alternative:
```

If the expected recurring project cost would exceed 5 PLN/month, do not adopt the service unless explicitly instructed by the project owner.

If a one-time expense would cause total project spending to exceed 50 PLN, do not adopt it unless explicitly instructed.

# Deployment and Hosting

SpendLens must be designed for low-cost or free deployment.

The project should be deployable using free tiers whenever practical.

The frontend and backend must be independently deployable.

Preferred architecture:

```text
Frontend
Next.js
↓
Free or low-cost hosting
Example: Vercel

Backend
NestJS
↓
Free or low-cost Node.js hosting

Database
PostgreSQL
↓
Free-tier managed PostgreSQL or self-hosted development instance
```

Do not assume that frontend and backend must be hosted by the same provider.

---

# Frontend Deployment

The Next.js application should remain compatible with Vercel unless a future requirement explicitly requires another deployment target.

Avoid frontend architecture that unnecessarily prevents deployment to common serverless or Node-compatible platforms.

Do not depend on:

- local filesystem persistence;
- long-running in-memory state;
- machine-specific configuration;
- locally installed binaries

for core frontend functionality.

All deployment-specific values must be configured through environment variables.

---

# Backend Deployment

NestJS must be deployable independently from Next.js.

The backend must not depend on:

- the Next.js runtime;
- Vercel-specific APIs;
- frontend filesystem structure;
- localhost-only communication;
- persistent local filesystem storage;
- in-memory state that must survive restarts.

The NestJS application should be compatible with ordinary Node.js hosting platforms.

Prefer standard Node.js APIs and portable infrastructure.

Do not introduce provider-specific backend code unless it solves a concrete requirement.

---

# Hosting Provider Independence

Do not tightly couple SpendLens to a single hosting provider.

Infrastructure integrations should remain portable where reasonable.

For example:

```text
Next.js → Vercel

NestJS → another Node.js hosting provider

PostgreSQL → independent database provider

Object Storage → S3-compatible provider
```

The application must communicate through configured URLs and credentials rather than assumptions about shared infrastructure.

---

# API URL

Frontend-to-backend communication must use configuration.

Development example:

```text
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Production example:

```text
NEXT_PUBLIC_API_URL=https://api.example.com/api
```

Never hardcode localhost or production backend URLs inside application code.

---

# CORS Deployment Rules

NestJS CORS configuration must support separate frontend and backend deployments.

Allowed frontend origins must come from environment configuration.

Example:

```text
FRONTEND_URL=https://spendlens.example.com
```

For multiple explicitly approved origins, use a controlled allowlist.

Do not use unrestricted production CORS.

---

# Stateless Backend

Treat deployed NestJS instances as disposable and restartable.

Do not rely on process memory for persistent application state.

Persistent information belongs in appropriate external systems such as:

- PostgreSQL;
- object storage;
- cache when later required.

In-memory data may only be used for temporary request-local or safely disposable state.

---

# File Storage and Deployment

Do not store uploaded receipts or bank statements permanently on the application server filesystem.

Local filesystem storage may be used only as a development adapter.

Production uploads must use external private object storage or another deployment-safe storage solution.

The storage layer should remain abstracted so the development implementation can differ from production.

Example:

```text
development:
LocalStorageProvider

production:
S3CompatibleStorageProvider
```

Do not make the rest of the application depend directly on either implementation.

---

# Serverless and Runtime Constraints

When implementing backend features, consider that low-cost hosting may:

- restart application instances;
- suspend idle services;
- limit request duration;
- provide ephemeral filesystems;
- limit memory and CPU;
- restrict long-running processes.

Do not design critical workflows around assumptions of an always-running single server.

Long-running document processing may later require a worker or job system, but do not introduce one before it is needed.

---

# Deployment Cost Rules

Deployment must follow the project cost constraints.

Preferred target during MVP:

```text
Frontend hosting: 0 PLN/month
Backend hosting: 0 PLN/month
Database: 0 PLN/month
Storage: 0 PLN/month or free allowance
```

Total recurring project cost without explicit approval must remain:

```text
<= 5 PLN/month
```

Do not adopt a hosting platform that requires entering a paid subscription simply to run the MVP when a reasonable free alternative exists.

---

# Deployment Configuration

Each deployable application must have clear environment configuration.

At minimum, backend deployment may require:

```text
DATABASE_URL
PORT
FRONTEND_URL
```

Frontend may require:

```text
NEXT_PUBLIC_API_URL
```

Additional variables should only be added when the related integration exists.

Never commit production secrets.

---

# Health Endpoint

The NestJS backend should expose a lightweight health endpoint when deployment work begins.

Example:

```text
GET /api/health
```

It should confirm that the application process is running without exposing sensitive configuration.

Do not expose:

- environment variables;
- database credentials;
- internal infrastructure information;
- secrets.

---

# Deployment Readiness

When implementing infrastructure-sensitive functionality, verify that it works outside localhost assumptions.

A feature that works only because frontend, backend, database, and files are on one developer machine is not production-ready.

Deployment architecture should support:

```text
Browser
↓
Next.js deployment
↓ HTTPS
NestJS deployment
↓
PostgreSQL / Storage
```

without requiring shared local disk or shared process memory.

# Definition of Done

A task is complete when:

- the requested behavior works,
- TypeScript remains strict,
- external input is validated,
- authorization and ownership are enforced where relevant,
- financial calculations remain precise,
- sensitive information is protected,
- error states are handled,
- critical business logic is testable,
- relevant tests pass,
- lint/type checks pass where available,
- no unrelated functionality was changed,
- no known critical security or data-integrity issue remains.

SpendLens should be built as a real financial product, not as a demo CRUD application.
