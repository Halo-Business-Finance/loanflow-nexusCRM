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
      account_lockouts: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          locked_at: string
          locked_by_system: boolean
          reason: string
          unlock_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          locked_at?: string
          locked_by_system?: boolean
          reason: string
          unlock_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          locked_at?: string
          locked_by_system?: boolean
          reason?: string
          unlock_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      approval_processes: {
        Row: {
          approval_steps: Json
          created_at: string
          created_by: string
          entry_criteria: Json | null
          final_approval_actions: Json | null
          final_rejection_actions: Json | null
          id: string
          is_active: boolean
          name: string
          object_type: string
          updated_at: string
        }
        Insert: {
          approval_steps: Json
          created_at?: string
          created_by: string
          entry_criteria?: Json | null
          final_approval_actions?: Json | null
          final_rejection_actions?: Json | null
          id?: string
          is_active?: boolean
          name: string
          object_type: string
          updated_at?: string
        }
        Update: {
          approval_steps?: Json
          created_at?: string
          created_by?: string
          entry_criteria?: Json | null
          final_approval_actions?: Json | null
          final_rejection_actions?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          object_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      approval_requests: {
        Row: {
          comments: string | null
          completed_at: string | null
          current_step: number
          id: string
          process_id: string
          record_id: string
          record_type: string
          status: string
          submitted_at: string
          submitted_by: string
        }
        Insert: {
          comments?: string | null
          completed_at?: string | null
          current_step?: number
          id?: string
          process_id: string
          record_id: string
          record_type: string
          status?: string
          submitted_at?: string
          submitted_by: string
        }
        Update: {
          comments?: string | null
          completed_at?: string | null
          current_step?: number
          id?: string
          process_id?: string
          record_id?: string
          record_type?: string
          status?: string
          submitted_at?: string
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "approval_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_steps: {
        Row: {
          actioned_at: string | null
          approver_id: string
          comments: string | null
          created_at: string
          id: string
          request_id: string
          status: string
          step_number: number
        }
        Insert: {
          actioned_at?: string | null
          approver_id: string
          comments?: string | null
          created_at?: string
          id?: string
          request_id: string
          status?: string
          step_number: number
        }
        Update: {
          actioned_at?: string | null
          approver_id?: string
          comments?: string | null
          created_at?: string
          id?: string
          request_id?: string
          status?: string
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "approval_steps_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          risk_score: number | null
          session_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          risk_score?: number | null
          session_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          risk_score?: number | null
          session_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      case_comments: {
        Row: {
          attachments: Json | null
          case_id: string
          comment_text: string
          comment_type: string
          created_at: string
          id: string
          is_internal: boolean
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          case_id: string
          comment_text: string
          comment_type?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          user_id: string
        }
        Update: {
          attachments?: Json | null
          case_id?: string
          comment_text?: string
          comment_type?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_comments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          case_number: string
          case_type: string
          client_id: string
          created_at: string
          customer_satisfaction_score: number | null
          description: string
          due_date: string | null
          escalated_to: string | null
          escalation_reason: string | null
          id: string
          priority: string
          resolution: string | null
          resolution_date: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_number: string
          case_type?: string
          client_id: string
          created_at?: string
          customer_satisfaction_score?: number | null
          description: string
          due_date?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          id?: string
          priority?: string
          resolution?: string | null
          resolution_date?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_number?: string
          case_type?: string
          client_id?: string
          created_at?: string
          customer_satisfaction_score?: number | null
          description?: string
          due_date?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          id?: string
          priority?: string
          resolution?: string | null
          resolution_date?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          annual_revenue: number | null
          average_transaction_size: number | null
          bank_lender_name: string | null
          business_address: string | null
          business_name: string | null
          call_notes: string | null
          created_at: string
          credit_score: number | null
          current_processing_rate: number | null
          email: string
          existing_loan_amount: number | null
          id: string
          income: number | null
          interest_rate: number | null
          join_date: string | null
          last_activity: string | null
          lead_id: string | null
          loan_amount: number | null
          loan_type: string | null
          location: string | null
          maturity_date: string | null
          monthly_processing_volume: number | null
          name: string
          net_operating_income: number | null
          notes: string | null
          owns_property: boolean | null
          phone: string | null
          pos_system: string | null
          priority: string | null
          processor_name: string | null
          property_payment_amount: number | null
          stage: string | null
          status: string
          total_loan_value: number | null
          total_loans: number | null
          updated_at: string
          user_id: string
          year_established: number | null
        }
        Insert: {
          annual_revenue?: number | null
          average_transaction_size?: number | null
          bank_lender_name?: string | null
          business_address?: string | null
          business_name?: string | null
          call_notes?: string | null
          created_at?: string
          credit_score?: number | null
          current_processing_rate?: number | null
          email: string
          existing_loan_amount?: number | null
          id?: string
          income?: number | null
          interest_rate?: number | null
          join_date?: string | null
          last_activity?: string | null
          lead_id?: string | null
          loan_amount?: number | null
          loan_type?: string | null
          location?: string | null
          maturity_date?: string | null
          monthly_processing_volume?: number | null
          name: string
          net_operating_income?: number | null
          notes?: string | null
          owns_property?: boolean | null
          phone?: string | null
          pos_system?: string | null
          priority?: string | null
          processor_name?: string | null
          property_payment_amount?: number | null
          stage?: string | null
          status?: string
          total_loan_value?: number | null
          total_loans?: number | null
          updated_at?: string
          user_id: string
          year_established?: number | null
        }
        Update: {
          annual_revenue?: number | null
          average_transaction_size?: number | null
          bank_lender_name?: string | null
          business_address?: string | null
          business_name?: string | null
          call_notes?: string | null
          created_at?: string
          credit_score?: number | null
          current_processing_rate?: number | null
          email?: string
          existing_loan_amount?: number | null
          id?: string
          income?: number | null
          interest_rate?: number | null
          join_date?: string | null
          last_activity?: string | null
          lead_id?: string | null
          loan_amount?: number | null
          loan_type?: string | null
          location?: string | null
          maturity_date?: string | null
          monthly_processing_volume?: number | null
          name?: string
          net_operating_income?: number | null
          notes?: string | null
          owns_property?: boolean | null
          phone?: string | null
          pos_system?: string | null
          priority?: string | null
          processor_name?: string | null
          property_payment_amount?: number | null
          stage?: string | null
          status?: string
          total_loan_value?: number | null
          total_loans?: number | null
          updated_at?: string
          user_id?: string
          year_established?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          community_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          community_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          community_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          client_id: string | null
          community_id: string
          created_at: string
          id: string
          joined_at: string | null
          last_activity: string | null
          role: string
          status: string
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          community_id: string
          created_at?: string
          id?: string
          joined_at?: string | null
          last_activity?: string | null
          role?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          community_id?: string
          created_at?: string
          id?: string
          joined_at?: string | null
          last_activity?: string | null
          role?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_members_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_reports: {
        Row: {
          completed_at: string | null
          created_at: string
          date_range_end: string
          date_range_start: string
          file_path: string | null
          filters: Json | null
          generated_by: string
          id: string
          report_data: Json
          report_type: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          date_range_end: string
          date_range_start: string
          file_path?: string | null
          filters?: Json | null
          generated_by: string
          id?: string
          report_data: Json
          report_type: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          date_range_end?: string
          date_range_start?: string
          file_path?: string | null
          filters?: Json | null
          generated_by?: string
          id?: string
          report_data?: Json
          report_type?: string
          status?: string
        }
        Relationships: []
      }
      custom_fields: {
        Row: {
          api_name: string
          created_at: string
          created_by: string
          default_value: string | null
          field_type: string
          id: string
          is_active: boolean
          is_required: boolean
          name: string
          object_id: string
          picklist_values: Json | null
          updated_at: string
        }
        Insert: {
          api_name: string
          created_at?: string
          created_by: string
          default_value?: string | null
          field_type: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          name: string
          object_id: string
          picklist_values?: Json | null
          updated_at?: string
        }
        Update: {
          api_name?: string
          created_at?: string
          created_by?: string
          default_value?: string | null
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          name?: string
          object_id?: string
          picklist_values?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_fields_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "custom_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_objects: {
        Row: {
          api_name: string
          created_at: string
          created_by: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          api_name: string
          created_at?: string
          created_by: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          api_name?: string
          created_at?: string
          created_by?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_records: {
        Row: {
          created_at: string
          created_by: string
          data: Json
          id: string
          object_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          data?: Json
          id?: string
          object_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          data?: Json
          id?: string
          object_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_records_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "custom_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      data_import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          data_type: string
          error_log: Json | null
          failed_records: number | null
          file_format: string
          file_path: string | null
          id: string
          job_name: string
          job_type: string
          mapping_configuration: Json | null
          processed_records: number | null
          progress_percentage: number | null
          started_at: string | null
          status: string
          successful_records: number | null
          total_records: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          data_type: string
          error_log?: Json | null
          failed_records?: number | null
          file_format: string
          file_path?: string | null
          id?: string
          job_name: string
          job_type: string
          mapping_configuration?: Json | null
          processed_records?: number | null
          progress_percentage?: number | null
          started_at?: string | null
          status?: string
          successful_records?: number | null
          total_records?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          data_type?: string
          error_log?: Json | null
          failed_records?: number | null
          file_format?: string
          file_path?: string | null
          id?: string
          job_name?: string
          job_type?: string
          mapping_configuration?: Json | null
          processed_records?: number | null
          progress_percentage?: number | null
          started_at?: string | null
          status?: string
          successful_records?: number | null
          total_records?: number | null
          user_id?: string
        }
        Relationships: []
      }
      email_accounts: {
        Row: {
          access_token: string
          created_at: string
          display_name: string
          email_address: string
          expires_at: string
          id: string
          is_active: boolean
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          display_name: string
          email_address: string
          expires_at: string
          id?: string
          is_active?: boolean
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          display_name?: string
          email_address?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_campaign_recipients: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          client_id: string | null
          created_at: string
          email_address: string
          id: string
          lead_id: string | null
          opened_at: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          client_id?: string | null
          created_at?: string
          email_address: string
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          client_id?: string | null
          created_at?: string
          email_address?: string
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_recipients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_recipients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          campaign_type: string
          created_at: string
          description: string | null
          email_template: string | null
          id: string
          name: string
          performance_metrics: Json | null
          send_schedule: Json | null
          status: string
          subject_line: string | null
          target_audience: Json | null
          trigger_conditions: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_type?: string
          created_at?: string
          description?: string | null
          email_template?: string | null
          id?: string
          name: string
          performance_metrics?: Json | null
          send_schedule?: Json | null
          status?: string
          subject_line?: string | null
          target_audience?: Json | null
          trigger_conditions?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_type?: string
          created_at?: string
          description?: string | null
          email_template?: string | null
          id?: string
          name?: string
          performance_metrics?: Json | null
          send_schedule?: Json | null
          status?: string
          subject_line?: string | null
          target_audience?: Json | null
          trigger_conditions?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      encryption_keys: {
        Row: {
          algorithm: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_name: string
          key_purpose: string
          last_rotated: string | null
        }
        Insert: {
          algorithm?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_name: string
          key_purpose: string
          last_rotated?: string | null
        }
        Update: {
          algorithm?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_name?: string
          key_purpose?: string
          last_rotated?: string | null
        }
        Relationships: []
      }
      event_attendees: {
        Row: {
          attendance_date: string | null
          client_id: string | null
          created_at: string
          email: string
          event_id: string
          id: string
          lead_id: string | null
          name: string
          notes: string | null
          registration_date: string | null
          registration_status: string
        }
        Insert: {
          attendance_date?: string | null
          client_id?: string | null
          created_at?: string
          email: string
          event_id: string
          id?: string
          lead_id?: string | null
          name: string
          notes?: string | null
          registration_date?: string | null
          registration_status?: string
        }
        Update: {
          attendance_date?: string | null
          client_id?: string | null
          created_at?: string
          email?: string
          event_id?: string
          id?: string
          lead_id?: string | null
          name?: string
          notes?: string | null
          registration_date?: string | null
          registration_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          event_data: Json | null
          event_type: string
          id: string
          location: string | null
          max_attendees: number | null
          name: string
          registration_required: boolean | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
          virtual_link: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          event_data?: Json | null
          event_type?: string
          id?: string
          location?: string | null
          max_attendees?: number | null
          name: string
          registration_required?: boolean | null
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
          virtual_link?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          location?: string | null
          max_attendees?: number | null
          name?: string
          registration_required?: boolean | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
          virtual_link?: string | null
        }
        Relationships: []
      }
      failed_login_attempts: {
        Row: {
          attempt_time: string
          created_at: string
          email: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          attempt_time?: string
          created_at?: string
          email: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          attempt_time?: string
          created_at?: string
          email?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      field_level_security: {
        Row: {
          created_at: string
          field_name: string
          id: string
          is_active: boolean
          role_restrictions: Json
          table_name: string
          updated_at: string
          user_restrictions: Json | null
        }
        Insert: {
          created_at?: string
          field_name: string
          id?: string
          is_active?: boolean
          role_restrictions?: Json
          table_name: string
          updated_at?: string
          user_restrictions?: Json | null
        }
        Update: {
          created_at?: string
          field_name?: string
          id?: string
          is_active?: boolean
          role_restrictions?: Json
          table_name?: string
          updated_at?: string
          user_restrictions?: Json | null
        }
        Relationships: []
      }
      forecast_periods: {
        Row: {
          created_at: string
          created_by: string
          end_date: string
          id: string
          name: string
          period_type: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          end_date: string
          id?: string
          name: string
          period_type: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          end_date?: string
          id?: string
          name?: string
          period_type?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      forecasts: {
        Row: {
          amount: number
          confidence_level: number | null
          created_at: string
          id: string
          methodology: string
          notes: string | null
          period_id: string
          quota: number | null
          submitted_at: string | null
          territory_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          confidence_level?: number | null
          created_at?: string
          id?: string
          methodology: string
          notes?: string | null
          period_id: string
          quota?: number | null
          submitted_at?: string | null
          territory_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          confidence_level?: number | null
          created_at?: string
          id?: string
          methodology?: string
          notes?: string | null
          period_id?: string
          quota?: number | null
          submitted_at?: string | null
          territory_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forecasts_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "forecast_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forecasts_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_restrictions: {
        Row: {
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_allowed: boolean
          reason: string | null
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address: unknown
          is_allowed?: boolean
          reason?: string | null
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_allowed?: boolean
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_articles: {
        Row: {
          category: string
          content: string
          created_at: string
          helpful_count: number | null
          id: string
          last_reviewed: string | null
          not_helpful_count: number | null
          reviewed_by: string | null
          status: string
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          view_count: number | null
          visibility: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          last_reviewed?: string | null
          not_helpful_count?: number | null
          reviewed_by?: string | null
          status?: string
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          view_count?: number | null
          visibility?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          last_reviewed?: string | null
          not_helpful_count?: number | null
          reviewed_by?: string | null
          status?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          view_count?: number | null
          visibility?: string
        }
        Relationships: []
      }
      lead_scores: {
        Row: {
          behavioral_score: number
          created_at: string
          demographic_score: number
          id: string
          last_calculated: string
          lead_id: string
          score_category: string
          score_history: Json | null
          scoring_model_id: string
          total_score: number
          updated_at: string
        }
        Insert: {
          behavioral_score?: number
          created_at?: string
          demographic_score?: number
          id?: string
          last_calculated?: string
          lead_id: string
          score_category?: string
          score_history?: Json | null
          scoring_model_id: string
          total_score?: number
          updated_at?: string
        }
        Update: {
          behavioral_score?: number
          created_at?: string
          demographic_score?: number
          id?: string
          last_calculated?: string
          lead_id?: string
          score_category?: string
          score_history?: Json | null
          scoring_model_id?: string
          total_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_scores_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_scores_scoring_model_id_fkey"
            columns: ["scoring_model_id"]
            isOneToOne: false
            referencedRelation: "lead_scoring_models"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_scoring_models: {
        Row: {
          behavioral_rules: Json
          created_at: string
          demographic_rules: Json
          description: string | null
          id: string
          is_active: boolean
          name: string
          score_thresholds: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          behavioral_rules?: Json
          created_at?: string
          demographic_rules?: Json
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          score_thresholds?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          behavioral_rules?: Json
          created_at?: string
          demographic_rules?: Json
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          score_thresholds?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          annual_revenue: number | null
          average_transaction_size: number | null
          bank_lender_name: string | null
          business_address: string | null
          business_name: string | null
          call_notes: string | null
          converted_at: string | null
          created_at: string
          credit_score: number | null
          current_processing_rate: number | null
          email: string
          existing_loan_amount: number | null
          id: string
          income: number | null
          interest_rate: number | null
          is_converted_to_client: boolean | null
          last_contact: string | null
          loan_amount: number | null
          loan_type: string | null
          location: string | null
          maturity_date: string | null
          monthly_processing_volume: number | null
          name: string
          net_operating_income: number | null
          notes: string | null
          owns_property: boolean | null
          phone: string | null
          pos_system: string | null
          priority: string
          processor_name: string | null
          property_payment_amount: number | null
          stage: string
          updated_at: string
          user_id: string
          year_established: number | null
        }
        Insert: {
          annual_revenue?: number | null
          average_transaction_size?: number | null
          bank_lender_name?: string | null
          business_address?: string | null
          business_name?: string | null
          call_notes?: string | null
          converted_at?: string | null
          created_at?: string
          credit_score?: number | null
          current_processing_rate?: number | null
          email: string
          existing_loan_amount?: number | null
          id?: string
          income?: number | null
          interest_rate?: number | null
          is_converted_to_client?: boolean | null
          last_contact?: string | null
          loan_amount?: number | null
          loan_type?: string | null
          location?: string | null
          maturity_date?: string | null
          monthly_processing_volume?: number | null
          name: string
          net_operating_income?: number | null
          notes?: string | null
          owns_property?: boolean | null
          phone?: string | null
          pos_system?: string | null
          priority?: string
          processor_name?: string | null
          property_payment_amount?: number | null
          stage?: string
          updated_at?: string
          user_id: string
          year_established?: number | null
        }
        Update: {
          annual_revenue?: number | null
          average_transaction_size?: number | null
          bank_lender_name?: string | null
          business_address?: string | null
          business_name?: string | null
          call_notes?: string | null
          converted_at?: string | null
          created_at?: string
          credit_score?: number | null
          current_processing_rate?: number | null
          email?: string
          existing_loan_amount?: number | null
          id?: string
          income?: number | null
          interest_rate?: number | null
          is_converted_to_client?: boolean | null
          last_contact?: string | null
          loan_amount?: number | null
          loan_type?: string | null
          location?: string | null
          maturity_date?: string | null
          monthly_processing_volume?: number | null
          name?: string
          net_operating_income?: number | null
          notes?: string | null
          owns_property?: boolean | null
          phone?: string | null
          pos_system?: string | null
          priority?: string
          processor_name?: string | null
          property_payment_amount?: number | null
          stage?: string
          updated_at?: string
          user_id?: string
          year_established?: number | null
        }
        Relationships: []
      }
      loan_requests: {
        Row: {
          approved_at: string | null
          client_id: string | null
          created_at: string
          documents: Json | null
          funded_at: string | null
          id: string
          interest_rate: number | null
          lead_id: string | null
          loan_amount: number
          loan_term_months: number | null
          loan_type: string
          notes: string | null
          priority: string
          purpose: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          client_id?: string | null
          created_at?: string
          documents?: Json | null
          funded_at?: string | null
          id?: string
          interest_rate?: number | null
          lead_id?: string | null
          loan_amount: number
          loan_term_months?: number | null
          loan_type?: string
          notes?: string | null
          priority?: string
          purpose?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          client_id?: string | null
          created_at?: string
          documents?: Json | null
          funded_at?: string | null
          id?: string
          interest_rate?: number | null
          lead_id?: string | null
          loan_amount?: number
          loan_term_months?: number | null
          loan_type?: string
          notes?: string | null
          priority?: string
          purpose?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          interest_rate: number | null
          lead_id: string | null
          loan_amount: number
          loan_term_months: number | null
          loan_type: string | null
          maturity_date: string | null
          monthly_payment: number | null
          notes: string | null
          origination_date: string | null
          remaining_balance: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          interest_rate?: number | null
          lead_id?: string | null
          loan_amount: number
          loan_term_months?: number | null
          loan_type?: string | null
          maturity_date?: string | null
          monthly_payment?: number | null
          notes?: string | null
          origination_date?: string | null
          remaining_balance?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          interest_rate?: number | null
          lead_id?: string | null
          loan_amount?: number
          loan_term_months?: number | null
          loan_type?: string | null
          maturity_date?: string | null
          monthly_payment?: number | null
          notes?: string | null
          origination_date?: string | null
          remaining_balance?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_settings: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean
          last_used: string | null
          phone_number: string | null
          preferred_method: string
          secret_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_used?: string | null
          phone_number?: string | null
          preferred_method?: string
          secret_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_used?: string | null
          phone_number?: string | null
          preferred_method?: string
          secret_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          related_type: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          related_type?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          amount: number
          client_id: string | null
          close_date: string
          created_at: string
          created_by: string
          id: string
          lead_id: string | null
          name: string
          primary_owner_id: string
          probability: number | null
          stage: string
          territory_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          close_date: string
          created_at?: string
          created_by: string
          id?: string
          lead_id?: string | null
          name: string
          primary_owner_id: string
          probability?: number | null
          stage: string
          territory_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          close_date?: string
          created_at?: string
          created_by?: string
          id?: string
          lead_id?: string | null
          name?: string
          primary_owner_id?: string
          probability?: number | null
          stage?: string
          territory_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_splits: {
        Row: {
          amount: number | null
          created_at: string
          created_by: string
          id: string
          opportunity_id: string
          percentage: number
          role: string | null
          split_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          created_by: string
          id?: string
          opportunity_id: string
          percentage: number
          role?: string | null
          split_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          created_by?: string
          id?: string
          opportunity_id?: string
          percentage?: number
          role?: string | null
          split_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_splits_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      password_history: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      password_policies: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          max_age_days: number
          min_length: number
          prevent_reuse_count: number
          require_lowercase: boolean
          require_numbers: boolean
          require_special_chars: boolean
          require_uppercase: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_age_days?: number
          min_length?: number
          prevent_reuse_count?: number
          require_lowercase?: boolean
          require_numbers?: boolean
          require_special_chars?: boolean
          require_uppercase?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_age_days?: number
          min_length?: number
          prevent_reuse_count?: number
          require_lowercase?: boolean
          require_numbers?: boolean
          require_special_chars?: boolean
          require_uppercase?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_entries: {
        Row: {
          amount: number | null
          client_id: string | null
          created_at: string
          id: string
          last_contact: string | null
          lead_id: string | null
          notes: string | null
          priority: string
          stage: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          client_id?: string | null
          created_at?: string
          id?: string
          last_contact?: string | null
          lead_id?: string | null
          notes?: string | null
          priority?: string
          stage: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          client_id?: string | null
          created_at?: string
          id?: string
          last_contact?: string | null
          lead_id?: string | null
          notes?: string | null
          priority?: string
          stage?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_entries_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          job_title: string | null
          language: string | null
          last_name: string | null
          phone_number: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean | null
          job_title?: string | null
          language?: string | null
          last_name?: string | null
          phone_number?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          language?: string | null
          last_name?: string | null
          phone_number?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          attempt_count: number
          block_until: string | null
          created_at: string
          id: string
          identifier: string
          is_blocked: boolean
          updated_at: string
          window_start: string
        }
        Insert: {
          action_type: string
          attempt_count?: number
          block_until?: string | null
          created_at?: string
          id?: string
          identifier: string
          is_blocked?: boolean
          updated_at?: string
          window_start?: string
        }
        Update: {
          action_type?: string
          attempt_count?: number
          block_until?: string | null
          created_at?: string
          id?: string
          identifier?: string
          is_blocked?: boolean
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      ringcentral_accounts: {
        Row: {
          client_id: string
          client_secret: string
          created_at: string
          extension: string | null
          id: string
          is_active: boolean
          server_url: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          client_id: string
          client_secret: string
          created_at?: string
          extension?: string | null
          id?: string
          is_active?: boolean
          server_url?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          client_id?: string
          client_secret?: string
          created_at?: string
          extension?: string | null
          id?: string
          is_active?: boolean
          server_url?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      secure_sessions: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          is_suspicious: boolean
          last_activity: string
          location_data: Json | null
          mfa_verified: boolean
          risk_score: number
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          is_suspicious?: boolean
          last_activity?: string
          location_data?: Json | null
          mfa_verified?: boolean
          risk_score?: number
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          is_suspicious?: boolean
          last_activity?: string
          location_data?: Json | null
          mfa_verified?: boolean
          risk_score?: number
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_config: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          severity: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          notification_type: string
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          notification_type: string
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          notification_type?: string
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      social_media_profiles: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          last_updated: string | null
          lead_id: string | null
          platform: string
          profile_data: Json | null
          profile_url: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          last_updated?: string | null
          lead_id?: string | null
          platform: string
          profile_data?: Json | null
          profile_url?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          last_updated?: string | null
          lead_id?: string | null
          platform?: string
          profile_data?: Json | null
          profile_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_profiles_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_configurations: {
        Row: {
          configuration: Json
          created_at: string
          domain_restrictions: string[] | null
          id: string
          is_active: boolean
          provider_name: string
          provider_type: string
          updated_at: string
        }
        Insert: {
          configuration: Json
          created_at?: string
          domain_restrictions?: string[] | null
          id?: string
          is_active?: boolean
          provider_name: string
          provider_type: string
          updated_at?: string
        }
        Update: {
          configuration?: Json
          created_at?: string
          domain_restrictions?: string[] | null
          id?: string
          is_active?: boolean
          provider_name?: string
          provider_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      territories: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          parent_id: string | null
          rules: Json
          territory_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          parent_id?: string | null
          rules: Json
          territory_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          parent_id?: string | null
          rules?: Json
          territory_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "territories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      territory_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          id: string
          is_active: boolean
          role: string
          territory_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          id?: string
          is_active?: boolean
          role: string
          territory_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          is_active?: boolean
          role?: string
          territory_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "territory_assignments_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_activity: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          error_message: string | null
          execution_data: Json | null
          id: string
          record_id: string
          started_at: string
          status: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          execution_data?: Json | null
          id?: string
          record_id: string
          started_at?: string
          status: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          execution_data?: Json | null
          id?: string
          record_id?: string
          started_at?: string
          status?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          flow_definition: Json
          id: string
          is_active: boolean
          name: string
          object_type: string
          trigger_conditions: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          flow_definition: Json
          id?: string
          is_active?: boolean
          name: string
          object_type: string
          trigger_conditions?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          flow_definition?: Json
          id?: string
          is_active?: boolean
          name?: string
          object_type?: string
          trigger_conditions?: Json | null
          trigger_type?: string
          updated_at?: string
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
          p_identifier: string
          p_action_type: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: Json
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_audit_log: {
        Args: {
          p_action: string
          p_table_name?: string
          p_record_id?: string
          p_old_values?: Json
          p_new_values?: Json
        }
        Returns: string
      }
      get_recent_failed_attempts: {
        Args: { user_email: string }
        Returns: number
      }
      get_user_role: {
        Args: { user_id?: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          required_role: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Returns: boolean
      }
      is_account_locked: {
        Args: { user_email: string }
        Returns: boolean
      }
      is_ip_allowed: {
        Args: { client_ip: unknown }
        Returns: boolean
      }
      lock_account: {
        Args: { user_email: string; lock_reason?: string }
        Returns: string
      }
      log_enhanced_security_event: {
        Args: {
          p_user_id?: string
          p_event_type?: string
          p_severity?: string
          p_details?: Json
          p_ip_address?: unknown
          p_user_agent?: string
          p_device_fingerprint?: string
          p_location?: Json
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_user_id?: string
          p_event_type?: string
          p_severity?: string
          p_details?: Json
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: string
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: Json
      }
    }
    Enums: {
      user_role: "admin" | "manager" | "agent" | "viewer"
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
      user_role: ["admin", "manager", "agent", "viewer"],
    },
  },
} as const
