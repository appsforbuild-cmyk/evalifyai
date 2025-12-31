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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          points?: number
          rarity?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          period_end?: string
          period_start?: string
          skill_gaps?: Json | null
          team?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_feedback_aggregate_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      attrition_prediction_history: {
        Row: {
          employee_id: string
          id: string
          organization_id: string | null
          recorded_at: string
          risk_level: string
          risk_score: number
        }
        Insert: {
          employee_id: string
          id?: string
          organization_id?: string | null
          recorded_at?: string
          risk_level: string
          risk_score: number
        }
        Update: {
          employee_id?: string
          id?: string
          organization_id?: string | null
          recorded_at?: string
          risk_level?: string
          risk_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "attrition_prediction_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      attrition_predictions: {
        Row: {
          confidence: number
          contributing_factors: Json
          created_at: string
          employee_id: string
          id: string
          last_calculated: string
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          predicted_timeframe?: string
          recommended_actions?: Json
          risk_level?: string
          risk_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "attrition_predictions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bias_audit_log: {
        Row: {
          bias_score: number
          content_type: string
          context: string | null
          created_at: string
          id: string
          issues: Json | null
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          original_text?: string
          suggestions_applied?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bias_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bias_training_completions: {
        Row: {
          completed_at: string
          id: string
          module_type: string
          organization_id: string | null
          quiz_score: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          module_type: string
          organization_id?: string | null
          quiz_score?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          module_type?: string
          organization_id?: string | null
          quiz_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bias_training_completions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees_directory: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          org_unit: string | null
          organization_id: string | null
          team: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          org_unit?: string | null
          organization_id?: string | null
          team: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          org_unit?: string | null
          organization_id?: string | null
          team?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_directory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          {
            foreignKeyName: "feedback_audit_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          published_at?: string | null
          session_id?: string
          tone_analysis?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
            foreignKeyName: "feedback_question_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
          organization_id: string | null
          question_text: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          organization_id?: string | null
          question_text: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          organization_id?: string | null
          question_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_questions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          profile_id?: string
          progress?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_completions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          employee_id: string
          id: string
          milestone_key: string
          organization_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          employee_id: string
          id?: string
          milestone_key: string
          organization_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          employee_id?: string
          id?: string
          milestone_key?: string
          organization_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_completions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          channels: Json
          created_at: string
          email_enabled: boolean
          frequency: string
          id: string
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_bias_benchmarks: {
        Row: {
          avg_bias_score: number | null
          bias_type_breakdown: Json | null
          computed_at: string
          department_scores: Json | null
          id: string
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          period_end?: string
          period_start?: string
          total_feedbacks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_bias_benchmarks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          accent_color: string | null
          background_color: string | null
          company_name: string | null
          created_at: string
          custom_branding: Json | null
          date_format: string
          domain_status: string | null
          domain_verification_token: string | null
          email_footer_content: string | null
          email_header_logo_url: string | null
          email_notifications: boolean
          email_templates: Json | null
          error_color: string | null
          feedback_reminder_days: number
          font_body: string | null
          font_heading: string | null
          id: string
          language: string
          logo_icon_url: string | null
          organization_id: string
          platform_name: string | null
          powered_by_enabled: boolean | null
          primary_color: string | null
          secondary_color: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          company_name?: string | null
          created_at?: string
          custom_branding?: Json | null
          date_format?: string
          domain_status?: string | null
          domain_verification_token?: string | null
          email_footer_content?: string | null
          email_header_logo_url?: string | null
          email_notifications?: boolean
          email_templates?: Json | null
          error_color?: string | null
          feedback_reminder_days?: number
          font_body?: string | null
          font_heading?: string | null
          id?: string
          language?: string
          logo_icon_url?: string | null
          organization_id: string
          platform_name?: string | null
          powered_by_enabled?: boolean | null
          primary_color?: string | null
          secondary_color?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          company_name?: string | null
          created_at?: string
          custom_branding?: Json | null
          date_format?: string
          domain_status?: string | null
          domain_verification_token?: string | null
          email_footer_content?: string | null
          email_header_logo_url?: string | null
          email_notifications?: boolean
          email_templates?: Json | null
          error_color?: string | null
          feedback_reminder_days?: number
          font_body?: string | null
          font_heading?: string | null
          id?: string
          language?: string
          logo_icon_url?: string | null
          organization_id?: string
          platform_name?: string | null
          powered_by_enabled?: boolean | null
          primary_color?: string | null
          secondary_color?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_users: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          is_primary_owner: boolean
          joined_at: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          is_primary_owner?: boolean
          joined_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          is_primary_owner?: boolean
          joined_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_email: string | null
          created_at: string
          domain: string | null
          features: Json
          id: string
          logo_url: string | null
          max_storage_gb: number
          max_users: number
          name: string
          plan: Database["public"]["Enums"]["organization_plan"]
          primary_color: string | null
          secondary_color: string | null
          slug: string
          status: Database["public"]["Enums"]["organization_status"]
          subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_email?: string | null
          created_at?: string
          domain?: string | null
          features?: Json
          id?: string
          logo_url?: string | null
          max_storage_gb?: number
          max_users?: number
          name: string
          plan?: Database["public"]["Enums"]["organization_plan"]
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          status?: Database["public"]["Enums"]["organization_status"]
          subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_email?: string | null
          created_at?: string
          domain?: string | null
          features?: Json
          id?: string
          logo_url?: string | null
          max_storage_gb?: number
          max_users?: number
          name?: string
          plan?: Database["public"]["Enums"]["organization_plan"]
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["organization_status"]
          subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          action_type: string
          created_at: string
          id: string
          organization_id: string | null
          points: number
          reference_id: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          organization_id?: string | null
          points: number
          reference_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          points?: number
          reference_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          team?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_feedback: {
        Row: {
          audio_path: string | null
          created_at: string | null
          created_by_profile_id: string
          employee_profile_id: string
          feedback_type: string | null
          id: string
          organization_id: string | null
          transcript: string | null
        }
        Insert: {
          audio_path?: string | null
          created_at?: string | null
          created_by_profile_id: string
          employee_profile_id: string
          feedback_type?: string | null
          id?: string
          organization_id?: string | null
          transcript?: string | null
        }
        Update: {
          audio_path?: string | null
          created_at?: string | null
          created_by_profile_id?: string
          employee_profile_id?: string
          feedback_type?: string | null
          id?: string
          organization_id?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quick_feedback_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recognition_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          organization_id: string | null
          recognition_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          organization_id?: string | null
          recognition_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          recognition_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recognition_comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          organization_id: string | null
          recognition_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          recognition_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          recognition_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recognition_likes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          recognition_type?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recognition_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retention_action_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_view_audit: {
        Row: {
          action: string
          created_at: string
          employee_id: string
          id: string
          organization_id: string | null
          viewer_id: string
        }
        Insert: {
          action?: string
          created_at?: string
          employee_id: string
          id?: string
          organization_id?: string | null
          viewer_id: string
        }
        Update: {
          action?: string
          created_at?: string
          employee_id?: string
          id?: string
          organization_id?: string | null
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_view_audit_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_audit_log: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          provider?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sso_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_config: {
        Row: {
          configuration: Json
          created_at: string
          created_by: string | null
          id: string
          is_enabled: boolean
          new_organization_id: string | null
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
          new_organization_id?: string | null
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
          new_organization_id?: string | null
          organization_id?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_config_new_organization_id_fkey"
            columns: ["new_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          earned_at: string
          id: string
          is_displayed: boolean
          organization_id: string | null
          progress: number
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          earned_at?: string
          id?: string
          is_displayed?: boolean
          organization_id?: string | null
          progress?: number
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          earned_at?: string
          id?: string
          is_displayed?: boolean
          organization_id?: string | null
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
          {
            foreignKeyName: "user_achievements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          success_count?: number
          total_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_import_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          gamification_opt_out: boolean
          id: string
          level: number
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          points_this_month?: number
          points_this_week?: number
          rank?: string
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          question_recordings?: Json | null
          recording_mode?: string | null
          status?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { _token: string }; Returns: Json }
      create_organization_with_owner: {
        Args: { _name: string; _owner_id: string; _slug: string }
        Returns: string
      }
      get_user_org_role: {
        Args: { _org_id: string }
        Returns: Database["public"]["Enums"]["organization_role"]
      }
      get_user_organization_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_belongs_to_org: { Args: { _org_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "manager" | "employee" | "hr" | "admin"
      organization_plan: "starter" | "professional" | "enterprise"
      organization_role: "owner" | "admin" | "manager" | "employee"
      organization_status: "trial" | "active" | "suspended" | "cancelled"
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
      organization_plan: ["starter", "professional", "enterprise"],
      organization_role: ["owner", "admin", "manager", "employee"],
      organization_status: ["trial", "active", "suspended", "cancelled"],
    },
  },
} as const
