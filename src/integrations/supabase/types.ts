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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics_feedback_aggregate: {
        Row: {
          avg_fairness: number | null
          avg_sentiment: number | null
          computed_at: string
          feedback_count: number | null
          id: string
          metadata: Json | null
          org_unit: string | null
          period_end: string
          period_start: string
          skill_gaps: Json | null
          team: string | null
        }
        Insert: {
          avg_fairness?: number | null
          avg_sentiment?: number | null
          computed_at?: string
          feedback_count?: number | null
          id?: string
          metadata?: Json | null
          org_unit?: string | null
          period_end: string
          period_start: string
          skill_gaps?: Json | null
          team?: string | null
        }
        Update: {
          avg_fairness?: number | null
          avg_sentiment?: number | null
          computed_at?: string
          feedback_count?: number | null
          id?: string
          metadata?: Json | null
          org_unit?: string | null
          period_end?: string
          period_start?: string
          skill_gaps?: Json | null
          team?: string | null
        }
        Relationships: []
      }
      employees_directory: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          org_unit: string | null
          team: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          org_unit?: string | null
          team: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          org_unit?: string | null
          team?: string
        }
        Relationships: []
      }
      feedback_audit: {
        Row: {
          action: string
          can_undo_until: string | null
          feedback_id: string
          id: string
          is_undone: boolean | null
          metadata: Json | null
          new_content: string | null
          new_tone: string | null
          performed_at: string
          performed_by: string
          previous_content: string | null
          previous_tone: string | null
        }
        Insert: {
          action: string
          can_undo_until?: string | null
          feedback_id: string
          id?: string
          is_undone?: boolean | null
          metadata?: Json | null
          new_content?: string | null
          new_tone?: string | null
          performed_at?: string
          performed_by: string
          previous_content?: string | null
          previous_tone?: string | null
        }
        Update: {
          action?: string
          can_undo_until?: string | null
          feedback_id?: string
          id?: string
          is_undone?: boolean | null
          metadata?: Json | null
          new_content?: string | null
          new_tone?: string | null
          performed_at?: string
          performed_by?: string
          previous_content?: string | null
          previous_tone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_audit_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_entries: {
        Row: {
          ai_draft: string | null
          competency_tags: string[] | null
          created_at: string | null
          final_feedback: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          session_id: string
          tone_analysis: Json | null
          updated_at: string | null
        }
        Insert: {
          ai_draft?: string | null
          competency_tags?: string[] | null
          created_at?: string | null
          final_feedback?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          session_id: string
          tone_analysis?: Json | null
          updated_at?: string | null
        }
        Update: {
          ai_draft?: string | null
          competency_tags?: string[] | null
          created_at?: string | null
          final_feedback?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          session_id?: string
          tone_analysis?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "voice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_question_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          parent_template_id: string | null
          questions: Json
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          parent_template_id?: string | null
          questions?: Json
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          parent_template_id?: string | null
          questions?: Json
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "feedback_question_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feedback_question_templates_parent_template_id_fkey"
            columns: ["parent_template_id"]
            isOneToOne: false
            referencedRelation: "feedback_question_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_questions: {
        Row: {
          category: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          question_text: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          question_text: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          question_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          profile_id: string
          progress: number | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          profile_id: string
          progress?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          profile_id?: string
          progress?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      milestone_completions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          employee_id: string
          id: string
          milestone_key: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          employee_id: string
          id?: string
          milestone_key: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          employee_id?: string
          id?: string
          milestone_key?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          org_unit: string | null
          team: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          org_unit?: string | null
          team?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          org_unit?: string | null
          team?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quick_feedback: {
        Row: {
          audio_path: string | null
          created_at: string | null
          created_by_profile_id: string
          employee_profile_id: string
          feedback_type: string | null
          id: string
          transcript: string | null
        }
        Insert: {
          audio_path?: string | null
          created_at?: string | null
          created_by_profile_id: string
          employee_profile_id: string
          feedback_type?: string | null
          id?: string
          transcript?: string | null
        }
        Update: {
          audio_path?: string | null
          created_at?: string | null
          created_by_profile_id?: string
          employee_profile_id?: string
          feedback_type?: string | null
          id?: string
          transcript?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voice_sessions: {
        Row: {
          audio_url: string | null
          created_at: string | null
          current_question_index: number | null
          description: string | null
          employee_id: string
          id: string
          is_complete: boolean | null
          manager_id: string
          question_recordings: Json | null
          recording_mode: string | null
          status: string | null
          title: string
          transcript: string | null
          updated_at: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          current_question_index?: number | null
          description?: string | null
          employee_id: string
          id?: string
          is_complete?: boolean | null
          manager_id: string
          question_recordings?: Json | null
          recording_mode?: string | null
          status?: string | null
          title: string
          transcript?: string | null
          updated_at?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          current_question_index?: number | null
          description?: string | null
          employee_id?: string
          id?: string
          is_complete?: boolean | null
          manager_id?: string
          question_recordings?: Json | null
          recording_mode?: string | null
          status?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "manager" | "employee" | "hr" | "admin"
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
      app_role: ["manager", "employee", "hr", "admin"],
    },
  },
} as const
