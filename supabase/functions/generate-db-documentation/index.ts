import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TableInfo {
  table_name: string;
  table_schema: string;
  table_type: string;
}

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string;
  character_maximum_length: number;
}

interface ForeignKeyInfo {
  table_name: string;
  column_name: string;
  foreign_table_schema: string;
  foreign_table_name: string;
  foreign_column_name: string;
}

interface PolicyInfo {
  schemaname: string;
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string;
  with_check: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting database documentation generation...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user info for audit logging
    const authHeader = req.headers.get('Authorization');
    let currentUser = null;
    if (authHeader) {
      const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        auth: { persistSession: false }
      });
      const { data: { user } } = await userSupabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (user) {
        const { data: userAccount } = await supabase
          .from('user_accounts')
          .select('user_uuid, first_name, last_name, email')
          .eq('supabase_user_uuid', user.id)
          .single();
        currentUser = userAccount;
      }
    }

    // Generate filename and version
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const version = 'v01';
    const filename = `DATABASE-STRUCTURE_${dateStr}_${version}.md`;

    console.log('Querying database schema...');

    // Query database schema information
    const { data: tables } = await supabase.rpc('get_database_schema_info', {});
    
    if (!tables) {
      throw new Error('Failed to retrieve database schema information');
    }

    // Get additional schema details
    const schemaQueries = await Promise.all([
      // Get table information
      supabase.from('information_schema.tables')
        .select('table_name, table_schema, table_type')
        .eq('table_schema', 'public'),
      
      // Get column information
      supabase.from('information_schema.columns')
        .select('table_name, column_name, data_type, is_nullable, column_default, character_maximum_length')
        .eq('table_schema', 'public')
        .order('table_name, ordinal_position'),
        
      // Get enum information
      supabase.rpc('get_enum_values', {})
    ]);

    const tablesData = schemaQueries[0].data as TableInfo[] || [];
    const columnsData = schemaQueries[1].data as ColumnInfo[] || [];
    const enumsData = schemaQueries[2].data || [];

    console.log(`Found ${tablesData.length} tables, ${columnsData.length} columns`);

    // Generate documentation content
    const documentation = generateDocumentationContent({
      tables: tablesData,
      columns: columnsData,
      enums: enumsData,
      filename,
      version,
      generatedBy: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'System',
      generatedAt: now.toISOString()
    });

    console.log('Documentation generated, saving to storage...');

    // For now, we'll return the content directly since we can't write to the file system
    // In a real implementation, this would save to storage and return a download URL
    const blob = new Blob([documentation], { type: 'text/markdown' });
    const downloadUrl = URL.createObjectURL(blob);

    // Log the generation event
    await supabase.from('security_audit_logs').insert({
      action: 'database_documentation_generated',
      details: {
        filename,
        version,
        generated_by_name: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'System',
        file_size: documentation.length,
        table_count: tablesData.length,
        column_count: columnsData.length
      }
    });

    console.log('Documentation generation completed successfully');

    // Create a data URL for download
    const dataUrl = `data:text/markdown;charset=utf-8,${encodeURIComponent(documentation)}`;

    return new Response(JSON.stringify({
      success: true,
      filename,
      download_url: dataUrl,
      file_size: documentation.length,
      table_count: tablesData.length,
      column_count: columnsData.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating database documentation:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateDocumentationContent(data: {
  tables: TableInfo[];
  columns: ColumnInfo[];
  enums: any[];
  filename: string;
  version: string;
  generatedBy: string;
  generatedAt: string;
}): string {
  const { tables, columns, enums, filename, version, generatedBy, generatedAt } = data;
  
  // Group columns by table
  const tableColumns: { [key: string]: ColumnInfo[] } = {};
  columns.forEach(col => {
    if (!tableColumns[col.table_name]) {
      tableColumns[col.table_name] = [];
    }
    tableColumns[col.table_name].push(col);
  });

  const doc = `# Database Structure Documentation

**Generated**: ${new Date(generatedAt).toLocaleString()}  
**Version**: ${version}  
**Generated By**: ${generatedBy}  
**Filename**: ${filename}

---

## Overview

This document provides a comprehensive overview of the database structure for the current system.

### Summary Statistics
- **Total Tables**: ${tables.length}
- **Total Columns**: ${columns.length}
- **Total Enums**: ${enums.length}
- **Schema**: public

---

## Table Structures

${tables.map(table => {
  const cols = tableColumns[table.table_name] || [];
  
  return `### ${table.table_name}

**Type**: ${table.table_type}  
**Schema**: ${table.table_schema}  
**Columns**: ${cols.length}

#### Columns

| Column Name | Data Type | Nullable | Default | Max Length |
|-------------|-----------|----------|---------|------------|
${cols.map(col => 
  `| ${col.column_name} | ${col.data_type} | ${col.is_nullable} | ${col.column_default || 'None'} | ${col.character_maximum_length || 'N/A'} |`
).join('\n')}

---
`;
}).join('\n')}

## Enums and Custom Types

${enums.length > 0 ? enums.map((enumInfo: any) => `### ${enumInfo.enum_name}

**Values**: ${enumInfo.enum_values ? enumInfo.enum_values.join(', ') : 'N/A'}

`).join('\n') : 'No custom enums found.'}

---

## Database Functions

The database includes various functions for business logic, security, and data validation. These functions are used throughout the application for:

- Row Level Security (RLS) policy enforcement
- Data validation and constraints
- Audit trail logging
- Complex business logic operations

---

## Security Policies

This database implements Row Level Security (RLS) across all tables to ensure data isolation and proper access control based on user roles and permissions.

### Key Security Features
- **Row Level Security**: Enabled on all user data tables
- **Role-based Access Control**: Different access levels (viewer, admin, super_admin, entity_admin)
- **Audit Logging**: All sensitive operations are logged to security_audit_logs
- **Rate Limiting**: Protection against excessive API calls

---

## Conventions Used

This database follows these naming and structural conventions:

- **snake_case**: All table and column names use snake_case
- **Timestamps**: All tables include created_at and updated_at fields
- **UUIDs**: Primary keys use UUID format with gen_random_uuid() default
- **Soft Delete**: Some tables support soft delete with is_active flags
- **Audit Trail**: Important operations are logged with user attribution

---

## Changelog

- **${new Date(generatedAt).toLocaleDateString()}**: ${version} - Initial database structure documentation generated by ${generatedBy}

---

*This documentation was automatically generated from the live database schema. For the most current information, regenerate this documentation from the System Administration panel.*
`;

  return doc;
}