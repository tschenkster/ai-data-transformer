import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RotateCcw } from 'lucide-react';

export interface ChangeHistoryEntry {
  id: string;
  action: 'edit' | 'reorder';
  affectedItemKey: string;
  affectedItemDescription: string;
  timestamp: Date;
  previousState: any;
  currentState: any;
  summary: string;
  isUndone: boolean;
}

interface ChangeHistoryTableProps {
  changeHistory: ChangeHistoryEntry[];
  onUndo: (entryId: string) => Promise<void>;
  recentlyUndoneItems: Set<string>;
}

export default function ChangeHistoryTable({ changeHistory, onUndo, recentlyUndoneItems }: ChangeHistoryTableProps) {
  const [undoingItems, setUndoingItems] = useState<Set<string>>(new Set());

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const handleUndo = async (entryId: string) => {
    setUndoingItems(prev => new Set(prev).add(entryId));
    try {
      await onUndo(entryId);
    } finally {
      setUndoingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(entryId);
        return newSet;
      });
    }
  };

  // Filter out undone entries and show most recent first
  const displayedHistory = changeHistory
    .filter(entry => !entry.isUndone)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
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
              <TableHead className="w-[200px]">Action</TableHead>
              <TableHead>Affected Item</TableHead>
              <TableHead className="w-[100px]">Time</TableHead>
              <TableHead className="w-[80px]">Undo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedHistory.map((entry) => (
              <TableRow 
                key={entry.id}
                className={`${
                  recentlyUndoneItems.has(entry.affectedItemKey) 
                    ? 'animate-pulse bg-yellow-50 dark:bg-yellow-950/20' 
                    : ''
                }`}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={entry.action === 'edit' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {entry.action === 'edit' ? 'Edit' : 'Reorder'}
                    </Badge>
                    <span className="text-sm">{entry.summary}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-mono">
                  {entry.affectedItemDescription}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatTime(entry.timestamp)}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUndo(entry.id)}
                    disabled={undoingItems.has(entry.id)}
                    className="h-6 w-6 p-0"
                    title="Undo this change"
                  >
                    <RotateCcw className={`h-3 w-3 ${undoingItems.has(entry.id) ? 'animate-spin' : ''}`} />
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