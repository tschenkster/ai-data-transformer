import { supabase } from '@/integrations/supabase/client';
import { ReportStructure, ProcessStructureData } from '@/features/report-structures/types';
import { TranslationService } from '@/services/translationService';

export class ReportStructureService {
  static async fetchStructures(languageCode?: string): Promise<ReportStructure[]> {
    const { data, error } = await supabase
      .from('report_structures')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    if (!data || !languageCode) return data || [];

    // Fetch translations for each structure
    const structuresWithTranslations = await Promise.all(
      data.map(async (structure) => {
        try {
          const translatedName = await TranslationService.getTranslation(
            'report_structure',
            structure.report_structure_uuid,
            'report_structure_name',
            languageCode
          );
          
          return {
            ...structure,
            report_structure_name: translatedName.startsWith('[missing:') 
              ? structure.report_structure_name 
              : translatedName
          };
        } catch (error) {
          console.error('Translation fetch failed for structure:', structure.report_structure_uuid, error);
          return structure;
        }
      })
    );

    return structuresWithTranslations;
  }

  static async setActiveStructure(structureId: number): Promise<void> {
    const { error } = await supabase
      .from('report_structures')
      .update({ is_active: true })
      .eq('report_structure_id', structureId);

    if (error) throw error;
  }

  static async deleteStructure(structureId: number): Promise<void> {
    const { error } = await supabase
      .from('report_structures')
      .delete()
      .eq('report_structure_id', structureId);

    if (error) throw error;
  }

  static async processStructureFile(
    fileData: ProcessStructureData,
    userId: string,
    userEmail: string
  ): Promise<any> {
    const { data: result, error } = await supabase.functions.invoke('process-report-structure', {
      body: {
        structureData: fileData.structureData,
        filename: fileData.filename,
        userId: userId,
        userEmail: userEmail,
        structureName: fileData.structureName,
        overwriteMode: fileData.overwriteMode,
        targetStructureId: fileData.targetStructureId,
        unmappedColumns: fileData.unmappedColumns,
        columnMappings: fileData.mappings,
        importedStructureId: fileData.importedStructureId,
      },
    });

    if (error) throw error;
    return result;
  }

  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    const dayMonth = date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const time = date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${dayMonth} ${time}`;
  }

  static getActiveStructure(structures: ReportStructure[]): ReportStructure | null {
    return structures.find(s => s.is_active) || null;
  }
}