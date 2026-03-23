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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          answer_value: Json | null
          assessment_id: string
          id: string
          notes: string | null
          question_id: string
        }
        Insert: {
          answer_value?: Json | null
          assessment_id: string
          id?: string
          notes?: string | null
          question_id: string
        }
        Update: {
          answer_value?: Json | null
          assessment_id?: string
          id?: string
          notes?: string | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          chief_complaint: string
          created_at: string
          current_step: number
          id: string
          patient_id: string
          status: string
          updated_at: string
        }
        Insert: {
          chief_complaint: string
          created_at?: string
          current_step?: number
          id?: string
          patient_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          chief_complaint?: string
          created_at?: string
          current_step?: number
          id?: string
          patient_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_decision_support: {
        Row: {
          assessment_id: string
          clinical_notes: string | null
          id: string
          investigation_plan: Json | null
          treatment_plan: Json | null
          updated_at: string
        }
        Insert: {
          assessment_id: string
          clinical_notes?: string | null
          id?: string
          investigation_plan?: Json | null
          treatment_plan?: Json | null
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          clinical_notes?: string | null
          id?: string
          investigation_plan?: Json | null
          treatment_plan?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_decision_support_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_reports: {
        Row: {
          assessment_id: string
          content: Json | null
          file_path: string | null
          format: string | null
          generated_at: string
          generated_by: string | null
          id: string
          metadata: Json | null
          report_type: string
          title: string
        }
        Insert: {
          assessment_id: string
          content?: Json | null
          file_path?: string | null
          format?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          report_type: string
          title: string
        }
        Update: {
          assessment_id?: string
          content?: Json | null
          file_path?: string | null
          format?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          report_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_reports_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      differential_diagnoses: {
        Row: {
          assessment_id: string
          condition_name: string
          explanation: string | null
          id: string
          key_features: Json | null
          probability: number
        }
        Insert: {
          assessment_id: string
          condition_name: string
          explanation?: string | null
          id?: string
          key_features?: Json | null
          probability?: number
        }
        Update: {
          assessment_id?: string
          condition_name?: string
          explanation?: string | null
          id?: string
          key_features?: Json | null
          probability?: number
        }
        Relationships: [
          {
            foreignKeyName: "differential_diagnoses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          age: number
          created_at: string
          gender: string
          healthcare_provider_id: string
          id: string
          last_assessment: string | null
          location: string
          name: string
          patient_id: string
        }
        Insert: {
          age: number
          created_at?: string
          gender: string
          healthcare_provider_id: string
          id?: string
          last_assessment?: string | null
          location?: string
          name: string
          patient_id: string
        }
        Update: {
          age?: number
          created_at?: string
          gender?: string
          healthcare_provider_id?: string
          id?: string
          last_assessment?: string | null
          location?: string
          name?: string
          patient_id?: string
        }
        Relationships: []
      }
      phase_answers: {
        Row: {
          assessment_id: string
          id: string
          phase: number
          phase_summary: Json | null
          red_flags_identified: Json | null
        }
        Insert: {
          assessment_id: string
          id?: string
          phase: number
          phase_summary?: Json | null
          red_flags_identified?: Json | null
        }
        Update: {
          assessment_id?: string
          id?: string
          phase?: number
          phase_summary?: Json | null
          red_flags_identified?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "phase_answers_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_notes: {
        Row: {
          assessment_changes: string | null
          assessment_id: string | null
          chief_complaint: string | null
          created_at: string
          examination_changes: string | null
          follow_up_instructions: string | null
          id: string
          interval_history: string | null
          investigation_results: string | null
          patient_id: string
          plan_modifications: string | null
          previous_assessment_id: string | null
          updated_at: string
          visit_date: string
        }
        Insert: {
          assessment_changes?: string | null
          assessment_id?: string | null
          chief_complaint?: string | null
          created_at?: string
          examination_changes?: string | null
          follow_up_instructions?: string | null
          id?: string
          interval_history?: string | null
          investigation_results?: string | null
          patient_id: string
          plan_modifications?: string | null
          previous_assessment_id?: string | null
          updated_at?: string
          visit_date?: string
        }
        Update: {
          assessment_changes?: string | null
          assessment_id?: string | null
          chief_complaint?: string | null
          created_at?: string
          examination_changes?: string | null
          follow_up_instructions?: string | null
          id?: string
          interval_history?: string | null
          investigation_results?: string | null
          patient_id?: string
          plan_modifications?: string | null
          previous_assessment_id?: string | null
          updated_at?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_notes_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notes_previous_assessment_id_fkey"
            columns: ["previous_assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          assessment_id: string
          category: string
          id: string
          options: Json | null
          order_index: number
          question_text: string
          question_type: string
          required: boolean
        }
        Insert: {
          assessment_id: string
          category?: string
          id?: string
          options?: Json | null
          order_index?: number
          question_text: string
          question_type: string
          required?: boolean
        }
        Update: {
          assessment_id?: string
          category?: string
          id?: string
          options?: Json | null
          order_index?: number
          question_text?: string
          question_type?: string
          required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_letters: {
        Row: {
          assessment_id: string
          clinical_question: string | null
          created_at: string
          examination_findings: string | null
          id: string
          investigations_completed: string | null
          letter_content: Json | null
          recipient_facility: string | null
          recipient_name: string | null
          relevant_history: string | null
          sent_at: string | null
          specialty: string
          status: string | null
          urgency: string | null
        }
        Insert: {
          assessment_id: string
          clinical_question?: string | null
          created_at?: string
          examination_findings?: string | null
          id?: string
          investigations_completed?: string | null
          letter_content?: Json | null
          recipient_facility?: string | null
          recipient_name?: string | null
          relevant_history?: string | null
          sent_at?: string | null
          specialty: string
          status?: string | null
          urgency?: string | null
        }
        Update: {
          assessment_id?: string
          clinical_question?: string | null
          created_at?: string
          examination_findings?: string | null
          id?: string
          investigations_completed?: string | null
          letter_content?: Json | null
          recipient_facility?: string | null
          recipient_name?: string | null
          relevant_history?: string | null
          sent_at?: string | null
          specialty?: string
          status?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_letters_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          active: boolean | null
          created_at: string
          default_template: boolean | null
          id: string
          name: string
          specialty: string | null
          template_content: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          default_template?: boolean | null
          id?: string
          name: string
          specialty?: string | null
          template_content?: Json | null
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          default_template?: boolean | null
          id?: string
          name?: string
          specialty?: string | null
          template_content?: Json | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_of_systems: {
        Row: {
          assessment_id: string
          id: string
          negative_symptoms: Json | null
          notes: string | null
          positive_symptoms: Json | null
          system_name: string
        }
        Insert: {
          assessment_id: string
          id?: string
          negative_symptoms?: Json | null
          notes?: string | null
          positive_symptoms?: Json | null
          system_name: string
        }
        Update: {
          assessment_id?: string
          id?: string
          negative_symptoms?: Json | null
          notes?: string | null
          positive_symptoms?: Json | null
          system_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_of_systems_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      soap_notes: {
        Row: {
          additional_notes: string | null
          assessment_id: string
          assessment_text: string | null
          author: string | null
          created_at: string
          id: string
          objective: string | null
          plan_text: string | null
          subjective: string | null
          template_used: string | null
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          assessment_id: string
          assessment_text?: string | null
          author?: string | null
          created_at?: string
          id?: string
          objective?: string | null
          plan_text?: string | null
          subjective?: string | null
          template_used?: string | null
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          assessment_id?: string
          assessment_text?: string | null
          author?: string | null
          created_at?: string
          id?: string
          objective?: string | null
          plan_text?: string | null
          subjective?: string | null
          template_used?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "soap_notes_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
