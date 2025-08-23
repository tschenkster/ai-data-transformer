export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      coa_translation_sessions: {
        Row: {
          coa_translation_session_uuid: string
          completed_at: string | null
          created_at: string
          error_details: Json | null
          estimated_completion_at: string | null
          filename: string
          processed_accounts: number | null
          progress_percentage: number | null
          retry_count: number | null
          session_data: Json
          session_id: string
          source_language: string | null
          status: string
          target_language: string
          total_accounts: number
          updated_at: string
          user_account_uuid: string | null
          user_id: string
        }
        Insert: {
          coa_translation_session_uuid?: string
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          estimated_completion_at?: string | null
          filename: string
          processed_accounts?: number | null
          progress_percentage?: number | null
          retry_count?: number | null
          session_data?: Json
          session_id?: string
          source_language?: string | null
          status?: string
          target_language: string
          total_accounts: number
          updated_at?: string
          user_account_uuid?: string | null
          user_id: string
        }
        Update: {
          coa_translation_session_uuid?: string
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          estimated_completion_at?: string | null
          filename?: string
          processed_accounts?: number | null
          progress_percentage?: number | null
          retry_count?: number | null
          session_data?: Json
          session_id?: string
          source_language?: string | null
          status?: string
          target_language?: string
          total_accounts?: number
          updated_at?: string
          user_account_uuid?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_line_items: {
        Row: {
          comment: string | null
          created_at: string | null
          created_by: string | null
          created_by_user_account_uuid: string | null
          data_source: string | null
          description_of_leaf: string | null
          display: boolean | null
          hierarchy_path: string | null
          is_calculated: boolean | null
          is_leaf: boolean | null
          is_parent_key_existing: boolean | null
          level_1_line_item_description: string | null
          level_2_line_item_description: string | null
          level_3_line_item_description: string | null
          level_4_line_item_description: string | null
          level_5_line_item_description: string | null
          level_6_line_item_description: string | null
          level_7_line_item_description: string | null
          line_item_type: string | null
          metadata: Json | null
          parent_report_line_item_key: string | null
          parent_report_line_item_uuid: string | null
          report_line_item_description: string | null
          report_line_item_id: number
          report_line_item_key: string
          report_line_item_uuid: string
          report_structure_id: number
          report_structure_name: string
          report_structure_uuid: string
          sort_order: number
          tags: string[] | null
          updated_at: string | null
          updated_by: string | null
          updated_by_user_account_uuid: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_user_account_uuid?: string | null
          data_source?: string | null
          description_of_leaf?: string | null
          display?: boolean | null
          hierarchy_path?: string | null
          is_calculated?: boolean | null
          is_leaf?: boolean | null
          is_parent_key_existing?: boolean | null
          level_1_line_item_description?: string | null
          level_2_line_item_description?: string | null
          level_3_line_item_description?: string | null
          level_4_line_item_description?: string | null
          level_5_line_item_description?: string | null
          level_6_line_item_description?: string | null
          level_7_line_item_description?: string | null
          line_item_type?: string | null
          metadata?: Json | null
          parent_report_line_item_key?: string | null
          parent_report_line_item_uuid?: string | null
          report_line_item_description?: string | null
          report_line_item_id?: never
          report_line_item_key: string
          report_line_item_uuid?: string
          report_structure_id: number
          report_structure_name: string
          report_structure_uuid: string
          sort_order?: number
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
          updated_by_user_account_uuid?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_user_account_uuid?: string | null
          data_source?: string | null
          description_of_leaf?: string | null
          display?: boolean | null
          hierarchy_path?: string | null
          is_calculated?: boolean | null
          is_leaf?: boolean | null
          is_parent_key_existing?: boolean | null
          level_1_line_item_description?: string | null
          level_2_line_item_description?: string | null
          level_3_line_item_description?: string | null
          level_4_line_item_description?: string | null
          level_5_line_item_description?: string | null
          level_6_line_item_description?: string | null
          level_7_line_item_description?: string | null
          line_item_type?: string | null
          metadata?: Json | null
          parent_report_line_item_key?: string | null
          parent_report_line_item_uuid?: string | null
          report_line_item_description?: string | null
          report_line_item_id?: never
          report_line_item_key?: string
          report_line_item_uuid?: string
          report_structure_id?: number
          report_structure_name?: string
          report_structure_uuid?: string
          sort_order?: number
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
          updated_by_user_account_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_line_items_report_structure_id_fkey"
            columns: ["report_structure_id"]
            isOneToOne: false
            referencedRelation: "report_structures"
            referencedColumns: ["report_structure_id"]
          },
          {
            foreignKeyName: "report_line_items_report_structure_uuid_fkey"
            columns: ["report_structure_uuid"]
            isOneToOne: false
            referencedRelation: "report_structures"
            referencedColumns: ["report_structure_uuid"]
          },
        ]
      }
      report_structure_change_logs: {
        Row: {
          action_type: Database["public"]["Enums"]["change_action_type"]
          change_id: number
          change_uuid: string
          is_undone: boolean
          line_item_description: string | null
          line_item_id: number | null
          line_item_key: string
          line_item_uuid: string | null
          new_state: Json | null
          previous_state: Json | null
          structure_id: number
          structure_uuid: string
          timestamp: string
          undone_at: string | null
          undone_by_uuid: string | null
          user_email: string | null
          user_first_name: string | null
          user_last_name: string | null
          user_uuid: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["change_action_type"]
          change_id?: number
          change_uuid?: string
          is_undone?: boolean
          line_item_description?: string | null
          line_item_id?: number | null
          line_item_key: string
          line_item_uuid?: string | null
          new_state?: Json | null
          previous_state?: Json | null
          structure_id: number
          structure_uuid: string
          timestamp?: string
          undone_at?: string | null
          undone_by_uuid?: string | null
          user_email?: string | null
          user_first_name?: string | null
          user_last_name?: string | null
          user_uuid: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["change_action_type"]
          change_id?: number
          change_uuid?: string
          is_undone?: boolean
          line_item_description?: string | null
          line_item_id?: number | null
          line_item_key?: string
          line_item_uuid?: string | null
          new_state?: Json | null
          previous_state?: Json | null
          structure_id?: number
          structure_uuid?: string
          timestamp?: string
          undone_at?: string | null
          undone_by_uuid?: string | null
          user_email?: string | null
          user_first_name?: string | null
          user_last_name?: string | null
          user_uuid?: string
        }
        Relationships: []
      }
      report_structures: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          archived_by_user_account_uuid: string | null
          created_at: string
          created_by_supabase_user_uuid: string
          created_by_user_name: string
          description: string | null
          imported_structure_id: string | null
          is_active: boolean
          metadata: Json | null
          name_of_import_file: string | null
          report_structure_id: number
          report_structure_name: string
          report_structure_uuid: string
          tags: string[] | null
          updated_at: string
          version: number
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          archived_by_user_account_uuid?: string | null
          created_at?: string
          created_by_supabase_user_uuid: string
          created_by_user_name: string
          description?: string | null
          imported_structure_id?: string | null
          is_active?: boolean
          metadata?: Json | null
          name_of_import_file?: string | null
          report_structure_id?: never
          report_structure_name: string
          report_structure_uuid?: string
          tags?: string[] | null
          updated_at?: string
          version?: number
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          archived_by_user_account_uuid?: string | null
          created_at?: string
          created_by_supabase_user_uuid?: string
          created_by_user_name?: string
          description?: string | null
          imported_structure_id?: string | null
          is_active?: boolean
          metadata?: Json | null
          name_of_import_file?: string | null
          report_structure_id?: never
          report_structure_name?: string
          report_structure_uuid?: string
          tags?: string[] | null
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          ip_address: unknown | null
          security_audit_log_uuid: string
          target_user_account_uuid: string | null
          target_user_id: string | null
          user_account_uuid: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          ip_address?: unknown | null
          security_audit_log_uuid?: string
          target_user_account_uuid?: string | null
          target_user_id?: string | null
          user_account_uuid?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          ip_address?: unknown | null
          security_audit_log_uuid?: string
          target_user_account_uuid?: string | null
          target_user_id?: string | null
          user_account_uuid?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_accounts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          failed_login_attempts: number | null
          first_name: string | null
          last_login_at: string | null
          last_name: string | null
          locale: string | null
          locked_until: string | null
          password_changed_at: string | null
          phone_number: string | null
          status: string
          supabase_user_uuid: string
          timezone: string | null
          updated_at: string | null
          user_account_id: number
          user_account_uuid: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          failed_login_attempts?: number | null
          first_name?: string | null
          last_login_at?: string | null
          last_name?: string | null
          locale?: string | null
          locked_until?: string | null
          password_changed_at?: string | null
          phone_number?: string | null
          status?: string
          supabase_user_uuid: string
          timezone?: string | null
          updated_at?: string | null
          user_account_id?: number
          user_account_uuid?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          failed_login_attempts?: number | null
          first_name?: string | null
          last_login_at?: string | null
          last_name?: string | null
          locale?: string | null
          locked_until?: string | null
          password_changed_at?: string | null
          phone_number?: string | null
          status?: string
          supabase_user_uuid?: string
          timezone?: string | null
          updated_at?: string | null
          user_account_id?: number
          user_account_uuid?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assigned_by_user_account_uuid: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_account_uuid: string | null
          user_id: string
          user_role_uuid: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assigned_by_user_account_uuid?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_account_uuid?: string | null
          user_id: string
          user_role_uuid?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assigned_by_user_account_uuid?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_account_uuid?: string | null
          user_id?: string
          user_role_uuid?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          identifier: string
          max_attempts?: number
          operation_type: string
          window_minutes?: number
        }
        Returns: boolean
      }
      detect_suspicious_activity: {
        Args: { p_time_window_minutes?: number; p_user_id: string }
        Returns: boolean
      }
      enhanced_log_security_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_identifier?: string
          p_target_user_id?: string
        }
        Returns: string
      }
      get_current_user_details: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_email: string
          user_first_name: string
          user_last_name: string
          user_uuid: string
        }[]
      }
      get_user_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_users: number
          pending_users: number
          total_structures: number
          user_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user_v2: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_failed_auth_attempt: {
        Args: { p_email: string; p_ip_address?: unknown; p_user_agent?: string }
        Returns: undefined
      }
      log_security_event: {
        Args: { p_action: string; p_details?: Json; p_target_user_id?: string }
        Returns: string
      }
      log_structure_change: {
        Args: {
          p_action_type: Database["public"]["Enums"]["change_action_type"]
          p_line_item_description: string
          p_line_item_id: number
          p_line_item_key: string
          p_line_item_uuid: string
          p_new_state?: Json
          p_previous_state?: Json
          p_structure_id: number
          p_structure_uuid: string
        }
        Returns: string
      }
      reorder_line_item_with_hierarchy: {
        Args: {
          p_drop_position?: string
          p_is_calculated_override?: boolean
          p_line_item_type_override?: string
          p_moved_item_uuid: string
          p_new_description?: string
          p_new_parent_uuid?: string
          p_regenerate_keys?: boolean
          p_structure_uuid: string
          p_target_position?: number
          p_target_sibling_uuid?: string
        }
        Returns: Json
      }
      update_sort_orders_transaction: {
        Args: { p_structure_uuid: string; p_updates: Json }
        Returns: Json
      }
    }
    Enums: {
      app_role: "user" | "admin" | "super_admin"
      change_action_type: "create" | "delete" | "rename" | "move"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "admin", "super_admin"],
      change_action_type: ["create", "delete", "rename", "move"],
    },
  },
} as const
