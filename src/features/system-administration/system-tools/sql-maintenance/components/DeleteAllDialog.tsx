import React, { useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { TableMetadata, DeleteAllRequest, DeleteResult } from '../types'

interface DeleteAllDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: TableMetadata | null
  onComplete: (result: DeleteResult) => void
}

export function DeleteAllDialog({ open, onOpenChange, table, onComplete }: DeleteAllDialogProps) {
  const [confirmation, setConfirmation] = useState('')
  const [mode, setMode] = useState<'delete' | 'truncate'>('delete')
  const [restartIdentity, setRestartIdentity] = useState(false)
  const [cascade, setCascade] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { toast } = useToast()

  const handleClose = () => {
    setConfirmation('')
    setMode('delete')
    setRestartIdentity(false)
    setCascade(false)
    setLoading(false)
    onOpenChange(false)
  }

  const handleConfirm = async () => {
    if (!table || confirmation !== table.table_name) {
      toast({
        title: 'Confirmation Required',
        description: 'Please type the exact table name to confirm',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const request: DeleteAllRequest = {
        schema_name: table.schema_name,
        table_name: table.table_name,
        mode,
        restart_identity: restartIdentity,
        cascade
      }

      const { data, error } = await supabase.functions.invoke('sql-maintenance', {
        body: { action: 'delete-all', ...request }
      })

      if (error) throw error

      onComplete(data)
      handleClose()

    } catch (error) {
      console.error('Delete all failed:', error)
      toast({
        title: 'Operation Failed',
        description: error.message || 'Failed to delete table data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const isConfirmationValid = confirmation === table?.table_name
  const canProceed = isConfirmationValid && !loading

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete All Rows
          </DialogTitle>
          <DialogDescription>
            This will permanently delete all data from{' '}
            <span className="font-mono font-semibold">
              {table?.schema_name}.{table?.table_name}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Danger Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>This action cannot be undone!</strong>
              <br />
              All {table?.row_count?.toLocaleString() || 0} rows will be permanently deleted.
              Data will be exported to CSV before deletion for audit purposes.
            </AlertDescription>
          </Alert>

          {/* Deletion Mode */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Deletion Mode</Label>
            <RadioGroup value={mode} onValueChange={(value: 'delete' | 'truncate') => setMode(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delete" id="delete" />
                <Label htmlFor="delete" className="text-sm">
                  DELETE (safer, slower)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="truncate" id="truncate" />
                <Label htmlFor="truncate" className="text-sm">
                  TRUNCATE (faster, resets sequences)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* TRUNCATE Options */}
          {mode === 'truncate' && (
            <div className="space-y-3 border-l-2 border-orange-200 pl-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="restart-identity"
                  checked={restartIdentity}
                  onCheckedChange={(checked) => setRestartIdentity(checked === true)}
                />
                <Label htmlFor="restart-identity" className="text-sm">
                  Restart Identity (reset auto-increment counters)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cascade"
                  checked={cascade}
                  onCheckedChange={(checked) => setCascade(checked === true)}
                />
                <Label htmlFor="cascade" className="text-sm">
                  Cascade (truncate dependent tables)
                </Label>
              </div>
            </div>
          )}

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-sm font-medium">
              Type <span className="font-mono bg-muted px-1 rounded">{table?.table_name}</span> to confirm:
            </Label>
            <Input
              id="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={table?.table_name || ''}
              className={!isConfirmationValid && confirmation ? 'border-destructive' : ''}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canProceed}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === 'truncate' ? 'Truncate Table' : 'Delete All Rows'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}