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
          coa_translation_session_id: number
          coa_translation_session_uuid: string
          completed_at: string | null
          created_at: string
          entity_id: number | null
          entity_uuid: string | null
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
          status_enum: Database["public"]["Enums"]["translation_session_status"]
          target_language: string
          total_accounts: number
          updated_at: string
          user_id: string
          user_uuid: string | null
        }
        Insert: {
          coa_translation_session_id?: never
          coa_translation_session_uuid?: string
          completed_at?: string | null
          created_at?: string
          entity_id?: number | null
          entity_uuid?: string | null
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
          status_enum?: Database["public"]["Enums"]["translation_session_status"]
          target_language: string
          total_accounts: number
          updated_at?: string
          user_id: string
          user_uuid?: string | null
        }
        Update: {
          coa_translation_session_id?: never
          coa_translation_session_uuid?: string
          completed_at?: string | null
          created_at?: string
          entity_id?: number | null
          entity_uuid?: string | null
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
          status_enum?: Database["public"]["Enums"]["translation_session_status"]
          target_language?: string
          total_accounts?: number
          updated_at?: string
          user_id?: string
          user_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_coa_translation_sessions_entity"
            columns: ["entity_uuid"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["entity_uuid"]
          },
          {
            foreignKeyName: "fk_coa_translation_sessions_user_account"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["user_uuid"]
          },
        ]
      }
      entities: {
        Row: {
          created_at: string
          created_by_user_uuid: string | null
          description: string | null
          entity_code: string
          entity_group_id: number
          entity_group_uuid: string
          entity_id: number
          entity_name: string
          entity_uuid: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_uuid?: string | null
          description?: string | null
          entity_code: string
          entity_group_id: number
          entity_group_uuid: string
          entity_id?: never
          entity_name: string
          entity_uuid?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_uuid?: string | null
          description?: string | null
          entity_code?: string
          entity_group_id?: number
          entity_group_uuid?: string
          entity_id?: never
          entity_name?: string
          entity_uuid?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_entities_created_by"
            columns: ["created_by_user_uuid"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["user_uuid"]
          },
          {
            foreignKeyName: "fk_entities_entity_group"
            columns: ["entity_group_uuid"]
            isOneToOne: false
            referencedRelation: "entity_groups"
            referencedColumns: ["entity_group_uuid"]
          },
        ]
      }
      entity_groups: {
        Row: {
          created_at: string
          created_by_user_uuid: string | null
          description: string | null
          entity_group_code: string
          entity_group_id: number
          entity_group_name: string
          entity_group_uuid: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_uuid?: string | null
          description?: string | null
          entity_group_code: string
          entity_group_id?: never
          entity_group_name: string
          entity_group_uuid?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_uuid?: string | null
          description?: string | null
          entity_group_code?: string
          entity_group_id?: never
          entity_group_name?: string
          entity_group_uuid?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_entity_groups_created_by"
            columns: ["created_by_user_uuid"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["user_uuid"]
          },
        ]
      }
      report_line_items: {
        Row: {
          comment: string | null
          created_at: string | null
          created_by: string | null
          created_by_user_uuid: string | null
          data_source: string | null
          description_of_leaf: string | null
          display: boolean | null
          entity_id: number | null
          entity_uuid: string | null
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
          updated_by_user_uuid: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_user_uuid?: string | null
          data_source?: string | null
          description_of_leaf?: string | null
          display?: boolean | null
          entity_id?: number | null
          entity_uuid?: string | null
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
          updated_by_user_uuid?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_user_uuid?: string | null
          data_source?: string | null
          description_of_leaf?: string | null
          display?: boolean | null
          entity_id?: number | null
          entity_uuid?: string | null
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
          updated_by_user_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_report_line_items_created_by_user_account"
            columns: ["created_by_user_uuid"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["user_uuid"]
          },
          {
            foreignKeyName: "fk_report_line_items_entity"
            columns: ["entity_uuid"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["entity_uuid"]
          },
          {
            foreignKeyName: "fk_report_line_items_updated_by_user_account"
            columns: ["updated_by_user_uuid"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["user_uuid"]
          },
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
          archived_by_user_uuid: string | null
          created_at: string
          created_by_supabase_user_uuid: string
          created_by_user_name: string
          description: string | null
          entity_id: number | null
          entity_uuid: string | null
          imported_structure_id: string | null
          is_active: boolean
          lifecycle_status: Database["public"]["Enums"]["report_structure_lifecycle_status"]
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
          archived_by_user_uuid?: string | null
          created_at?: string
          created_by_supabase_user_uuid: string
          created_by_user_name: string
          description?: string | null
          entity_id?: number | null
          entity_uuid?: string | null
          imported_structure_id?: string | null
          is_active?: boolean
          lifecycle_status?: Database["public"]["Enums"]["report_structure_lifecycle_status"]
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
          archived_by_user_uuid?: string | null
          created_at?: string
          created_by_supabase_user_uuid?: string
          created_by_user_name?: string
          description?: string | null
          entity_id?: number | null
          entity_uuid?: string | null
          imported_structure_id?: string | null
          is_active?: boolean
          lifecycle_status?: Database["public"]["Enums"]["report_structure_lifecycle_status"]
          metadata?: Json | null
          name_of_import_file?: string | null
          report_structure_id?: never
          report_structure_name?: string
          report_structure_uuid?: string
          tags?: string[] | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_report_structures_archived_by_user_account"
            columns: ["archived_by_user_uuid"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["user_uuid"]
          },
          {
            foreignKeyName: "fk_report_structures_entity"
            columns: ["entity_uuid"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["entity_uuid"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: number | null
          entity_uuid: string | null
          ip_address: unknown | null
          security_audit_log_id: number
          security_audit_log_uuid: string
          target_user_id: string | null
          target_user_uuid: string | null
          user_agent: string | null
          user_id: string | null
          user_uuid: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: number | null
          entity_uuid?: string | null
          ip_address?: unknown | null
          security_audit_log_id?: never
          security_audit_log_uuid?: string
          target_user_id?: string | null
          target_user_uuid?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_uuid?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: number | null
          entity_uuid?: string | null
          ip_address?: unknown | null
          security_audit_log_id?: never
          security_audit_log_uuid?: string
          target_user_id?: string | null
          target_user_uuid?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_security_audit_logs_entity"
            columns: ["entity_uuid"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["entity_uuid"]
          },
          {
            foreignKeyName: "fk_security_audit_logs_target_user_account"
            columns: ["target_user_uuid"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["user_uuid"]
          },
          {
            foreignKeyName: "fk_security_audit_logs_user_account"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["user_uuid"]
          },
        ]
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
          status_enum: Database["public"]["Enums"]["user_account_status"]
          supabase_user_uuid: string
          timezone: string | null
          updated_at: string | null
          user_id: number
          user_uuid: string
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
          status_enum?: Database["public"]["Enums"]["user_account_status"]
          supabase_user_uuid: string
          timezone?: string | null
          updated_at?: string | null
          user_id?: number
          user_uuid?: string
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
          status_enum?: Database["public"]["Enums"]["user_account_status"]
          supabase_user_uuid?: string
          timezone?: string | null
          updated_at?: string | null
          user_id?: number
          user_uuid?: string
        }
        Relationships: []
      }
      user_entity_access: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          entity_group_id: number | null
          entity_group_uuid: string | null
          entity_id: number | null
          entity_uuid: string | null
          granted_at: string
          granted_by_user_uuid: string | null
          is_active: boolean
          revoked_at: string | null
          user_account_id: number
          user_account_uuid: string
          user_entity_access_id: number
          user_entity_access_uuid: string
        }
        Insert: {
          access_level: Database["public"]["Enums"]["access_level"]
          entity_group_id?: number | null
          entity_group_uuid?: string | null
          entity_id?: number | null
          entity_uuid?: string | null
          granted_at?: string
          granted_by_user_uuid?: string | null
          is_active?: boolean
          revoked_at?: string | null
          user_account_id: number
          user_account_uuid: string
          user_entity_access_id?: never
          user_entity_access_uuid?: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          entity_group_id?: number | null
          entity_group_uuid?: string | null
          entity_id?: number | null
          entity_uuid?: string | null
          granted_at?: string
          granted_by_user_uuid?: string | null
          is_active?: boolean
          revoked_at?: string | null
          user_account_id?: number
          user_account_uuid?: string
          user_entity_access_id?: never
          user_entity_access_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_entity_access_entity"
            columns: ["entity_uuid"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["entity_uuid"]
          },
          {
            foreignKeyName: "fk_user_entity_access_entity_group"
            columns: ["entity_group_uuid"]
            isOneToOne: false
            referencedRelation: "entity_groups"
            referencedColumns: ["entity_group_uuid"]
          },
          {
            foreignKeyName: "fk_user_entity_access_granted_by"
            columns: ["granted_by_user_uuid"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["user_uuid"]
          },
          {
            foreignKeyName: "fk_user_entity_access_user"
            columns: ["user_account_uuid"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["user_uuid"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assigned_by_user_account_uuid: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          user_id: string
          user_role_id: number
          user_role_uuid: string
          user_uuid: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assigned_by_user_account_uuid?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id: string
          user_role_id?: never
          user_role_uuid?: string
          user_uuid?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assigned_by_user_account_uuid?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string
          user_role_id?: never
          user_role_uuid?: string
          user_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_assigned_by_user_account"
            columns: ["assigned_by_user_account_uuid"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["user_uuid"]
          },
          {
            foreignKeyName: "fk_user_roles_user_account"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["user_uuid"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bulk_update_user_status: {
        Args: {
          p_new_status: Database["public"]["Enums"]["user_account_status"]
          p_reason?: string
          p_user_uuids: string[]
        }
        Returns: Json
      }
      check_permission_conflicts: {
        Args: { p_user_uuid: string }
        Returns: {
          access_levels: string[]
          conflict_type: string
          description: string
          entity_name: string
        }[]
      }
      check_rate_limit: {
        Args: {
          identifier: string
          max_attempts?: number
          operation_type: string
          window_minutes?: number
        }
        Returns: boolean
      }
      convert_line_items_to_concatenated_format: {
        Args: { p_structure_id: number }
        Returns: Json
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
      extract_structure_id_from_line_item_id: {
        Args: { p_line_item_id: number }
        Returns: number
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
      get_enhanced_user_management_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_users: number
          entity_admins: number
          pending_users: number
          recent_invitations: number
          suspended_users: number
          total_access_grants: number
          total_users: number
        }[]
      }
      get_enhanced_user_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_users: number
          pending_users: number
          recent_logins: number
          total_line_items: number
          total_structures: number
          user_count: number
        }[]
      }
      get_next_concatenated_line_item_id: {
        Args: { p_structure_id: number }
        Returns: number
      }
      get_report_structure_with_creator: {
        Args: { p_structure_uuid: string }
        Returns: {
          created_at: string
          creator_email: string
          creator_name: string
          is_active: boolean
          line_item_count: number
          report_structure_name: string
          report_structure_uuid: string
          version: number
        }[]
      }
      get_report_structures_by_lifecycle_status: {
        Args: {
          p_status: Database["public"]["Enums"]["report_structure_lifecycle_status"]
        }
        Returns: {
          created_at: string
          is_active: boolean
          lifecycle_status: Database["public"]["Enums"]["report_structure_lifecycle_status"]
          report_structure_name: string
          report_structure_uuid: string
          updated_at: string
          version: number
        }[]
      }
      get_translation_sessions_by_status: {
        Args: {
          p_status: Database["public"]["Enums"]["translation_session_status"]
        }
        Returns: {
          coa_translation_session_uuid: string
          created_at: string
          filename: string
          processed_accounts: number
          progress_percentage: number
          status_enum: Database["public"]["Enums"]["translation_session_status"]
          total_accounts: number
          updated_at: string
        }[]
      }
      get_user_accessible_entities: {
        Args: { p_user_uuid: string }
        Returns: {
          access_level: string
          entity_code: string
          entity_name: string
          entity_uuid: string
        }[]
      }
      get_user_account_by_supabase_uuid: {
        Args: { p_supabase_uuid: string }
        Returns: {
          created_at: string
          email: string
          failed_login_attempts: number
          first_name: string
          last_login_at: string
          last_name: string
          status: string
          user_id: number
          user_uuid: string
        }[]
      }
      get_user_effective_permissions: {
        Args: { p_user_uuid: string }
        Returns: {
          access_level: Database["public"]["Enums"]["access_level"]
          entity_group_name: string
          entity_group_uuid: string
          entity_name: string
          entity_uuid: string
          granted_at: string
          granted_by_name: string
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
      get_user_with_roles: {
        Args: { p_supabase_user_uuid: string }
        Returns: {
          email: string
          first_name: string
          is_admin: boolean
          is_super_admin: boolean
          last_name: string
          roles: string[]
          status: string
          user_uuid: string
        }[]
      }
      get_users_by_status: {
        Args: { p_status: Database["public"]["Enums"]["user_account_status"] }
        Returns: {
          created_at: string
          email: string
          first_name: string
          last_name: string
          status_enum: Database["public"]["Enums"]["user_account_status"]
          updated_at: string
          user_uuid: string
        }[]
      }
      get_valid_user_account_status_transitions: {
        Args: {
          p_current_status: Database["public"]["Enums"]["user_account_status"]
        }
        Returns: Database["public"]["Enums"]["user_account_status"][]
      }
      grant_entity_access: {
        Args:
          | {
              p_access_level: Database["public"]["Enums"]["access_level"]
              p_entity_group_uuid?: string
              p_entity_uuid?: string
              p_granted_by_user_uuid: string
              p_user_uuid: string
            }
          | {
              p_access_level: Database["public"]["Enums"]["access_level"]
              p_entity_uuid: string
              p_granted_by_user_uuid: string
              p_user_uuid: string
            }
        Returns: boolean
      }
      grant_entity_group_access: {
        Args: {
          p_access_level: Database["public"]["Enums"]["access_level"]
          p_entity_group_uuid: string
          p_granted_by_user_uuid: string
          p_user_uuid: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      invite_user_with_role: {
        Args: {
          p_email: string
          p_first_name?: string
          p_invited_by_uuid?: string
          p_last_name?: string
          p_role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: Json
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user_v2: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_entity_admin_for_scope: {
        Args: {
          p_entity_group_uuid?: string
          p_entity_uuid?: string
          p_user_uuid: string
        }
        Returns: boolean
      }
      is_super_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_valid_report_structure_lifecycle_transition: {
        Args: {
          p_from_status: Database["public"]["Enums"]["report_structure_lifecycle_status"]
          p_to_status: Database["public"]["Enums"]["report_structure_lifecycle_status"]
        }
        Returns: boolean
      }
      is_valid_translation_session_status_transition: {
        Args: {
          p_from_status: Database["public"]["Enums"]["translation_session_status"]
          p_to_status: Database["public"]["Enums"]["translation_session_status"]
        }
        Returns: boolean
      }
      is_valid_user_account_status_transition: {
        Args: {
          p_from_status: Database["public"]["Enums"]["user_account_status"]
          p_to_status: Database["public"]["Enums"]["user_account_status"]
        }
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
      revoke_all_user_access: {
        Args: { p_reason?: string; p_user_uuid: string }
        Returns: Json
      }
      transition_user_account_status: {
        Args: {
          p_new_status: Database["public"]["Enums"]["user_account_status"]
          p_reason?: string
          p_user_uuid: string
        }
        Returns: boolean
      }
      update_sort_orders_transaction: {
        Args: { p_structure_uuid: string; p_updates: Json }
        Returns: Json
      }
      user_has_entity_access: {
        Args: { p_entity_uuid: string; p_user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      access_level: "viewer" | "entity_admin"
      app_role: "super_admin" | "entity_admin" | "viewer"
      change_action_type: "create" | "delete" | "rename" | "move"
      report_structure_lifecycle_status:
        | "draft"
        | "active"
        | "inactive"
        | "archived"
        | "deprecated"
      translation_session_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
        | "paused"
      user_account_status:
        | "pending"
        | "approved"
        | "rejected"
        | "suspended"
        | "archived"
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
      access_level: ["viewer", "entity_admin"],
      app_role: ["super_admin", "entity_admin", "viewer"],
      change_action_type: ["create", "delete", "rename", "move"],
      report_structure_lifecycle_status: [
        "draft",
        "active",
        "inactive",
        "archived",
        "deprecated",
      ],
      translation_session_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "paused",
      ],
      user_account_status: [
        "pending",
        "approved",
        "rejected",
        "suspended",
        "archived",
      ],
    },
  },
} as const
