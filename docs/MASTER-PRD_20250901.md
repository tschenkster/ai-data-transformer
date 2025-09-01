Token Count: 1835

# Master Product Requirements Document (Master PRD)

## Table of Contents
- 0. Document Meta Information
- 1. Overview & Strategy Context
- 2. Users, Segments, JTBD
- 3. Functional Requirements
  - Cross-Cutting Requirement: Multi-Entity & Entity-Group Management
  - Cross-Cutting Requirement: Multilingual Support
  - Feature Domains
- 4. Data Requirements
- 5. Integrations & APIs
- 6. Non-Functional Requirements
- 7. Architecture & System Design
- 8. UX, Content, and Policy
- 9. Dependencies & Assumptions
- 10. Release Plan & Milestones
- 11. Other

## 0. Document Meta Information
- **Product Name**: Finance Data Transformer
- **Document Owner**: Thomas Schenkelberg
- **Date**: September 1, 2025
- **Status**: Draft
- **Version**: 1.6

---

## 1. Overview & Strategy Context

### Product Benefits Overview

**Headline**  
Turn messy DATEV exports into clean data & reports.

**The Startup CFO’s Challenge**  
You need board-ready insights quickly, but here’s the reality:
- **Useless DATEV reports [Compliance ≠ Insights]** – DATEV exports are designed for compliance, not management. They provide PDFs that reveal little about performance or financial trends.
- **No real finance tech stack yet [In Transition]** – You’ve outgrown simple bookkeeping, but a full ERP/BI/FP&A stack is not in place. Excel is the stopgap, and it’s fragile.
- **Manual Excel grind [Error-Prone & Fragile]** – Each month requires hours of cleanup, categorization, and restructuring just to build a basic P&L. Errors and endless copy-paste waste valuable time.

**The Solution — An AI-Powered Finance Workflow**  
- **Upload** DATEV exports with one click.  
- **AI standardizes** data: automated cleanup and categorization.  
- **Store in database**: reliable, scalable, consistent data storage.  
- **Analyze & share**: dashboards in-browser, exports, or BI integration.

**Benefits**  
- **Insights in minutes** – From raw exports to clean insights instantly.  
- **Database backbone** – Reliable system, not fragile spreadsheets.  
- **Standardized reporting** – Templates for P&L, balance sheet, cash flow; or custom structures.  
- **Effortless updates** – Map accounts once; monthly updates are automated.  
- **BI-ready integration** – Connect to Power BI, Tableau, or other tools.  
- **Time for strategy** – Close faster, shift hours from cleanup to analysis.

**Before → After Snapshot**  
- **Before**: DATEV dumps → manual Excel cleanup → fragile Excel models → limited visibility.  
- **After**: Clean, structured data in a database → fast & reliable analysis / reporting → CFO focus on strategy and growth.

### Product Vision
Startup CFOs (10–100 employees) are forced to work with low-value DATEV reports and fragile Excel sheets that constantly break. They urgently need accurate, board-ready insights but often lack an internal finance tech stack.

### Non-Goals
- Full ERP replacement.
- Real-time accounting software.
- Advanced forecasting or modeling.
- Multi-company consolidation beyond entity/entity-group scope.
- Direct DATEV API integration (currently file-based).

---

## 2. Users, Segments, JTBD

### Primary Personas

**Startup CFO (Primary User)**  
- **Company Size**: 10–100 employees.  
- **Needs**: Board-ready financial data.  
- **Pain**: Reliance on compliance-focused DATEV exports and fragile Excel sheets that break with the slightest change—while lacking a finance tech stack.  
- **JTBD**: Turn compliance-driven accounting data into actionable insights quickly and reliably.

**Finance Manager (Secondary User)**  
- **Role**: Data preparation and reporting.  
- **Needs**: Efficient, repeatable workflows.  
- **JTBD**: Deliver accurate monthly reporting without manual Excel intervention.

**Super Admin (Admin User)**  
- **Role**: Manage access and configuration.  
- **JTBD**: Ensure secure access and compliance.

### Key User Stories

