export interface ReportStructure {
  report_structure_id: number;
  report_structure_uuid: string;
  report_structure_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_supabase_user_uuid: string;
  created_by_user_name: string;
  version: number;
  name_of_import_file?: string;
  imported_structure_id?: string;
}

export interface ReportLineItem {
  report_line_item_id: number;
  report_line_item_uuid: string;
  report_structure_id: number;
  report_structure_uuid: string;
  report_structure_name: string;
  report_line_item_key: string;
  report_line_item_description?: string;
  parent_report_line_item_key?: string;
  parent_report_line_item_uuid?: string;
  is_parent_key_existing: boolean;
  sort_order: number;
  hierarchy_path?: string;
  level_1_line_item_description?: string;
  level_2_line_item_description?: string;
  level_3_line_item_description?: string;
  level_4_line_item_description?: string;
  level_5_line_item_description?: string;
  level_6_line_item_description?: string;
  level_7_line_item_description?: string;
  is_leaf: boolean;
  is_calculated: boolean;
  display: boolean;
  line_item_type?: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface ProcessStructureData {
  structureData: any[];
  filename: string;
  totalRows: number;
  mappings: any[];
  unmappedColumns: Record<string, any>[];
  overwriteMode: boolean;
  targetStructureId?: string;
  importedStructureId?: string;
  structureName?: string;
}