import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Database, 
  Trash2, 
  AlertTriangle, 
  Download, 
  Filter, 
  Search,
  Shield,
  Clock,
  HardDrive,
  FileDown
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { TableMetadata, DeleteResult } from '../types'
import { DeleteAllDialog } from './DeleteAllDialog'
import { DeleteWhereDialog } from './DeleteWhereDialog'

export function SqlMaintenance() {
  const [tables, setTables] = useState<TableMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dangerMode, setDangerMode] = useState(false)
  const [selectedTable, setSelectedTable] = useState<TableMetadata | null>(null)
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [deleteWhereOpen, setDeleteWhereOpen] = useState(false)
  const [recentOperations, setRecentOperations] = useState<any[]>([])
  
  const { toast } = useToast()

  useEffect(() => {
    fetchTables()
    fetchRecentOperations()
  }, [])

  const fetchTables = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.rpc('get_table_metadata')
      
      if (error) throw error

      // Enrich with protection status
      const enrichedTables = await Promise.all(
        data.map(async (table: TableMetadata) => {
          const { data: isProtected } = await supabase.rpc('is_table_protected', {
            p_schema_name: table.schema_name,
            p_table_name: table.table_name
          })
          
          return {
            ...table,
            is_protected: isProtected
          }
        })
      )
      
      setTables(enrichedTables)
    } catch (error) {
      console.error('Failed to fetch tables:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch table metadata',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentOperations = async () => {
    try {
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .ilike('action', 'sql_maintenance_%')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      setRecentOperations(data || [])
    } catch (error) {
      console.error('Failed to fetch recent operations:', error)
    }
  }

  const handleDeleteAll = (table: TableMetadata) => {
    if (table.is_protected && !dangerMode) {
      toast({
        title: 'Protected Table',
        description: 'Enable Danger Mode to delete from protected tables',
        variant: 'destructive'
      })
      return
    }
    
    setSelectedTable(table)
    setDeleteAllOpen(true)
  }

  const handleDeleteWhere = (table: TableMetadata) => {
    if (table.is_protected && !dangerMode) {
      toast({
        title: 'Protected Table',
        description: 'Enable Danger Mode to delete from protected tables',
        variant: 'destructive'
      })
      return
    }
    
    setSelectedTable(table)
    setDeleteWhereOpen(true)
  }

  const onOperationComplete = (result: DeleteResult) => {
    fetchTables() // Refresh table data
    fetchRecentOperations() // Refresh audit log
    
    if (result.success) {
      toast({
        title: 'Operation Complete',
        description: `${result.rows_deleted || 0} rows affected in ${result.duration_ms}ms`,
      })
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const filteredTables = tables.filter(table => 
    table.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.schema_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">SQL Maintenance</h2>
          <p className="text-muted-foreground">
            Clean and maintain database tables with comprehensive audit trails
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={dangerMode ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setDangerMode(!dangerMode)}
          >
            <Shield className="h-4 w-4 mr-2" />
            {dangerMode ? 'Danger Mode ON' : 'Enable Danger Mode'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTables}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Danger Mode Warning */}
      {dangerMode && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Danger Mode is enabled!</strong> You can now perform operations on protected tables. 
            Use with extreme caution as these operations are irreversible.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tables">Database Tables</TabsTrigger>
          <TabsTrigger value="history">Operation History</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredTables.length} of {tables.length} tables
            </div>
          </div>

          {/* Tables */}
          {loading ? (
            <div className="text-center py-8">
              <Progress value={undefined} className="w-32 mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Loading tables...</p>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Tables
                </CardTitle>
                <CardDescription>
                  Manage table data with comprehensive safety measures and audit logging
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Schema</TableHead>
                      <TableHead>Table Name</TableHead>
                      <TableHead className="text-right">Rows</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTables.map((table) => (
                      <TableRow key={`${table.schema_name}.${table.table_name}`}>
                        <TableCell className="font-mono text-sm">
                          {table.schema_name}
                        </TableCell>
                        <TableCell className="font-medium">
                          {table.table_name}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(table.row_count)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatBytes(table.table_size_bytes)}
                        </TableCell>
                        <TableCell>
                          {table.is_protected && (
                            <Badge variant={dangerMode ? 'destructive' : 'secondary'}>
                              <Shield className="h-3 w-3 mr-1" />
                              Protected
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteWhere(table)}
                              disabled={table.is_protected && !dangerMode}
                            >
                              <Filter className="h-4 w-4 mr-1" />
                              Custom Delete
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteAll(table)}
                              disabled={table.is_protected && !dangerMode}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete All
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Operations
              </CardTitle>
              <CardDescription>
                Audit trail of SQL maintenance operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rows Affected</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Export</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOperations.map((op) => (
                    <TableRow key={op.security_audit_log_uuid}>
                      <TableCell className="font-mono text-sm">
                        {new Date(op.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {op.action.replace('sql_maintenance_', '')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {op.details?.schema_name}.{op.details?.table_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={op.details?.status === 'success' ? 'default' : 'destructive'}>
                          {op.details?.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {op.details?.rows_deleted || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {op.details?.duration_ms ? `${op.details.duration_ms}ms` : '-'}
                      </TableCell>
                      <TableCell>
                        {op.details?.csv_object_path && (
                          <Button variant="ghost" size="sm">
                            <FileDown className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DeleteAllDialog
        open={deleteAllOpen}
        onOpenChange={setDeleteAllOpen}
        table={selectedTable}
        onComplete={onOperationComplete}
      />
      
      <DeleteWhereDialog
        open={deleteWhereOpen}
        onOpenChange={setDeleteWhereOpen}
        table={selectedTable}
        onComplete={onOperationComplete}
      />
    </div>
  )
}