**Data Import & Transformation**  
- As a Startup CFO, I want to upload accounting export files (like DATEV) and receive financial reports (P&L / Balance Sheet / Cashflow) in minutes.  
- As a Startup CFO, I want to translate German account names for international reporting.  
- As a Viewer, I want to export transformed data in multiple formats.

**User & Entity Management**  
- As a Super Admin, I want to approve user registrations securely.  
- As a Super Admin, I want to manage entities, roles, and configurations.  

---

## 3. Functional Requirements

### Cross-Cutting Requirement: Multi-Entity & Entity-Group Management
**Purpose:** Provide multi-entity and entity-group support with a consistent ID strategy, naming conventions, and enhanced access control. Ensures data is separated per legal entity, users only see their entitled scopes, and administrators can manage access granularly.

**Scope includes:**
- **ID Strategy:** Every table includes UUID (primary) and integer ID (secondary); UUIDs always first column; enforce uniqueness.
- **Constraint & Enum Naming:** Prefixes for constraints (`pk_*`, `fk_*`, `uq_*`, `idx_*`); enums in lowercase snake_case.
- **Entity & Group Structure:** Entities modeled with `entity_uuid`/`entity_id`, groups with `entity_group_uuid`/`entity_group_id`; entities can belong to groups; RLS enforces assigned access.
- **Roles & Permissions:** Super Admin (global), Entity Admin (scoped), Viewer (read-only).
- **Data Model Adjustments:** Entity/group UUID+ID in all fact/dimension tables; `user_entity_access` linking `user_uuid` to scopes.
- **App Behavior:** Login filters queries by assigned entity/group; entity switcher for multi-entity users; dashboards scoped accordingly.
- **Enhanced User Management:** Extended with Users, Access, and Audit Log subfeatures; effective permissions viewer; bulk actions; audit trail.

**Boundary Note:** This requirement underpins all modules. It extends **User Management** with scoped permissions, and **Authentication & Authorization** enforces global RBAC.

### Cross-Cutting Requirement: Multilingual Support
**Purpose:** Ensure that all user-facing and content-level text is consistently maintained in multiple languages. For MVP, translations cover `report_structures` and `report_line_items`, with original, English, and German guaranteed. Future coverage extends to `chart_of_accounts` and other descriptive fields. The canonical `hierarchy_path` remains language-agnostic; localized display paths are derived via translations.

**Scope includes:**
- **Goals:** Provide scalable multilingual data model, ensure EN/DE/original availability, support CRUD flows, enforce RLS/audit, minimize schema churn.
- **Translation Handling:** Manage translations for report structures and line items; fallback logic; AI translation at upload.
- **Data Model:** Use dedicated translation tables (`ui_translations`, `report_structures_translations`, `report_line_items_translations`) and `system_languages`; enforce strict naming and constraints; indexes for performance.
- **APIs & Retrieval:** APIs accept `?lang=<iso>` or `?lang=orig` flag; fallback order enforced; CRUD support with validation.
- **Functional Requirements:** User UI language preference; translation storage in dedicated tables; AI translation on upload/update; validation (unique constraints); RLS/audit logging.
- **Migration:** Backfill existing data; detect source languages; auto-generate EN/DE if missing.
- **Acceptance Criteria:** All fields have EN/DE/original; UI elements translated; AI fills gaps; manual overrides possible; queries return correct/fallback language; performance target achieved; RLS enforced.
- **Non-Functional Requirements:** Translation queries p95 <150ms; extensible to more languages; reliable fallback; full audit logging.

**Risks:**
- AI translation quality (mitigation: manual override + audit).
- Missing EN (mitigation: auto-generate + flag).
- Join overhead (mitigation: indexes, caching, materialized views).
- Schema drift (mitigation: strict translation table strategy).

**Future Enhancements:** Additional EU languages, AI confidence scoring, review workflows, full-text search, localized collation/sorting.

**Boundary Note:** This requirement underpins multilingual capabilities across all features (imports, mapping, reporting, exports) and extends the data model without schema churn.

This section defines the product’s high-level feature domains, aligned with a feature-based architecture in Lovable. Each feature domain has a clear purpose, scope, and boundary to guide implementation and ensure consistency with business objectives.

