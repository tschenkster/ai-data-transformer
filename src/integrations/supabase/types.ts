export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      account_mappings: {
        Row: {
          confidence_score: number | null
          created_at: string
          embedding: string | null
          id: string
          mapped_account_name: string
          original_account_name: string
          reasoning: string | null
          user_id: string
          validated: boolean | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          embedding?: string | null
          id?: string
          mapped_account_name: string
          original_account_name: string
          reasoning?: string | null
          user_id: string
          validated?: boolean | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          embedding?: string | null
          id?: string
          mapped_account_name?: string
          original_account_name?: string
          reasoning?: string | null
          user_id?: string
          validated?: boolean | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: []
      }
      mapping_decisions: {
        Row: {
          confidence_score: number | null
          created_at: string
          final_mapping: string | null
          id: string
          original_account_name: string
          reasoning: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          session_id: string
          similar_accounts: Json | null
          status: string
          suggested_mapping: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          final_mapping?: string | null
          id?: string
          original_account_name: string
          reasoning?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id: string
          similar_accounts?: Json | null
          status?: string
          suggested_mapping: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          final_mapping?: string | null
          id?: string
          original_account_name?: string
          reasoning?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id?: string
          similar_accounts?: Json | null
          status?: string
          suggested_mapping?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mapping_decisions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mapping_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mapping_sessions: {
        Row: {
          approved_accounts: number | null
          completed_at: string | null
          created_at: string
          filename: string
          id: string
          processed_accounts: number | null
          status: string
          total_accounts: number
          user_id: string
        }
        Insert: {
          approved_accounts?: number | null
          completed_at?: string | null
          created_at?: string
          filename: string
          id?: string
          processed_accounts?: number | null
          status?: string
          total_accounts: number
          user_id: string
        }
        Update: {
          approved_accounts?: number | null
          completed_at?: string | null
          created_at?: string
          filename?: string
          id?: string
          processed_accounts?: number | null
          status?: string
          total_accounts?: number
          user_id?: string
        }
        Relationships: []
      }
      report_line_items: {
        Row: {
          comment: number | null
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
          parent_report_line_item_key: string | null
          report_line_item_description: string | null
          report_line_item_id: string
          report_line_item_key: string
          report_structure_id: string
          report_structure_name: string
          sort_order: number
        }
        Insert: {
          comment?: number | null
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
          parent_report_line_item_key?: string | null
          report_line_item_description?: string | null
          report_line_item_id?: string
          report_line_item_key: string
          report_structure_id: string
          report_structure_name: string
          sort_order?: number
        }
        Update: {
          comment?: number | null
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
          parent_report_line_item_key?: string | null
          report_line_item_description?: string | null
          report_line_item_id?: string
          report_line_item_key?: string
          report_structure_id?: string
          report_structure_name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_line_items_report_structure_id_fkey"
            columns: ["report_structure_id"]
            isOneToOne: false
            referencedRelation: "report_structures"
            referencedColumns: ["report_structure_id"]
          },
        ]
      }
      report_structures: {
        Row: {
          created_at: string
          created_by_user_id: string
          created_by_user_name: string
          is_active: boolean
          report_structure_id: string
          report_structure_name: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          created_by_user_name: string
          is_active?: boolean
          report_structure_id?: string
          report_structure_name: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          created_by_user_name?: string
          is_active?: boolean
          report_structure_id?: string
          report_structure_name?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      user_accounts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          status: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          status?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_account_embeddings: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
          filter_user_id?: string
        }
        Returns: {
          id: string
          original_account_name: string
          mapped_account_name: string
          confidence_score: number
          reasoning: string
          similarity: number
          validated: boolean
          created_at: string
          user_id: string
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
