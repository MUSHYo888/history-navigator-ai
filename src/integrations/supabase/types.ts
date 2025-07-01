export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      answers: {
        Row: {
          answer_value: Json
          assessment_id: string
          created_at: string
          id: string
          notes: string | null
          question_id: string
          updated_at: string
        }
        Insert: {
          answer_value: Json
          assessment_id: string
          created_at?: string
          id?: string
          notes?: string | null
          question_id: string
          updated_at?: string
        }
        Update: {
          answer_value?: Json
          assessment_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          question_id?: string
          updated_at?: string
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
      clinical_reports: {
        Row: {
          assessment_id: string
          content: Json
          file_path: string | null
          format: string
          generated_at: string
          generated_by: string | null
          id: string
          metadata: Json | null
          report_type: string
          title: string
        }
        Insert: {
          assessment_id: string
          content: Json
          file_path?: string | null
          format?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          report_type: string
          title: string
        }
        Update: {
          assessment_id?: string
          content?: Json
          file_path?: string | null
          format?: string
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
          created_at: string
          explanation: string | null
          id: string
          key_features: Json
          probability: number
        }
        Insert: {
          assessment_id: string
          condition_name: string
          created_at?: string
          explanation?: string | null
          id?: string
          key_features?: Json
          probability: number
        }
        Update: {
          assessment_id?: string
          condition_name?: string
          created_at?: string
          explanation?: string | null
          id?: string
          key_features?: Json
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
          id: string
          last_assessment: string | null
          location: string | null
          name: string
          patient_id: string
          updated_at: string
        }
        Insert: {
          age: number
          created_at?: string
          gender: string
          id?: string
          last_assessment?: string | null
          location?: string | null
          name: string
          patient_id: string
          updated_at?: string
        }
        Update: {
          age?: number
          created_at?: string
          gender?: string
          id?: string
          last_assessment?: string | null
          location?: string | null
          name?: string
          patient_id?: string
          updated_at?: string
        }
        Relationships: []
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
          interval_history: string
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
          interval_history: string
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
          interval_history?: string
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
          created_at: string
          id: string
          options: Json | null
          order_index: number
          question_text: string
          question_type: string
          required: boolean
        }
        Insert: {
          assessment_id: string
          category: string
          created_at?: string
          id?: string
          options?: Json | null
          order_index: number
          question_text: string
          question_type: string
          required?: boolean
        }
        Update: {
          assessment_id?: string
          category?: string
          created_at?: string
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
          clinical_question: string
          created_at: string
          examination_findings: string | null
          id: string
          investigations_completed: string | null
          letter_content: Json
          recipient_facility: string | null
          recipient_name: string | null
          relevant_history: string | null
          sent_at: string | null
          specialty: string
          status: string
          urgency: string
        }
        Insert: {
          assessment_id: string
          clinical_question: string
          created_at?: string
          examination_findings?: string | null
          id?: string
          investigations_completed?: string | null
          letter_content: Json
          recipient_facility?: string | null
          recipient_name?: string | null
          relevant_history?: string | null
          sent_at?: string | null
          specialty: string
          status?: string
          urgency?: string
        }
        Update: {
          assessment_id?: string
          clinical_question?: string
          created_at?: string
          examination_findings?: string | null
          id?: string
          investigations_completed?: string | null
          letter_content?: Json
          recipient_facility?: string | null
          recipient_name?: string | null
          relevant_history?: string | null
          sent_at?: string | null
          specialty?: string
          status?: string
          urgency?: string
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
          active: boolean
          created_at: string
          default_template: boolean
          id: string
          name: string
          specialty: string | null
          template_content: Json
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          default_template?: boolean
          id?: string
          name: string
          specialty?: string | null
          template_content: Json
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          default_template?: boolean
          id?: string
          name?: string
          specialty?: string | null
          template_content?: Json
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_of_systems: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          negative_symptoms: Json
          notes: string | null
          positive_symptoms: Json
          system_name: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          negative_symptoms?: Json
          notes?: string | null
          positive_symptoms?: Json
          system_name: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          negative_symptoms?: Json
          notes?: string | null
          positive_symptoms?: Json
          system_name?: string
          updated_at?: string
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
          assessment_text: string
          author: string | null
          created_at: string
          id: string
          objective: string
          plan_text: string
          subjective: string
          template_used: string | null
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          assessment_id: string
          assessment_text: string
          author?: string | null
          created_at?: string
          id?: string
          objective: string
          plan_text: string
          subjective: string
          template_used?: string | null
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          assessment_id?: string
          assessment_text?: string
          author?: string | null
          created_at?: string
          id?: string
          objective?: string
          plan_text?: string
          subjective?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
