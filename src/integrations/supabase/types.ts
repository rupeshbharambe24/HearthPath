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
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      college_domains: {
        Row: {
          college_name: string
          created_at: string
          domain: string
          id: string
          status: string
        }
        Insert: {
          college_name: string
          created_at?: string
          domain: string
          id?: string
          status?: string
        }
        Update: {
          college_name?: string
          created_at?: string
          domain?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      compatibility_snapshots: {
        Row: {
          candidate_user_id: string
          compatibility_score: number
          computed_at: string
          discovery_mode: string
          id: string
          rationale: string[]
          score_band: string
          shared_values: string[]
          viewer_user_id: string
        }
        Insert: {
          candidate_user_id: string
          compatibility_score: number
          computed_at?: string
          discovery_mode: string
          id?: string
          rationale?: string[]
          score_band: string
          shared_values?: string[]
          viewer_user_id: string
        }
        Update: {
          candidate_user_id?: string
          compatibility_score?: number
          computed_at?: string
          discovery_mode?: string
          id?: string
          rationale?: string[]
          score_band?: string
          shared_values?: string[]
          viewer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compatibility_snapshots_candidate_user_id_fkey"
            columns: ["candidate_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compatibility_snapshots_viewer_user_id_fkey"
            columns: ["viewer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_actions: {
        Row: {
          action_date: string
          action_type: string
          actor_user_id: string
          created_at: string
          id: string
          metadata: Json
          target_user_id: string
        }
        Insert: {
          action_date?: string
          action_type: string
          actor_user_id: string
          created_at?: string
          id?: string
          metadata?: Json
          target_user_id: string
        }
        Update: {
          action_date?: string
          action_type?: string
          actor_user_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_actions_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_actions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_summaries: {
        Row: {
          consent_scope: string | null
          created_at: string
          generated_by: string
          id: string
          metadata: Json
          relationship_id: string
          source_scope: string
          summary: string
          summary_kind: string
          title: string
          visibility: string
        }
        Insert: {
          consent_scope?: string | null
          created_at?: string
          generated_by: string
          id?: string
          metadata?: Json
          relationship_id: string
          source_scope: string
          summary: string
          summary_kind: string
          title: string
          visibility: string
        }
        Update: {
          consent_scope?: string | null
          created_at?: string
          generated_by?: string
          id?: string
          metadata?: Json
          relationship_id?: string
          source_scope?: string
          summary?: string
          summary_kind?: string
          title?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_summaries_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_summaries_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      fun_posts: {
        Row: {
          correct_answer: string | null
          created_at: string | null
          id: string
          message: string | null
          owner_id: string | null
          question: string | null
          target_user: string | null
          type: string
          visible_to_target: boolean | null
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          owner_id?: string | null
          question?: string | null
          target_user?: string | null
          type: string
          visible_to_target?: boolean | null
        }
        Update: {
          correct_answer?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          owner_id?: string | null
          question?: string | null
          target_user?: string | null
          type?: string
          visible_to_target?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fun_posts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fun_posts_target_user_fkey"
            columns: ["target_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          archived_at: string | null
          attachment_type: string | null
          attachment_url: string | null
          created_at: string | null
          created_by: string | null
          entry_type: string | null
          id: string
          level_at: number | null
          memo_text: string | null
          mood: string | null
          reflection_follow_up: string | null
          relationship_id: string | null
          tags: string[] | null
          visibility: string | null
        }
        Insert: {
          archived_at?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string | null
          created_by?: string | null
          entry_type?: string | null
          id?: string
          level_at?: number | null
          memo_text?: string | null
          mood?: string | null
          reflection_follow_up?: string | null
          relationship_id?: string | null
          tags?: string[] | null
          visibility?: string | null
        }
        Update: {
          archived_at?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string | null
          created_by?: string | null
          entry_type?: string | null
          id?: string
          level_at?: number | null
          memo_text?: string | null
          mood?: string | null
          reflection_follow_up?: string | null
          relationship_id?: string | null
          tags?: string[] | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          content_type: string | null
          created_at: string | null
          id: string
          read_at: string | null
          receiver_id: string | null
          sender_id: string | null
        }
        Insert: {
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_permissions: {
        Row: {
          created_at: string
          granted_at: string
          granted_by: string
          granted_to: string
          id: string
          permission: string
          relationship_id: string
          revoked_at: string | null
        }
        Insert: {
          created_at?: string
          granted_at?: string
          granted_by: string
          granted_to: string
          id?: string
          permission: string
          relationship_id: string
          revoked_at?: string | null
        }
        Update: {
          created_at?: string
          granted_at?: string
          granted_by?: string
          granted_to?: string
          id?: string
          permission?: string
          relationship_id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relationship_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_permissions_granted_to_fkey"
            columns: ["granted_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_permissions_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          relationship_id: string | null
          reporter_user_id: string
          status: string
          target_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          relationship_id?: string | null
          reporter_user_id: string
          status?: string
          target_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          relationship_id?: string | null
          reporter_user_id?: string
          status?: string
          target_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          relationship_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          relationship_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          relationship_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_events_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      relationships: {
        Row: {
          agreements_summary: string | null
          archived_at: string | null
          boundary_topics: string[] | null
          cooldown_until: string | null
          current_level: number | null
          current_stage: number | null
          exclusive_locked_at: string | null
          hearts_a2b: number | null
          hearts_b2a: number | null
          id: string
          lifecycle_state: string | null
          pace_preference: string | null
          paused_at: string | null
          requested_stage: number | null
          stage_request_cooldown_until: string | null
          stage_request_from_user_id: string | null
          stage_request_status: string | null
          status: string | null
          trust_score: number | null
          updated_at: string | null
          user_a: string | null
          user_b: string | null
        }
        Insert: {
          agreements_summary?: string | null
          archived_at?: string | null
          boundary_topics?: string[] | null
          cooldown_until?: string | null
          current_level?: number | null
          current_stage?: number | null
          exclusive_locked_at?: string | null
          hearts_a2b?: number | null
          hearts_b2a?: number | null
          id?: string
          lifecycle_state?: string | null
          pace_preference?: string | null
          paused_at?: string | null
          requested_stage?: number | null
          stage_request_cooldown_until?: string | null
          stage_request_from_user_id?: string | null
          stage_request_status?: string | null
          status?: string | null
          trust_score?: number | null
          updated_at?: string | null
          user_a?: string | null
          user_b?: string | null
        }
        Update: {
          agreements_summary?: string | null
          archived_at?: string | null
          boundary_topics?: string[] | null
          cooldown_until?: string | null
          current_level?: number | null
          current_stage?: number | null
          exclusive_locked_at?: string | null
          hearts_a2b?: number | null
          hearts_b2a?: number | null
          id?: string
          lifecycle_state?: string | null
          pace_preference?: string | null
          paused_at?: string | null
          requested_stage?: number | null
          stage_request_cooldown_until?: string | null
          stage_request_from_user_id?: string | null
          stage_request_status?: string | null
          status?: string | null
          trust_score?: number | null
          updated_at?: string | null
          user_a?: string | null
          user_b?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relationships_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action_type: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          report_id: string | null
          target_user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          report_id?: string | null
          target_user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          report_id?: string | null
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_user_id: string | null
          created_at: string
          id: string
          kind:
            | "stage_requested"
            | "stage_accepted"
            | "stage_declined"
            | "stage_deferred"
            | "permission_granted"
            | "permission_revoked"
            | "heart_received"
            | "message_received"
            | "invitation_received"
            | "invitation_accepted"
            | "invitation_declined"
            | "breakup_initiated"
          payload: Json
          read_at: string | null
          recipient_user_id: string
          related_id: string | null
          related_kind: string | null
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          kind:
            | "stage_requested"
            | "stage_accepted"
            | "stage_declined"
            | "stage_deferred"
            | "permission_granted"
            | "permission_revoked"
            | "heart_received"
            | "message_received"
            | "invitation_received"
            | "invitation_accepted"
            | "invitation_declined"
            | "breakup_initiated"
          payload?: Json
          read_at?: string | null
          recipient_user_id: string
          related_id?: string | null
          related_kind?: string | null
        }
        Update: {
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_checkins: {
        Row: {
          created_at: string
          gratitude_note: string | null
          id: string
          relationship_id: string
          relationship_note: string | null
          relationship_rating: number
          user_id: string
          visibility: string
          week_start: string
        }
        Insert: {
          created_at?: string
          gratitude_note?: string | null
          id?: string
          relationship_id: string
          relationship_note?: string | null
          relationship_rating: number
          user_id: string
          visibility?: string
          week_start: string
        }
        Update: {
          created_at?: string
          gratitude_note?: string | null
          id?: string
          relationship_id?: string
          relationship_note?: string | null
          relationship_rating?: number
          user_id?: string
          visibility?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_checkins_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_verifications: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          status: string
          user_id: string
          verification_type: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          status?: string
          user_id: string
          verification_type: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          status?: string
          user_id?: string
          verification_type?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          access_state: string | null
          about: string | null
          branch: string | null
          boundary_topics: string[] | null
          campus_zone: string | null
          college_email: string
          college_name: string | null
          communication_style: string | null
          created_at: string | null
          deal_breakers: string[] | null
          discovery_mode: string | null
          email_verified_at: string | null
          heartpath_norms_acknowledged_at: string | null
          hobbies: string[] | null
          id: string
          languages: string[] | null
          lifestyle_preferences: string[] | null
          name: string
          onboarding_completed_at: string | null
          onboarding_step: string | null
          pace_style: string | null
          photo_levels: Json | null
          preferred_chat_frequency: string | null
          privacy_comfort: string | null
          profile_completeness: number | null
          pronouns: string | null
          relationship_intent: string | null
          student_verified_at: string | null
          value_tags: string[] | null
          verification_badges: Json | null
          voice_notes_comfort: string | null
          year: number | null
        }
        Insert: {
          access_state?: string | null
          about?: string | null
          branch?: string | null
          boundary_topics?: string[] | null
          campus_zone?: string | null
          college_email: string
          college_name?: string | null
          communication_style?: string | null
          created_at?: string | null
          deal_breakers?: string[] | null
          discovery_mode?: string | null
          email_verified_at?: string | null
          heartpath_norms_acknowledged_at?: string | null
          hobbies?: string[] | null
          id: string
          languages?: string[] | null
          lifestyle_preferences?: string[] | null
          name: string
          onboarding_completed_at?: string | null
          onboarding_step?: string | null
          pace_style?: string | null
          photo_levels?: Json | null
          preferred_chat_frequency?: string | null
          privacy_comfort?: string | null
          profile_completeness?: number | null
          pronouns?: string | null
          relationship_intent?: string | null
          student_verified_at?: string | null
          value_tags?: string[] | null
          verification_badges?: Json | null
          voice_notes_comfort?: string | null
          year?: number | null
        }
        Update: {
          access_state?: string | null
          about?: string | null
          branch?: string | null
          boundary_topics?: string[] | null
          campus_zone?: string | null
          college_email?: string
          college_name?: string | null
          communication_style?: string | null
          created_at?: string | null
          deal_breakers?: string[] | null
          discovery_mode?: string | null
          email_verified_at?: string | null
          heartpath_norms_acknowledged_at?: string | null
          hobbies?: string[] | null
          id?: string
          languages?: string[] | null
          lifestyle_preferences?: string[] | null
          name?: string
          onboarding_completed_at?: string | null
          onboarding_step?: string | null
          pace_style?: string | null
          photo_levels?: Json | null
          preferred_chat_frequency?: string | null
          privacy_comfort?: string | null
          profile_completeness?: number | null
          pronouns?: string | null
          relationship_intent?: string | null
          student_verified_at?: string | null
          value_tags?: string[] | null
          verification_badges?: Json | null
          voice_notes_comfort?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_college_email_domain: {
        Args: {
          email: string
        }
        Returns: {
          approved: boolean
          college_name: string | null
          domain: string | null
          normalized_email: string | null
        }[]
      }
      create_notification: {
        Args: {
          p_recipient: string
          p_actor: string
          p_kind:
            | "stage_requested"
            | "stage_accepted"
            | "stage_declined"
            | "stage_deferred"
            | "permission_granted"
            | "permission_revoked"
            | "heart_received"
            | "message_received"
            | "invitation_received"
            | "invitation_accepted"
            | "invitation_declined"
            | "breakup_initiated"
          p_payload?: Json
          p_related_kind?: string
          p_related_id?: string
        }
        Returns: string | null
      }
      blocked_user_summaries: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          college_name: string | null
        }[]
      }
      discovery_candidates: {
        Args: {
          p_limit?: number
        }
        Returns: {
          id: string
          name: string
          college_name: string | null
          branch: string | null
          year: number | null
          hobbies: string[] | null
          about: string | null
          relationship_intent: string | null
          preferred_chat_frequency: string | null
          pace_style: string | null
          communication_style: string | null
          value_tags: string[] | null
          lifestyle_preferences: string[] | null
          deal_breakers: string[] | null
          discovery_mode: string | null
          campus_zone: string | null
          profile_completeness: number | null
          verification_badges: Json | null
          photo_levels: Json | null
          access_state: string | null
          boundary_topics: string[] | null
          heartpath_norms_acknowledged_at: string | null
        }[]
      }
      sync_user_access_state: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Tables"]["users"]["Row"]
      }
      viewer_can_see_photo_level: {
        Args: {
          p_target: string
          p_level: number
        }
        Returns: boolean
      }
      purge_user: {
        Args: {
          p_user: string
        }
        Returns: undefined
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
