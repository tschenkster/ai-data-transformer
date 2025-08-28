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

    // Query comprehensive database schema information using new RPC functions
    const schemaQueries = await Promise.all([
      supabase.rpc('get_table_info', {}),
      supabase.rpc('get_column_info', {}),
      supabase.rpc('get_enum_values', {}),
      supabase.rpc('get_foreign_keys', {}),
      supabase.rpc('get_rls_policies', {}),
      supabase.rpc('get_database_functions', {}),
      supabase.rpc('get_indexes', {})
    ]);

    // Extract data from query results
    const tablesData = schemaQueries[0].data || [];
    const columnsData = schemaQueries[1].data || [];
    const enumsData = schemaQueries[2].data || [];
    const foreignKeysData = schemaQueries[3].data || [];
    const rlsPoliciesData = schemaQueries[4].data || [];
    const dbFunctionsData = schemaQueries[5].data || [];
    const indexesData = schemaQueries[6].data || [];

    // Check if we got any data
    if (tablesData.length === 0) {
      console.warn('No tables found in public schema - this might indicate an issue with schema access');
    }

    console.log(`Found ${tablesData.length} tables, ${columnsData.length} columns`);

    // Generate documentation content
    const documentation = generateDocumentationContent({
      tables: tablesData,
      columns: columnsData,
      enums: enumsData,
      foreignKeys: foreignKeysData,
      rlsPolicies: rlsPoliciesData,
      dbFunctions: dbFunctionsData,
      indexes: indexesData,
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
  tables: any[];
  columns: any[];
  enums: any[];
  foreignKeys: any[];
  rlsPolicies: any[];
  dbFunctions: any[];
  indexes: any[];
  filename: string;
  version: string;
  generatedBy: string;
  generatedAt: string;
}): string {
  const { tables, columns, enums, foreignKeys, rlsPolicies, dbFunctions, indexes, filename, version, generatedBy, generatedAt } = data;
  
  // Group data by table for easier processing
  const tableColumns: { [key: string]: any[] } = {};
  const tableForeignKeys: { [key: string]: any[] } = {};
  const tablePolicies: { [key: string]: any[] } = {};
  const tableIndexes: { [key: string]: any[] } = {};
  
  columns.forEach(col => {
    if (!tableColumns[col.table_name]) tableColumns[col.table_name] = [];
    tableColumns[col.table_name].push(col);
  });
  
  foreignKeys.forEach(fk => {
    if (!tableForeignKeys[fk.table_name]) tableForeignKeys[fk.table_name] = [];
    tableForeignKeys[fk.table_name].push(fk);
  });
  
  rlsPolicies.forEach(policy => {
    if (!tablePolicies[policy.tablename]) tablePolicies[policy.tablename] = [];
    tablePolicies[policy.tablename].push(policy);
  });
  
  indexes.forEach(idx => {
    if (!tableIndexes[idx.table_name]) tableIndexes[idx.table_name] = [];
    tableIndexes[idx.table_name].push(idx);
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
- **Total Foreign Keys**: ${foreignKeys.length}
- **Total RLS Policies**: ${rlsPolicies.length}
- **Total Database Functions**: ${dbFunctions.length}
- **Total Indexes**: ${indexes.length}
- **Schema**: public

---

## Table Structures

${tables.map(table => {
  const cols = tableColumns[table.table_name] || [];
  const fks = tableForeignKeys[table.table_name] || [];
  const policies = tablePolicies[table.table_name] || [];
  const idxs = tableIndexes[table.table_name] || [];
  
  return `### ${table.table_name}

**Type**: ${table.table_type}  
**Schema**: ${table.table_schema}  
**Columns**: ${cols.length}  
**Foreign Keys**: ${fks.length}  
**RLS Policies**: ${policies.length}  
**Indexes**: ${idxs.length}

#### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
${cols.map(col => {
  // Simplify data types for readability
  let simpleType = col.data_type;
  if (col.character_maximum_length) {
    simpleType = `${col.data_type}(${col.character_maximum_length})`;
  }
  
  // Simplify default values
  let simpleDefault = col.column_default || 'None';
  if (simpleDefault.includes('gen_random_uuid')) simpleDefault = 'UUID';
  if (simpleDefault.includes('now()')) simpleDefault = 'Current Time';
  if (simpleDefault.length > 20) simpleDefault = simpleDefault.substring(0, 17) + '...';
  
  return `| **${col.column_name}** | ${simpleType} | ${col.is_nullable === 'YES' ? '✓' : '✗'} | ${simpleDefault} |`;
}).join('\n')}

${cols.filter(col => col.column_name.includes('_uuid') && col.column_name !== 'supabase_user_uuid').length > 0 ? `
**Primary Keys**: ${cols.filter(col => col.column_name.includes('_uuid') && col.column_name !== 'supabase_user_uuid').map(col => col.column_name).join(', ')}
` : ''}

${cols.filter(col => col.column_name.includes('created_at') || col.column_name.includes('updated_at')).length > 0 ? `
**Timestamps**: ${cols.filter(col => col.column_name.includes('created_at') || col.column_name.includes('updated_at')).map(col => col.column_name).join(', ')}
` : ''}

${fks.length > 0 ? `#### Foreign Key Relationships

| Column | References | Constraint Name |
|--------|------------|-----------------|
${fks.map(fk => 
  `| ${fk.column_name} | ${fk.foreign_table_schema}.${fk.foreign_table_name}.${fk.foreign_column_name} | ${fk.constraint_name} |`
).join('\n')}
` : ''}

${policies.length > 0 ? `#### Row Level Security Policies

${policies.map(policy => `**${policy.policyname}**  
- **Command**: ${policy.cmd}  
- **Permissive**: ${policy.permissive}  
- **Roles**: ${policy.roles.join(', ')}  
- **Using Expression**: ${policy.qual || 'N/A'}  
- **With Check Expression**: ${policy.with_check || 'N/A'}  
`).join('\n')}
` : ''}

${idxs.length > 0 ? `#### Indexes

| Index Name | Columns | Unique | Primary | Type |
|------------|---------|--------|---------|------|
${idxs.map(idx => 
  `| ${idx.index_name} | ${idx.column_names.join(', ')} | ${idx.is_unique ? 'Yes' : 'No'} | ${idx.is_primary ? 'Yes' : 'No'} | ${idx.index_type} |`
).join('\n')}
` : ''}

---
`;
}).join('\n')}

## Enums and Custom Types

${enums.length > 0 ? enums.map((enumInfo: any) => `### ${enumInfo.enum_name}

**Values**: ${enumInfo.enum_values ? enumInfo.enum_values.join(', ') : 'N/A'}

`).join('\n') : 'No custom enums found.'}

---

## Foreign Key Relationships Graph (Text-Based)

This section provides a text-based mapping of all foreign key relationships in the database:

${foreignKeys.length > 0 ? foreignKeys.map(fk => 
  `- **${fk.table_name}.${fk.column_name}** → **${fk.foreign_table_name}.${fk.foreign_column_name}**`
).join('\n') : 'No foreign key relationships found.'}

---

## Database Functions

The database includes ${dbFunctions.length} custom functions for business logic, security, and data validation:

${dbFunctions.length > 0 ? dbFunctions.map(func => `### ${func.function_name}

**Schema**: ${func.function_schema}  
**Return Type**: ${func.return_type}  
**Arguments**: ${func.argument_types || 'None'}  
**Type**: ${func.function_type}

`).join('\n') : 'No custom functions found.'}

---

## Security Policies Summary

This database implements Row Level Security (RLS) across ${tables.filter(t => tablePolicies[t.table_name]?.length > 0).length} tables to ensure data isolation and proper access control.

### Tables with RLS Enabled

${tables.map(table => {
  const policies = tablePolicies[table.table_name] || [];
  return policies.length > 0 ? `- **${table.table_name}**: ${policies.length} policies` : null;
}).filter(Boolean).join('\n') || 'No RLS policies found.'}

### Key Security Features
- **Row Level Security**: Enabled on ${tables.filter(t => tablePolicies[t.table_name]?.length > 0).length} tables
- **Role-based Access Control**: Different access levels (viewer, entity_admin, super_admin)
- **Audit Logging**: All sensitive operations are logged to security_audit_logs
- **Rate Limiting**: Protection against excessive API calls

---

## Indexes and Performance

The database includes ${indexes.length} indexes for performance optimization:

### Index Summary by Type
${indexes.reduce((acc, idx) => {
  acc[idx.index_type] = (acc[idx.index_type] || 0) + 1;
  return acc;
}, {} as {[key: string]: number})}

${Object.entries(indexes.reduce((acc, idx) => {
  acc[idx.index_type] = (acc[idx.index_type] || 0) + 1;
  return acc;
}, {} as {[key: string]: number})).map(([type, count]) => `- **${type}**: ${count} indexes`).join('\n')}

---

## Conventions Used

This database follows these naming and structural conventions:

- **snake_case**: All table and column names use snake_case
- **Timestamps**: All tables include created_at and updated_at fields where applicable
- **UUIDs**: Primary keys use UUID format with gen_random_uuid() default
- **Soft Delete**: Some tables support soft delete with is_active flags
- **Audit Trail**: Important operations are logged with user attribution
- **Foreign Keys**: Proper referential integrity with named constraints
- **RLS Policies**: Comprehensive row-level security implementation

---

## Changelog

- **${new Date(generatedAt).toLocaleDateString()}**: ${version} - Initial database structure documentation generated by ${generatedBy}
  - Generated comprehensive schema documentation
  - Included ${tables.length} tables, ${columns.length} columns
  - Documented ${foreignKeys.length} foreign key relationships
  - Cataloged ${rlsPolicies.length} RLS policies
  - Listed ${dbFunctions.length} database functions
  - Indexed ${indexes.length} performance indexes

---

*This documentation was automatically generated from the live database schema. For the most current information, regenerate this documentation from the System Administration panel.*
`;

  return doc;
}