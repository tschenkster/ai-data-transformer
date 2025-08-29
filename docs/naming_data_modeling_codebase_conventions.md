Token count: 3300

# Naming, Data Modeling & Codebase Conventions

## 1. Executive Summary
The model uses lower snake_case with underscores as separators and predominantly plural table names (e.g., `report_line_items`, `user_accounts`). Two tables end with a singular `..._log` suffix, creating a pluralization inconsistency. Columns are also lower snake_case, with common suffixes such as `_uuid`, `_id`, `_at`, and boolean `is_...`. UUIDs and integer IDs coexist across all entities by rule. All records support UTF-8 for business data, but table and column identifiers must remain ASCII-only.

Schemas provide clear namespaces. The **`public` schema** (Supabase’s default schema, used here for operational purposes) holds user-driven tables. The optional **`reporting` schema** is reserved for derived, rebuildable analytical tables.

The frontend follows a **feature-based architecture**: code is organized under `src/features/<feature-name>/` with self-contained modules (components, hooks, services, utils, types). Shared UI lives under `src/components/ui/`, integrations under `src/integrations/`, and global hooks in `src/hooks/`. Pages are thin wrappers delegating to feature modules.

## 2. Global Conventions & Data Modeling Rules
- **Casing:** Use lower snake_case for all tables, columns, constraints, and enum type names.  
- **Separators:** Use `_` (underscore) as the only separator; no spaces or hyphens.  
- **Language (identifiers vs. data):** **Identifiers must be ASCII English** (no umlauts/ß); **data values are UTF-8** and may contain umlauts and any Unicode.  
- **Encoding:** Postgres database uses **UTF-8** (default).  
- **Collation & normalization:** Use **ICU collation `de-x-icu`** for German sorting unless a case-/accent-sensitive index is required; normalize text to **NFC** at ingestion for consistent comparisons; use **citext** or functional indexes for case-insensitive search.  
- **Disallowed:** Uppercase letters, hyphens, spaces, trailing underscores, leading numerals, and reserved words as bare column names (e.g., `timestamp`). Umlauts/ß are **not allowed in identifiers**.  
- **Abbreviations:** Allowed: `id`, `uuid`, `ip`. Avoid new abbreviations unless added to the allow-list.  
- **Singular vs. plural:** Tables are plural nouns (e.g., `user_accounts`). Event/audit/history tables always end with plural `_logs`.  

### Data Modeling Rules
- **Schemas:** All tables live in either the `public` schema (operational, user-driven) or the `reporting` schema (derived, analytical).  
- **Schema purposes:**  
  - `public`: Stores operational, user-edited data with RLS. Not rebuildable. Prefixes: `user_`, `report_`, `security_`, `coa_`.  
  - `reporting`: Stores rebuildable BI tables. Prefixes: `dim_`, `fact_`, `bridge_`. Read-only to users.  
- **Rebuildability Test:** If a table can be dropped and safely recomputed from upstream data, it belongs in `reporting`. If not (because it stores user edits/approvals), it belongs in `public`.  
- **Entity granularity:** Each table models a single business concept at one level of granularity; do not mix header and detail data in the same table.  
- **Keys:** Surrogate UUIDs are always the PK. Natural keys must be stored explicitly in `_key` columns but never serve as relational PKs.  
- **Bridge/junction tables:** In `public`, bridges capture user decisions (mutable). In `reporting`, bridges are rebuildable, read-only links between entities. Each bridge has its own surrogate PK and a unique constraint across its FK pair.  
- **Change history:** Append-only change logs use `_logs`. Slowly Changing Dimensions (SCD2) in `reporting` require `valid_from`, `valid_to`, `is_current`.  
- **Referential integrity:** All FKs must have explicit FK constraints. Cascading deletes are forbidden; use soft deletes or archival instead.  
- **Auditability:** All tables require `created_at` and `updated_at`. Domain-critical tables also require `created_by_user_uuid`.  
- **Hierarchies:** Model with adjacency lists (`parent_uuid`) and materialized paths (`hierarchy_path`). Maximum depth 7 levels; extensions require schema migration.  
- **Units & currencies:** Monetary columns must always specify a currency suffix (e.g., `_amount_eur`). Time is stored in UTC; presentation is handled in the application layer.  
- **Money precision:** Monetary amounts use `NUMERIC(18,2)` (or `NUMERIC(20,4)` if sub-cent precision required). Floats are prohibited.  
- **Currency codes:** Pair monetary amounts with ISO-4217 3-letter code columns (`*_currency`).  
- **Tenancy (multi-entity):** The application is designed for multiple entities. All future entity-specific business tables must include an `entity_uuid` (PK) and `entity_id` (unique int). Entities can be grouped into **entity groups** using `entity_group_uuid` and `entity_group_id`. RLS policies enforce strict isolation: users can only access rows for the entities or entity groups they are assigned to. The current 7 core tables do not yet include `entity_uuid`; this rule is forward-looking and applies when entity-scoped accounting data (e.g., journals, balances, mappings) are introduced.