### Authentication & Authorization  
**Feature module path:** `features/auth/`  
**Purpose:** Secure sign-in, role-based access, and permission checks to protect data and routes. Must enforce multi-entity scoping in collaboration with User Management.  
**Scope includes:**  
- Email/password, SSO/OAuth, optional MFA  
- Role & permission model (RBAC) with guardrails for routes, APIs, and UI  
- Session handling, token refresh, secure logout  
- Admin tools to assign roles and audit permission changes  
**Boundary note:** This feature enforces RBAC across APIs, database, and UI. **Entity memberships** are owned by **User Management**, but all access enforcement must respect multi-entity scopes.

### User Management  
**Feature module path:** `features/user-management/`  
**Purpose:** Create, invite, organize, and maintain users and their profiles across entities. Must implement multi-entity scoping to ensure users only access their entitled entities/groups.  
**Scope includes:**  
- User lifecycle: invite → activate → suspend → remove  
- Profile management (name, email, locale, time zone)  
- Entity memberships and scopes (entity_uuid/entity_group_uuid)  
- Role assignments (Viewer, Entity Admin, Super Admin)  
- Activity overview for admins  
**Boundary note:** This feature manages entity memberships (scope) and user profiles. **Role enforcement** is handled by **Authentication & Authorization**, but scoping is enforced here via multi-entity requirements.

### Report Structure Management  
**Feature module path:** `features/report-structures/`  
**Purpose:** Manage reusable financial report hierarchies (e.g., P&L, Balance Sheet) with version control.  
**Scope includes:**  
- Create and edit hierarchical report definitions  
- Standardized naming via mapped_hierarchy_path  
- Versioning & change-log for auditability  
- Localization (DE/EN labels)

### Report Structure Import & Transformation  
**Feature module path:** `features/imports/report-structure-import/`  
**Purpose:** Import and validate hierarchical report structures (e.g., P&L/Bilanz trees) and publish versioned definitions.  
**Scope includes:**  
- Parse hierarchical files; enforce keys, parent-child integrity, and mapped_hierarchy_path  
- Detect duplicates/missing parents; preview impact before publish  
- Versioning, rollback, and change-log integration  
- Localization fields (DE/EN) and optional comment metadata

### Trial Balance Import & Transformation  
**Feature module path:** `features/imports/trial-balance-import/`  
**Purpose:** Import monthly/annual trial balances and normalize them to the platform schema for reporting.  
**Scope includes:**  
- DATEV TB parsing; account & period validation; currency and sign normalization  
- Entity/fiscal calendar alignment; opening balance handling  
- Mapping hooks to CoA Mapping; variance and completeness checks  
- Publish to fact tables with audit trail and reprocessing options

### Journal Entry Import & Transformation  
**Feature module path:** `features/imports/journal-entry-import/`  
**Purpose:** Import detailed journal entries (Buchungssätze) for drill-downs and reconciliation.  
**Scope includes:**  
- Parse large files with batching; validate header/line consistency  
- Standardize columns (document number, posting date, account, amount, text)  
- Linkage to TB periods, entities, and mapping context  
- Persist to journal fact tables with queryable error buckets

### Import Pipeline (Shared Infrastructure)  
**Feature module path:** `features/imports/shared-pipeline/`  
**Purpose:** Provide a reusable upload → validate → transform → persist pipeline for all import types with consistent UX, logging, and retries.  
**Scope includes:**  
- Unified UI components for drag-and-drop uploads and progress tracking  
- Schema detection, file validation (CSV/XLSX), and error surfacing  
- Staging tables, transformation runners, publish/rollback controls  
- Re-run failed steps, resumable jobs, and centralized import logs

### CoA Translation  
**Feature module path:** `features/coa-translation/`  
**Purpose:** Translate chart-of-accounts (CoA) names and descriptions between languages to support international reporting.  
**Scope includes:**  
- Drag-and-drop upload of account lists; language auto-detection  
- AI-powered translation with batching and progress tracking  
- Glossary/terminology controls and per-client overrides  
- Export translated CoA to CSV/XLSX; persist sessions with error handling

