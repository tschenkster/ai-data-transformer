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
          .maybeSingle();
        currentUser = userAccount;
      }
    }

    // Generate filename and version
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    
    // Check for existing documentation generated today to increment version
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    
    const { data: existingDocs } = await supabase
      .from('security_audit_logs')
      .select('details')
      .eq('action', 'database_documentation_generated')
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay)
      .order('created_at', { ascending: false });
    
    // Find the highest version number for today
    let maxVersion = 0;
    if (existingDocs && existingDocs.length > 0) {
      existingDocs.forEach(doc => {
        if (doc.details?.version) {
          const versionMatch = doc.details.version.match(/v(\d+)/);
          if (versionMatch) {
            const versionNum = parseInt(versionMatch[1], 10);
            maxVersion = Math.max(maxVersion, versionNum);
          }
        }
      });
    }
    
    const version = `v${String(maxVersion + 1).padStart(2, '0')}`;
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

    // Background task to upload file to Supabase Storage and log the event
    async function uploadAndLogTask() {
      try {
        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('database-docs')
          .upload(filename, new Blob([documentation], { type: 'text/markdown' }), {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }

        console.log('File uploaded successfully:', uploadData?.path);

        // Log the generation event
        await supabase.from('security_audit_logs').insert({
          action: 'database_documentation_generated',
          details: {
            filename,
            version,
            generated_by_name: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'System',
            file_size: documentation.length,
            table_count: tablesData.length,
            column_count: columnsData.length,
            storage_path: uploadData?.path,
            upload_success: true
          }
        });

        // Clean up old files (keep last 10)
        const cleanupResult = await supabase.rpc('cleanup_old_documentation_files', { p_keep_count: 10 });
        console.log(`Cleaned up ${cleanupResult.data || 0} old documentation files`);

        console.log('Documentation generation and upload completed successfully');
      } catch (error) {
        console.error('Background task error:', error);
        
        // Log the failure
        await supabase.from('security_audit_logs').insert({
          action: 'database_documentation_generation_failed',
          details: {
            filename,
            version,
            generated_by_name: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'System',
            error: error.message,
            upload_success: false
          }
        });
      }
    }

    // Start background task for file upload and logging
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(uploadAndLogTask());
    } else {
      // Fallback for environments without EdgeRuntime
      uploadAndLogTask().catch(console.error);
    }

    // Get download URL for the file (for immediate download capability)
    const { data: { publicUrl } } = supabase.storage
      .from('database-docs')
      .getPublicUrl(filename);

    // Create a data URL for immediate download (backward compatibility)
    const dataUrl = `data:text/markdown;charset=utf-8,${encodeURIComponent(documentation)}`;

    return new Response(JSON.stringify({
      success: true,
      filename,
      download_url: dataUrl, // Immediate download
      storage_url: publicUrl, // Storage URL (may not be immediately available)
      file_size: documentation.length,
      table_count: tablesData.length,
      column_count: columnsData.length,
      version,
      message: 'Documentation generated successfully. File is being uploaded to storage in the background.'
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

// Utility function to calculate column widths
function calculateColumnWidths(data: any[], columnKeys: string[], headers: string[], options: { tableNameColumn?: boolean } = {}): number[] {
  return columnKeys.map((key, index) => {
    const headerLength = headers[index].length;
    const maxDataLength = Math.max(
      ...data.map(row => {
        let value = '';
        if (key === 'column_display') {
          value = `**${row.column_name}**`;
        } else if (key === 'type_display') {
          let simpleType = row.data_type;
          if (row.character_maximum_length) {
            simpleType = `${row.data_type}(${row.character_maximum_length})`;
          }
          value = simpleType;
        } else if (key === 'nullable_display') {
          value = row.is_nullable === 'YES' ? '✓' : '✗';
        } else if (key === 'default_display') {
          let simpleDefault = row.column_default || 'None';
          if (simpleDefault.includes('gen_random_uuid')) simpleDefault = 'UUID';
          if (simpleDefault.includes('now()')) simpleDefault = 'Current Time';
          if (simpleDefault.length > 20) simpleDefault = simpleDefault.substring(0, 17) + '...';
          value = simpleDefault;
        } else if (key === 'fk_column') {
          value = row.column_name;
        } else if (key === 'fk_references') {
          value = `${row.foreign_table_schema}.${row.foreign_table_name}.${row.foreign_column_name}`;
        } else if (key === 'fk_constraint') {
          value = row.constraint_name;
        } else if (key === 'index_name') {
          value = row.index_name;
        } else if (key === 'index_columns') {
          value = row.column_names.join(', ');
        } else if (key === 'index_unique') {
          value = row.is_unique ? 'Yes' : 'No';
        } else if (key === 'index_primary') {
          value = row.is_primary ? 'Yes' : 'No';
        } else if (key === 'index_type') {
          value = row.index_type;
        } else if (key === 'table_name') {
          value = `**${row.table_name}**`;
        } else {
          value = String(row[key] || '');
        }
        return value.length;
      })
    );
    
    // Set minimum and maximum column widths
    const minWidth = 8;
    // Use higher max width for table names to prevent truncation
    const maxWidth = (key === 'table_name' || options.tableNameColumn) ? 80 : 50;
    return Math.min(Math.max(Math.max(headerLength, maxDataLength), minWidth), maxWidth);
  });
}

// Utility function to pad content to fixed width
function padToWidth(content: string, width: number): string {
  if (content.length > width) {
    return content.substring(0, width - 3) + '...';
  }
  return content.padEnd(width, ' ');
}

// Utility function to create fixed-width table row
function createFixedWidthRow(values: string[], widths: number[]): string {
  const paddedValues = values.map((value, index) => padToWidth(value, widths[index]));
  return `| ${paddedValues.join(' | ')} |`;
}

// Utility function to create table separator
function createTableSeparator(widths: number[]): string {
  const separators = widths.map(width => '-'.repeat(width));
  return `| ${separators.join(' | ')} |`;
}

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

## Tables Overview

${tables.length > 0 ? (() => {
  const headers = ['Table Name', 'Type', 'Columns', 'Foreign Keys', 'RLS Policies', 'Indexes'];
  const columnKeys = ['table_name', 'table_type', 'column_count', 'fk_count', 'policy_count', 'index_count'];
  
  // Prepare table data with counts
  const tableData = tables.map(table => ({
    table_name: table.table_name,
    table_type: table.table_type,
    column_count: (tableColumns[table.table_name] || []).length,
    fk_count: (tableForeignKeys[table.table_name] || []).length,
    policy_count: (tablePolicies[table.table_name] || []).length,
    index_count: (tableIndexes[table.table_name] || []).length
  }));
  
  const widths = calculateColumnWidths(tableData, columnKeys, headers, { tableNameColumn: true });
  
  const headerRow = createFixedWidthRow(headers, widths);
  const separatorRow = createTableSeparator(widths);
  
  const dataRows = tableData.map(table => {
    const values = [
      `**${table.table_name}**`,
      table.table_type,
      String(table.column_count),
      String(table.fk_count),
      String(table.policy_count),
      String(table.index_count)
    ];
    
    return createFixedWidthRow(values, widths);
  });
  
  return [headerRow, separatorRow, ...dataRows].join('\n');
})() : 'No tables found.'}

This overview provides a quick summary of all database tables with their key characteristics. Tables with RLS policies have security controls enabled, while foreign keys indicate relationships between tables.

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

${cols.length > 0 ? (() => {
  const headers = ['Column', 'Type', 'Nullable', 'Default'];
  const columnKeys = ['column_display', 'type_display', 'nullable_display', 'default_display'];
  const widths = calculateColumnWidths(cols, columnKeys, headers);
  
  const headerRow = createFixedWidthRow(headers, widths);
  const separatorRow = createTableSeparator(widths);
  
  const dataRows = cols.map(col => {
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
    
    const values = [
      `**${col.column_name}**`,
      simpleType,
      col.is_nullable === 'YES' ? '✓' : '✗',
      simpleDefault
    ];
    
    return createFixedWidthRow(values, widths);
  });
  
  return [headerRow, separatorRow, ...dataRows].join('\n');
})() : 'No columns found.'}

${cols.filter(col => col.column_name.includes('_uuid') && col.column_name !== 'supabase_user_uuid').length > 0 ? `
**Primary Keys**: ${cols.filter(col => col.column_name.includes('_uuid') && col.column_name !== 'supabase_user_uuid').map(col => col.column_name).join(', ')}
` : ''}

${cols.filter(col => col.column_name.includes('created_at') || col.column_name.includes('updated_at')).length > 0 ? `
**Timestamps**: ${cols.filter(col => col.column_name.includes('created_at') || col.column_name.includes('updated_at')).map(col => col.column_name).join(', ')}
` : ''}

${fks.length > 0 ? `#### Foreign Key Relationships

${(() => {
  const headers = ['Column', 'References', 'Constraint Name'];
  const columnKeys = ['fk_column', 'fk_references', 'fk_constraint'];
  const widths = calculateColumnWidths(fks, columnKeys, headers);
  
  const headerRow = createFixedWidthRow(headers, widths);
  const separatorRow = createTableSeparator(widths);
  
  const dataRows = fks.map(fk => {
    const values = [
      fk.column_name,
      `${fk.foreign_table_schema}.${fk.foreign_table_name}.${fk.foreign_column_name}`,
      fk.constraint_name
    ];
    
    return createFixedWidthRow(values, widths);
  });
  
  return [headerRow, separatorRow, ...dataRows].join('\n');
})()}
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

${(() => {
  const headers = ['Index Name', 'Columns', 'Unique', 'Primary', 'Type'];
  const columnKeys = ['index_name', 'index_columns', 'index_unique', 'index_primary', 'index_type'];
  const widths = calculateColumnWidths(idxs, columnKeys, headers);
  
  const headerRow = createFixedWidthRow(headers, widths);
  const separatorRow = createTableSeparator(widths);
  
  const dataRows = idxs.map(idx => {
    const values = [
      idx.index_name,
      idx.column_names.join(', '),
      idx.is_unique ? 'Yes' : 'No',
      idx.is_primary ? 'Yes' : 'No',
      idx.index_type
    ];
    
    return createFixedWidthRow(values, widths);
  });
  
  return [headerRow, separatorRow, ...dataRows].join('\n');
})()}
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

${dbFunctions.length > 0 ? (() => {
  const headers = ['Function Name', 'Schema', 'Return Type', 'Arguments', 'Type'];
  const columnKeys = ['function_name', 'function_schema', 'return_type', 'argument_types', 'function_type'];
  const widths = calculateColumnWidths(dbFunctions, columnKeys, headers);
  
  const headerRow = createFixedWidthRow(headers, widths);
  const separatorRow = createTableSeparator(widths);
  
  const dataRows = dbFunctions.map(func => {
    const values = [
      `**${func.function_name}**`,
      func.function_schema,
      func.return_type,
      func.argument_types || 'None',
      func.function_type
    ];
    
    return createFixedWidthRow(values, widths);
  });
  
  return [headerRow, separatorRow, ...dataRows].join('\n');
})() : 'No custom functions found.'}

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

${indexes.length > 0 ? (() => {
  const indexTypeData = Object.entries(indexes.reduce((acc, idx) => {
    acc[idx.index_type] = (acc[idx.index_type] || 0) + 1;
    return acc;
  }, {} as {[key: string]: number})).map(([type, count]) => ({
    index_type: type,
    count: count
  }));
  
  const headers = ['Index Type', 'Count'];
  const columnKeys = ['index_type', 'count'];
  const widths = calculateColumnWidths(indexTypeData, columnKeys, headers);
  
  const headerRow = createFixedWidthRow(headers, widths);
  const separatorRow = createTableSeparator(widths);
  
  const dataRows = indexTypeData.map(item => {
    const values = [
      `**${item.index_type}**`,
      String(item.count)
    ];
    
    return createFixedWidthRow(values, widths);
  });
  
  return [headerRow, separatorRow, ...dataRows].join('\n');
})() : 'No indexes found.'}

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