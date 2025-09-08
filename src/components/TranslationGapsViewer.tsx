import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Languages, FileText, Database, MousePointer } from 'lucide-react';

interface TranslationGap {
  entityType: string;
  entityUuid: string;
  fieldKey: string;
  sourceLanguage: string;
  targetLanguage: string;
  originalText: string;
}

interface TranslationGapsViewerProps {
  gaps: TranslationGap[];
  className?: string;
}

export function TranslationGapsViewer({ gaps, className }: TranslationGapsViewerProps) {
  if (!gaps || gaps.length === 0) {
    return null;
  }

  // Group gaps by entity type
  const gapsByType = gaps.reduce((acc: Record<string, TranslationGap[]>, gap) => {
    if (!acc[gap.entityType]) {
      acc[gap.entityType] = [];
    }
    acc[gap.entityType].push(gap);
    return acc;
  }, {});

  const getTypeIcon = (entityType: string) => {
    switch (entityType) {
      case 'ui':
        return <MousePointer className="h-4 w-4" />;
      case 'report_structure':
        return <FileText className="h-4 w-4" />;
      case 'report_line_item':
        return <Database className="h-4 w-4" />;
      default:
        return <Languages className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (entityType: string) => {
    switch (entityType) {
      case 'ui':
        return 'UI Elements';
      case 'report_structure':
        return 'Report Structures';
      case 'report_line_item':
        return 'Line Items';
      default:
        return entityType;
    }
  };

  const getTruncatedText = (text: string, maxLength = 60) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Translation Gaps Details
        </CardTitle>
        <CardDescription>
          Detailed view of missing translations by content type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={Object.keys(gapsByType)[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {Object.entries(gapsByType).map(([entityType, typeGaps]) => (
              <TabsTrigger key={entityType} value={entityType} className="flex items-center gap-2">
                {getTypeIcon(entityType)}
                {getTypeLabel(entityType)}
                <Badge variant="secondary" className="ml-1">
                  {typeGaps.length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.entries(gapsByType).map(([entityType, typeGaps]) => (
            <TabsContent key={entityType} value={entityType}>
              <ScrollArea className="h-80">
                <div className="space-y-3 pr-4">
                  {typeGaps.map((gap, index) => (
                    <div
                      key={`${gap.entityUuid}-${gap.fieldKey}-${gap.targetLanguage}`}
                      className="p-3 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {gap.fieldKey}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {gap.sourceLanguage.toUpperCase()} → {gap.targetLanguage.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Text: </span>
                        <span className="text-foreground">
                          {getTruncatedText(gap.originalText)}
                        </span>
                      </div>
                      
                      {entityType !== 'ui' && (
                        <div className="text-xs text-muted-foreground">
                          ID: {gap.entityUuid.substring(0, 8)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}