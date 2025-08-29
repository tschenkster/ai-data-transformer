# Documentation

This folder contains project documentation files.

## Contents

- **Database**: Latest schema documentation and database structure files
- **Codebase**: Architecture documentation and code analysis reports  
- **API**: Endpoint references and integration guides

## Organization

```
docs/
├── README.md (this file)
├── database/
│   ├── README.md
│   └── DATABASE-STRUCTURE_[date]_v[num].md
├── codebase/
│   ├── README.md  
│   └── CODEBASE-STRUCTURE_[date]_v[num].md
└── api/
    └── README.md (API documentation)
```

## Usage

### Database Documentation
Generated automatically via the Database Documentation tool in System Administration. Contains comprehensive schema information, RLS policies, and usage examples.

### Codebase Documentation  
Generated via the Codebase Documentation tool. Provides detailed analysis of project structure, feature modules, and architectural patterns.

### API Documentation  
Covers all edge functions, database functions, authentication patterns, and integration examples.

## Synchronization

Documentation files are:
1. Generated and stored in Supabase Storage buckets
2. Synchronized to this local `/docs` folder using the System Administration tools
3. Automatically organized with proper naming conventions
4. Kept up-to-date with the latest project changes

Use the "Sync to Project" functionality in the documentation tools to ensure this folder contains the latest generated documentation.