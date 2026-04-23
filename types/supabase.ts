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
      activities: {
        Row: {
          activity_type: string | null
          agency_id: string | null
          ai_sentiment: string | null
          ai_suggested_action: string | null
          ai_summary: string | null
          channel: string | null
          contact_id: string | null
          created_at: string | null
          duration: number | null
          id: string
          is_processed: boolean | null
          metadata: Json | null
          outcome: string | null
          property_id: string | null
          raw_content: string
          scheduled_at: string | null
          status: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          activity_type?: string | null
          agency_id?: string | null
          ai_sentiment?: string | null
          ai_suggested_action?: string | null
          ai_summary?: string | null
          channel?: string | null
          contact_id?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          is_processed?: boolean | null
          metadata?: Json | null
          outcome?: string | null
          property_id?: string | null
          raw_content: string
          scheduled_at?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string | null
          agency_id?: string | null
          ai_sentiment?: string | null
          ai_suggested_action?: string | null
          ai_summary?: string | null
          channel?: string | null
          contact_id?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          is_processed?: boolean | null
          metadata?: Json | null
          outcome?: string | null
          property_id?: string | null
          raw_content?: string
          scheduled_at?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "activities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "admin_cashflow_projection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "admin_money_at_risk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "agency_money_at_risk"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "activities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "activities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      agencies: {
        Row: {
          address: string | null
          billing_plan: string | null
          created_at: string | null
          current_period_end: string | null
          email_contact: string | null
          floorplan_usage_count: number | null
          floorplan_usage_reset_date: string | null
          grace_period_ends_at: string | null
          id: string
          max_members: number | null
          name: string
          owner_id: string | null
          phone: string | null
          settings_notifications: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          billing_plan?: string | null
          created_at?: string | null
          current_period_end?: string | null
          email_contact?: string | null
          floorplan_usage_count?: number | null
          floorplan_usage_reset_date?: string | null
          grace_period_ends_at?: string | null
          id?: string
          max_members?: number | null
          name: string
          owner_id?: string | null
          phone?: string | null
          settings_notifications?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          billing_plan?: string | null
          created_at?: string | null
          current_period_end?: string | null
          email_contact?: string | null
          floorplan_usage_count?: number | null
          floorplan_usage_reset_date?: string | null
          grace_period_ends_at?: string | null
          id?: string
          max_members?: number | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          settings_notifications?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          website?: string | null
        }
        Relationships: []
      }
      agency_members: {
        Row: {
          agency_id: string | null
          id: string
          is_admin: boolean | null
          joined_at: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          agency_id?: string | null
          id?: string
          is_admin?: boolean | null
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          agency_id?: string | null
          id?: string
          is_admin?: boolean | null
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_members_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_locations: {
        Row: {
          accuracy: number | null
          agency_id: string
          created_at: string
          id: string
          latitude: number
          longitude: number
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          agency_id: string
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          user_id: string
        }
        Update: {
          accuracy?: number | null
          agency_id?: string
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_locations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          agency_id: string | null
          cost_usd: number | null
          created_at: string | null
          feature_context: string | null
          id: string
          input_tokens: number | null
          model: string
          output_tokens: number | null
          provider: string
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          agency_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          feature_context?: string | null
          id?: string
          input_tokens?: number | null
          model: string
          output_tokens?: number | null
          provider: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          agency_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          feature_context?: string | null
          id?: string
          input_tokens?: number | null
          model?: string
          output_tokens?: number | null
          provider?: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_preferences: {
        Row: {
          agency_id: string
          cities: string[] | null
          contact_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          max_bedrooms: number | null
          max_price: number | null
          max_size_m2: number | null
          min_bathrooms: number | null
          min_bedrooms: number | null
          min_match_score: number | null
          min_price: number | null
          min_size_m2: number | null
          property_type: string | null
          provinces: string[] | null
          required_features: string[] | null
          transaction_type: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          cities?: string[] | null
          contact_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_bedrooms?: number | null
          max_price?: number | null
          max_size_m2?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          min_match_score?: number | null
          min_price?: number | null
          min_size_m2?: number | null
          property_type?: string | null
          provinces?: string[] | null
          required_features?: string[] | null
          transaction_type?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          cities?: string[] | null
          contact_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_bedrooms?: number | null
          max_price?: number | null
          max_size_m2?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          min_match_score?: number | null
          min_price?: number | null
          min_size_m2?: number | null
          property_type?: string | null
          provinces?: string[] | null
          required_features?: string[] | null
          transaction_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_preferences_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_preferences_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_preferences_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          event_type: string
          id: string
          is_recurring: boolean | null
          location: string | null
          notes: string | null
          property_id: string | null
          recurrence_rule: string | null
          reminder_minutes: number | null
          scheduled_at: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          event_type: string
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          notes?: string | null
          property_id?: string | null
          recurrence_rule?: string | null
          reminder_minutes?: number | null
          scheduled_at: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          event_type?: string
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          notes?: string | null
          property_id?: string | null
          recurrence_rule?: string | null
          reminder_minutes?: number | null
          scheduled_at?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "calendar_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "admin_cashflow_projection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "admin_money_at_risk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "agency_money_at_risk"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "calendar_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "calendar_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_sends: {
        Row: {
          agency_id: string
          campaign_id: string
          clicked_at: string | null
          contact_id: string
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          html_content: string
          id: string
          opened_at: string | null
          provider_email_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
        }
        Insert: {
          agency_id: string
          campaign_id: string
          clicked_at?: string | null
          contact_id: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          html_content: string
          id?: string
          opened_at?: string | null
          provider_email_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          agency_id?: string
          campaign_id?: string
          clicked_at?: string | null
          contact_id?: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          html_content?: string
          id?: string
          opened_at?: string | null
          provider_email_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_sends_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          address_lat: number | null
          address_lng: number | null
          agency_id: string | null
          ai_analysis_cache: Json | null
          ai_farming_strategy: string | null
          ai_last_updated: string | null
          ai_prediction: Json | null
          ai_profile_summary: string | null
          ai_summary: string | null
          behavior_tags: Json | null
          budget_max: number | null
          budget_min: number | null
          building_number: string | null
          cadastral_reference: string | null
          company: string | null
          conversion_probability: number | null
          created_at: string | null
          door: string | null
          email: string | null
          embedding_preferences: string | null
          estimated_market_value: number | null
          farming_status: string | null
          financial_propensity: number | null
          financial_status: string | null
          first_name: string
          floor: string | null
          formatted_address: string | null
          google_place_id: string | null
          id: string
          intelligence_score: number | null
          last_interaction_outcome: string | null
          last_name: string | null
          last_scoring_update: string | null
          last_valuation_date: string | null
          latitude: number | null
          lead_score: number | null
          legal_alerts_found: boolean | null
          legal_analysis_summary: Json | null
          life_stage: string | null
          longitude: number | null
          min_bathrooms: number | null
          min_bedrooms: number | null
          phone: string | null
          position: string | null
          preferences_embedding: string | null
          preferred_zones: string[] | null
          property_competitor_expiry: string | null
          property_competitor_name: string | null
          property_lease_end: string | null
          property_occupancy: string | null
          role: string | null
          street: string | null
          street_number: string | null
          surface_m2: number | null
          updated_at: string | null
          urgency_level: number | null
          usage_type: string | null
          user_id: string | null
          year_built: number | null
        }
        Insert: {
          address?: string | null
          address_lat?: number | null
          address_lng?: number | null
          agency_id?: string | null
          ai_analysis_cache?: Json | null
          ai_farming_strategy?: string | null
          ai_last_updated?: string | null
          ai_prediction?: Json | null
          ai_profile_summary?: string | null
          ai_summary?: string | null
          behavior_tags?: Json | null
          budget_max?: number | null
          budget_min?: number | null
          building_number?: string | null
          cadastral_reference?: string | null
          company?: string | null
          conversion_probability?: number | null
          created_at?: string | null
          door?: string | null
          email?: string | null
          embedding_preferences?: string | null
          estimated_market_value?: number | null
          farming_status?: string | null
          financial_propensity?: number | null
          financial_status?: string | null
          first_name: string
          floor?: string | null
          formatted_address?: string | null
          google_place_id?: string | null
          id?: string
          intelligence_score?: number | null
          last_interaction_outcome?: string | null
          last_name?: string | null
          last_scoring_update?: string | null
          last_valuation_date?: string | null
          latitude?: number | null
          lead_score?: number | null
          legal_alerts_found?: boolean | null
          legal_analysis_summary?: Json | null
          life_stage?: string | null
          longitude?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          phone?: string | null
          position?: string | null
          preferences_embedding?: string | null
          preferred_zones?: string[] | null
          property_competitor_expiry?: string | null
          property_competitor_name?: string | null
          property_lease_end?: string | null
          property_occupancy?: string | null
          role?: string | null
          street?: string | null
          street_number?: string | null
          surface_m2?: number | null
          updated_at?: string | null
          urgency_level?: number | null
          usage_type?: string | null
          user_id?: string | null
          year_built?: number | null
        }
        Update: {
          address?: string | null
          address_lat?: number | null
          address_lng?: number | null
          agency_id?: string | null
          ai_analysis_cache?: Json | null
          ai_farming_strategy?: string | null
          ai_last_updated?: string | null
          ai_prediction?: Json | null
          ai_profile_summary?: string | null
          ai_summary?: string | null
          behavior_tags?: Json | null
          budget_max?: number | null
          budget_min?: number | null
          building_number?: string | null
          cadastral_reference?: string | null
          company?: string | null
          conversion_probability?: number | null
          created_at?: string | null
          door?: string | null
          email?: string | null
          embedding_preferences?: string | null
          estimated_market_value?: number | null
          farming_status?: string | null
          financial_propensity?: number | null
          financial_status?: string | null
          first_name?: string
          floor?: string | null
          formatted_address?: string | null
          google_place_id?: string | null
          id?: string
          intelligence_score?: number | null
          last_interaction_outcome?: string | null
          last_name?: string | null
          last_scoring_update?: string | null
          last_valuation_date?: string | null
          latitude?: number | null
          lead_score?: number | null
          legal_alerts_found?: boolean | null
          legal_analysis_summary?: Json | null
          life_stage?: string | null
          longitude?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          phone?: string | null
          position?: string | null
          preferences_embedding?: string | null
          preferred_zones?: string[] | null
          property_competitor_expiry?: string | null
          property_competitor_name?: string | null
          property_lease_end?: string | null
          property_occupancy?: string | null
          role?: string | null
          street?: string | null
          street_number?: string | null
          surface_m2?: number | null
          updated_at?: string | null
          urgency_level?: number | null
          usage_type?: string | null
          user_id?: string | null
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          agency_id: string
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          scheduled_at: string | null
          started_at: string | null
          status: string | null
          target_audience: Json | null
          template_id: string | null
          total_clicked: number | null
          total_delivered: number | null
          total_failed: number | null
          total_opened: number | null
          total_recipients: number | null
          total_sent: number | null
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          target_audience?: Json | null
          template_id?: string | null
          total_clicked?: number | null
          total_delivered?: number | null
          total_failed?: number | null
          total_opened?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          target_audience?: Json | null
          template_id?: string | null
          total_clicked?: number | null
          total_delivered?: number | null
          total_failed?: number | null
          total_opened?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          agency_id: string
          category: string | null
          created_at: string | null
          description: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          agency_id: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          agency_id?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          agency_id: string
          contact_id: string | null
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          property_id: string | null
          start_time: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          agency_id: string
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          property_id?: string | null
          start_time: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          agency_id?: string
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          property_id?: string | null
          start_time?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "admin_cashflow_projection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "admin_money_at_risk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "agency_money_at_risk"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_dismissals: {
        Row: {
          dismissed_at: string | null
          entity_id: string
          feed_type: string
          id: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string | null
          entity_id: string
          feed_type: string
          id?: string
          user_id: string
        }
        Update: {
          dismissed_at?: string | null
          entity_id?: string
          feed_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          agency_id: string
          created_at: string | null
          end_date: string
          id: string
          period: string
          start_date: string
          target_value: number
          type: string
          user_id: string | null
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          end_date: string
          id?: string
          period: string
          start_date: string
          target_value: number
          type: string
          user_id?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          period?: string
          start_date?: string
          target_value?: number
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          section: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          section: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          section?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      market_stats: {
        Row: {
          avg_price_m2: number
          city: string
          created_at: string | null
          id: string
          trend: string | null
          updated_at: string | null
          zone_name: string
        }
        Insert: {
          avg_price_m2: number
          city: string
          created_at?: string | null
          id?: string
          trend?: string | null
          updated_at?: string | null
          zone_name: string
        }
        Update: {
          avg_price_m2?: number
          city?: string
          created_at?: string | null
          id?: string
          trend?: string | null
          updated_at?: string | null
          zone_name?: string
        }
        Relationships: []
      }
      marketplace_leads: {
        Row: {
          agency_id: string
          created_at: string | null
          email: string
          id: string
          listing_id: string
          message: string | null
          name: string
          phone: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          email: string
          id?: string
          listing_id: string
          message?: string | null
          name: string
          phone?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          email?: string
          id?: string
          listing_id?: string
          message?: string | null
          name?: string
          phone?: string | null
          source?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_leads_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_leads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          agency_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          leads_generated: number | null
          property_id: string
          published_at: string | null
          status: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          leads_generated?: number | null
          property_id: string
          published_at?: string | null
          status?: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          leads_generated?: number | null
          property_id?: string
          published_at?: string | null
          status?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "admin_cashflow_projection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "admin_money_at_risk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "agency_money_at_risk"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "marketplace_listings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "marketplace_listings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      match_notifications: {
        Row: {
          agency_id: string
          clicked_at: string | null
          contact_id: string
          created_at: string | null
          email_opened: boolean | null
          email_opened_at: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          link_clicked: boolean | null
          listing_id: string
          match_reasons: Json | null
          match_score: number
          preference_id: string
        }
        Insert: {
          agency_id: string
          clicked_at?: string | null
          contact_id: string
          created_at?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          link_clicked?: boolean | null
          listing_id: string
          match_reasons?: Json | null
          match_score: number
          preference_id: string
        }
        Update: {
          agency_id?: string
          clicked_at?: string | null
          contact_id?: string
          created_at?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          link_clicked?: boolean | null
          listing_id?: string
          match_reasons?: Json | null
          match_score?: number
          preference_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_notifications_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_notifications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_notifications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "match_notifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_notifications_preference_id_fkey"
            columns: ["preference_id"]
            isOneToOne: false
            referencedRelation: "buyer_preferences"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          amount: number
          contact_id: string
          created_at: string
          id: string
          notes: string | null
          property_id: string
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          contact_id: string
          created_at?: string
          id?: string
          notes?: string | null
          property_id: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          contact_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          property_id?: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "offers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "admin_cashflow_projection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "admin_money_at_risk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "agency_money_at_risk"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "offers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "offers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_publications: {
        Row: {
          created_at: string | null
          error_message: string | null
          external_id: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          portal_name: string
          property_id: string
          published_url: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          portal_name: string
          property_id: string
          published_url?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          portal_name?: string
          property_id?: string
          published_url?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_publications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "admin_cashflow_projection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_publications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "admin_money_at_risk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_publications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "agency_money_at_risk"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "portal_publications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "portal_publications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      preferences: {
        Row: {
          agency_id: string | null
          contact_id: string
          created_at: string | null
          financial_status: string | null
          id: string
          max_price: number | null
          min_bathrooms: number | null
          min_bedrooms: number | null
          min_price: number | null
          property_type: string | null
          updated_at: string | null
          zones: string[] | null
        }
        Insert: {
          agency_id?: string | null
          contact_id: string
          created_at?: string | null
          financial_status?: string | null
          id?: string
          max_price?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          min_price?: number | null
          property_type?: string | null
          updated_at?: string | null
          zones?: string[] | null
        }
        Update: {
          agency_id?: string | null
          contact_id?: string
          created_at?: string | null
          financial_status?: string | null
          id?: string
          max_price?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          min_price?: number | null
          property_type?: string | null
          updated_at?: string | null
          zones?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "preferences_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preferences_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preferences_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_session_id: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          email_signature: string | null
          first_name: string | null
          id: string
          imap_host: string | null
          imap_password: string | null
          imap_port: number | null
          imap_user: string | null
          job_title: string | null
          last_name: string | null
          onboarding_completed: boolean | null
          phone: string | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_user: string | null
          updated_at: string | null
        }
        Insert: {
          active_session_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          email_signature?: string | null
          first_name?: string | null
          id: string
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_user?: string | null
          job_title?: string | null
          last_name?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string | null
        }
        Update: {
          active_session_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          email_signature?: string | null
          first_name?: string | null
          id?: string
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_user?: string | null
          job_title?: string | null
          last_name?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          address_lat: number | null
          address_lng: number | null
          agency_id: string | null
          ai_advice_cache: Json | null
          bathrooms: number | null
          bedrooms: number
          buyer_contact_id: string | null
          cadastral_reference: string | null
          closing_probability: number | null
          commission_amount: number | null
          created_at: string | null
          description: string | null
          description_embedding: string | null
          door: string | null
          estimated_market_value: number | null
          exclusive_end_date: string | null
          final_price: number | null
          floor: string | null
          formatted_address: string | null
          google_place_id: string | null
          id: string
          image_url: string | null
          images: string[] | null
          m2: number | null
          market_delta: number | null
          marketing_description: string | null
          min_acceptable_price: number | null
          owner_contact_id: string | null
          photo_url: string | null
          price: number
          professional_plan_url: string | null
          property_type: string | null
          raw_status: string | null
          reservation_date: string | null
          size: number | null
          stage_tasks: Json | null
          status: string | null
          street: string | null
          street_number: string | null
          surface_m2: number | null
          type: string | null
          updated_at: string | null
          usage_type: string | null
          user_id: string | null
          valuation_data: Json | null
          valuation_price: number | null
          year_built: number | null
          zone: string
        }
        Insert: {
          address: string
          address_lat?: number | null
          address_lng?: number | null
          agency_id?: string | null
          ai_advice_cache?: Json | null
          bathrooms?: number | null
          bedrooms: number
          buyer_contact_id?: string | null
          cadastral_reference?: string | null
          closing_probability?: number | null
          commission_amount?: number | null
          created_at?: string | null
          description?: string | null
          description_embedding?: string | null
          door?: string | null
          estimated_market_value?: number | null
          exclusive_end_date?: string | null
          final_price?: number | null
          floor?: string | null
          formatted_address?: string | null
          google_place_id?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          m2?: number | null
          market_delta?: number | null
          marketing_description?: string | null
          min_acceptable_price?: number | null
          owner_contact_id?: string | null
          photo_url?: string | null
          price: number
          professional_plan_url?: string | null
          property_type?: string | null
          raw_status?: string | null
          reservation_date?: string | null
          size?: number | null
          stage_tasks?: Json | null
          status?: string | null
          street?: string | null
          street_number?: string | null
          surface_m2?: number | null
          type?: string | null
          updated_at?: string | null
          usage_type?: string | null
          user_id?: string | null
          valuation_data?: Json | null
          valuation_price?: number | null
          year_built?: number | null
          zone: string
        }
        Update: {
          address?: string
          address_lat?: number | null
          address_lng?: number | null
          agency_id?: string | null
          ai_advice_cache?: Json | null
          bathrooms?: number | null
          bedrooms?: number
          buyer_contact_id?: string | null
          cadastral_reference?: string | null
          closing_probability?: number | null
          commission_amount?: number | null
          created_at?: string | null
          description?: string | null
          description_embedding?: string | null
          door?: string | null
          estimated_market_value?: number | null
          exclusive_end_date?: string | null
          final_price?: number | null
          floor?: string | null
          formatted_address?: string | null
          google_place_id?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          m2?: number | null
          market_delta?: number | null
          marketing_description?: string | null
          min_acceptable_price?: number | null
          owner_contact_id?: string | null
          photo_url?: string | null
          price?: number
          professional_plan_url?: string | null
          property_type?: string | null
          raw_status?: string | null
          reservation_date?: string | null
          size?: number | null
          stage_tasks?: Json | null
          status?: string | null
          street?: string | null
          street_number?: string | null
          surface_m2?: number | null
          type?: string | null
          updated_at?: string | null
          usage_type?: string | null
          user_id?: string | null
          valuation_data?: Json | null
          valuation_price?: number | null
          year_built?: number | null
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_buyer_contact_id_fkey"
            columns: ["buyer_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_buyer_contact_id_fkey"
            columns: ["buyer_contact_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "properties_owner_contact_id_fkey"
            columns: ["owner_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_contact_id_fkey"
            columns: ["owner_contact_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_contact_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      property_offers: {
        Row: {
          amount: number
          buyer_contact_id: string | null
          created_at: string | null
          id: string
          property_id: string | null
          status: string | null
        }
        Insert: {
          amount: number
          buyer_contact_id?: string | null
          created_at?: string | null
          id?: string
          property_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          buyer_contact_id?: string | null
          created_at?: string | null
          id?: string
          property_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_offers_buyer_contact_id_fkey"
            columns: ["buyer_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_offers_buyer_contact_id_fkey"
            columns: ["buyer_contact_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "property_offers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "admin_cashflow_projection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_offers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "admin_money_at_risk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_offers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "agency_money_at_risk"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_offers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_offers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_visits: {
        Row: {
          agency_id: string
          agent_notes: string | null
          cancellation_sent: boolean | null
          confirmation_sent: boolean | null
          created_at: string | null
          id: string
          listing_id: string
          property_id: string
          reminder_sent: boolean | null
          scheduled_at: string | null
          status: string
          updated_at: string | null
          visit_date: string
          visit_time: string
          visitor_email: string
          visitor_name: string
          visitor_notes: string | null
          visitor_phone: string | null
        }
        Insert: {
          agency_id: string
          agent_notes?: string | null
          cancellation_sent?: boolean | null
          confirmation_sent?: boolean | null
          created_at?: string | null
          id?: string
          listing_id: string
          property_id: string
          reminder_sent?: boolean | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string | null
          visit_date: string
          visit_time: string
          visitor_email: string
          visitor_name: string
          visitor_notes?: string | null
          visitor_phone?: string | null
        }
        Update: {
          agency_id?: string
          agent_notes?: string | null
          cancellation_sent?: boolean | null
          confirmation_sent?: boolean | null
          created_at?: string | null
          id?: string
          listing_id?: string
          property_id?: string
          reminder_sent?: boolean | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string | null
          visit_date?: string
          visit_time?: string
          visitor_email?: string
          visitor_name?: string
          visitor_notes?: string | null
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_visits_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_visits_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "admin_cashflow_projection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "admin_money_at_risk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "agency_money_at_risk"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "scheduled_visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "financial_opportunity_pipeline"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "scheduled_visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_groups: {
        Row: {
          agency_id: string | null
          color: string | null
          created_at: string | null
          created_by: string
          expires_at: string | null
          filter_criteria: Json | null
          icon: string | null
          id: string
          name: string
          type: string | null
        }
        Insert: {
          agency_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          filter_criteria?: Json | null
          icon?: string | null
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          agency_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          filter_criteria?: Json | null
          icon?: string | null
          id?: string
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      telemetry_events: {
        Row: {
          agency_id: string
          created_at: string | null
          event_payload: Json | null
          event_type: string
          id: string
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          event_payload?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          event_payload?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_events_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_logs: {
        Row: {
          agency_id: string
          created_at: string | null
          id: string
          lat: number
          lng: number
          user_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          id?: string
          lat: number
          lng: number
          user_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          id?: string
          lat?: number
          lng?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_logs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_cashflow_projection: {
        Row: {
          address: string | null
          days_to_close: number | null
          estimated_closing_date: string | null
          id: string | null
          potential_commission: number | null
          status: string | null
        }
        Insert: {
          address?: string | null
          days_to_close?: never
          estimated_closing_date?: never
          id?: string | null
          potential_commission?: never
          status?: string | null
        }
        Update: {
          address?: string | null
          days_to_close?: never
          estimated_closing_date?: never
          id?: string | null
          potential_commission?: never
          status?: string | null
        }
        Relationships: []
      }
      admin_money_at_risk: {
        Row: {
          address: string | null
          id: string | null
          intelligence_score: number | null
          last_scoring_update: string | null
          legal_alerts_found: boolean | null
          listing_price: number | null
          potential_commission: number | null
          risk_percentage: number | null
        }
        Relationships: []
      }
      agency_agent_performance: {
        Row: {
          agency_id: string | null
          agent_name: string | null
          avg_risk_index: number | null
          total_portfolio_value: number | null
          total_properties: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_dashboard_stats: {
        Row: {
          active_properties: number | null
          agency_id: string | null
          contacts_by_stage: Json | null
          last_updated: string | null
          pipeline_value: number | null
          total_contacts: number | null
          total_properties: number | null
        }
        Relationships: []
      }
      agency_money_at_risk: {
        Row: {
          address: string | null
          agency_id: string | null
          intelligence_score: number | null
          last_scoring_update: string | null
          legal_alerts_found: boolean | null
          listing_price: number | null
          potential_commission: number | null
          property_id: string | null
          risk_percentage: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_opportunity_pipeline: {
        Row: {
          address: string | null
          contact_id: string | null
          estimated_market_value: number | null
          financial_priority_score: number | null
          intelligence_score: number | null
          legal_alerts_found: boolean | null
          listing_price: number | null
          owner_name: string | null
          potential_equity: number | null
          property_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_and_reset_floorplan_usage: {
        Args: { agency_id_param: string }
        Returns: {
          can_use: boolean
          current_usage: number
          usage_limit: number
        }[]
      }
      check_is_member: { Args: { check_agency_id: string }; Returns: boolean }
      cleanup_expired_groups: { Args: never; Returns: number }
      get_active_buyer_preferences: {
        Args: { p_agency_id: string }
        Returns: {
          cities: string[]
          contact_email: string
          contact_id: string
          contact_name: string
          is_active: boolean
          max_price: number
          min_bedrooms: number
          min_match_score: number
          min_price: number
          preference_id: string
          property_type: string
        }[]
      }
      get_agency_upcoming_visits: {
        Args: { p_agency_id: string }
        Returns: {
          created_at: string
          property_title: string
          status: string
          visit_date: string
          visit_id: string
          visit_time: string
          visitor_email: string
          visitor_name: string
        }[]
      }
      get_available_slots: {
        Args: { p_date: string; p_property_id: string }
        Returns: {
          is_available: boolean
          time_slot: string
        }[]
      }
      get_floorplan_limit: { Args: { plan_name: string }; Returns: number }
      get_map_markers: {
        Args: {
          max_lat: number
          max_lng: number
          min_lat: number
          min_lng: number
        }
        Returns: {
          address: string
          id: string
          lat: number
          lng: number
          price: number
          status: string
        }[]
      }
      get_match_history: {
        Args: { p_contact_id: string }
        Returns: {
          created_at: string
          email_opened: boolean
          email_sent: boolean
          match_score: number
          notification_id: string
          property_title: string
        }[]
      }
      get_my_agency_id: { Args: never; Returns: string }
      get_my_agency_stats: {
        Args: never
        Returns: {
          active_properties: number | null
          agency_id: string | null
          contacts_by_stage: Json | null
          last_updated: string | null
          pipeline_value: number | null
          total_contacts: number | null
          total_properties: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "agency_dashboard_stats"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_team_roster: {
        Args: never
        Returns: {
          email: string
          joined_at: string
          role: string
          user_id: string
        }[]
      }
      get_public_listings:
        | {
            Args: { p_limit?: number; p_offset?: number }
            Returns: {
              address: string
              bathrooms: number
              bedrooms: number
              city: string
              listing_id: string
              photos: Json
              price: number
              property_id: string
              published_at: string
              size_m2: number
              title: string
              views: number
            }[]
          }
        | {
            Args: {
              p_bedrooms?: number
              p_limit?: number
              p_max_price?: number
              p_min_price?: number
              p_offset?: number
            }
            Returns: {
              address: string
              bathrooms: number
              bedrooms: number
              description: string
              formatted_address: string
              images: string[]
              listing_id: string
              marketing_description: string
              price: number
              property_id: string
              published_at: string
              surface_m2: number
              views: number
              zone: string
            }[]
          }
      get_smart_opportunity_feed: {
        Args: { limit_count: number }
        Returns: {
          cta_label: string
          entity_a: string
          entity_b: string
          id: string
          metadata: Json
          reasoning: string
          score: number
          title: string
          type: string
        }[]
      }
      increment_campaign_stat: {
        Args: { p_campaign_id: string; p_column: string }
        Returns: undefined
      }
      increment_listing_views: {
        Args: { p_listing_id: string }
        Returns: undefined
      }
      is_member_of: { Args: { _agency_id: string }; Returns: boolean }
      join_agency_securely: {
        Args: { target_agency_id: string }
        Returns: boolean
      }
      match_potential_buyers: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          budget_max: number
          email: string
          financial_status: string
          first_name: string
          id: string
          last_name: string
          min_bedrooms: number
          phone: string
          preferred_zones: string[]
          similarity: number
        }[]
      }
      match_properties: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          address: string
          address_lat: number | null
          address_lng: number | null
          agency_id: string | null
          ai_advice_cache: Json | null
          bathrooms: number | null
          bedrooms: number
          buyer_contact_id: string | null
          cadastral_reference: string | null
          closing_probability: number | null
          commission_amount: number | null
          created_at: string | null
          description: string | null
          description_embedding: string | null
          door: string | null
          estimated_market_value: number | null
          exclusive_end_date: string | null
          final_price: number | null
          floor: string | null
          formatted_address: string | null
          google_place_id: string | null
          id: string
          image_url: string | null
          images: string[] | null
          m2: number | null
          market_delta: number | null
          marketing_description: string | null
          min_acceptable_price: number | null
          owner_contact_id: string | null
          photo_url: string | null
          price: number
          professional_plan_url: string | null
          property_type: string | null
          raw_status: string | null
          reservation_date: string | null
          size: number | null
          stage_tasks: Json | null
          status: string | null
          street: string | null
          street_number: string | null
          surface_m2: number | null
          type: string | null
          updated_at: string | null
          usage_type: string | null
          user_id: string | null
          valuation_data: Json | null
          valuation_price: number | null
          year_built: number | null
          zone: string
        }[]
        SetofOptions: {
          from: "*"
          to: "properties"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      match_properties_for_contact: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          address: string
          bathrooms: number
          bedrooms: number
          id: string
          photo_url: string
          price: number
          similarity: number
          size: number
          status: string
          zone: string
        }[]
      }
      refresh_agency_stats: { Args: never; Returns: undefined }
      search_contacts_fuzzy: {
        Args: {
          match_threshold?: number
          p_agency_id: string
          search_query: string
        }
        Returns: {
          address: string | null
          address_lat: number | null
          address_lng: number | null
          agency_id: string | null
          ai_analysis_cache: Json | null
          ai_farming_strategy: string | null
          ai_last_updated: string | null
          ai_prediction: Json | null
          ai_profile_summary: string | null
          ai_summary: string | null
          behavior_tags: Json | null
          budget_max: number | null
          budget_min: number | null
          building_number: string | null
          cadastral_reference: string | null
          company: string | null
          conversion_probability: number | null
          created_at: string | null
          door: string | null
          email: string | null
          embedding_preferences: string | null
          estimated_market_value: number | null
          farming_status: string | null
          financial_propensity: number | null
          financial_status: string | null
          first_name: string
          floor: string | null
          formatted_address: string | null
          google_place_id: string | null
          id: string
          intelligence_score: number | null
          last_interaction_outcome: string | null
          last_name: string | null
          last_scoring_update: string | null
          last_valuation_date: string | null
          latitude: number | null
          lead_score: number | null
          legal_alerts_found: boolean | null
          legal_analysis_summary: Json | null
          life_stage: string | null
          longitude: number | null
          min_bathrooms: number | null
          min_bedrooms: number | null
          phone: string | null
          position: string | null
          preferences_embedding: string | null
          preferred_zones: string[] | null
          property_competitor_expiry: string | null
          property_competitor_name: string | null
          property_lease_end: string | null
          property_occupancy: string | null
          role: string | null
          street: string | null
          street_number: string | null
          surface_m2: number | null
          updated_at: string | null
          urgency_level: number | null
          usage_type: string | null
          user_id: string | null
          year_built: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "contacts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_contacts_hybrid: {
        Args: {
          match_threshold?: number
          p_agency_id: string
          query_text: string
        }
        Returns: {
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
          similarity: number
        }[]
      }
      search_knowledge: {
        Args: {
          filter_section?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          section: string
          similarity: number
          title: string
        }[]
      }
      user_is_agency_admin: {
        Args: { agency_uuid: string; user_uuid: string }
        Returns: boolean
      }
      user_is_agency_member: {
        Args: { agency_uuid: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      offer_status: "pending" | "accepted" | "rejected" | "counter_offer"
      property_occupancy:
        | "vacant"
        | "rented"
        | "owner_occupied"
        | "competitor"
        | "unavailable"
        | "unknown"
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
      offer_status: ["pending", "accepted", "rejected", "counter_offer"],
      property_occupancy: [
        "vacant",
        "rented",
        "owner_occupied",
        "competitor",
        "unavailable",
        "unknown",
      ],
    },
  },
} as const
