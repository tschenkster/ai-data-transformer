import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteAllRequest {
  schema_name: string
  table_name: string
  mode: 'delete' | 'truncate'
  restart_identity?: boolean
  cascade?: boolean
}

interface DeleteWhereRequest {
  schema_name: string
  table_name: string
  filter?: {
    op: 'AND' | 'OR'
    conditions: Array<{
      column: string
      operator: string
      value: any
    }>
  }
  advanced_predicate?: string
  dry_run?: boolean
  sample_limit?: number
  row_limit?: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Verify super admin role using user-scoped client (so auth.uid() is set)
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
    );

    const { data: isSuperAdmin, error: roleError } = await supabaseUser.rpc('is_super_admin_user')
    
    if (roleError || !isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Super Admin access required' }), 
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body to check for action field
    const body = await req.json()
    
    // Route based on URL path (legacy) or body.action (new)
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()
    const action = body.action

    if (req.method === 'POST') {
      if (path === 'delete-all' || action === 'delete-all') {
        return await handleDeleteAll(req, supabaseClient, supabaseUser, user.id, body)
      } else if (path === 'delete-where' || action === 'delete-where') {
        return await handleDeleteWhere(req, supabaseClient, supabaseUser, user.id, body)
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }), 
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('SQL Maintenance error:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleDeleteAll(req: Request, supabaseClient: any, supabaseUser: any, userId: string, body?: any) {
  const requestBody: DeleteAllRequest = body || await req.json()
  const { schema_name, table_name, mode, restart_identity = false, cascade = false } = requestBody
  
  console.log(`Delete all request: ${schema_name}.${table_name}, mode: ${mode}`)
  
  const startTime = Date.now()
  
  try {
    // Check if table is protected
    const { data: isProtected } = await supabaseClient
      .rpc('is_table_protected', { p_schema_name: schema_name, p_table_name: table_name })
    
    if (isProtected) {
      throw new Error('Cannot delete from protected table')
    }

    // Get row count before deletion
    const { count: rowCountBefore, error: countError } = await supabaseClient
      .from(table_name)
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      throw new Error(`Failed to count rows: ${countError.message}`)
    }

    // Export data to CSV before deletion
    const csvMetadata = await exportTableToCSV(supabaseClient, schema_name, table_name)
    
    // Use the secure RPC function for actual deletion
    const { data: rowsDeleted, error: deleteError } = await supabaseUser
      .rpc('delete_all_rows_secure', {
        p_schema_name: schema_name,
        p_table_name: table_name,
        p_mode: mode,
        p_restart_identity: restart_identity,
        p_cascade: cascade
      })
    
    if (deleteError) {
      throw new Error(`Delete operation failed: ${deleteError.message}`)
    }

    const duration = Date.now() - startTime

    // Log the operation
    await supabaseUser.rpc('log_sql_maintenance_event', {
      p_action: 'delete_all',
      p_schema_name: schema_name,
      p_table_name: table_name,
      p_mode: mode,
      p_row_count_before: rowCountBefore || 0,
      p_rows_deleted: rowsDeleted,
      p_duration_ms: duration,
      p_csv_object_path: csvMetadata.object_path,
      p_csv_rows: csvMetadata.row_count,
      p_csv_size_bytes: csvMetadata.size_bytes,
      p_csv_sha256: csvMetadata.sha256
    })

    return new Response(
      JSON.stringify({
        success: true,
        row_count_before: rowCountBefore || 0,
        rows_deleted: rowsDeleted,
        duration_ms: duration,
        csv_metadata: csvMetadata
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    const duration = Date.now() - startTime
    
    // Log the failed operation
    await supabaseUser.rpc('log_sql_maintenance_event', {
      p_action: 'delete_all',
      p_schema_name: schema_name,
      p_table_name: table_name,
      p_mode: mode,
      p_duration_ms: duration,
      p_status: 'failure',
      p_error_message: error.message
    })

    throw error
  }
}

async function handleDeleteWhere(req: Request, supabaseClient: any, supabaseUser: any, userId: string, body?: any) {
  const requestBody: DeleteWhereRequest = body || await req.json()
  const { schema_name, table_name, filter, advanced_predicate, dry_run = false, sample_limit = 50, row_limit } = requestBody
  
  console.log(`Delete where request: ${schema_name}.${table_name}, dry_run: ${dry_run}`)
  
  const startTime = Date.now()
  
  try {
    // Check if table is protected
    const { data: isProtected } = await supabaseUser
      .rpc('is_table_protected', { p_schema_name: schema_name, p_table_name: table_name })
    
    if (isProtected) {
      throw new Error('Cannot delete from protected table')
    }

    // Build query based on filter or advanced predicate
    let query = supabaseClient.from(table_name).select('*')
    let whereClause = ''
    
    if (advanced_predicate) {
      // For advanced predicate, we'll need to use raw SQL
      whereClause = advanced_predicate
    } else if (filter) {
      // Build query from structured filter
      whereClause = buildWhereClause(filter)
      query = applyFiltersToQuery(query, filter)
    }

    if (dry_run) {
      // Get count and sample for preview
      const { data: previewData, error: previewError } = await query.limit(sample_limit)
      
      if (previewError) {
        throw new Error(`Preview failed: ${previewError.message}`)
      }

      const { count: matchCount, error: countError } = await supabaseClient
        .from(table_name)
        .select('*', { count: 'exact', head: true })
      
      return new Response(
        JSON.stringify({
          success: true,
          dry_run: true,
          match_count: matchCount || 0,
          sample_data: previewData || [],
          where_clause: whereClause
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get count before deletion
    const { count: matchCount, error: countError } = await query.select('*', { count: 'exact', head: true })
    
    if (countError) {
      throw new Error(`Failed to count matching rows: ${countError.message}`)
    }

    if (row_limit && (matchCount || 0) > row_limit) {
      throw new Error(`Match count ${matchCount || 0} exceeds safety limit ${row_limit}`)
    }

    // Export matching data to CSV before deletion
    const csvMetadata = await exportTableToCSV(supabaseClient, schema_name, table_name, whereClause)

    // Perform deletion
    let deleteQuery = supabaseClient.from(table_name).delete()
    if (filter) {
      deleteQuery = applyFiltersToQuery(deleteQuery, filter)
    }
    
    const { error: deleteError } = await deleteQuery
    
    if (deleteError) {
      throw new Error(`Delete failed: ${deleteError.message}`)
    }

    const duration = Date.now() - startTime

    // Log the operation
    await supabaseUser.rpc('log_sql_maintenance_event', {
      p_action: 'delete_where',
      p_schema_name: schema_name,
      p_table_name: table_name,
      p_where_predicate: whereClause,
      p_row_count_before: matchCount,
      p_rows_deleted: matchCount,
      p_duration_ms: duration,
      p_csv_object_path: csvMetadata.object_path,
      p_csv_rows: csvMetadata.row_count,
      p_csv_size_bytes: csvMetadata.size_bytes,
      p_csv_sha256: csvMetadata.sha256
    })

    return new Response(
      JSON.stringify({
        success: true,
        match_count: matchCount,
        rows_deleted: matchCount,
        duration_ms: duration,
        csv_metadata: csvMetadata
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    const duration = Date.now() - startTime
    
    // Log the failed operation
    await supabaseUser.rpc('log_sql_maintenance_event', {
      p_action: 'delete_where',
      p_schema_name: schema_name,
      p_table_name: table_name,
      p_where_predicate: advanced_predicate || JSON.stringify(filter),
      p_duration_ms: duration,
      p_status: 'failure',
      p_error_message: error.message
    })

    throw error
  }
}

function buildWhereClause(filter: any): string {
  if (!filter.conditions || filter.conditions.length === 0) {
    return ''
  }
  
  const conditions = filter.conditions.map((condition: any) => {
    const { column, operator, value } = condition
    switch (operator) {
      case '=':
        return `${column} = '${value}'`
      case '!=':
        return `${column} != '${value}'`
      case '<':
        return `${column} < '${value}'`
      case '<=':
        return `${column} <= '${value}'`
      case '>':
        return `${column} > '${value}'`
      case '>=':
        return `${column} >= '${value}'`
      case 'IN':
        const values = Array.isArray(value) ? value : [value]
        return `${column} IN (${values.map(v => `'${v}'`).join(', ')})`
      case 'LIKE':
        return `${column} LIKE '%${value}%'`
      default:
        return `${column} = '${value}'`
    }
  })
  
  return conditions.join(` ${filter.op} `)
}

function applyFiltersToQuery(query: any, filter: any): any {
  if (!filter.conditions || filter.conditions.length === 0) {
    return query
  }
  
  filter.conditions.forEach((condition: any) => {
    const { column, operator, value } = condition
    switch (operator) {
      case '=':
        query = query.eq(column, value)
        break
      case '!=':
        query = query.neq(column, value)
        break
      case '<':
        query = query.lt(column, value)
        break
      case '<=':
        query = query.lte(column, value)
        break
      case '>':
        query = query.gt(column, value)
        break
      case '>=':
        query = query.gte(column, value)
        break
      case 'IN':
        query = query.in(column, Array.isArray(value) ? value : [value])
        break
      case 'LIKE':
        query = query.ilike(column, `%${value}%`)
        break
    }
  })
  
  return query
}

async function exportTableToCSV(supabaseClient: any, schemaName: string, tableName: string, whereClause?: string): Promise<any> {
  console.log(`Exporting ${schemaName}.${tableName} to CSV`)
  
  try {
    // Get all data from the table
    let query = supabaseClient.from(tableName).select('*')
    
    // Apply where clause if provided
    if (whereClause) {
      // For simplicity, we'll fetch all and filter in memory
      // In production, you'd want to use raw SQL for complex WHERE clauses
    }
    
    const { data, error } = await query
    
    if (error) {
      throw new Error(`Failed to fetch data for export: ${error.message}`)
    }

    if (!data || data.length === 0) {
      console.log('No data to export')
      return {
        object_path: null,
        row_count: 0,
        size_bytes: 0,
        sha256: null
      }
    }

    // Convert data to CSV
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string' && value.includes(',')) return `"${value}"`
        return value
      }).join(','))
    ].join('\n')

    // Generate filename
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '')
    const filename = `deleted-data-${schemaName === 'public' ? tableName : `${schemaName}.${tableName}`}-${dateStr}-${timeStr}.csv`
    
    // Create folder structure path
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const objectPath = `${year}/${month}/${day}/${filename}`

    // Upload to storage
    const { error: uploadError } = await supabaseClient.storage
      .from('system-tools-deletions')
      .upload(objectPath, csvContent, {
        contentType: 'text/csv',
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Failed to upload CSV: ${uploadError.message}`)
    }

    console.log(`CSV exported to: ${objectPath}`)

    return {
      object_path: objectPath,
      row_count: data.length,
      size_bytes: new Blob([csvContent]).size,
      sha256: null // Would need crypto library to calculate
    }

  } catch (error) {
    console.error('CSV export failed:', error)
    throw error
  }
}