## 3. Table Naming Rules
- **Prefixes by schema:**  
  - `public` schema → use domain prefixes: `user_`, `report_`, `security_`, `coa_`.  
  - `reporting` schema → use star-schema prefixes: `dim_`, `fact_`, `bridge_`.  
- **Composite/junction tables:** If modeling M:N assignments (e.g., users ↔ roles), prefer `<a>_<b>_assignments` in `public`.  
- **Historical / audit tables:** Always use a plural `_logs` suffix for append-only event/audit/history tables.  
- **Catalog/enum/reference tables:** Use plural nouns (e.g., `roles`, `action_types`).  
- **Examples & patterns:**  
  - `public.report_line_items` → pattern: `<domain>_<entity_plural>`  
  - `public.user_accounts` → pattern: `<domain>_<entity_plural>`  
  - `public.security_audit_logs` → normalized pattern for audit tables  
  - `reporting.bridge_account_to_report_line_item` → rebuildable reporting bridge

## 4. Column Naming Rules
- **Primary keys:** Each table has both `<entity>_uuid` (UUID, PK, business/relational) and `<entity>_id` (integer, sequential display key, unique, not used for joins).  
- **Foreign keys:** Name as `<referenced_entity>_uuid` when referencing a UUID PK. For self-references use `parent_<entity>_uuid`.  
- **Composite key ordering:** When two columns identify an entity in context, order from broader → narrower.  
- **Surrogate vs. natural keys:** Use UUIDs/integer IDs as surrogates; natural keys use `_key`.  
- **Booleans:** Prefix with `is_` or `has_`.  
- **Date/time:** Use suffix `_at` for timestamps. Avoid bare `timestamp`.  
- **Amounts/units:** Suffix with unit (e.g., `_amount_eur`, `_qty`, `_hours`).  
- **Sequence/index:** Use `_order` or `_position`.  
- **Audit columns:** Always include `created_at`, `updated_at`, and `created_by_user_uuid` when relevant.  
- **JSON state:** JSONB columns use semantic names without `_json` suffix.  
- **ASCII identifier policy:** Provide `_slug` columns where ASCII-only derivatives are needed.  
- **Examples:**  
  - `report_line_item_uuid` → PK uses `<entity>_uuid`.  
  - `report_structure_uuid` → FK uses `<referenced_entity>_uuid`.  
  - `is_leaf`, `is_calculated` → booleans use `is_` prefix.  
  - `created_at`, `updated_at` → timestamps use `_at`.  
  - `net_amount`, `tax_amount`, `gross_amount` → consistent accounting amounts.

## 5. Keys & Relationships
- **Primary key shapes:** UUID PK + integer ID secondary. Applies to all tables.  
- **Foreign key shapes:** Always `<referenced_entity>_uuid`.  
- **Bridge tables:** PK is a synthetic UUID + unique composite on FK pair.  
- **Constraint naming:** Use `pk_`, `fk_`, `uq_`, `idx_`. Avoid PostgreSQL auto-generated names (`…_pkey`, `…_fkey`, `…_key`) — use explicit names per the prefixes above for clarity and consistency.  
- **Canonical user source:** Always `public.user_accounts.user_uuid`. Supabase `auth.users` only referenced indirectly.  
- **Examples:**  
  - `report_line_items.report_structure_uuid → report_structures.report_structure_uuid` (FK).  
  - `user_roles.user_uuid → user_accounts.user_uuid`.  

