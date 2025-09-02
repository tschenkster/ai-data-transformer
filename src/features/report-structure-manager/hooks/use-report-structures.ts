import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { ReportStructureService } from '@/features/report-structure-manager/services/reportStructureService';
import { LineItemService } from '@/features/report-structure-manager/services/lineItemService';
import { ReportStructure, ReportLineItem, ProcessStructureData } from '@/features/report-structure-manager/types';

export function useReportStructures(): {
  structures: ReportStructure[];
  activeStructure: ReportStructure | null;
  lineItems: ReportLineItem[];
  loading: boolean;
  uploading: boolean;
  selectedStructureForModify: number | null;
  fetchStructures: () => Promise<void>;
  fetchLineItems: (structureId: number) => Promise<void>;
  setActiveStructureHandler: (structureId: number) => Promise<void>;
  deleteStructure: (structureId: number, structureName: string) => Promise<void>;
  handleFileProcessed: (fileData: ProcessStructureData) => Promise<void>;
  setSelectedStructureForModify: React.Dispatch<React.SetStateAction<number | null>>;
  isSuperAdmin: boolean;
  formatDate: (dateString: string) => string;
  buildHierarchyTree: (lineItems: ReportLineItem[]) => ReportLineItem[];
  getLineItemLevel: (item: ReportLineItem) => number;
} {
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();

  const [structures, setStructures] = useState<ReportStructure[]>([]);
  const [activeStructure, setActiveStructure] = useState<ReportStructure | null>(null);
  const [lineItems, setLineItems] = useState<ReportLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedStructureForModify, setSelectedStructureForModify] = useState<number | null>(null);

  const fetchStructures = async () => {
    try {
      const data = await ReportStructureService.fetchStructures();
      setStructures(data);
      
      // Find active structure
      const active = ReportStructureService.getActiveStructure(data);
      setActiveStructure(active);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch report structures",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLineItems = async (structureId: number) => {
    try {
      const data = await LineItemService.fetchLineItems(structureId);
      setLineItems(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch line items",
        variant: "destructive",
      });
    }
  };

  const setActiveStructureHandler = async (structureId: number) => {
    try {
      await ReportStructureService.setActiveStructure(structureId);
      toast({
        title: "Success",
        description: "Active structure updated successfully",
      });
      fetchStructures();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to set active structure",
        variant: "destructive",
      });
    }
  };

  const deleteStructure = async (structureId: number, structureName: string) => {
    if (!confirm(`Are you sure you want to delete "${structureName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await ReportStructureService.deleteStructure(structureId);
      toast({
        title: "Success",
        description: "Structure deleted successfully",
      });
      fetchStructures();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete structure",
        variant: "destructive",
      });
    }
  };

  const handleFileProcessed = async (fileData: ProcessStructureData) => {
    if (!user) return;

    setUploading(true);
    try {
      await ReportStructureService.processStructureFile(
        fileData,
        user.id,
        user.email || ''
      );

      toast({
        title: "Success",
        description: `Report structure "${fileData.filename}" processed successfully`,
      });
      
      fetchStructures();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to process report structure",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
  }, []);

  return {
    // Data
    structures,
    activeStructure,
    lineItems,
    loading,
    uploading,
    selectedStructureForModify,

    // Actions
    fetchStructures,
    fetchLineItems,
    setActiveStructureHandler,
    deleteStructure,
    handleFileProcessed,
    setSelectedStructureForModify,

    // Permissions
    isSuperAdmin,

    // Helper functions
    formatDate: ReportStructureService.formatDate,
    buildHierarchyTree: LineItemService.buildHierarchyTree,
    getLineItemLevel: LineItemService.getLineItemLevel
  };
}