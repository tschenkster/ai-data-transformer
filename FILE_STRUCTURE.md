# Project File Structure

## Overview

This project follows a **feature-based architecture** with clear separation of concerns. Each feature is self-contained with its own components, services, hooks, and types.

## Directory Structure

```
├── src/
│   ├── features/                    # Feature modules (business logic)
│   │   ├── auth/                   # Authentication & Security
│   │   │   ├── components/         # Auth-related components
│   │   │   │   ├── AuthRoute.tsx
│   │   │   │   ├── ForgotPasswordForm.tsx
│   │   │   │   ├── PasswordStrengthIndicator.tsx
│   │   │   │   ├── ResetPasswordForm.tsx
│   │   │   │   └── SecurityAuditDashboard.tsx
│   │   │   ├── services/           # Auth business logic
│   │   │   │   └── securityService.ts
│   │   │   ├── utils/             # Auth utilities
│   │   │   │   └── passwordValidation.ts
│   │   │   └── index.ts           # Feature exports
│   │   │
│   │   ├── user-management/        # User Administration
│   │   │   ├── components/
│   │   │   │   ├── UserAccessManagementPanel.tsx
│   │   │   │   ├── UserManagementPanel.tsx
│   │   │   │   ├── UserManagementTable.tsx
│   │   │   │   ├── UserProfileDisplay.tsx
│   │   │   │   └── UserStatsCards.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useUserActions.ts
│   │   │   │   └── useUserManagement.ts
│   │   │   ├── services/
│   │   │   │   ├── invitationService.ts
│   │   │   │   ├── roleService.ts
│   │   │   │   └── userService.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── report-structures/      # Report Building & Management
│   │   │   ├── components/
│   │   │   │   ├── ChangeHistoryTable.tsx
│   │   │   │   ├── CreateLineItemDialog.tsx
│   │   │   │   ├── DeleteLineItemDialog.tsx
│   │   │   │   ├── ReportStructureCard.tsx
│   │   │   │   ├── ReportStructureManager.tsx
│   │   │   │   ├── ReportStructureModifier.tsx
│   │   │   │   └── ReportStructureViewer.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useReportStructures.ts
│   │   │   ├── services/
│   │   │   │   ├── lineItemService.ts
│   │   │   │   └── reportStructureService.ts
│   │   │   ├── utils/
│   │   │   │   ├── lineItemUtils.ts
│   │   │   │   └── sortOrderUtils.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── coa-translation/        # Chart of Accounts Translation
│   │   │   ├── components/
│   │   │   │   └── CoATranslator.tsx
│   │   │   ├── constants/
│   │   │   │   └── languages.ts
│   │   │   ├── hooks/
│   │   │   │   └── useCoATranslation.ts
│   │   │   ├── services/
│   │   │   │   └── translationService.ts
│   │   │   ├── utils/
│   │   │   │   └── languageDetection.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── coa-mapping/            # Chart of Accounts Mapping
│   │   │   ├── components/
│   │   │   │   └── CoAMapper.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── data-security/          # Security & Access Control
│   │   │   ├── components/
│   │   │   │   ├── AccessManagement.tsx
│   │   │   │   └── SecurityAuditLog.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── imports/                # Data Import Pipeline
│   │   │   ├── shared-pipeline/    # Reusable import infrastructure
│   │   │   │   ├── components/
│   │   │   │   │   ├── AdvancedFileUpload.tsx
│   │   │   │   │   └── FileUpload.tsx
│   │   │   │   └── index.ts
│   │   │   ├── journal-entry-import/
│   │   │   │   └── index.ts
│   │   │   ├── trial-balance-import/
│   │   │   │   └── index.ts
│   │   │   └── report-structure-import/
│   │   │       ├── components/
│   │   │       │   └── ReportStructureImport.tsx
│   │   │       └── index.ts
│   │   │
│   │   ├── report-viewer/          # Report Visualization
│   │   │   ├── components/
│   │   │   │   └── ReportViewer.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── system-administration/  # System Admin Functions
│   │   │   ├── components/
│   │   │   │   ├── EntityManagement.tsx
│   │   │   │   └── EntitySelector.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── entity-management/      # Multi-entity Management
│   │   │   └── index.ts
│   │   │
│   │   ├── file-management/        # File Handling
│   │   │   └── index.ts
│   │   │
│   │   ├── workflow/               # Workflow Management
│   │   │   └── index.ts
│   │   │
│   │   ├── audit-trails/           # Audit & Change Tracking
│   │   │   └── index.ts
│   │   │
│   │   └── security-audit/         # Security Monitoring
│   │       └── index.ts
│   │
│   ├── components/                 # Shared UI Components
│   │   ├── ui/                    # Design system components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   └── ... (30+ UI components)
│   │   ├── AppSidebar.tsx         # Main navigation sidebar
│   │   ├── ErrorBoundary.tsx      # Error handling wrapper
│   │   ├── Footer.tsx             # Application footer
│   │   ├── LanguageSelector.tsx   # Language selection component
│   │   ├── TransformationVisualization.tsx
│   │   └── WorkflowStatusManager.tsx
│   │
│   ├── pages/                     # Route components
│   │   ├── Admin.tsx              # Admin dashboard
│   │   ├── Auth.tsx               # Authentication page
│   │   ├── Dashboard.tsx          # Main dashboard
│   │   ├── CoAMapper.tsx          # CoA mapping interface
│   │   ├── CoATranslator.tsx      # Translation interface
│   │   ├── FinancialReports.tsx   # Reports page
│   │   ├── Home.tsx               # Landing page
│   │   ├── ReportStructures.tsx   # Report management
│   │   └── ... (additional pages)
│   │
│   ├── hooks/                     # Global hooks
│   │   ├── use-auth.tsx           # Authentication state
│   │   ├── use-mobile.tsx         # Mobile detection
│   │   ├── use-sidebar-state.tsx  # Sidebar state management
│   │   └── use-toast.ts           # Toast notifications
│   │
│   ├── shared/                    # Shared utilities
│   │   ├── utils/
│   │   │   ├── debugUtils.ts      # Debug utilities
│   │   │   ├── errorHandling.ts   # Error handling
│   │   │   └── validation.ts      # Validation utilities
│   │   └── index.ts
│   │
│   ├── integrations/              # External service integrations
│   │   └── supabase/
│   │       ├── client.ts          # Supabase client configuration
│   │       └── types.ts           # Generated database types
│   │
│   ├── lib/                       # Library utilities
│   │   └── utils.ts               # Common utilities (cn, slugify)
│   │
│   ├── app/                       # App routing
│   │   └── routes/
│   │       └── app-routes.tsx     # Route definitions
│   │
│   ├── index.css                  # Global styles & design tokens
│   ├── main.tsx                   # App entry point
│   └── App.tsx                    # Root component
│
├── supabase/                      # Backend infrastructure
│   ├── functions/                 # Edge Functions
│   │   ├── delete-user/
│   │   ├── detect-language/
│   │   ├── process-report-structure/
│   │   └── translate-accounts/
│   ├── migrations/                # Database migrations
│   └── config.toml                # Supabase configuration
│
├── public/                        # Static assets
│   ├── robots.txt
│   └── ... (images, icons)
│
├── scripts/                       # Build & development scripts
│   ├── check-circular-deps.js
│   └── check-component-sizes.js
│
└── Configuration Files
    ├── tailwind.config.ts         # Tailwind CSS configuration
    ├── vite.config.ts             # Vite build configuration
    ├── package.json               # Dependencies & scripts
    ├── tsconfig.json              # TypeScript configuration
    └── eslint.config.js           # ESLint rules
```

