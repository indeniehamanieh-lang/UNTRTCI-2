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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          target: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string
          created_at: string
          id: string
          is_demo: boolean
          title: string
          url: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          title: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          title?: string
          url?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string
          id: string
          is_demo: boolean
          location: string
          starts_at: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_demo?: boolean
          location?: string
          starts_at: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_demo?: boolean
          location?: string
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          created_at: string
          id: string
          job_id: string
          message: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          message?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          message?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          closes_at: string | null
          contact: string | null
          created_at: string
          description: string
          id: string
          is_demo: boolean
          kind: string
          location: string
          title: string
        }
        Insert: {
          closes_at?: string | null
          contact?: string | null
          created_at?: string
          description?: string
          id?: string
          is_demo?: boolean
          kind?: string
          location?: string
          title: string
        }
        Update: {
          closes_at?: string | null
          contact?: string | null
          created_at?: string
          description?: string
          id?: string
          is_demo?: boolean
          kind?: string
          location?: string
          title?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          card_revoked: boolean
          card_token: string | null
          created_at: string
          directory_consent: boolean
          id_back_path: string | null
          id_consent: boolean
          id_doc_type: string | null
          id_front_path: string | null
          id_verified: boolean
          expires_at: string | null
          id: string
          member_number: string | null
          nom: string
          photo_url: string | null
          prenoms: string
          review_note: string | null
          specialites: string[]
          status: Database["public"]["Enums"]["membership_status"]
          telephone: string
          updated_at: string
          user_id: string
          validated_at: string | null
          ville: string
        }
        Insert: {
          card_revoked?: boolean
          card_token?: string | null
          created_at?: string
          directory_consent?: boolean
          id_back_path?: string | null
          id_consent?: boolean
          id_doc_type?: string | null
          id_front_path?: string | null
          id_verified?: boolean
          expires_at?: string | null
          id?: string
          member_number?: string | null
          nom: string
          photo_url?: string | null
          prenoms: string
          review_note?: string | null
          specialites?: string[]
          status?: Database["public"]["Enums"]["membership_status"]
          telephone: string
          updated_at?: string
          user_id: string
          validated_at?: string | null
          ville: string
        }
        Update: {
          card_revoked?: boolean
          card_token?: string | null
          created_at?: string
          directory_consent?: boolean
          id_back_path?: string | null
          id_consent?: boolean
          id_doc_type?: string | null
          id_front_path?: string | null
          id_verified?: boolean
          expires_at?: string | null
          id?: string
          member_number?: string | null
          nom?: string
          photo_url?: string | null
          prenoms?: string
          review_note?: string | null
          specialites?: string[]
          status?: Database["public"]["Enums"]["membership_status"]
          telephone?: string
          updated_at?: string
          user_id?: string
          validated_at?: string | null
          ville?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          is_demo: boolean
          kind: string
          published: boolean
          title: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          is_demo?: boolean
          kind?: string
          published?: boolean
          title: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          kind?: string
          published?: boolean
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      support_requests: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string
          response: string | null
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          message: string
          response?: string | null
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string
          response?: string | null
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      technician_skills: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      training_registrations: {
        Row: {
          created_at: string
          id: string
          training_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          training_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          training_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_registrations_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          created_at: string
          description: string
          id: string
          is_demo: boolean
          location: string
          seats: number | null
          starts_at: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_demo?: boolean
          location?: string
          seats?: number | null
          starts_at: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_demo?: boolean
          location?: string
          seats?: number | null
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_stats: { Args: never; Returns: Json }
      can_claim_first_admin: { Args: never; Returns: boolean }
      claim_first_admin: { Args: never; Returns: boolean }
      resubmit_membership: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      log_identity_view: { Args: { _id: string }; Returns: undefined }
      purge_identity: { Args: { _id: string }; Returns: undefined }
      list_directory: {
        Args: never
        Returns: {
          id: string
          member_number: string
          nom: string
          prenoms: string
          specialites: string[]
          telephone: string
          ville: string
        }[]
      }
      list_staff: {
        Args: never
        Returns: {
          email: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      log_action: {
        Args: { _action: string; _details: Json; _target: string }
        Returns: undefined
      }
      review_membership: {
        Args: {
          _id: string
          _note?: string
          _status: Database["public"]["Enums"]["membership_status"]
        }
        Returns: {
          card_revoked: boolean
          card_token: string | null
          created_at: string
          directory_consent: boolean
          id_back_path: string | null
          id_consent: boolean
          id_doc_type: string | null
          id_front_path: string | null
          id_verified: boolean
          expires_at: string | null
          id: string
          member_number: string | null
          nom: string
          photo_url: string | null
          prenoms: string
          review_note: string | null
          specialites: string[]
          status: Database["public"]["Enums"]["membership_status"]
          telephone: string
          updated_at: string
          user_id: string
          validated_at: string | null
          ville: string
        }
        SetofOptions: {
          from: "*"
          to: "memberships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      revoke_card: { Args: { _id: string; _note?: string }; Returns: undefined }
      set_user_role: {
        Args: {
          _email: string
          _grant: boolean
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      verify_card: {
        Args: { _token: string }
        Returns: {
          expires_at: string
          member_number: string
          nom: string
          prenoms: string
          status: Database["public"]["Enums"]["membership_status"]
          valid: boolean
          ville: string
        }[]
      }
    }
    Enums: {
      app_role: "super_admin" | "responsable" | "gestionnaire" | "membre"
      membership_status:
        | "en_attente"
        | "validee"
        | "refusee"
        | "suspendue"
        | "expiree"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["super_admin", "responsable", "gestionnaire", "membre"],
      membership_status: [
        "en_attente",
        "validee",
        "refusee",
        "suspendue",
        "expiree",
      ],
    },
  },
} as const
