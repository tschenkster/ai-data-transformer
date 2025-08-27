import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, User, Clock, BarChart3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedReportStructureData {
  report_structure_uuid: string;
  report_structure_name: string;
  version: number;
  is_active: boolean;
  created_at: string;
  creator_name: string;
  creator_email: string;
  line_item_count: number;
}

interface ReportStructureCardProps {
  structureUuid: string;
  className?: string;
}

export function ReportStructureCard({ 
  structureUuid, 
  className = "" 
}: ReportStructureCardProps) {
  const [structureData, setStructureData] = useState<EnhancedReportStructureData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (structureUuid) {
      fetchEnhancedStructureData();
    }
  }, [structureUuid]);

  const fetchEnhancedStructureData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_report_structure_with_creator', { 
          p_structure_uuid: structureUuid 
        });

      if (error) {
        console.error('Error fetching enhanced structure data:', error);
        return;
      }

      if (data && data.length > 0) {
        setStructureData(data[0] as EnhancedReportStructureData);
      }
    } catch (error) {
      console.error('Error in fetchEnhancedStructureData:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <Skeleton className="h-5 w-[250px]" />
          <Skeleton className="h-4 w-[180px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!structureData) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Report Structure
          </CardTitle>
          <CardDescription>Unable to load structure data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {structureData.report_structure_name}
          {structureData.is_active && (
            <Badge variant="default" className="ml-2">Active</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Version {structureData.version} • Created {formatDistanceToNow(new Date(structureData.created_at), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Created by:</span>
          <span className="text-sm font-medium">
            {structureData.creator_name || structureData.creator_email}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Line items:</span>
          <Badge variant="secondary">
            {Number(structureData.line_item_count).toLocaleString()}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge variant={structureData.is_active ? "default" : "outline"}>
            {structureData.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}