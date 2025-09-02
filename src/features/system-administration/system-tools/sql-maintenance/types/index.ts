export interface TableMetadata {
  schema_name: string
  table_name: string
  row_count: number
  table_size_bytes: number
  last_updated: string | null
  is_protected?: boolean
}

export interface DeleteAllRequest {
  schema_name: string
  table_name: string
  mode: 'delete' | 'truncate'
  restart_identity?: boolean
  cascade?: boolean
}

export interface FilterCondition {
  column: string
  operator: '=' | '!=' | '<' | '<=' | '>' | '>=' | 'IN' | 'LIKE'
  value: any
}

export interface StructuredFilter {
  op: 'AND' | 'OR'
  conditions: FilterCondition[]
}

export interface DeleteWhereRequest {
  schema_name: string
  table_name: string
  filter?: StructuredFilter
  advanced_predicate?: string
  dry_run?: boolean
  sample_limit?: number
  row_limit?: number
}

export interface DeleteResult {
  success: boolean
  row_count_before?: number
  match_count?: number
  rows_deleted?: number
  duration_ms?: number
  csv_metadata?: {
    object_path: string
    row_count: number
    size_bytes: number
    sha256?: string
  }
  sample_data?: any[]
  where_clause?: string
  dry_run?: boolean
}