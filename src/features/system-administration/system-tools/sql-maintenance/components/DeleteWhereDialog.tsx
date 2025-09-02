import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertTriangle, Filter, Eye, Loader2, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { TableMetadata, DeleteWhereRequest, DeleteResult, FilterCondition, StructuredFilter } from '../types'

interface DeleteWhereDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: TableMetadata | null
  onComplete: (result: DeleteResult) => void
}

const OPERATORS = [
  { value: '=', label: 'equals' },
  { value: '!=', label: 'not equals' },
  { value: '<', label: 'less than' },
  { value: '<=', label: 'less than or equal' },
  { value: '>', label: 'greater than' },
  { value: '>=', label: 'greater than or equal' },
  { value: 'IN', label: 'in list' },
  { value: 'LIKE', label: 'contains' },
]

export function DeleteWhereDialog({ open, onOpenChange, table, onComplete }: DeleteWhereDialogProps) {
  const [mode, setMode] = useState<'visual' | 'advanced'>('visual')
  const [conditions, setConditions] = useState<FilterCondition[]>([])
  const [operator, setOperator] = useState<'AND' | 'OR'>('AND')
  const [advancedPredicate, setAdvancedPredicate] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [matchCountConfirmation, setMatchCountConfirmation] = useState('')
  const [preview, setPreview] = useState<DeleteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [columns, setColumns] = useState<string[]>([])
  
  const { toast } = useToast()

  useEffect(() => {
    if (table && open) {
      fetchColumns()
      resetForm()
    }
  }, [table, open])

  const resetForm = () => {
    setConditions([{ column: '', operator: '=', value: '' }])
    setOperator('AND')
    setAdvancedPredicate('')
    setConfirmation('')
    setMatchCountConfirmation('')
    setPreview(null)
    setLoading(false)
    setPreviewLoading(false)
  }

  const fetchColumns = async () => {
    if (!table) return
    
    try {
      const { data, error } = await supabase.rpc('get_column_info')
      
      if (error) throw error
      
      const tableColumns = data
        .filter((col: any) => col.table_name === table.table_name)
        .map((col: any) => col.column_name)
        .sort()
      
      setColumns(tableColumns)
    } catch (error) {
      console.error('Failed to fetch columns:', error)
    }
  }

  const addCondition = () => {
    setConditions([...conditions, { column: '', operator: '=', value: '' }])
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, field: keyof FilterCondition, value: any) => {
    const updated = [...conditions]
    updated[index] = { ...updated[index], [field]: value }
    setConditions(updated)
  }

  const handlePreview = async () => {
    if (!table) return

    setPreviewLoading(true)
    
    try {
      const request: DeleteWhereRequest = {
        schema_name: table.schema_name,
        table_name: table.table_name,
        dry_run: true,
        sample_limit: 10
      }

      if (mode === 'visual') {
        const validConditions = conditions.filter(c => c.column && c.value !== '')
        if (validConditions.length === 0) {
          toast({
            title: 'No Conditions',
            description: 'Please add at least one valid condition',
            variant: 'destructive'
          })
          return
        }
        
        request.filter = {
          op: operator,
          conditions: validConditions
        }
      } else {
        if (!advancedPredicate.trim()) {
          toast({
            title: 'No Predicate',
            description: 'Please enter a WHERE predicate',
            variant: 'destructive'
          })
          return
        }
        
        request.advanced_predicate = advancedPredicate.trim()
      }

      const { data, error } = await supabase.functions.invoke('sql-maintenance/delete-where', {
        body: request
      })

      if (error) throw error

      setPreview(data)
      
    } catch (error) {
      console.error('Preview failed:', error)
      toast({
        title: 'Preview Failed',
        description: error.message || 'Failed to preview deletion',
        variant: 'destructive'
      })
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!table || !preview) return

    const expectedConfirmation = `DELETE ${table.table_name}`
    const expectedMatchCount = preview.match_count?.toString() || '0'
    
    if (confirmation !== expectedConfirmation) {
      toast({
        title: 'Confirmation Required',
        description: `Please type "${expectedConfirmation}" to confirm`,
        variant: 'destructive'
      })
      return
    }

    if (matchCountConfirmation !== expectedMatchCount) {
      toast({
        title: 'Match Count Required',
        description: `Please type "${expectedMatchCount}" to confirm the match count`,
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const request: DeleteWhereRequest = {
        schema_name: table.schema_name,
        table_name: table.table_name,
        dry_run: false
      }

      if (mode === 'visual' && preview.where_clause) {
        const validConditions = conditions.filter(c => c.column && c.value !== '')
        request.filter = {
          op: operator,
          conditions: validConditions
        }
      } else if (mode === 'advanced') {
        request.advanced_predicate = advancedPredicate.trim()
      }

      const { data, error } = await supabase.functions.invoke('sql-maintenance/delete-where', {
        body: request
      })

      if (error) throw error

      onComplete(data)
      handleClose()

    } catch (error) {
      console.error('Delete where failed:', error)
      toast({
        title: 'Operation Failed',
        description: error.message || 'Failed to delete rows',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const canPreview = mode === 'visual' 
    ? conditions.some(c => c.column && c.value !== '')
    : advancedPredicate.trim().length > 0

  const canProceed = preview && 
    confirmation === `DELETE ${table?.table_name}` && 
    matchCountConfirmation === preview.match_count?.toString()

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-destructive" />
            Custom Delete
          </DialogTitle>
          <DialogDescription>
            Delete specific rows from{' '}
            <span className="font-mono font-semibold">
              {table?.schema_name}.{table?.table_name}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs value={mode} onValueChange={(value: 'visual' | 'advanced') => setMode(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visual">Visual Filter</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Predicate</TabsTrigger>
            </TabsList>

            <TabsContent value="visual" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Filter Conditions</Label>
                  <Button variant="outline" size="sm" onClick={addCondition}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Condition
                  </Button>
                </div>

                {conditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-md">
                    <Select 
                      value={condition.column} 
                      onValueChange={(value) => updateCondition(index, 'column', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select 
                      value={condition.operator} 
                      onValueChange={(value) => updateCondition(index, 'operator', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map(op => (
                          <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Value"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      className="flex-1"
                    />

                    {conditions.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCondition(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                {conditions.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Label>Combine with:</Label>
                    <Select value={operator} onValueChange={(value: 'AND' | 'OR') => setOperator(value)}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-2">
                <Label>WHERE Predicate</Label>
                <Textarea
                  placeholder="created_at < '2024-01-01' AND status IN ('draft', 'failed')"
                  value={advancedPredicate}
                  onChange={(e) => setAdvancedPredicate(e.target.value)}
                  rows={3}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Enter only the WHERE clause content (without "WHERE" keyword)
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Preview Button */}
          <div className="flex justify-center">
            <Button
              onClick={handlePreview}
              disabled={!canPreview || previewLoading}
              variant="outline"
            >
              {previewLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Eye className="h-4 w-4 mr-2" />
              Preview Deletion
            </Button>
          </div>

          {/* Preview Results */}
          {preview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview Results</CardTitle>
                <CardDescription>
                  {preview.match_count} rows will be deleted
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Badge variant="outline">
                    Matches: {preview.match_count}
                  </Badge>
                  {preview.where_clause && (
                    <Badge variant="secondary" className="font-mono text-xs">
                      {preview.where_clause}
                    </Badge>
                  )}
                </div>

                {preview.sample_data && preview.sample_data.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Sample Data (first 10 rows):</Label>
                    <div className="border rounded-md max-h-32 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(preview.sample_data[0]).slice(0, 4).map(key => (
                              <TableHead key={key} className="text-xs">{key}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.sample_data.slice(0, 5).map((row, i) => (
                            <TableRow key={i}>
                              {Object.values(row).slice(0, 4).map((value: any, j) => (
                                <TableCell key={j} className="text-xs font-mono">
                                  {String(value).substring(0, 20)}
                                  {String(value).length > 20 && '...'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{preview.match_count} rows will be permanently deleted!</strong>
                    <br />
                    Data will be exported to CSV before deletion for audit purposes.
                  </AlertDescription>
                </Alert>

                {/* Confirmation Inputs */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="delete-confirmation">
                      Type <span className="font-mono bg-muted px-1 rounded">DELETE {table?.table_name}</span> to confirm:
                    </Label>
                    <Input
                      id="delete-confirmation"
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      placeholder={`DELETE ${table?.table_name}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="count-confirmation">
                      Type <span className="font-mono bg-muted px-1 rounded">{preview.match_count}</span> to confirm the match count:
                    </Label>
                    <Input
                      id="count-confirmation"
                      value={matchCountConfirmation}
                      onChange={(e) => setMatchCountConfirmation(e.target.value)}
                      placeholder={preview.match_count?.toString()}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canProceed || loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete {preview?.match_count || 0} Rows
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}