## 6. Domain-Specific Conventions
- **Report structure hierarchy:** Use `_key`, `parent_<entity>_uuid`, `hierarchy_path`, `level_<n>`, `sort_order`. Depth max 7.  
- **Audit/change tracking:** `_logs` tables capture append-only events.  
- **Bridges:**  
  - In `public`, bridges capture user decisions (mutable). Must include workflow metadata: `confidence_score`, `mapping_method` (enum: `ai|rule|manual`), `needs_review`, `approved_by_user_uuid`, `approved_at`.  
  - In `reporting`, bridges are rebuildable, slim, and read-only.
- **Journal & postings integrity:** Journal entries must balance; enforce constraint on sum of signed amounts = 0.  
- **Debit/credit convention:** Use the signed amount convention (positive = debit, negative = credit) globally.  
- **Immutability:** Posted rows are immutable; corrections are adjustments with `adjusts_*` references. Exception: a Super Admin may override and delete data to clean up the database.  
- **Chart of accounts:** `account_number` is TEXT, uniqueness `(entity_uuid, account_number)`.  
- **Fiscal periods:** Standardize on `fiscal_year`, `fiscal_period` (or `period_key`). Store times in UTC.  
- **VAT/tax:** Use controlled `vat_code` enum; store `vat_rate_percent`; enforce `gross_amount = net_amount + tax_amount`.  
- **Multi-entity tenancy:** All entity data carries `entity_uuid`. Entities can be grouped into entity groups via `entity_group_uuid`. RLS enforces strict separation. Note: the current 7 core tables do not yet include `entity_uuid`. This rule applies to future entity-scoped tables such as journals, balances, or mappings.  
- **FX rates:** Tables must record `from_currency`, `to_currency`, `rate NUMERIC(20,10)`, `valid_from/valid_to`; converted rows persist `applied_fx_rate`.  
- **Provenance:** Ingested rows require `source_system`, `source_file`, `source_row_number`, `source_hash` for idempotency.  
- **Statuses:** Workflow states use ENUMs/allow-lists, not free text.  

