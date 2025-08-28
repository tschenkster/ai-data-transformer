# API Documentation

This folder contains API documentation for the system.

## Edge Functions

### Database Documentation Generator
- **Endpoint**: `/functions/v1/generate-db-documentation`
- **Method**: POST
- **Auth**: Required (Super Admin only)
- **Description**: Generates comprehensive database structure documentation

#### Request
```json
{
  "action": "generate"
}
```

#### Response
```json
{
  "success": true,
  "filename": "DATABASE-STRUCTURE_20250828_v07.md",
  "version": 7,
  "download_url": "https://[project-id].supabase.co/storage/v1/object/public/database-docs/[filename]",
  "signed_download_url": "https://[project-id].supabase.co/storage/v1/object/sign/database-docs/[filename]"
}
```

#### Progress Updates
The function provides real-time progress updates during generation:
- 5% - Initialization and authentication
- 10% - Version determination  
- 20-45% - Schema analysis (tables, columns, relationships, policies, functions)
- 55% - Documentation generation
- 75% - File preparation
- 85% - Upload to storage
- 95% - Audit logging
- 98% - Cleanup
- 100% - Completion

### Language Detection
- **Endpoint**: `/functions/v1/detect-language`
- **Method**: POST
- **Description**: Detects the language of provided text content

### Account Translation
- **Endpoint**: `/functions/v1/translate-accounts`
- **Method**: POST
- **Description**: Translates chart of accounts between languages

### Report Structure Processing
- **Endpoint**: `/functions/v1/process-report-structure`
- **Method**: POST
- **Description**: Processes and validates report structure imports

## Database Functions

### Security Functions
- `is_super_admin_user()` - Check if user has super admin privileges
- `is_admin_user_v2()` - Check if user has admin privileges
- `log_security_event()` - Log security-related events
- `enhanced_log_security_event()` - Enhanced security event logging with rate limiting

### Schema Information
- `get_table_info()` - Retrieve table metadata
- `get_column_info()` - Retrieve column information
- `get_foreign_keys()` - Get foreign key relationships
- `get_rls_policies()` - Get Row Level Security policies
- `get_database_functions()` - Get database function information
- `get_indexes()` - Get index information
- `get_table_constraints()` - Get table constraints

### Report Structure Management
- `reorder_line_item_with_hierarchy()` - Reorder report line items
- `update_sort_orders_transaction()` - Update sort orders atomically
- `log_structure_change()` - Log changes to report structures

### User Management
- `get_current_user_details()` - Get current user information
- `grant_entity_access()` - Grant entity access to users
- `user_has_entity_access()` - Check user entity access
- `get_user_accessible_entities()` - Get entities accessible to user

## Authentication

All API endpoints require proper Supabase authentication. Include the authorization header:

```
Authorization: Bearer [supabase-jwt-token]
```

## Error Handling

Standard HTTP status codes are used:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error responses include detailed error messages:
```json
{
  "success": false,
  "error": "Error message description"
}
```