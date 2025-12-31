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
      achievements: {
        Row: {
          category: string
          created_at: string
          criteria: Json
          description: string
          icon: string
          id: string
          name: string
          points: number
          rarity: string
        }
        Insert: {
          category?: string
          created_at?: string
          criteria?: Json
          description: string
          icon?: string
          id?: string
          name: string
          points?: number
          rarity?: string
        }
        Update: {
          category?: string
          created_at?: string
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number
          rarity?: string
        }
        Relationships: []
      }
      admin_api_keys: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
        }
        Relationships: []
      }
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
      attrition_prediction_history: {
        Row: {
          employee_id: string
          id: string
          recorded_at: string
          risk_level: string
          risk_score: number
        }
        Insert: {
          employee_id: string
          id?: string
          recorded_at?: string
          risk_level: string
          risk_score: number
        }
        Update: {
          employee_id?: string
          id?: string
          recorded_at?: string
          risk_level?: string
          risk_score?: number
        }
        Relationships: []
      }
      attrition_predictions: {
        Row: {
          confidence: number
          contributing_factors: Json
          created_at: string
          employee_id: string
          id: string
          last_calculated: string
          predicted_timeframe: string
          recommended_actions: Json
          risk_level: string
          risk_score: number
        }
        Insert: {
          confidence?: number
          contributing_factors?: Json
          created_at?: string
          employee_id: string
          id?: string
          last_calculated?: string
          predicted_timeframe?: string
          recommended_actions?: Json
          risk_level: string
          risk_score: number
        }
        Update: {
          confidence?: number
          contributing_factors?: Json
          created_at?: string
          employee_id?: string
          id?: string
          last_calculated?: string
          predicted_timeframe?: string
          recommended_actions?: Json
          risk_level?: string
          risk_score?: number
        }
        Relationships: []
      }
      bias_audit_log: {
        Row: {
          bias_score: number
          content_type: string
          context: string | null
          created_at: string
          id: string
          issues: Json | null
          original_text: string
          suggestions_applied: Json | null
          user_id: string
        }
        Insert: {
          bias_score: number
          content_type: string
          context?: string | null
          created_at?: string
          id?: string
          issues?: Json | null
          original_text: string
          suggestions_applied?: Json | null
          user_id: string
        }
        Update: {
          bias_score?: number
          content_type?: string
          context?: string | null
          created_at?: string
          id?: string
          issues?: Json | null
          original_text?: string
          suggestions_applied?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      bias_training_completions: {
        Row: {
          completed_at: string
          id: string
          module_type: string
          quiz_score: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          module_type: string
          quiz_score?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          module_type?: string
          quiz_score?: number | null
          user_id?: string
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
      notification_preferences: {
        Row: {
          channels: Json
          created_at: string
          email_enabled: boolean
          frequency: string
          id: string
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          channels?: Json
          created_at?: string
          email_enabled?: boolean
          frequency?: string
          id?: string
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          channels?: Json
          created_at?: string
          email_enabled?: boolean
          frequency?: string
          id?: string
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_bias_benchmarks: {
        Row: {
          avg_bias_score: number | null
          bias_type_breakdown: Json | null
          computed_at: string
          department_scores: Json | null
          id: string
          period_end: string
          period_start: string
          total_feedbacks: number | null
        }
        Insert: {
          avg_bias_score?: number | null
          bias_type_breakdown?: Json | null
          computed_at?: string
          department_scores?: Json | null
          id?: string
          period_end: string
          period_start: string
          total_feedbacks?: number | null
        }
        Update: {
          avg_bias_score?: number | null
          bias_type_breakdown?: Json | null
          computed_at?: string
          department_scores?: Json | null
          id?: string
          period_end?: string
          period_start?: string
          total_feedbacks?: number | null
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          action_type: string
          created_at: string
          id: string
          points: number
          reference_id: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          points: number
          reference_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          points?: number
          reference_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          attrition_opt_out: boolean | null
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
          attrition_opt_out?: boolean | null
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
          attrition_opt_out?: boolean | null
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
      recognition_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          recognition_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          recognition_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          recognition_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recognition_comments_recognition_id_fkey"
            columns: ["recognition_id"]
            isOneToOne: false
            referencedRelation: "recognition_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      recognition_likes: {
        Row: {
          created_at: string
          id: string
          recognition_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recognition_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recognition_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recognition_likes_recognition_id_fkey"
            columns: ["recognition_id"]
            isOneToOne: false
            referencedRelation: "recognition_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      recognition_posts: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          is_public: boolean
          likes: number
          message: string
          recognition_type: string
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          is_public?: boolean
          likes?: number
          message: string
          recognition_type?: string
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          is_public?: boolean
          likes?: number
          message?: string
          recognition_type?: string
          to_user_id?: string
        }
        Relationships: []
      }
      retention_action_plans: {
        Row: {
          actions: Json
          completed_at: string | null
          created_at: string
          created_by: string
          employee_id: string
          id: string
          impact_score_after: number | null
          impact_score_before: number | null
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          completed_at?: string | null
          created_at?: string
          created_by: string
          employee_id: string
          id?: string
          impact_score_after?: number | null
          impact_score_before?: number | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          completed_at?: string | null
          created_at?: string
          created_by?: string
          employee_id?: string
          id?: string
          impact_score_after?: number | null
          impact_score_before?: number | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      risk_view_audit: {
        Row: {
          action: string
          created_at: string
          employee_id: string
          id: string
          viewer_id: string
        }
        Insert: {
          action?: string
          created_at?: string
          employee_id: string
          id?: string
          viewer_id: string
        }
        Update: {
          action?: string
          created_at?: string
          employee_id?: string
          id?: string
          viewer_id?: string
        }
        Relationships: []
      }
      sso_audit_log: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          provider: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          provider?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          provider?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sso_config: {
        Row: {
          configuration: Json
          created_at: string
          created_by: string | null
          id: string
          is_enabled: boolean
          organization_id: string
          provider: string
          updated_at: string
        }
        Insert: {
          configuration?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_enabled?: boolean
          organization_id?: string
          provider: string
          updated_at?: string
        }
        Update: {
          configuration?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_enabled?: boolean
          organization_id?: string
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          earned_at: string
          id: string
          is_displayed: boolean
          progress: number
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          earned_at?: string
          id?: string
          is_displayed?: boolean
          progress?: number
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          earned_at?: string
          id?: string
          is_displayed?: boolean
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_import_history: {
        Row: {
          created_at: string
          error_count: number
          error_details: Json | null
          id: string
          imported_by: string
          method: string
          success_count: number
          total_count: number
        }
        Insert: {
          created_at?: string
          error_count?: number
          error_details?: Json | null
          id?: string
          imported_by: string
          method: string
          success_count?: number
          total_count?: number
        }
        Update: {
          created_at?: string
          error_count?: number
          error_details?: Json | null
          id?: string
          imported_by?: string
          method?: string
          success_count?: number
          total_count?: number
        }
        Relationships: []
      }
      user_points: {
        Row: {
          gamification_opt_out: boolean
          id: string
          level: number
          points_this_month: number
          points_this_week: number
          rank: string
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          gamification_opt_out?: boolean
          id?: string
          level?: number
          points_this_month?: number
          points_this_week?: number
          rank?: string
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          gamification_opt_out?: boolean
          id?: string
          level?: number
          points_this_month?: number
          points_this_week?: number
          rank?: string
          total_points?: number
          updated_at?: string
          user_id?: string
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