### CoA Mapping  
**Feature module path:** `features/coa-mapping/`  
**Purpose:** Map client-specific CoA accounts to standardized report structures using rules and AI with review workflows.  
**Scope includes:**  
- Rule-based + AI-assisted suggestions with confidence scoring  
- Embeddings/search over historical mappings; training set management  
- Review UI (accept/override), bulk actions, and full audit trail  
- Export approved mappings to CSV/XLSX; publish to mapping tables

### Report Viewer  
**Feature module path:** `features/report-viewer/`  
**Purpose:** Provide an interactive interface for exploring imported trial balances and journal entries.  
**Scope includes:**  
- Visual interface for monthly and annual trial balance views  
- Drill-down into journal entries and mapping results  
- Export reports into multiple formats (CSV, XLSX, PDF)  
- Filters for entity, period, and hierarchy path  
- User-friendly navigation integrated with Report Structures

### Data Security  
**Feature module path:** `features/data-security/`  
**Purpose:** Ensure robust protection of financial data across storage, processing, and access layers.  
**Scope includes:**  
- Row-Level Security and least-privilege defaults  
- PII handling and GDPR-compliant data management  
- Encryption at rest and in transit  
- Security configuration dashboards

### Audit Trails  
**Feature module path:** `features/audit-trails/`  
**Purpose:** Maintain immutable logs of system actions for compliance, accountability, and troubleshooting.  
**Scope includes:**  
- Immutable audit logs for key actions and configuration changes  
- Historical audit views with search and filtering  
- Integration with compliance and monitoring frameworks (e.g., SOC 2, GDPR)  
- Admin dashboards to review and export audit data  
**Boundary note:** Integrates with **Data Security** but remains a **separate feature** focused on compliance reporting and forensic visibility.

### System Administration  
**Feature module path:** `features/system-administration/`  
**Purpose:** Operate and configure the platform: entities, settings, maintenance, and observability.  
**Scope includes:**  
- Entity & environment configuration  
- Global settings (locales, fiscal calendars, currency)  
- Backups, health checks, and monitoring  
- Feature flags and runtime configuration  
- **Database Structure Documentation Generator** – Generate and download up-to-date database structure documentation as textual Markdown.  

### Historic Translation Fixer  
**Feature module path:** `features/system-administration/system-tools/`  
**Purpose:** Ensure completeness, traceability, and auditability of multilingual translation data by fixing historic NULL values and enforcing schema rules.  
**Scope includes:**  
- Data Migration: Backfill NULL values in translation tables.  
- Schema Hardening: Add NOT NULL constraints and validation triggers.  
- Business Logic Updates: Update RPC and edge functions to always require source tracking.  
- Application Updates: UI and services display and enforce source data.  
- Monitoring: Daily automated quality checks and alerts.  
- System Tools Integration: Admin-facing dashboard for manual validation runs.  
**Non-Goals:** Extending translation support beyond existing tables; introducing new languages; changing AI provider.  
**Data Requirements:** Applies to all translation tables (`ui_translations`, `report_structures_translations`, `report_line_items_translations` and future ones). Enforces non-NULL `language_code_original` and `original_text`, guarantees EN/DE/original for each record.  
**Non-Functional Requirements:** Migration <30s per table; retrieval <500ms; RLS enforced; audit logs updated; reliable fallback.  
**Risks:** Migration failures (mitigation: rollback scripts); performance degradation (mitigation: indexing, benchmarking); breaking changes (mitigation: backward compatibility); admin misuse (mitigation: restrict to Super Admins).  
**Success Criteria:** Zero NULL values in source fields, enforced schema constraints, validated translation operations, SLA performance maintained, ~25% AI translation quality improvement, accessible under System Tools.

---

## 4. Data Requirements

This section summarizes the high-level data requirements that underpin the platform. Detailed specifications for individual data entities and tables are documented in the respective Feature PRDs.

**Purpose**  
Ensure financial data is stored in a reliable, scalable, and auditable database, enabling consistent reporting and integration with BI tools. Must incorporate multi-entity scoping and ID strategy across all tables.