## 7. Rule Catalog (numbered)
- **R1 [GLOBAL]:** Identifiers use lower snake_case, ASCII only.  
- **R2 [GLOBAL]:** Encoding UTF-8; normalize text to NFC.  
- **R3 [GLOBAL]:** Default collation ICU `de-x-icu`; use citext or indexes for case-insensitive search.  
- **R4 [GLOBAL]:** Disallow uppercase, hyphens, spaces, leading numerals, reserved words.  
- **R5 [TABLE]:** Tables are plural nouns with prefixes per schema.  
- **R6 [TABLE]:** Audit tables end `_logs`.  
- **R7 [SCHEMA]:** `public` schema = operational, user-driven; `reporting` schema = derived, analytical.  
- **R8 [BOUNDARY]:** Apply Rebuildability Test to classify.  
- **R9 [TABLE|PUBLIC]:** `public` schema uses domain prefixes.  
- **R10 [TABLE|REPORTING]:** `reporting` schema uses `dim_`, `fact_`, `bridge_`.  
- **R11 [COLUMN]:** Every table has `<entity>_uuid` PK + `<entity>_id`.  
- **R12 [KEYS]:** FKs are `<referenced_entity>_uuid`; self-FKs are `parent_<entity>_uuid`.  
- **R13 [COLUMN]:** Natural keys use `_key`.  
- **R14 [COLUMN]:** Booleans start with `is_`/`has_`.  
- **R15 [COLUMN]:** Timestamps end `_at`.  
- **R16 [COLUMN]:** Monetary columns are NUMERIC with ISO-4217 currency code.  
- **R17 [ACCOUNTING]:** Any future tables that represent journal or posting entries must enforce balancing (sum of signed amounts = 0).  
- **R18 [ACCOUNTING]:** Any future tables that represent journal or posting entries must adopt the **signed amount convention** (positive = debit, negative = credit) globally; mixing conventions is prohibited.  
- **R19 [IMMUTABILITY]:** Posted rows are immutable; corrections are adjustments with references. Exception: a Super Admin may override and delete data to clean up the database.  
- **R20 [COA]:** Account numbers are TEXT; uniqueness `(entity_uuid, account_number)`.  
- **R21 [PERIOD]:** Fiscal metadata standardized (`fiscal_year`, `fiscal_period` or `period_key`).  
- **R22 [VAT]:** VAT code enum + rate; enforce `gross = net + tax`.  
- **R23 [TENANCY]:** All entity tables include `entity_uuid`; RLS required. Entities can be grouped into entity groups via `entity_group_uuid`. Note: the current 7 core tables do not yet include `entity_uuid`. This rule is forward-looking for future entity-scoped tables.  
- **R24 [FX]:** FX rates store `from_currency`, `to_currency`, `rate`, validity; applied rows persist `applied_fx_rate`.  
- **R25 [PROVENANCE]:** Ingested rows include provenance columns and use `source_hash` for idempotency.  
- **R26 [STATUS]:** Workflow/status columns use ENUMs or allow-lists only.  
- **R27 [BRIDGE|PUBLIC]:** Bridges in `public` are mutable with workflow metadata.  
- **R28 [BRIDGE|REPORTING]:** Bridges in `reporting` are rebuildable and read-only.  
- **R29 [AUDIT]:** Significant actions logged to `_logs` with actor + timestamp.  
- **R30 [CODE|FRONTEND]:** Directories use kebab-case only (e.g., `user-management`, not `userManagement`).  
- **R31 [CODE|FRONTEND]:** React components use PascalCase.tsx (e.g., `UserProfile.tsx`).  
- **R32 [CODE|FRONTEND]:** Hooks use `use-` prefix with camelCase.ts (e.g., `use-auth.ts`).  
- **R33 [CODE|FRONTEND]:** No duplicate file functionality across different paths.  
- **R34 [CODE|FRONTEND]:** Components over 200 lines require decomposition justification.  
- **R35 [CODE|FRONTEND]:** Business logic must be in hooks or services, not directly in components.  
- **R36 [CODE|FRONTEND]:** Feature modules must be self-contained under `features/<feature-name>/`.  
- **R37 [CODE|FRONTEND]:** No `Enhanced` or `Improved` prefixes without clear differentiation need.  
- **R38 [CODE|FRONTEND]:** Index files only at package boundaries, not for re-exports.  
- **R39 [CODE|FRONTEND]:** Import paths must use absolute imports with `@/` prefix.  
- **R40 [CODE|FRONTEND]:** No circular dependencies between features.  
- **R41 [CODE|FRONTEND]:** Shared utilities must be domain-agnostic.  
- **R42 [CODE|FRONTEND]:** Pages must be thin wrappers that delegate to feature components.  
- **R43 [CODE|FRONTEND]:** All TypeScript files must have explicit return types for exported functions.  
- **R44 [CODE|FRONTEND]:** Test files must be colocated as `*.test.ts` or `*.test.tsx`.  
- **R45 [CODE|ARCHITECTURE]:** Codebase is feature-based: each feature resides in `src/features/<feature-name>/` and exposes a barrel `index.ts`.  
- **R46 [CODE|ARCHITECTURE]:** Each feature follows this internal structure: `components/`, `hooks/`, `services/`, `utils/`, `types/`.  
- **R47 [CODE|ARCHITECTURE]:** Shared UI components live under `src/components/ui/`; integrations under `src/integrations/`; global hooks under `src/hooks/`; pages are thin wrappers in `src/pages/`.  
- **R48 [CODE|ARCHITECTURE]:** No deep cross-feature imports — consume only via a feature’s `index.ts`.  
- **R49 [CODE|ARCHITECTURE]:** Features map 1:1 to PRD domains (e.g., `auth`, `user-management`, `report-structures`, `imports`, `coa-translation`, `coa-mapping`, `report-viewer`, `data-security`, `audit-trails`, `system-administration`).  
- **R50 [CODE|ARCHITECTURE]:** Business logic must live in `services/` or `hooks/`, never directly in React components.  
- **R51 [CODE|ARCHITECTURE]:** Pages under `src/pages/` only compose feature components and routing — no business logic.  
- **R52 [CODE|QUALITY]:** Tests are colocated with the unit under test as `*.test.ts(x)` within the same feature.  
- **R53 [CODE|DEPENDENCIES]:** Use absolute imports with `@/` alias; avoid relative paths that escape feature roots.  
- **R54 [CODE|DEPENDENCIES]:** No circular dependencies across features; shared, domain-agnostic utilities belong in `src/shared/` or `src/components/ui/`.  
- **R55 [CODE|BOUNDARIES]:** A feature must not reach into another feature’s private folders; interact only through exported types/functions from its barrel.  
- **R56 [CODE|STATE]:** Cross-feature state is prohibited; lift state into a shared hook or service only if it is domain-agnostic.  