## Architecture Principles

### 1. Feature-Based Organization
- Each feature is self-contained in `src/features/[feature-name]/`
- Features export their public API through `index.ts`
- Internal structure follows consistent patterns:
  - `components/` - React components
  - `hooks/` - Custom hooks
  - `services/` - Business logic & API calls
  - `utils/` - Utility functions
  - `types/` - TypeScript interfaces

### 2. Design System
- UI components library in `src/components/ui/`
- Based on shadcn/ui with customizations
- Design tokens defined in `index.css`
- Semantic color system using CSS variables

### 3. Backend Integration
- Supabase for database, authentication, and storage
- Row-Level Security (RLS) policies for data protection
- Edge Functions for serverless compute
- Type-safe database access with generated types

### 4. Security Architecture
- Multi-layered security with rate limiting
- Password strength validation
- Session management and audit logging
- Role-based access control (RBAC)

## Key Features

### Authentication & Security (`src/features/auth/`)
- JWT-based authentication with Supabase Auth
- Enhanced password validation with strength indicators
- Rate limiting and brute force protection
- Security audit dashboard and event logging
- Password reset functionality

### User Management (`src/features/user-management/`)
- User administration and role management
- Multi-entity access control
- User invitation system
- Profile management and statistics

### Report Structures (`src/features/report-structures/`)
- Hierarchical report building (P&L, Balance Sheet)
- Line item management with drag-and-drop
- Version control and change tracking
- Report structure modification tools

### Chart of Accounts (`src/features/coa-translation/`, `src/features/coa-mapping/`)
- AI-powered account translation (18+ languages)
- Account mapping and standardization
- Language detection and batch processing

### Data Import Pipeline (`src/features/imports/`)
- Reusable file upload infrastructure
- Trial balance import with validation
- Journal entry import processing
- Report structure import capabilities

## Development Guidelines

### File Naming Conventions
- Components: PascalCase (e.g., `UserManagementPanel.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useUserManagement.ts`)
- Services: camelCase (e.g., `userService.ts`)
- Utils: camelCase (e.g., `lineItemUtils.ts`)

### Import/Export Patterns
- Features export through barrel files (`index.ts`)
- Use relative imports within features
- Import from feature barrels externally
- Avoid deep imports across feature boundaries

### Component Architecture
- Functional components with TypeScript
- Custom hooks for state management
- Service layer for API interactions
- Error boundaries for fault tolerance

### Database Conventions
- Snake_case for database fields
- UUIDs for primary keys where applicable
- Integer IDs for sequential data
- Timestamps with `_at` suffix (e.g., `created_at`)

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Query, Context API
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Build Tools**: Vite, ESLint, TypeScript compiler

## Security Features

- Row-Level Security (RLS) on all database tables
- Rate limiting on authentication endpoints
- Password strength validation and security tips
- Session monitoring and audit logging
- Role-based access control with entity separation
- Secure file upload with validation

This structure ensures scalability, maintainability, and clear separation of concerns while following modern React and TypeScript best practices.