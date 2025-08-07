import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RotateCcw } from 'lucide-react';

export interface ChangeHistoryEntry {
  change_uuid: string;
  change_id: number;
  user_uuid: string;
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  structure_uuid: string;
  structure_id: number;
  line_item_uuid: string | null;
  line_item_id: number | null;
  action_type: 'create' | 'delete' | 'rename' | 'move';
  line_item_key: string;
  line_item_description: string;
  previous_state: any;
  new_state: any;
  timestamp: string;
  is_undone: boolean;
  undone_at: string | null;
  undone_by_uuid: string | null;
}

interface ChangeHistoryTableProps {
  changeHistory: ChangeHistoryEntry[];
  onUndo: (changeUuid: string) => Promise<void>;
  recentlyUndoneItems: Set<string>;
}

export default function ChangeHistoryTable({ changeHistory, onUndo, recentlyUndoneItems }: ChangeHistoryTableProps) {
  const [undoingItems, setUndoingItems] = useState<Set<string>>(new Set());

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const handleUndo = async (changeUuid: string) => {
    setUndoingItems(prev => new Set(prev).add(changeUuid));
    try {
      await onUndo(changeUuid);
    } finally {
      setUndoingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(changeUuid);
        return newSet;
      });
    }
  };

  // Filter out undone entries and show most recent first
  const displayedHistory = changeHistory
    .filter(entry => !entry.is_undone)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20); // Show last 20 changes

  if (displayedHistory.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">Change History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No changes made yet. Your modifications will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-sm">Change History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Time</TableHead>
              <TableHead className="w-[120px]">Action Type</TableHead>
              <TableHead>Line Item</TableHead>
              <TableHead className="w-[80px]">Undo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedHistory.map((entry) => (
              <TableRow 
                key={entry.change_uuid}
                className={`${
                  recentlyUndoneItems.has(entry.line_item_key) 
                    ? 'animate-pulse bg-yellow-50 dark:bg-yellow-950/20' 
                    : ''
                }`}
              >
                <TableCell className="text-xs text-muted-foreground">
                  {formatTime(entry.timestamp)}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      entry.action_type === 'rename' ? 'default' : 
                      entry.action_type === 'move' ? 'secondary' :
                      entry.action_type === 'create' ? 'outline' : 'destructive'
                    }
                    className="text-xs"
                  >
                    {entry.action_type === 'rename' ? 'Rename' : 
                     entry.action_type === 'move' ? 'Move' :
                     entry.action_type === 'create' ? 'Create' : 'Delete'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="font-mono text-xs text-muted-foreground mb-1">
                    {entry.line_item_key}
                  </div>
                  <div>{entry.line_item_description}</div>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUndo(entry.change_uuid)}
                    disabled={undoingItems.has(entry.change_uuid)}
                    className="h-6 w-6 p-0"
                    title="Undo this change"
                  >
                    <RotateCcw className={`h-3 w-3 ${undoingItems.has(entry.change_uuid) ? 'animate-spin' : ''}`} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}