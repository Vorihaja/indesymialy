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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_preferences: {
        Row: {
          data_export_requested_at: string | null
          deletion_requested_at: string | null
          discoverable: boolean
          email_enabled: boolean
          language: string
          profile_id: string
          profile_visibility: string
          push_enabled: boolean
          theme: string
          updated_at: string
        }
        Insert: {
          data_export_requested_at?: string | null
          deletion_requested_at?: string | null
          discoverable?: boolean
          email_enabled?: boolean
          language?: string
          profile_id: string
          profile_visibility?: string
          push_enabled?: boolean
          theme?: string
          updated_at?: string
        }
        Update: {
          data_export_requested_at?: string | null
          deletion_requested_at?: string | null
          discoverable?: boolean
          email_enabled?: boolean
          language?: string
          profile_id?: string
          profile_visibility?: string
          push_enabled?: boolean
          theme?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      active_organizations: {
        Row: {
          organization_id: string
          profile_id: string
          selected_at: string
        }
        Insert: {
          organization_id: string
          profile_id: string
          selected_at?: string
        }
        Update: {
          organization_id?: string
          profile_id?: string
          selected_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_organizations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_access_logs: {
        Row: {
          action: string
          actor_profile_id: string
          created_at: string
          details: Json
          id: string
          target_profile_id: string | null
        }
        Insert: {
          action: string
          actor_profile_id: string
          created_at?: string
          details?: Json
          id?: string
          target_profile_id?: string | null
        }
        Update: {
          action?: string
          actor_profile_id?: string
          created_at?: string
          details?: Json
          id?: string
          target_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_access_logs_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_access_logs_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_governance_state: {
        Row: {
          admin_since: string | null
          changed_by: string | null
          created_at: string
          last_reason: string | null
          permission_snapshot: string[]
          profile_id: string
          reactivated_at: string | null
          revoked_at: string | null
          status: string
          suspended_at: string | null
          updated_at: string
        }
        Insert: {
          admin_since?: string | null
          changed_by?: string | null
          created_at?: string
          last_reason?: string | null
          permission_snapshot?: string[]
          profile_id: string
          reactivated_at?: string | null
          revoked_at?: string | null
          status?: string
          suspended_at?: string | null
          updated_at?: string
        }
        Update: {
          admin_since?: string | null
          changed_by?: string | null
          created_at?: string
          last_reason?: string | null
          permission_snapshot?: string[]
          profile_id?: string
          reactivated_at?: string | null
          revoked_at?: string | null
          status?: string
          suspended_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_governance_state_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_governance_state_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_permission_grants: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          permission_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_permission_grants_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_permission_grants_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_permission_grants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_permission_metadata: {
        Row: {
          action: string
          action_label: string
          created_at: string
          display_order: number
          domain: string
          domain_label: string
          is_active: boolean
          label: string
          permission_id: string
          sensitivity: string
          updated_at: string
        }
        Insert: {
          action: string
          action_label: string
          created_at?: string
          display_order?: number
          domain: string
          domain_label: string
          is_active?: boolean
          label: string
          permission_id: string
          sensitivity: string
          updated_at?: string
        }
        Update: {
          action?: string
          action_label?: string
          created_at?: string
          display_order?: number
          domain?: string
          domain_label?: string
          is_active?: boolean
          label?: string
          permission_id?: string
          sensitivity?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_permission_metadata_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: true
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      attendances: {
        Row: {
          check_in_at: string | null
          check_method: string | null
          check_out_at: string | null
          coach_id: string | null
          created_at: string | null
          discipline: string | null
          id: string
          member_id: string | null
          notes: string | null
          organization_id: string | null
          session_date: string
          session_time: string
          status: string | null
        }
        Insert: {
          check_in_at?: string | null
          check_method?: string | null
          check_out_at?: string | null
          coach_id?: string | null
          created_at?: string | null
          discipline?: string | null
          id?: string
          member_id?: string | null
          notes?: string | null
          organization_id?: string | null
          session_date: string
          session_time: string
          status?: string | null
        }
        Update: {
          check_in_at?: string | null
          check_method?: string | null
          check_out_at?: string | null
          coach_id?: string | null
          created_at?: string | null
          discipline?: string | null
          id?: string
          member_id?: string | null
          notes?: string | null
          organization_id?: string | null
          session_date?: string
          session_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendances_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "club_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_observability_events: {
        Row: {
          auth_method: string
          duration_ms: number
          error_category: string | null
          event_id: string
          id: string
          observed_at: string
          outcome: string
          source: string
        }
        Insert: {
          auth_method?: string
          duration_ms: number
          error_category?: string | null
          event_id: string
          id?: string
          observed_at?: string
          outcome: string
          source?: string
        }
        Update: {
          auth_method?: string
          duration_ms?: number
          error_category?: string | null
          event_id?: string
          id?: string
          observed_at?: string
          outcome?: string
          source?: string
        }
        Relationships: []
      }
      breaking_news: {
        Row: {
          created_at: string | null
          id: string
          text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          text?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          aliases: string[]
          commune_id: string | null
          created_at: string | null
          district_id: string | null
          id: string
          is_active: boolean
          name: string
          region_id: string
          slug: string | null
        }
        Insert: {
          aliases?: string[]
          commune_id?: string | null
          created_at?: string | null
          district_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          region_id: string
          slug?: string | null
        }
        Update: {
          aliases?: string[]
          commune_id?: string | null
          created_at?: string | null
          district_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          region_id?: string
          slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      club_events: {
        Row: {
          actual_attendees: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string | null
          expected_attendees: number | null
          id: string
          is_public: boolean | null
          name: string
          organization_id: string | null
          poster_url: string | null
          start_time: string | null
          status: string | null
          updated_at: string | null
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          actual_attendees?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type?: string | null
          expected_attendees?: number | null
          id?: string
          is_public?: boolean | null
          name: string
          organization_id?: string | null
          poster_url?: string | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          actual_attendees?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string | null
          expected_attendees?: number | null
          id?: string
          is_public?: boolean | null
          name?: string
          organization_id?: string | null
          poster_url?: string | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      club_followers: {
        Row: {
          followed_at: string | null
          follower_email: string | null
          follower_name: string | null
          id: string
          notification_preferences: Json | null
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          followed_at?: string | null
          follower_email?: string | null
          follower_name?: string | null
          id?: string
          notification_preferences?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          followed_at?: string | null
          follower_email?: string | null
          follower_name?: string | null
          id?: string
          notification_preferences?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_followers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      club_media: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string | null
          file_url: string
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          media_type: string
          organization_id: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          uploaded_by: string | null
          views_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id?: string | null
          file_url: string
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          media_type: string
          organization_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          uploaded_by?: string | null
          views_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string | null
          file_url?: string
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          media_type?: string
          organization_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          uploaded_by?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "club_media_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_media_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          address: string | null
          belt_level: string | null
          city: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          fighter_id: string | null
          first_name: string
          full_name: string | null
          gender: string | null
          id: string
          join_date: string | null
          joined_at: string | null
          last_name: string
          left_at: string | null
          member_status: string | null
          notes: string | null
          organization_id: string | null
          phone: string | null
          photo_url: string | null
          primary_discipline: string | null
          profile_id: string | null
          role: string | null
          updated_at: string | null
          weight_category: string | null
        }
        Insert: {
          address?: string | null
          belt_level?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          fighter_id?: string | null
          first_name: string
          full_name?: string | null
          gender?: string | null
          id?: string
          join_date?: string | null
          joined_at?: string | null
          last_name: string
          left_at?: string | null
          member_status?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          photo_url?: string | null
          primary_discipline?: string | null
          profile_id?: string | null
          role?: string | null
          updated_at?: string | null
          weight_category?: string | null
        }
        Update: {
          address?: string | null
          belt_level?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          fighter_id?: string | null
          first_name?: string
          full_name?: string | null
          gender?: string | null
          id?: string
          join_date?: string | null
          joined_at?: string | null
          last_name?: string
          left_at?: string | null
          member_status?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          photo_url?: string | null
          primary_discipline?: string | null
          profile_id?: string | null
          role?: string | null
          updated_at?: string | null
          weight_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_members_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          label: string
          member_id: string | null
          organization_id: string | null
          receipt_url: string | null
          reference_number: string | null
          transaction_date: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          label: string
          member_id?: string | null
          organization_id?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          transaction_date?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          label?: string
          member_id?: string | null
          organization_id?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          transaction_date?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "club_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          id: string
          is_official_federated: boolean
          logo_url: string | null
          name: string
          organization_id: string | null
          profile_id: string
          region_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_official_federated?: boolean
          logo_url?: string | null
          name: string
          organization_id?: string | null
          profile_id: string
          region_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_official_federated?: boolean
          logo_url?: string | null
          name?: string
          organization_id?: string | null
          profile_id?: string
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clubs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clubs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clubs_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          bio: string | null
          certification_level: string | null
          created_at: string | null
          display_order: number | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          nickname: string | null
          organization_id: string | null
          phone: string | null
          photo_url: string | null
          profile_id: string | null
          role: string | null
          specialties: string[] | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          certification_level?: string | null
          created_at?: string | null
          display_order?: number | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          nickname?: string | null
          organization_id?: string | null
          phone?: string | null
          photo_url?: string | null
          profile_id?: string | null
          role?: string | null
          specialties?: string[] | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          certification_level?: string | null
          created_at?: string | null
          display_order?: number | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          nickname?: string | null
          organization_id?: string | null
          phone?: string | null
          photo_url?: string | null
          profile_id?: string | null
          role?: string | null
          specialties?: string[] | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coaches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaches_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      combat_actions: {
        Row: {
          category: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      combat_disciplines: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      communes: {
        Row: {
          city_id: string | null
          code: string | null
          created_at: string
          district_id: string
          id: string
          is_active: boolean
          name: string
          region_id: string
          slug: string
        }
        Insert: {
          city_id?: string | null
          code?: string | null
          created_at?: string
          district_id: string
          id?: string
          is_active?: boolean
          name: string
          region_id: string
          slug: string
        }
        Update: {
          city_id?: string | null
          code?: string | null
          created_at?: string
          district_id?: string
          id?: string
          is_active?: boolean
          name?: string
          region_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "communes_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communes_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communes_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_blocks: {
        Row: {
          blocked_profile_id: string
          blocker_profile_id: string
          created_at: string
          id: string
          reason: string | null
          revoked_at: string | null
        }
        Insert: {
          blocked_profile_id: string
          blocker_profile_id: string
          created_at?: string
          id?: string
          reason?: string | null
          revoked_at?: string | null
        }
        Update: {
          blocked_profile_id?: string
          blocker_profile_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_blocks_blocked_profile_id_fkey"
            columns: ["blocked_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_blocks_blocker_profile_id_fkey"
            columns: ["blocker_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_categories: {
        Row: {
          capacity: number | null
          competition_id: string
          created_at: string
          discipline_id: string | null
          gender: string | null
          id: string
          max_age: number | null
          max_weight_kg: number | null
          min_age: number | null
          min_weight_kg: number | null
          name: string
        }
        Insert: {
          capacity?: number | null
          competition_id: string
          created_at?: string
          discipline_id?: string | null
          gender?: string | null
          id?: string
          max_age?: number | null
          max_weight_kg?: number | null
          min_age?: number | null
          min_weight_kg?: number | null
          name: string
        }
        Update: {
          capacity?: number | null
          competition_id?: string
          created_at?: string
          discipline_id?: string | null
          gender?: string | null
          id?: string
          max_age?: number | null
          max_weight_kg?: number | null
          min_age?: number | null
          min_weight_kg?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_categories_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_categories_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "discipline_weight_catalog"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "competition_categories_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_rulesets: {
        Row: {
          created_at: string | null
          discipline_id: string
          id: string
          is_active: boolean | null
          name: string
          rules: Json
          version: string | null
        }
        Insert: {
          created_at?: string | null
          discipline_id: string
          id?: string
          is_active?: boolean | null
          name: string
          rules: Json
          version?: string | null
        }
        Update: {
          created_at?: string | null
          discipline_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          rules?: Json
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_rulesets_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "combat_disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          created_at: string
          event_id: string
          id: string
          kind: string
          name: string
          rules: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          kind: string
          name: string
          rules?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          kind?: string
          name?: string
          rules?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          amount: number
          beneficiary: string
          created_at: string
          details: string | null
          end_date: string
          id: string
          manager: string
          payment: string
          ref: string
          start_date: string
          status: string
          type: string
        }
        Insert: {
          amount?: number
          beneficiary: string
          created_at?: string
          details?: string | null
          end_date: string
          id?: string
          manager?: string
          payment?: string
          ref: string
          start_date: string
          status?: string
          type: string
        }
        Update: {
          amount?: number
          beneficiary?: string
          created_at?: string
          details?: string | null
          end_date?: string
          id?: string
          manager?: string
          payment?: string
          ref?: string
          start_date?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          left_at: string | null
          organization_id: string | null
          profile_id: string | null
          role: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          left_at?: string | null
          organization_id?: string | null
          profile_id?: string | null
          role?: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          organization_id?: string | null
          profile_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_user_preferences: {
        Row: {
          conversation_id: string
          id: string
          is_archived: boolean
          is_favorite: boolean
          is_pinned: boolean
          last_read_at: string | null
          locally_deleted_at: string | null
          muted_until: string | null
          profile_id: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_archived?: boolean
          is_favorite?: boolean
          is_pinned?: boolean
          last_read_at?: string | null
          locally_deleted_at?: string | null
          muted_until?: string | null
          profile_id: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_archived?: boolean
          is_favorite?: boolean
          is_pinned?: boolean
          last_read_at?: string | null
          locally_deleted_at?: string | null
          muted_until?: string | null
          profile_id?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_user_preferences_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_user_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          avatar_url: string | null
          categories: string[] | null
          conversation_type: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_archived: boolean | null
          is_pinned: boolean | null
          last_message_at: string | null
          title: string | null
        }
        Insert: {
          avatar_url?: string | null
          categories?: string[] | null
          conversation_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          last_message_at?: string | null
          title?: string | null
        }
        Update: {
          avatar_url?: string | null
          categories?: string[] | null
          conversation_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          last_message_at?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_action_rules: {
        Row: {
          action_id: string
          causes_end: boolean | null
          description: string | null
          discipline_id: string
          end_type: string | null
          id: string
          is_allowed: boolean | null
          penalty_if_used: boolean | null
          points_value: number | null
        }
        Insert: {
          action_id: string
          causes_end?: boolean | null
          description?: string | null
          discipline_id: string
          end_type?: string | null
          id?: string
          is_allowed?: boolean | null
          penalty_if_used?: boolean | null
          points_value?: number | null
        }
        Update: {
          action_id?: string
          causes_end?: boolean | null
          description?: string | null
          discipline_id?: string
          end_type?: string | null
          id?: string
          is_allowed?: boolean | null
          penalty_if_used?: boolean | null
          points_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discipline_action_rules_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "combat_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_action_rules_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "combat_disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_action_types: {
        Row: {
          action_type_id: string
          created_at: string | null
          discipline_id: string
          id: string
        }
        Insert: {
          action_type_id: string
          created_at?: string | null
          discipline_id: string
          id?: string
        }
        Update: {
          action_type_id?: string
          created_at?: string | null
          discipline_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discipline_action_types_action_type_id_fkey"
            columns: ["action_type_id"]
            isOneToOne: false
            referencedRelation: "fight_action_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_action_types_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "discipline_weight_catalog"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "discipline_action_types_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_fight_methods: {
        Row: {
          created_at: string | null
          discipline_id: string
          id: string
          is_active: boolean | null
          method_id: string
        }
        Insert: {
          created_at?: string | null
          discipline_id: string
          id?: string
          is_active?: boolean | null
          method_id: string
        }
        Update: {
          created_at?: string | null
          discipline_id?: string
          id?: string
          is_active?: boolean | null
          method_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discipline_fight_methods_discipline_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "discipline_weight_catalog"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "discipline_fight_methods_discipline_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_fight_methods_method_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "fight_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_weight_categories: {
        Row: {
          code: string
          created_at: string
          display_label: string
          eligibility_note: string | null
          gender: string
          id: string
          is_active: boolean
          is_open_weight: boolean
          max_inclusive: boolean
          max_weight_kg: number | null
          min_inclusive: boolean
          min_weight_kg: number | null
          name: string
          ruleset_id: string
          sort_order: number
          source_note: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          display_label: string
          eligibility_note?: string | null
          gender?: string
          id?: string
          is_active?: boolean
          is_open_weight?: boolean
          max_inclusive?: boolean
          max_weight_kg?: number | null
          min_inclusive?: boolean
          min_weight_kg?: number | null
          name: string
          ruleset_id: string
          sort_order?: number
          source_note?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          display_label?: string
          eligibility_note?: string | null
          gender?: string
          id?: string
          is_active?: boolean
          is_open_weight?: boolean
          max_inclusive?: boolean
          max_weight_kg?: number | null
          min_inclusive?: boolean
          min_weight_kg?: number | null
          name?: string
          ruleset_id?: string
          sort_order?: number
          source_note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discipline_weight_categories_ruleset_id_fkey"
            columns: ["ruleset_id"]
            isOneToOne: false
            referencedRelation: "discipline_weight_catalog"
            referencedColumns: ["ruleset_id"]
          },
          {
            foreignKeyName: "discipline_weight_categories_ruleset_id_fkey"
            columns: ["ruleset_id"]
            isOneToOne: false
            referencedRelation: "discipline_weight_rulesets"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_weight_policies: {
        Row: {
          allow_custom_category: boolean
          created_at: string
          discipline_id: string
          mode: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          allow_custom_category?: boolean
          created_at?: string
          discipline_id: string
          mode: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          allow_custom_category?: boolean
          created_at?: string
          discipline_id?: string
          mode?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discipline_weight_policies_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: true
            referencedRelation: "discipline_weight_catalog"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "discipline_weight_policies_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: true
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_weight_rulesets: {
        Row: {
          age_group: string | null
          code: string
          competition_level: string | null
          created_at: string
          discipline_id: string
          governing_body: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          notes: string | null
          source_checked_at: string | null
          source_reference: string | null
          source_title: string | null
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          variant: string | null
          verification_status: string
          version_label: string | null
        }
        Insert: {
          age_group?: string | null
          code: string
          competition_level?: string | null
          created_at?: string
          discipline_id: string
          governing_body?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          notes?: string | null
          source_checked_at?: string | null
          source_reference?: string | null
          source_title?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          variant?: string | null
          verification_status?: string
          version_label?: string | null
        }
        Update: {
          age_group?: string | null
          code?: string
          competition_level?: string | null
          created_at?: string
          discipline_id?: string
          governing_body?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          notes?: string | null
          source_checked_at?: string | null
          source_reference?: string | null
          source_title?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          variant?: string | null
          verification_status?: string
          version_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discipline_weight_rulesets_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "discipline_weight_catalog"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "discipline_weight_rulesets_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplines: {
        Row: {
          archived_at: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      districts: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          region_id: string
          slug: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          region_id: string
          slug: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          region_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "districts_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      elo_history: {
        Row: {
          elo_after: number
          elo_before: number
          elo_change: number
          fight_id: string | null
          fighter_id: string | null
          id: string
          recorded_at: string | null
        }
        Insert: {
          elo_after: number
          elo_before: number
          elo_change: number
          fight_id?: string | null
          fighter_id?: string | null
          id?: string
          recorded_at?: string | null
        }
        Update: {
          elo_after?: number
          elo_before?: number
          elo_change?: number
          fight_id?: string | null
          fighter_id?: string | null
          id?: string
          recorded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elo_history_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elo_history_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_calendar_items: {
        Row: {
          all_day: boolean
          archived_at: string | null
          context_role: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          event_type: string
          id: string
          location: string | null
          owner_profile_id: string
          source: string
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          archived_at?: string | null
          context_role?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          event_type?: string
          id?: string
          location?: string | null
          owner_profile_id: string
          source?: string
          starts_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          archived_at?: string | null
          context_role?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          event_type?: string
          id?: string
          location?: string | null
          owner_profile_id?: string
          source?: string
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_calendar_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_calendar_items_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_workspace_records: {
        Row: {
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          module_id: string
          owner_profile_id: string
          priority: string
          role_slug: string
          status: string
          tab_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          module_id: string
          owner_profile_id: string
          priority?: string
          role_slug: string
          status?: string
          tab_id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          module_id?: string
          owner_profile_id?: string
          priority?: string
          role_slug?: string
          status?: string
          tab_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_workspace_records_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_access_logs: {
        Row: {
          event_id: string
          id: string
          manual: boolean
          metadata: Json
          occurred_at: string
          operator_profile_id: string | null
          result: string
          ticket_id: string
          zone: string | null
        }
        Insert: {
          event_id: string
          id?: string
          manual?: boolean
          metadata?: Json
          occurred_at?: string
          operator_profile_id?: string | null
          result: string
          ticket_id: string
          zone?: string | null
        }
        Update: {
          event_id?: string
          id?: string
          manual?: boolean
          metadata?: Json
          occurred_at?: string
          operator_profile_id?: string | null
          result?: string
          ticket_id?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_access_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_access_logs_operator_profile_id_fkey"
            columns: ["operator_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_access_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      event_access_settings: {
        Row: {
          access_scan_enabled: boolean
          club_registration_enabled: boolean
          created_at: string
          event_id: string
          public_registration_enabled: boolean
          registration_closes_at: string | null
          registration_opens_at: string | null
          sales_closes_at: string | null
          sales_opens_at: string | null
          ticket_sales_enabled: boolean
          updated_at: string
          updated_by: string
        }
        Insert: {
          access_scan_enabled?: boolean
          club_registration_enabled?: boolean
          created_at?: string
          event_id: string
          public_registration_enabled?: boolean
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          sales_closes_at?: string | null
          sales_opens_at?: string | null
          ticket_sales_enabled?: boolean
          updated_at?: string
          updated_by: string
        }
        Update: {
          access_scan_enabled?: boolean
          club_registration_enabled?: boolean
          created_at?: string
          event_id?: string
          public_registration_enabled?: boolean
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          sales_closes_at?: string | null
          sales_opens_at?: string | null
          ticket_sales_enabled?: boolean
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_access_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_access_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_accreditations: {
        Row: {
          access_zones: string[]
          accreditation_type: string
          badge_code: string
          created_at: string
          event_id: string
          holder_name: string
          id: string
          issued_at: string | null
          issued_by: string
          official_assignment_id: string | null
          profile_id: string | null
          staff_assignment_id: string | null
          status: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          access_zones?: string[]
          accreditation_type?: string
          badge_code: string
          created_at?: string
          event_id: string
          holder_name: string
          id?: string
          issued_at?: string | null
          issued_by: string
          official_assignment_id?: string | null
          profile_id?: string | null
          staff_assignment_id?: string | null
          status?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          access_zones?: string[]
          accreditation_type?: string
          badge_code?: string
          created_at?: string
          event_id?: string
          holder_name?: string
          id?: string
          issued_at?: string | null
          issued_by?: string
          official_assignment_id?: string | null
          profile_id?: string | null
          staff_assignment_id?: string | null
          status?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_accreditations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_accreditations_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_accreditations_official_assignment_id_fkey"
            columns: ["official_assignment_id"]
            isOneToOne: false
            referencedRelation: "event_official_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_accreditations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_accreditations_staff_assignment_id_fkey"
            columns: ["staff_assignment_id"]
            isOneToOne: false
            referencedRelation: "staff_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      event_budget_history: {
        Row: {
          changed_by: string
          created_at: string
          event_budget_id: string
          from_status: string | null
          id: string
          note: string | null
          to_status: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          event_budget_id: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          event_budget_id?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_budget_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_budget_history_event_budget_id_fkey"
            columns: ["event_budget_id"]
            isOneToOne: false
            referencedRelation: "event_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      event_budget_lines: {
        Row: {
          actual_amount: number
          category_code: string
          committed_amount: number
          created_at: string
          event_budget_id: string
          forecast_amount: number
          id: string
          label: string
          line_type: string
          notes: string | null
          position: number
          updated_at: string
        }
        Insert: {
          actual_amount?: number
          category_code: string
          committed_amount?: number
          created_at?: string
          event_budget_id: string
          forecast_amount?: number
          id?: string
          label: string
          line_type: string
          notes?: string | null
          position?: number
          updated_at?: string
        }
        Update: {
          actual_amount?: number
          category_code?: string
          committed_amount?: number
          created_at?: string
          event_budget_id?: string
          forecast_amount?: number
          id?: string
          label?: string
          line_type?: string
          notes?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_budget_lines_event_budget_id_fkey"
            columns: ["event_budget_id"]
            isOneToOne: false
            referencedRelation: "event_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      event_budgets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          created_by: string
          currency_code: string
          event_id: string
          id: string
          name: string
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by: string
          currency_code?: string
          event_id: string
          id?: string
          name: string
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by?: string
          currency_code?: string
          event_id?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_budgets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_budgets_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_budgets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checklist_comments: {
        Row: {
          attachment_path: string | null
          author_profile_id: string
          checklist_id: string
          content: string
          created_at: string
          deleted_at: string | null
          id: string
        }
        Insert: {
          attachment_path?: string | null
          author_profile_id: string
          checklist_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
        }
        Update: {
          attachment_path?: string | null
          author_profile_id?: string
          checklist_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_checklist_comments_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklist_comments_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "event_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checklists: {
        Row: {
          assigned_to: string | null
          category: string | null
          completed_at: string | null
          completed_by: string | null
          critical_blocking: boolean | null
          due_at: string | null
          event_id: string | null
          id: string
          is_completed: boolean | null
          priority: string
          task_name: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          completed_by?: string | null
          critical_blocking?: boolean | null
          due_at?: string | null
          event_id?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: string
          task_name: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          completed_by?: string | null
          critical_blocking?: boolean | null
          due_at?: string | null
          event_id?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: string
          task_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_checklists_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklists_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_coorganizers: {
        Row: {
          event_id: string
          id: string
          invited_at: string
          invited_by: string
          organization_id: string
          responded_at: string | null
          role: string
          status: string
        }
        Insert: {
          event_id: string
          id?: string
          invited_at?: string
          invited_by: string
          organization_id: string
          responded_at?: string | null
          role?: string
          status?: string
        }
        Update: {
          event_id?: string
          id?: string
          invited_at?: string
          invited_by?: string
          organization_id?: string
          responded_at?: string | null
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_coorganizers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_coorganizers_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_coorganizers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_fight_cards: {
        Row: {
          created_at: string
          discipline_id: string | null
          event_id: string
          fighter_blue_id: string | null
          fighter_blue_mention: string | null
          fighter_red_id: string | null
          fighter_red_mention: string | null
          id: string
          position: number
          segment: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discipline_id?: string | null
          event_id: string
          fighter_blue_id?: string | null
          fighter_blue_mention?: string | null
          fighter_red_id?: string | null
          fighter_red_mention?: string | null
          id?: string
          position: number
          segment: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discipline_id?: string | null
          event_id?: string
          fighter_blue_id?: string | null
          fighter_blue_mention?: string | null
          fighter_red_id?: string | null
          fighter_red_mention?: string | null
          id?: string
          position?: number
          segment?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_fight_cards_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "discipline_weight_catalog"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "event_fight_cards_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_fight_cards_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_fight_cards_fighter_blue_id_fkey"
            columns: ["fighter_blue_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_fight_cards_fighter_red_id_fkey"
            columns: ["fighter_red_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
        ]
      }
      event_internal_role_grants: {
        Row: {
          created_at: string
          ends_at: string | null
          event_id: string
          granted_by: string
          id: string
          internal_role_id: string
          profile_id: string
          revoked_at: string | null
          starts_at: string | null
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          event_id: string
          granted_by: string
          id?: string
          internal_role_id: string
          profile_id: string
          revoked_at?: string | null
          starts_at?: string | null
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          event_id?: string
          granted_by?: string
          id?: string
          internal_role_id?: string
          profile_id?: string
          revoked_at?: string | null
          starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_internal_role_grants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_internal_role_grants_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_internal_role_grants_internal_role_id_fkey"
            columns: ["internal_role_id"]
            isOneToOne: false
            referencedRelation: "organization_internal_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_internal_role_grants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invitations: {
        Row: {
          event_id: string
          id: string
          invitation_type: string
          invitee_profile_id: string | null
          mention: string
          responded_at: string | null
          role: string
          sent_at: string
          sent_by: string
          status: string
        }
        Insert: {
          event_id: string
          id?: string
          invitation_type: string
          invitee_profile_id?: string | null
          mention: string
          responded_at?: string | null
          role: string
          sent_at?: string
          sent_by: string
          status?: string
        }
        Update: {
          event_id?: string
          id?: string
          invitation_type?: string
          invitee_profile_id?: string | null
          mention?: string
          responded_at?: string | null
          role?: string
          sent_at?: string
          sent_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invitations_invitee_profile_id_fkey"
            columns: ["invitee_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invitations_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invoice_payments: {
        Row: {
          amount: number
          created_at: string
          financial_payment_id: string | null
          id: string
          invoice_id: string
          method: string
          notes: string | null
          paid_at: string
          recorded_by: string
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          financial_payment_id?: string | null
          id?: string
          invoice_id: string
          method: string
          notes?: string | null
          paid_at?: string
          recorded_by: string
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          financial_payment_id?: string | null
          id?: string
          invoice_id?: string
          method?: string
          notes?: string | null
          paid_at?: string
          recorded_by?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_invoice_payments_financial_payment_id_fkey"
            columns: ["financial_payment_id"]
            isOneToOne: false
            referencedRelation: "financial_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "event_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invoice_payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invoices: {
        Row: {
          amount_paid: number
          counterparty_email: string | null
          counterparty_name: string
          counterparty_organization_id: string | null
          created_at: string
          created_by: string
          currency_code: string
          description: string
          direction: string
          document_path: string | null
          due_date: string
          event_id: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          counterparty_email?: string | null
          counterparty_name: string
          counterparty_organization_id?: string | null
          created_at?: string
          created_by: string
          currency_code?: string
          description: string
          direction: string
          document_path?: string | null
          due_date: string
          event_id: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          status?: string
          subtotal: number
          tax_amount?: number
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          counterparty_email?: string | null
          counterparty_name?: string
          counterparty_organization_id?: string | null
          created_at?: string
          created_by?: string
          currency_code?: string
          description?: string
          direction?: string
          document_path?: string | null
          due_date?: string
          event_id?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_invoices_counterparty_organization_id_fkey"
            columns: ["counterparty_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_lifecycle_history: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          event_id: string
          from_status: string | null
          id: string
          metadata: Json
          reason: string | null
          to_status: string | null
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          event_id: string
          from_status?: string | null
          id?: string
          metadata?: Json
          reason?: string | null
          to_status?: string | null
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          event_id?: string
          from_status?: string | null
          id?: string
          metadata?: Json
          reason?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_lifecycle_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_lifecycle_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_official_assignments: {
        Row: {
          created_at: string
          event_id: string
          id: string
          mention: string | null
          profile_id: string | null
          role: string
          status: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          mention?: string | null
          profile_id?: string | null
          role: string
          status?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          mention?: string | null
          profile_id?: string | null
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_official_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_official_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_operation_history: {
        Row: {
          changed_by: string
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          operation_id: string
          to_status: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          operation_id: string
          to_status: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          operation_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_operation_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_operation_history_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "event_operation_records"
            referencedColumns: ["id"]
          },
        ]
      }
      event_operation_records: {
        Row: {
          attachment_path: string | null
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          domain: string
          due_at: string | null
          event_id: string
          id: string
          owner_profile_id: string | null
          resolution: string | null
          resolved_at: string | null
          severity: string
          started_at: string | null
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          attachment_path?: string | null
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          domain: string
          due_at?: string | null
          event_id: string
          id?: string
          owner_profile_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          severity?: string
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          attachment_path?: string | null
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          domain?: string
          due_at?: string | null
          event_id?: string
          id?: string
          owner_profile_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          severity?: string
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_operation_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_operation_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_operation_records_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          created_at: string
          event_id: string
          id: string
          organization_id: string | null
          participant_type: string
          profile_id: string | null
          public_visible: boolean
          status: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          organization_id?: string | null
          participant_type: string
          profile_id?: string | null
          public_visible?: boolean
          status?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          organization_id?: string | null
          participant_type?: string
          profile_id?: string | null
          public_visible?: boolean
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registration_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          reason: string | null
          registration_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          registration_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          registration_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registration_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registration_history_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          applicant_organization_id: string | null
          applicant_profile_id: string | null
          applicant_type: string
          competition_category_id: string | null
          decision_reason: string | null
          document_paths: string[]
          eligibility_status: string
          event_id: string
          id: string
          license_number: string | null
          medical_certificate_path: string | null
          payment_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
          waitlist_position: number | null
          weight_kg: number | null
        }
        Insert: {
          applicant_organization_id?: string | null
          applicant_profile_id?: string | null
          applicant_type: string
          competition_category_id?: string | null
          decision_reason?: string | null
          document_paths?: string[]
          eligibility_status?: string
          event_id: string
          id?: string
          license_number?: string | null
          medical_certificate_path?: string | null
          payment_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          waitlist_position?: number | null
          weight_kg?: number | null
        }
        Update: {
          applicant_organization_id?: string | null
          applicant_profile_id?: string | null
          applicant_type?: string
          competition_category_id?: string | null
          decision_reason?: string | null
          document_paths?: string[]
          eligibility_status?: string
          event_id?: string
          id?: string
          license_number?: string | null
          medical_certificate_path?: string | null
          payment_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          waitlist_position?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_applicant_organization_id_fkey"
            columns: ["applicant_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_applicant_profile_id_fkey"
            columns: ["applicant_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_competition_category_id_fkey"
            columns: ["competition_category_id"]
            isOneToOne: false
            referencedRelation: "competition_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_report_exports: {
        Row: {
          created_at: string
          format: string
          generated_by: string | null
          id: string
          report_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          format: string
          generated_by?: string | null
          id?: string
          report_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          format?: string
          generated_by?: string | null
          id?: string
          report_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_report_exports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_report_exports_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "event_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reports: {
        Row: {
          content: Json
          created_at: string
          created_by: string
          event_id: string
          generated_at: string | null
          id: string
          kind: string
          published_at: string | null
          status: string
          title: string
        }
        Insert: {
          content?: Json
          created_at?: string
          created_by: string
          event_id: string
          generated_at?: string | null
          id?: string
          kind: string
          published_at?: string | null
          status?: string
          title: string
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string
          event_id?: string
          generated_at?: string | null
          id?: string
          kind?: string
          published_at?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_schedule_items: {
        Row: {
          created_at: string
          ends_at: string
          event_id: string
          id: string
          kind: string
          location: string | null
          notes: string | null
          notification_prepared: boolean
          position: number
          public_visible: boolean
          responsible_profile_id: string | null
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          event_id: string
          id?: string
          kind: string
          location?: string | null
          notes?: string | null
          notification_prepared?: boolean
          position?: number
          public_visible?: boolean
          responsible_profile_id?: string | null
          starts_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          event_id?: string
          id?: string
          kind?: string
          location?: string | null
          notes?: string | null
          notification_prepared?: boolean
          position?: number
          public_visible?: boolean
          responsible_profile_id?: string | null
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_schedule_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_schedule_items_responsible_profile_id_fkey"
            columns: ["responsible_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sponsor_deliverables: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivered_by: string | null
          description: string | null
          due_at: string | null
          estimated_value: number | null
          event_sponsor_id: string
          evidence_path: string | null
          id: string
          status: string
          title: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          delivered_by?: string | null
          description?: string | null
          due_at?: string | null
          estimated_value?: number | null
          event_sponsor_id: string
          evidence_path?: string | null
          id?: string
          status?: string
          title: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          delivered_by?: string | null
          description?: string | null
          due_at?: string | null
          estimated_value?: number | null
          event_sponsor_id?: string
          evidence_path?: string | null
          id?: string
          status?: string
          title?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sponsor_deliverables_delivered_by_fkey"
            columns: ["delivered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sponsor_deliverables_event_sponsor_id_fkey"
            columns: ["event_sponsor_id"]
            isOneToOne: false
            referencedRelation: "event_sponsors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sponsor_deliverables_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sponsors: {
        Row: {
          amount: number
          contact_email: string | null
          contact_name: string | null
          contract_end: string | null
          contract_start: string | null
          created_at: string
          created_by: string | null
          event_id: string | null
          id: string
          package_id: string | null
          payment_status: string
          roi_percentage: number | null
          signed_at: string | null
          sponsor_id: string | null
          status: string
          updated_at: string
          visibility_score: number | null
        }
        Insert: {
          amount: number
          contact_email?: string | null
          contact_name?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          id?: string
          package_id?: string | null
          payment_status?: string
          roi_percentage?: number | null
          signed_at?: string | null
          sponsor_id?: string | null
          status?: string
          updated_at?: string
          visibility_score?: number | null
        }
        Update: {
          amount?: number
          contact_email?: string | null
          contact_name?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          id?: string
          package_id?: string | null
          payment_status?: string
          roi_percentage?: number | null
          signed_at?: string | null
          sponsor_id?: string | null
          status?: string
          updated_at?: string
          visibility_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sponsors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sponsors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sponsors_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "sponsor_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sponsors_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      event_transaction_history: {
        Row: {
          changed_by: string
          created_at: string
          event_transaction_id: string
          from_status: string | null
          id: string
          note: string | null
          to_status: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          event_transaction_id: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          event_transaction_id?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_transaction_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_transaction_history_event_transaction_id_fkey"
            columns: ["event_transaction_id"]
            isOneToOne: false
            referencedRelation: "event_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_transactions: {
        Row: {
          amount: number
          approved_by: string | null
          budget_line_id: string | null
          category_code: string
          counterparty_organization_id: string | null
          created_at: string
          currency_code: string
          description: string
          due_at: string | null
          event_id: string
          event_sponsor_id: string | null
          id: string
          occurred_at: string | null
          official_payment_id: string | null
          paid_at: string | null
          recorded_by: string
          reference: string | null
          staff_payment_id: string | null
          status: string
          ticket_sale_id: string | null
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          budget_line_id?: string | null
          category_code: string
          counterparty_organization_id?: string | null
          created_at?: string
          currency_code?: string
          description: string
          due_at?: string | null
          event_id: string
          event_sponsor_id?: string | null
          id?: string
          occurred_at?: string | null
          official_payment_id?: string | null
          paid_at?: string | null
          recorded_by: string
          reference?: string | null
          staff_payment_id?: string | null
          status?: string
          ticket_sale_id?: string | null
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          budget_line_id?: string | null
          category_code?: string
          counterparty_organization_id?: string | null
          created_at?: string
          currency_code?: string
          description?: string
          due_at?: string | null
          event_id?: string
          event_sponsor_id?: string | null
          id?: string
          occurred_at?: string | null
          official_payment_id?: string | null
          paid_at?: string | null
          recorded_by?: string
          reference?: string | null
          staff_payment_id?: string | null
          status?: string
          ticket_sale_id?: string | null
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_transactions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_transactions_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "event_budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_transactions_counterparty_organization_id_fkey"
            columns: ["counterparty_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_transactions_event_sponsor_id_fkey"
            columns: ["event_sponsor_id"]
            isOneToOne: false
            referencedRelation: "event_sponsors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_transactions_official_payment_id_fkey"
            columns: ["official_payment_id"]
            isOneToOne: false
            referencedRelation: "official_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_transactions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_transactions_staff_payment_id_fkey"
            columns: ["staff_payment_id"]
            isOneToOne: false
            referencedRelation: "staff_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_transactions_ticket_sale_id_fkey"
            columns: ["ticket_sale_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          archived_at: string | null
          cancellation_reason: string | null
          capacity: number | null
          city_id: string | null
          commune_id: string | null
          created_at: string | null
          district_id: string | null
          ends_at: string | null
          event_type: string | null
          id: string
          organizer_id: string | null
          postponed_from: string | null
          postponement_reason: string | null
          published_at: string | null
          readiness_percent: number
          region_id: string | null
          starts_at: string | null
          status: string | null
          timezone_name: string
          title: string
          updated_at: string | null
          venue: string | null
          visibility: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          cancellation_reason?: string | null
          capacity?: number | null
          city_id?: string | null
          commune_id?: string | null
          created_at?: string | null
          district_id?: string | null
          ends_at?: string | null
          event_type?: string | null
          id?: string
          organizer_id?: string | null
          postponed_from?: string | null
          postponement_reason?: string | null
          published_at?: string | null
          readiness_percent?: number
          region_id?: string | null
          starts_at?: string | null
          status?: string | null
          timezone_name?: string
          title: string
          updated_at?: string | null
          venue?: string | null
          visibility?: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          cancellation_reason?: string | null
          capacity?: number | null
          city_id?: string | null
          commune_id?: string | null
          created_at?: string | null
          district_id?: string | null
          ends_at?: string | null
          event_type?: string | null
          id?: string
          organizer_id?: string | null
          postponed_from?: string | null
          postponement_reason?: string | null
          published_at?: string | null
          readiness_percent?: number
          region_id?: string | null
          starts_at?: string | null
          status?: string | null
          timezone_name?: string
          title?: string
          updated_at?: string | null
          venue?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_action_categories: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      fight_action_events: {
        Row: {
          action_type_id: string
          created_at: string | null
          event_id: string | null
          fight_id: string
          fighter_id: string
          id: string
          is_success: boolean | null
          round_number: number | null
          score: number | null
        }
        Insert: {
          action_type_id: string
          created_at?: string | null
          event_id?: string | null
          fight_id: string
          fighter_id: string
          id?: string
          is_success?: boolean | null
          round_number?: number | null
          score?: number | null
        }
        Update: {
          action_type_id?: string
          created_at?: string | null
          event_id?: string | null
          fight_id?: string
          fighter_id?: string
          id?: string
          is_success?: boolean | null
          round_number?: number | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_action_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "fight_event_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_action_events_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_action_events_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_action_types: {
        Row: {
          category_id: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          category_id: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          category_id?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_action_types_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fight_action_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_action_values: {
        Row: {
          action_type_id: string
          created_at: string | null
          discipline_id: string
          ends_match: boolean | null
          id: string
          score: number | null
          score_label: string | null
          victory_method_id: string | null
        }
        Insert: {
          action_type_id: string
          created_at?: string | null
          discipline_id: string
          ends_match?: boolean | null
          id?: string
          score?: number | null
          score_label?: string | null
          victory_method_id?: string | null
        }
        Update: {
          action_type_id?: string
          created_at?: string | null
          discipline_id?: string
          ends_match?: boolean | null
          id?: string
          score?: number | null
          score_label?: string | null
          victory_method_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_action_values_action_type_id_fkey"
            columns: ["action_type_id"]
            isOneToOne: false
            referencedRelation: "fight_action_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_action_values_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "discipline_weight_catalog"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "fight_action_values_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_action_values_victory_method_id_fkey"
            columns: ["victory_method_id"]
            isOneToOne: false
            referencedRelation: "fight_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_announcements: {
        Row: {
          announced_at: string | null
          announced_by: string | null
          announcement_type: string
          created_at: string | null
          fight_id: string
          id: string
          is_public: boolean | null
          message: string | null
          title: string | null
        }
        Insert: {
          announced_at?: string | null
          announced_by?: string | null
          announcement_type: string
          created_at?: string | null
          fight_id: string
          id?: string
          is_public?: boolean | null
          message?: string | null
          title?: string | null
        }
        Update: {
          announced_at?: string | null
          announced_by?: string | null
          announcement_type?: string
          created_at?: string | null
          fight_id?: string
          id?: string
          is_public?: boolean | null
          message?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_announcements_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_card: {
        Row: {
          event_id: string | null
          fight_order: number
          fighter_a_id: string | null
          fighter_b_id: string | null
          id: string
          is_confirmed: boolean | null
          tag: string
        }
        Insert: {
          event_id?: string | null
          fight_order: number
          fighter_a_id?: string | null
          fighter_b_id?: string | null
          id?: string
          is_confirmed?: boolean | null
          tag: string
        }
        Update: {
          event_id?: string | null
          fight_order?: number
          fighter_a_id?: string | null
          fighter_b_id?: string | null
          id?: string
          is_confirmed?: boolean | null
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "fight_card_fighter_a_id_fkey"
            columns: ["fighter_a_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_card_fighter_b_id_fkey"
            columns: ["fighter_b_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_decisions: {
        Row: {
          approved_by: string | null
          created_at: string | null
          decided_by: string | null
          decision_type: string
          description: string | null
          fight_id: string
          id: string
          loser_id: string | null
          round_number: number | null
          time_of_end: string | null
          victory_method_id: string | null
          winner_id: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          decided_by?: string | null
          decision_type: string
          description?: string | null
          fight_id: string
          id?: string
          loser_id?: string | null
          round_number?: number | null
          time_of_end?: string | null
          victory_method_id?: string | null
          winner_id?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          decided_by?: string | null
          decision_type?: string
          description?: string | null
          fight_id?: string
          id?: string
          loser_id?: string | null
          round_number?: number | null
          time_of_end?: string | null
          victory_method_id?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_decisions_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_decisions_loser_id_fkey"
            columns: ["loser_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_decisions_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_event_actions: {
        Row: {
          created_at: string | null
          event_code: string
          id: string
          parameters: Json | null
          reaction_type: string
        }
        Insert: {
          created_at?: string | null
          event_code: string
          id?: string
          parameters?: Json | null
          reaction_type: string
        }
        Update: {
          created_at?: string | null
          event_code?: string
          id?: string
          parameters?: Json | null
          reaction_type?: string
        }
        Relationships: []
      }
      fight_event_log: {
        Row: {
          created_at: string | null
          event_code: string | null
          event_type: string
          fight_id: string
          fighter_id: string | null
          id: string
          is_validated: boolean | null
          operation_mode: string | null
          payload: Json | null
          processed: boolean | null
          processed_at: string | null
          processing_error: string | null
          recorded_by: string | null
          round_number: number | null
          sequence_number: number
          source: string | null
          validated_by: string | null
        }
        Insert: {
          created_at?: string | null
          event_code?: string | null
          event_type: string
          fight_id: string
          fighter_id?: string | null
          id?: string
          is_validated?: boolean | null
          operation_mode?: string | null
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          processing_error?: string | null
          recorded_by?: string | null
          round_number?: number | null
          sequence_number: number
          source?: string | null
          validated_by?: string | null
        }
        Update: {
          created_at?: string | null
          event_code?: string | null
          event_type?: string
          fight_id?: string
          fighter_id?: string | null
          id?: string
          is_validated?: boolean | null
          operation_mode?: string | null
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          processing_error?: string | null
          recorded_by?: string | null
          round_number?: number | null
          sequence_number?: number
          source?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_event_log_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_event_log_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_event_types: {
        Row: {
          category: string
          code: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category: string
          code: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string
          code?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      fight_events_timeline: {
        Row: {
          action_type_id: string | null
          created_at: string | null
          description: string | null
          event_time: string | null
          event_type: string
          fight_id: string
          fighter_id: string | null
          id: string
          recorded_by: string | null
          round_id: string | null
          source_timer_event_id: string | null
        }
        Insert: {
          action_type_id?: string | null
          created_at?: string | null
          description?: string | null
          event_time?: string | null
          event_type?: string
          fight_id: string
          fighter_id?: string | null
          id?: string
          recorded_by?: string | null
          round_id?: string | null
          source_timer_event_id?: string | null
        }
        Update: {
          action_type_id?: string | null
          created_at?: string | null
          description?: string | null
          event_time?: string | null
          event_type?: string
          fight_id?: string
          fighter_id?: string | null
          id?: string
          recorded_by?: string | null
          round_id?: string | null
          source_timer_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_events_timeline_source_timer_event_id_fkey"
            columns: ["source_timer_event_id"]
            isOneToOne: false
            referencedRelation: "fight_timer_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_events_timeline_action_type_id_fkey"
            columns: ["action_type_id"]
            isOneToOne: false
            referencedRelation: "fight_action_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_events_timeline_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_events_timeline_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_events_timeline_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "fight_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_incidents: {
        Row: {
          description: string | null
          detected_at: string | null
          fight_id: string
          id: string
          incident_type: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
        }
        Insert: {
          description?: string | null
          detected_at?: string | null
          fight_id: string
          id?: string
          incident_type: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
        }
        Update: {
          description?: string | null
          detected_at?: string | null
          fight_id?: string
          id?: string
          incident_type?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "fight_incidents_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_judge_cards: {
        Row: {
          card_status: string | null
          created_at: string | null
          fight_id: string
          fighter_blue_score: number | null
          fighter_red_score: number | null
          id: string
          judge_id: string
          submitted_at: string | null
          total_rounds: number | null
        }
        Insert: {
          card_status?: string | null
          created_at?: string | null
          fight_id: string
          fighter_blue_score?: number | null
          fighter_red_score?: number | null
          id?: string
          judge_id: string
          submitted_at?: string | null
          total_rounds?: number | null
        }
        Update: {
          card_status?: string | null
          created_at?: string | null
          fight_id?: string
          fighter_blue_score?: number | null
          fighter_red_score?: number | null
          id?: string
          judge_id?: string
          submitted_at?: string | null
          total_rounds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_judge_cards_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_judge_round_scores: {
        Row: {
          blue_score: number
          created_at: string | null
          id: string
          judge_card_id: string
          red_score: number
          round_number: number
        }
        Insert: {
          blue_score: number
          created_at?: string | null
          id?: string
          judge_card_id: string
          red_score: number
          round_number: number
        }
        Update: {
          blue_score?: number
          created_at?: string | null
          id?: string
          judge_card_id?: string
          red_score?: number
          round_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "fight_judge_round_scores_judge_card_id_fkey"
            columns: ["judge_card_id"]
            isOneToOne: false
            referencedRelation: "fight_judge_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_judge_scores: {
        Row: {
          blue_score: number
          created_at: string | null
          fight_id: string
          id: string
          judge_id: string
          notes: string | null
          red_score: number
          round_number: number
          updated_at: string | null
        }
        Insert: {
          blue_score: number
          created_at?: string | null
          fight_id: string
          id?: string
          judge_id: string
          notes?: string | null
          red_score: number
          round_number: number
          updated_at?: string | null
        }
        Update: {
          blue_score?: number
          created_at?: string | null
          fight_id?: string
          id?: string
          judge_id?: string
          notes?: string | null
          red_score?: number
          round_number?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_judge_scores_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_judge_scores_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_live_actions: {
        Row: {
          action_time: string | null
          action_type: string
          fight_id: string | null
          fighter_id: string | null
          id: string
          points_delta: number | null
          recorded_at: string | null
          recorded_by: string | null
          round_number: number
        }
        Insert: {
          action_time?: string | null
          action_type: string
          fight_id?: string | null
          fighter_id?: string | null
          id?: string
          points_delta?: number | null
          recorded_at?: string | null
          recorded_by?: string | null
          round_number: number
        }
        Update: {
          action_time?: string | null
          action_type?: string
          fight_id?: string | null
          fighter_id?: string | null
          id?: string
          points_delta?: number | null
          recorded_at?: string | null
          recorded_by?: string | null
          round_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "fight_live_actions_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_live_actions_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_method_details: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          label: string
          method_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          method_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          method_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fight_method_details_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "fight_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_methods: {
        Row: {
          category: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          label: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          label: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
        }
        Relationships: []
      }
      fight_official_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          fight_id: string
          id: string
          position: number | null
          role: string
          status: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          fight_id: string
          id?: string
          position?: number | null
          role: string
          status?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          fight_id?: string
          id?: string
          position?: number | null
          role?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fight_official_assignments_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_officials: {
        Row: {
          assigned_at: string | null
          created_at: string | null
          fight_id: string
          id: string
          notes: string | null
          official_id: string
          role: string
        }
        Insert: {
          assigned_at?: string | null
          created_at?: string | null
          fight_id: string
          id?: string
          notes?: string | null
          official_id: string
          role: string
        }
        Update: {
          assigned_at?: string | null
          created_at?: string | null
          fight_id?: string
          id?: string
          notes?: string | null
          official_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "fight_officials_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_officials_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_operation_modes: {
        Row: {
          created_at: string | null
          ended_at: string | null
          fight_id: string
          id: string
          mode: string
          notes: string | null
          reason: string | null
          started_at: string | null
          switched_by: string | null
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          fight_id: string
          id?: string
          mode: string
          notes?: string | null
          reason?: string | null
          started_at?: string | null
          switched_by?: string | null
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          fight_id?: string
          id?: string
          mode?: string
          notes?: string | null
          reason?: string | null
          started_at?: string | null
          switched_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_operation_modes_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_penalties: {
        Row: {
          fight_id: string
          fighter_id: string
          id: string
          issued_at: string | null
          issued_by: string | null
          penalty_type: string
          points_deducted: number | null
          reason: string | null
          round_id: string | null
          status: string | null
        }
        Insert: {
          fight_id: string
          fighter_id: string
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          penalty_type: string
          points_deducted?: number | null
          reason?: string | null
          round_id?: string | null
          status?: string | null
        }
        Update: {
          fight_id?: string
          fighter_id?: string
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          penalty_type?: string
          points_deducted?: number | null
          reason?: string | null
          round_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_penalties_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_penalties_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_penalties_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "fight_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_proposal_history: {
        Row: {
          changed_by: string | null
          created_at: string
          fight_proposal_id: string
          from_status: string | null
          id: string
          note: string | null
          snapshot: Json
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          fight_proposal_id: string
          from_status?: string | null
          id?: string
          note?: string | null
          snapshot?: Json
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          fight_proposal_id?: string
          from_status?: string | null
          id?: string
          note?: string | null
          snapshot?: Json
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fight_proposal_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_proposal_history_fight_proposal_id_fkey"
            columns: ["fight_proposal_id"]
            isOneToOne: false
            referencedRelation: "fight_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_proposals: {
        Row: {
          created_at: string | null
          event_date: string | null
          event_name: string | null
          fighter_id: string | null
          id: string
          ko_bonus: number | null
          message_id: string | null
          opponent_age: number | null
          opponent_club: string | null
          opponent_name: string
          opponent_reach: string | null
          opponent_record: string | null
          opponent_style: string | null
          opponent_weight: string | null
          purse_amount: number | null
          responded_at: string | null
          rules: string | null
          status: string | null
          venue: string | null
          weight_category: string | null
          win_bonus: number | null
        }
        Insert: {
          created_at?: string | null
          event_date?: string | null
          event_name?: string | null
          fighter_id?: string | null
          id?: string
          ko_bonus?: number | null
          message_id?: string | null
          opponent_age?: number | null
          opponent_club?: string | null
          opponent_name: string
          opponent_reach?: string | null
          opponent_record?: string | null
          opponent_style?: string | null
          opponent_weight?: string | null
          purse_amount?: number | null
          responded_at?: string | null
          rules?: string | null
          status?: string | null
          venue?: string | null
          weight_category?: string | null
          win_bonus?: number | null
        }
        Update: {
          created_at?: string | null
          event_date?: string | null
          event_name?: string | null
          fighter_id?: string | null
          id?: string
          ko_bonus?: number | null
          message_id?: string | null
          opponent_age?: number | null
          opponent_club?: string | null
          opponent_name?: string
          opponent_reach?: string | null
          opponent_record?: string | null
          opponent_style?: string | null
          opponent_weight?: string | null
          purse_amount?: number | null
          responded_at?: string | null
          rules?: string | null
          status?: string | null
          venue?: string | null
          weight_category?: string | null
          win_bonus?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_proposals_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_proposals_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_recovery_logs: {
        Row: {
          conflicts_detected: number | null
          fight_id: string
          id: string
          notes: string | null
          recovered_by: string | null
          recovered_records: number | null
          recovery_completed_at: string | null
          recovery_started_at: string | null
          recovery_status: string | null
        }
        Insert: {
          conflicts_detected?: number | null
          fight_id: string
          id?: string
          notes?: string | null
          recovered_by?: string | null
          recovered_records?: number | null
          recovery_completed_at?: string | null
          recovery_started_at?: string | null
          recovery_status?: string | null
        }
        Update: {
          conflicts_detected?: number | null
          fight_id?: string
          id?: string
          notes?: string | null
          recovered_by?: string | null
          recovered_records?: number | null
          recovery_completed_at?: string | null
          recovery_started_at?: string | null
          recovery_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_recovery_logs_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_replacements: {
        Row: {
          corner: string
          created_at: string
          effective_at: string
          event_id: string
          fight_id: string
          id: string
          previous_fighter_id: string
          reason: string
          replaced_by: string
          replacement_fighter_id: string
          status: string
        }
        Insert: {
          corner: string
          created_at?: string
          effective_at?: string
          event_id: string
          fight_id: string
          id?: string
          previous_fighter_id: string
          reason: string
          replaced_by: string
          replacement_fighter_id: string
          status?: string
        }
        Update: {
          corner?: string
          created_at?: string
          effective_at?: string
          event_id?: string
          fight_id?: string
          id?: string
          previous_fighter_id?: string
          reason?: string
          replaced_by?: string
          replacement_fighter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fight_replacements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_replacements_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_replacements_previous_fighter_id_fkey"
            columns: ["previous_fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_replacements_replaced_by_fkey"
            columns: ["replaced_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_replacements_replacement_fighter_id_fkey"
            columns: ["replacement_fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_results: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          label: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          label: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
        }
        Relationships: []
      }
      fight_rounds: {
        Row: {
          created_at: string | null
          duration_seconds: number
          ended_at: string | null
          fight_id: string
          id: string
          round_number: number
          started_at: string | null
          status: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number
          ended_at?: string | null
          fight_id: string
          id?: string
          round_number: number
          started_at?: string | null
          status?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number
          ended_at?: string | null
          fight_id?: string
          id?: string
          round_number?: number
          started_at?: string | null
          status?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_rounds_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_rounds_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_scorecards: {
        Row: {
          created_at: string | null
          decision: string | null
          fight_id: string
          fighter_id: string
          id: string
          judge_id: string
          round_number: number
          score: number
        }
        Insert: {
          created_at?: string | null
          decision?: string | null
          fight_id: string
          fighter_id: string
          id?: string
          judge_id: string
          round_number: number
          score?: number
        }
        Update: {
          created_at?: string | null
          decision?: string | null
          fight_id?: string
          fighter_id?: string
          id?: string
          judge_id?: string
          round_number?: number
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "fight_scorecards_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_scorecards_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_scores: {
        Row: {
          action_type_id: string
          fight_id: string
          fighter_id: string
          id: string
          is_penalty: boolean | null
          notes: string | null
          points: number
          recorded_at: string | null
          recorded_by: string | null
          round_id: string | null
          score_label: string | null
        }
        Insert: {
          action_type_id: string
          fight_id: string
          fighter_id: string
          id?: string
          is_penalty?: boolean | null
          notes?: string | null
          points?: number
          recorded_at?: string | null
          recorded_by?: string | null
          round_id?: string | null
          score_label?: string | null
        }
        Update: {
          action_type_id?: string
          fight_id?: string
          fighter_id?: string
          id?: string
          is_penalty?: boolean | null
          notes?: string | null
          points?: number
          recorded_at?: string | null
          recorded_by?: string | null
          round_id?: string | null
          score_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_scores_action_type_id_fkey"
            columns: ["action_type_id"]
            isOneToOne: false
            referencedRelation: "fight_action_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_scores_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_scores_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_scores_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "fight_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_statistics: {
        Row: {
          control_time_seconds: number | null
          fight_id: string
          fighter_id: string
          id: string
          penalties: number | null
          points_scored: number | null
          submission_successful: number | null
          submissions_attempted: number | null
          successful_strikes: number | null
          takedowns_attempted: number | null
          takedowns_successful: number | null
          total_strikes: number | null
          updated_at: string | null
        }
        Insert: {
          control_time_seconds?: number | null
          fight_id: string
          fighter_id: string
          id?: string
          penalties?: number | null
          points_scored?: number | null
          submission_successful?: number | null
          submissions_attempted?: number | null
          successful_strikes?: number | null
          takedowns_attempted?: number | null
          takedowns_successful?: number | null
          total_strikes?: number | null
          updated_at?: string | null
        }
        Update: {
          control_time_seconds?: number | null
          fight_id?: string
          fighter_id?: string
          id?: string
          penalties?: number | null
          points_scored?: number | null
          submission_successful?: number | null
          submissions_attempted?: number | null
          successful_strikes?: number | null
          takedowns_attempted?: number | null
          takedowns_successful?: number | null
          total_strikes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_statistics_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_statistics_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_statuses: {
        Row: {
          code: string
          description: string | null
          name: string
        }
        Insert: {
          code: string
          description?: string | null
          name: string
        }
        Update: {
          code?: string
          description?: string | null
          name?: string
        }
        Relationships: []
      }
      fight_sync_queue: {
        Row: {
          checksum: string | null
          created_at: string | null
          entity_id: string | null
          entity_name: string
          event_source: string | null
          fight_id: string
          id: string
          operation: string
          payload: Json
          retry_count: number | null
          sync_status: string | null
          synced_at: string | null
        }
        Insert: {
          checksum?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_name: string
          event_source?: string | null
          fight_id: string
          id?: string
          operation: string
          payload: Json
          retry_count?: number | null
          sync_status?: string | null
          synced_at?: string | null
        }
        Update: {
          checksum?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string
          event_source?: string | null
          fight_id?: string
          id?: string
          operation?: string
          payload?: Json
          retry_count?: number | null
          sync_status?: string | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_sync_queue_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_timer_events: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          event_type: string
          fight_id: string
          id: string
          reason: string | null
          recorded_by: string | null
          round_id: string | null
          started_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          event_type: string
          fight_id: string
          id?: string
          reason?: string | null
          recorded_by?: string | null
          round_id?: string | null
          started_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          event_type?: string
          fight_id?: string
          id?: string
          reason?: string | null
          recorded_by?: string | null
          round_id?: string | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_timer_events_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_timer_events_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "fight_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      fighter_career_stats: {
        Row: {
          draws: number | null
          fighter_id: string
          id: string
          losses: number | null
          total_fights: number | null
          updated_at: string | null
          wins: number | null
          wins_by_decision: number | null
          wins_by_ko: number | null
          wins_by_submission: number | null
        }
        Insert: {
          draws?: number | null
          fighter_id: string
          id?: string
          losses?: number | null
          total_fights?: number | null
          updated_at?: string | null
          wins?: number | null
          wins_by_decision?: number | null
          wins_by_ko?: number | null
          wins_by_submission?: number | null
        }
        Update: {
          draws?: number | null
          fighter_id?: string
          id?: string
          losses?: number | null
          total_fights?: number | null
          updated_at?: string | null
          wins?: number | null
          wins_by_decision?: number | null
          wins_by_ko?: number | null
          wins_by_submission?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fighter_career_stats_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: true
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
        ]
      }
      fighter_fights: {
        Row: {
          created_at: string | null
          event: string
          fight_date: string
          fighter_id: string | null
          id: string
          opponent: string
          purse: number | null
          result: string | null
        }
        Insert: {
          created_at?: string | null
          event: string
          fight_date: string
          fighter_id?: string | null
          id?: string
          opponent: string
          purse?: number | null
          result?: string | null
        }
        Update: {
          created_at?: string | null
          event?: string
          fight_date?: string
          fighter_id?: string | null
          id?: string
          opponent?: string
          purse?: number | null
          result?: string | null
        }
        Relationships: []
      }
      fighter_transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          fighter_id: string | null
          id: string
          label: string | null
          transaction_date: string
          transaction_type: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          fighter_id?: string | null
          id?: string
          label?: string | null
          transaction_date: string
          transaction_type?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          fighter_id?: string | null
          id?: string
          label?: string | null
          transaction_date?: string
          transaction_type?: string | null
        }
        Relationships: []
      }
      fighters: {
        Row: {
          biography: string | null
          created_at: string
          current_weight_kg: number | null
          date_of_birth: string | null
          draws: number
          elo_rating: number
          full_name: string
          height_cm: number | null
          id: string
          last_medical_check: string | null
          losses: number
          medical_clearance_expiry: string | null
          nickname: string | null
          profile_id: string
          reach_cm: number | null
          status: string | null
          status_professional: Database["public"]["Enums"]["fighter_status_type"]
          weight_class: string | null
          wins: number
        }
        Insert: {
          biography?: string | null
          created_at?: string
          current_weight_kg?: number | null
          date_of_birth?: string | null
          draws?: number
          elo_rating?: number
          full_name: string
          height_cm?: number | null
          id?: string
          last_medical_check?: string | null
          losses?: number
          medical_clearance_expiry?: string | null
          nickname?: string | null
          profile_id: string
          reach_cm?: number | null
          status?: string | null
          status_professional?: Database["public"]["Enums"]["fighter_status_type"]
          weight_class?: string | null
          wins?: number
        }
        Update: {
          biography?: string | null
          created_at?: string
          current_weight_kg?: number | null
          date_of_birth?: string | null
          draws?: number
          elo_rating?: number
          full_name?: string
          height_cm?: number | null
          id?: string
          last_medical_check?: string | null
          losses?: number
          medical_clearance_expiry?: string | null
          nickname?: string | null
          profile_id?: string
          reach_cm?: number | null
          status?: string | null
          status_professional?: Database["public"]["Enums"]["fighter_status_type"]
          weight_class?: string | null
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "fighters_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fights: {
        Row: {
          archived_at: string | null
          cancellation_reason: string | null
          created_at: string | null
          discipline_id: string
          ending_round: number | null
          ending_time: string | null
          event_id: string | null
          fight_order: number
          fight_type: string | null
          fighter_blue_id: string | null
          fighter_red_id: string | null
          id: string
          method: string | null
          referee_id: string | null
          scheduled_rounds: number | null
          status: string | null
          updated_at: string | null
          weight_category: string | null
          weight_category_id: string | null
          winner_id: string | null
        }
        Insert: {
          archived_at?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          discipline_id: string
          ending_round?: number | null
          ending_time?: string | null
          event_id?: string | null
          fight_order: number
          fight_type?: string | null
          fighter_blue_id?: string | null
          fighter_red_id?: string | null
          id?: string
          method?: string | null
          referee_id?: string | null
          scheduled_rounds?: number | null
          status?: string | null
          updated_at?: string | null
          weight_category?: string | null
          weight_category_id?: string | null
          winner_id?: string | null
        }
        Update: {
          archived_at?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          discipline_id?: string
          ending_round?: number | null
          ending_time?: string | null
          event_id?: string | null
          fight_order?: number
          fight_type?: string | null
          fighter_blue_id?: string | null
          fighter_red_id?: string | null
          id?: string
          method?: string | null
          referee_id?: string | null
          scheduled_rounds?: number | null
          status?: string | null
          updated_at?: string | null
          weight_category?: string | null
          weight_category_id?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fights_discipline_fk"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "discipline_weight_catalog"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "fights_discipline_fk"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "discipline_weight_catalog"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "fights_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_fighter_blue_id_fkey"
            columns: ["fighter_blue_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_fighter_red_id_fkey"
            columns: ["fighter_red_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_weight_category_id_fkey"
            columns: ["weight_category_id"]
            isOneToOne: false
            referencedRelation: "discipline_weight_catalog"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "fights_weight_category_id_fkey"
            columns: ["weight_category_id"]
            isOneToOne: false
            referencedRelation: "discipline_weight_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_categories: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          operation_type: string
          organization_id: string | null
          owner_type: string
          profile_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          operation_type: string
          organization_id?: string | null
          owner_type: string
          profile_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          operation_type?: string
          organization_id?: string | null
          owner_type?: string
          profile_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_categories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_manual_operations: {
        Row: {
          amount: number
          category_id: string | null
          category_name: string
          counterparty_name: string | null
          created_at: string
          created_by: string
          currency_code: string
          description: string
          financial_payment_id: string | null
          id: string
          idempotency_key: string
          notes: string | null
          occurred_at: string
          operation_type: string
          organization_id: string | null
          owner_type: string
          payment_method: string | null
          profile_id: string | null
          receipt_path: string | null
          reference: string | null
          reversal_payment_id: string | null
          reversal_reason: string | null
          reversed_at: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          category_name: string
          counterparty_name?: string | null
          created_at?: string
          created_by: string
          currency_code?: string
          description: string
          financial_payment_id?: string | null
          id?: string
          idempotency_key: string
          notes?: string | null
          occurred_at?: string
          operation_type: string
          organization_id?: string | null
          owner_type: string
          payment_method?: string | null
          profile_id?: string | null
          receipt_path?: string | null
          reference?: string | null
          reversal_payment_id?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          category_name?: string
          counterparty_name?: string | null
          created_at?: string
          created_by?: string
          currency_code?: string
          description?: string
          financial_payment_id?: string | null
          id?: string
          idempotency_key?: string
          notes?: string | null
          occurred_at?: string
          operation_type?: string
          organization_id?: string | null
          owner_type?: string
          payment_method?: string | null
          profile_id?: string | null
          receipt_path?: string | null
          reference?: string | null
          reversal_payment_id?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_manual_operations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_manual_operations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_manual_operations_financial_payment_id_fkey"
            columns: ["financial_payment_id"]
            isOneToOne: true
            referencedRelation: "financial_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_manual_operations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_manual_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_manual_operations_reversal_payment_id_fkey"
            columns: ["reversal_payment_id"]
            isOneToOne: true
            referencedRelation: "financial_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_accounts: {
        Row: {
          created_at: string
          currency_code: string
          id: string
          organization_id: string | null
          owner_type: string
          profile_id: string | null
          system_key: string | null
        }
        Insert: {
          created_at?: string
          currency_code?: string
          id?: string
          organization_id?: string | null
          owner_type: string
          profile_id?: string | null
          system_key?: string | null
        }
        Update: {
          created_at?: string
          currency_code?: string
          id?: string
          organization_id?: string | null
          owner_type?: string
          profile_id?: string | null
          system_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_entries: {
        Row: {
          account_id: string
          amount: number
          counterparty_account_id: string
          created_at: string
          currency_code: string
          description: string
          entry_type: string
          id: string
          occurred_at: string
          payment_id: string
        }
        Insert: {
          account_id: string
          amount: number
          counterparty_account_id: string
          created_at?: string
          currency_code: string
          description: string
          entry_type: string
          id?: string
          occurred_at: string
          payment_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          counterparty_account_id?: string
          created_at?: string
          currency_code?: string
          description?: string
          entry_type?: string
          id?: string
          occurred_at?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "financial_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_counterparty_account_id_fkey"
            columns: ["counterparty_account_id"]
            isOneToOne: false
            referencedRelation: "financial_account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "financial_entries_counterparty_account_id_fkey"
            columns: ["counterparty_account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "financial_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency_code: string
          description: string
          id: string
          idempotency_key: string
          occurred_at: string
          payee_account_id: string
          payer_account_id: string
          payment_kind: string
          reference: string | null
          refunded_payment_id: string | null
          source_id: string | null
          source_type: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency_code: string
          description: string
          id?: string
          idempotency_key: string
          occurred_at?: string
          payee_account_id: string
          payer_account_id: string
          payment_kind?: string
          reference?: string | null
          refunded_payment_id?: string | null
          source_id?: string | null
          source_type: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency_code?: string
          description?: string
          id?: string
          idempotency_key?: string
          occurred_at?: string
          payee_account_id?: string
          payer_account_id?: string
          payment_kind?: string
          reference?: string | null
          refunded_payment_id?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_payments_payee_account_id_fkey"
            columns: ["payee_account_id"]
            isOneToOne: false
            referencedRelation: "financial_account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "financial_payments_payee_account_id_fkey"
            columns: ["payee_account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_payments_payer_account_id_fkey"
            columns: ["payer_account_id"]
            isOneToOne: false
            referencedRelation: "financial_account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "financial_payments_payer_account_id_fkey"
            columns: ["payer_account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_payments_refunded_payment_id_fkey"
            columns: ["refunded_payment_id"]
            isOneToOne: true
            referencedRelation: "financial_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      korana_actors: {
        Row: {
          actor_type: string
          avatar_url: string | null
          created_at: string
          display_name: string
          handle: string
          id: string
          is_verified: boolean
          organization_id: string | null
          profile_id: string | null
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          actor_type: string
          avatar_url?: string | null
          created_at?: string
          display_name: string
          handle: string
          id?: string
          is_verified?: boolean
          organization_id?: string | null
          profile_id?: string | null
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          actor_type?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          handle?: string
          id?: string
          is_verified?: boolean
          organization_id?: string | null
          profile_id?: string | null
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "korana_actors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_actors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      korana_comments: {
        Row: {
          author_actor_id: string
          content: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          parent_comment_id: string | null
          post_id: string
          status: string
          updated_at: string
        }
        Insert: {
          author_actor_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          author_actor_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "korana_comments_author_actor_id_fkey"
            columns: ["author_actor_id"]
            isOneToOne: false
            referencedRelation: "korana_actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "korana_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "korana_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      korana_feed_preferences: {
        Row: {
          feed_mode: string
          preferred_discipline_id: string | null
          preferred_region_id: string | null
          profile_id: string
          show_sensitive: boolean
          updated_at: string
        }
        Insert: {
          feed_mode?: string
          preferred_discipline_id?: string | null
          preferred_region_id?: string | null
          profile_id: string
          show_sensitive?: boolean
          updated_at?: string
        }
        Update: {
          feed_mode?: string
          preferred_discipline_id?: string | null
          preferred_region_id?: string | null
          profile_id?: string
          show_sensitive?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "korana_feed_preferences_preferred_discipline_id_fkey"
            columns: ["preferred_discipline_id"]
            isOneToOne: false
            referencedRelation: "discipline_weight_catalog"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "korana_feed_preferences_preferred_discipline_id_fkey"
            columns: ["preferred_discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_feed_preferences_preferred_region_id_fkey"
            columns: ["preferred_region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_feed_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      korana_follows: {
        Row: {
          created_at: string
          followed_actor_id: string
          follower_actor_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followed_actor_id: string
          follower_actor_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followed_actor_id?: string
          follower_actor_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "korana_follows_followed_actor_id_fkey"
            columns: ["followed_actor_id"]
            isOneToOne: false
            referencedRelation: "korana_actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_follows_follower_actor_id_fkey"
            columns: ["follower_actor_id"]
            isOneToOne: false
            referencedRelation: "korana_actors"
            referencedColumns: ["id"]
          },
        ]
      }
      korana_hashtags: {
        Row: {
          created_at: string
          id: string
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          tag?: string
        }
        Relationships: []
      }
      korana_mentions: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          mentioned_actor_id: string
          post_id: string | null
          target_type: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          mentioned_actor_id: string
          post_id?: string | null
          target_type: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          mentioned_actor_id?: string
          post_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "korana_mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "korana_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_mentions_mentioned_actor_id_fkey"
            columns: ["mentioned_actor_id"]
            isOneToOne: false
            referencedRelation: "korana_actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "korana_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      korana_moderation_actions: {
        Row: {
          action: string
          comment_id: string | null
          created_at: string
          id: string
          metadata: Json
          moderator_profile_id: string
          post_id: string | null
          reason: string
          report_id: string | null
          target_actor_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          comment_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          moderator_profile_id: string
          post_id?: string | null
          reason: string
          report_id?: string | null
          target_actor_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          comment_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          moderator_profile_id?: string
          post_id?: string | null
          reason?: string
          report_id?: string | null
          target_actor_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "korana_moderation_actions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "korana_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_moderation_actions_moderator_profile_id_fkey"
            columns: ["moderator_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_moderation_actions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "korana_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_moderation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "korana_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_moderation_actions_target_actor_id_fkey"
            columns: ["target_actor_id"]
            isOneToOne: false
            referencedRelation: "korana_actors"
            referencedColumns: ["id"]
          },
        ]
      }
      korana_post_hashtags: {
        Row: {
          created_at: string
          hashtag_id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          hashtag_id: string
          post_id: string
        }
        Update: {
          created_at?: string
          hashtag_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "korana_post_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "korana_hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_post_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "korana_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      korana_post_media: {
        Row: {
          alt_text: string | null
          created_at: string
          duration_seconds: number | null
          file_size_bytes: number | null
          height_px: number | null
          id: string
          media_type: string
          mime_type: string | null
          position: number
          post_id: string
          storage_path: string
          width_px: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          height_px?: number | null
          id?: string
          media_type: string
          mime_type?: string | null
          position?: number
          post_id: string
          storage_path: string
          width_px?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          height_px?: number | null
          id?: string
          media_type?: string
          mime_type?: string | null
          position?: number
          post_id?: string
          storage_path?: string
          width_px?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "korana_post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "korana_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      korana_posts: {
        Row: {
          author_actor_id: string
          content: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          linked_entity_id: string | null
          linked_entity_type: string | null
          published_at: string | null
          reply_control: string
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          author_actor_id: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          published_at?: string | null
          reply_control?: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          author_actor_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          published_at?: string | null
          reply_control?: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "korana_posts_author_actor_id_fkey"
            columns: ["author_actor_id"]
            isOneToOne: false
            referencedRelation: "korana_actors"
            referencedColumns: ["id"]
          },
        ]
      }
      korana_reactions: {
        Row: {
          actor_id: string
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          reaction_type: string
          target_type: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reaction_type?: string
          target_type: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reaction_type?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "korana_reactions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "korana_actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "korana_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "korana_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      korana_reports: {
        Row: {
          comment_id: string | null
          created_at: string
          details: string | null
          id: string
          post_id: string | null
          reason_category: string
          reporter_actor_id: string
          resolved_at: string | null
          resolved_by_profile_id: string | null
          status: string
          target_actor_id: string | null
          target_type: string
          updated_at: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          post_id?: string | null
          reason_category: string
          reporter_actor_id: string
          resolved_at?: string | null
          resolved_by_profile_id?: string | null
          status?: string
          target_actor_id?: string | null
          target_type: string
          updated_at?: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          post_id?: string | null
          reason_category?: string
          reporter_actor_id?: string
          resolved_at?: string | null
          resolved_by_profile_id?: string | null
          status?: string
          target_actor_id?: string | null
          target_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "korana_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "korana_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "korana_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_reports_reporter_actor_id_fkey"
            columns: ["reporter_actor_id"]
            isOneToOne: false
            referencedRelation: "korana_actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_reports_resolved_by_profile_id_fkey"
            columns: ["resolved_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_reports_target_actor_id_fkey"
            columns: ["target_actor_id"]
            isOneToOne: false
            referencedRelation: "korana_actors"
            referencedColumns: ["id"]
          },
        ]
      }
      korana_reposts: {
        Row: {
          actor_id: string
          commentary: string | null
          created_at: string
          deleted_at: string | null
          id: string
          post_id: string
          status: string
        }
        Insert: {
          actor_id: string
          commentary?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          post_id: string
          status?: string
        }
        Update: {
          actor_id?: string
          commentary?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          post_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "korana_reposts_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "korana_actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_reposts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "korana_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      korana_saved_posts: {
        Row: {
          actor_id: string
          created_at: string
          post_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          post_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "korana_saved_posts_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "korana_actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korana_saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "korana_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          created_at: string | null
          document_url: string | null
          expiry_date: string
          federation_name: string
          id: string
          issue_date: string
          last_sync_at: string | null
          license_number: string
          license_type: string | null
          member_id: string | null
          status: string | null
          synced_with_federation: boolean | null
        }
        Insert: {
          created_at?: string | null
          document_url?: string | null
          expiry_date: string
          federation_name: string
          id?: string
          issue_date: string
          last_sync_at?: string | null
          license_number: string
          license_type?: string | null
          member_id?: string | null
          status?: string | null
          synced_with_federation?: boolean | null
        }
        Update: {
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string
          federation_name?: string
          id?: string
          issue_date?: string
          last_sync_at?: string | null
          license_number?: string
          license_type?: string | null
          member_id?: string | null
          status?: string | null
          synced_with_federation?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "licenses_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "club_members"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_bundle_items: {
        Row: {
          bundle_id: string
          created_at: string
          product_id: string
          quantity: number
          sort_order: number
        }
        Insert: {
          bundle_id: string
          created_at?: string
          product_id: string
          quantity: number
          sort_order?: number
        }
        Update: {
          bundle_id?: string
          created_at?: string
          product_id?: string
          quantity?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "marketplace_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_bundle_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_bundles: {
        Row: {
          created_at: string
          created_by: string
          currency: string
          description: string | null
          discount_percent: number | null
          ends_at: string | null
          fixed_price: number | null
          id: string
          name: string
          pricing_mode: string
          seller_organization_id: string
          starts_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          discount_percent?: number | null
          ends_at?: string | null
          fixed_price?: number | null
          id?: string
          name: string
          pricing_mode: string
          seller_organization_id: string
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          discount_percent?: number | null
          ends_at?: string | null
          fixed_price?: number | null
          id?: string
          name?: string
          pricing_mode?: string
          seller_organization_id?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_bundles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_bundles_seller_organization_id_fkey"
            columns: ["seller_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          mode: string
          product_id: string
          quantity: number
          rental_end: string | null
          rental_start: string | null
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          mode: string
          product_id: string
          quantity: number
          rental_end?: string | null
          rental_start?: string | null
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          mode?: string
          product_id?: string
          quantity?: number
          rental_end?: string | null
          rental_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "marketplace_carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_carts: {
        Row: {
          created_at: string
          currency: string
          customer_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_carts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_customer_disputes: {
        Row: {
          created_at: string
          created_by: string
          customer_id: string
          description: string | null
          id: string
          order_id: string | null
          resolution: string | null
          resolved_at: string | null
          seller_organization_id: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_id: string
          description?: string | null
          id?: string
          order_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          seller_organization_id: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_id?: string
          description?: string | null
          id?: string
          order_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          seller_organization_id?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_customer_disputes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_customer_disputes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_customer_disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_customer_disputes_seller_organization_id_fkey"
            columns: ["seller_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_customer_loyalty_ledger: {
        Row: {
          created_at: string
          created_by: string
          customer_id: string
          id: string
          order_id: string | null
          points_delta: number
          reason: string
          seller_organization_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_id: string
          id?: string
          order_id?: string | null
          points_delta: number
          reason: string
          seller_organization_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_id?: string
          id?: string
          order_id?: string | null
          points_delta?: number
          reason?: string
          seller_organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_customer_loyalty_ledger_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_customer_loyalty_ledger_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_customer_loyalty_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_customer_loyalty_ledger_seller_organization_id_fkey"
            columns: ["seller_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_customer_segment_members: {
        Row: {
          added_by: string
          created_at: string
          customer_id: string
          segment_id: string
        }
        Insert: {
          added_by: string
          created_at?: string
          customer_id: string
          segment_id: string
        }
        Update: {
          added_by?: string
          created_at?: string
          customer_id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_customer_segment_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_customer_segment_members_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_customer_segment_members_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "marketplace_customer_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_customer_segments: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          seller_organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          seller_organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          seller_organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_customer_segments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_customer_segments_seller_organization_id_fkey"
            columns: ["seller_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_deliveries: {
        Row: {
          address: string | null
          carrier: string | null
          carrier_id: string | null
          id: string
          method: string
          order_id: string
          status: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          carrier?: string | null
          carrier_id?: string | null
          id?: string
          method: string
          order_id: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          carrier?: string | null
          carrier_id?: string | null
          id?: string
          method?: string
          order_id?: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_deliveries_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "marketplace_delivery_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_delivery_carriers: {
        Row: {
          created_at: string
          created_by: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          seller_organization_id: string
          status: string
          tracking_url_template: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          seller_organization_id: string
          status?: string
          tracking_url_template?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          seller_organization_id?: string
          status?: string
          tracking_url_template?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_delivery_carriers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_delivery_carriers_seller_organization_id_fkey"
            columns: ["seller_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_delivery_zone_areas: {
        Row: {
          city_id: string | null
          commune_id: string | null
          created_at: string
          district_id: string | null
          id: string
          region_id: string | null
          zone_id: string
        }
        Insert: {
          city_id?: string | null
          commune_id?: string | null
          created_at?: string
          district_id?: string | null
          id?: string
          region_id?: string | null
          zone_id: string
        }
        Update: {
          city_id?: string | null
          commune_id?: string | null
          created_at?: string
          district_id?: string | null
          id?: string
          region_id?: string | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_delivery_zone_areas_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_delivery_zone_areas_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_delivery_zone_areas_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_delivery_zone_areas_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_delivery_zone_areas_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "marketplace_delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_delivery_zones: {
        Row: {
          created_at: string
          created_by: string
          currency: string
          delivery_fee: number
          free_delivery_threshold: number | null
          id: string
          max_delivery_days: number
          min_delivery_days: number
          name: string
          seller_organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string
          delivery_fee?: number
          free_delivery_threshold?: number | null
          id?: string
          max_delivery_days?: number
          min_delivery_days?: number
          name: string
          seller_organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string
          delivery_fee?: number
          free_delivery_threshold?: number | null
          id?: string
          max_delivery_days?: number
          min_delivery_days?: number
          name?: string
          seller_organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_delivery_zones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_delivery_zones_seller_organization_id_fkey"
            columns: ["seller_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_favorites: {
        Row: {
          created_at: string
          product_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_inventory: {
        Row: {
          available: number
          low_stock_threshold: number
          product_id: string
          reserved: number
          updated_at: string
        }
        Insert: {
          available?: number
          low_stock_threshold?: number
          product_id: string
          reserved?: number
          updated_at?: string
        }
        Update: {
          available?: number
          low_stock_threshold?: number
          product_id?: string
          reserved?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_inventory_count_lines: {
        Row: {
          applied_delta: number
          count_id: string
          counted_at: string | null
          counted_physical: number | null
          created_at: string
          id: string
          product_id: string
          theoretical_available: number
          theoretical_physical: number
          theoretical_reserved: number
        }
        Insert: {
          applied_delta?: number
          count_id: string
          counted_at?: string | null
          counted_physical?: number | null
          created_at?: string
          id?: string
          product_id: string
          theoretical_available: number
          theoretical_physical: number
          theoretical_reserved: number
        }
        Update: {
          applied_delta?: number
          count_id?: string
          counted_at?: string | null
          counted_physical?: number | null
          created_at?: string
          id?: string
          product_id?: string
          theoretical_available?: number
          theoretical_physical?: number
          theoretical_reserved?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_inventory_count_lines_count_id_fkey"
            columns: ["count_id"]
            isOneToOne: false
            referencedRelation: "marketplace_inventory_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_inventory_count_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_inventory_counts: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          id: string
          note: string | null
          seller_organization_id: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          note?: string | null
          seller_organization_id: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          note?: string | null
          seller_organization_id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_inventory_counts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_inventory_counts_seller_organization_id_fkey"
            columns: ["seller_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_order_groups: {
        Row: {
          cart_id: string
          created_at: string
          currency: string
          customer_id: string
          id: string
          idempotency_key: string
          total: number
        }
        Insert: {
          cart_id: string
          created_at?: string
          currency?: string
          customer_id: string
          id?: string
          idempotency_key: string
          total?: number
        }
        Update: {
          cart_id?: string
          created_at?: string
          currency?: string
          customer_id?: string
          id?: string
          idempotency_key?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_order_groups_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "marketplace_carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_order_groups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_order_lines: {
        Row: {
          created_at: string
          id: string
          line_total: number
          mode: string
          order_id: string
          product_id: string
          product_title: string
          quantity: number
          rental_end: string | null
          rental_start: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          mode: string
          order_id: string
          product_id: string
          product_title: string
          quantity: number
          rental_end?: string | null
          rental_start?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          mode?: string
          order_id?: string
          product_id?: string
          product_title?: string
          quantity?: number
          rental_end?: string | null
          rental_start?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          order_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          order_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          order_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_orders: {
        Row: {
          created_at: string
          currency: string
          customer_email: string
          customer_id: string
          customer_name: string
          customer_phone: string
          delivery_address: string | null
          fees: number
          fulfillment_method: string
          group_id: string | null
          id: string
          payment_status: string
          seller_organization_id: string
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email: string
          customer_id: string
          customer_name: string
          customer_phone: string
          delivery_address?: string | null
          fees?: number
          fulfillment_method: string
          group_id?: string | null
          id?: string
          payment_status?: string
          seller_organization_id: string
          status?: string
          subtotal: number
          total: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string
          customer_id?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: string | null
          fees?: number
          fulfillment_method?: string
          group_id?: string | null
          id?: string
          payment_status?: string
          seller_organization_id?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_orders_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "marketplace_order_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_orders_seller_organization_id_fkey"
            columns: ["seller_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_partnership_products: {
        Row: {
          created_at: string
          partnership_id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          partnership_id: string
          product_id: string
        }
        Update: {
          created_at?: string
          partnership_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_partnership_products_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "marketplace_partnerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_partnership_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_partnership_status_history: {
        Row: {
          changed_by: string
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          partnership_id: string
          to_status: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          partnership_id: string
          to_status: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          partnership_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_partnership_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_partnership_status_history_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "marketplace_partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_partnerships: {
        Row: {
          benefit_type: string
          benefit_value: number | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          currency: string
          description: string | null
          ends_at: string | null
          id: string
          partner_name: string
          partner_organization_id: string | null
          partnership_type: string
          promotion_code: string | null
          seller_organization_id: string
          starts_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          benefit_type: string
          benefit_value?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          partner_name: string
          partner_organization_id?: string | null
          partnership_type: string
          promotion_code?: string | null
          seller_organization_id: string
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          benefit_type?: string
          benefit_value?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          partner_name?: string
          partner_organization_id?: string | null
          partnership_type?: string
          promotion_code?: string | null
          seller_organization_id?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_partnerships_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_partnerships_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_partnerships_seller_organization_id_fkey"
            columns: ["seller_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_payments: {
        Row: {
          created_at: string
          id: string
          idempotency_key: string | null
          metadata: Json
          method: string
          paid_at: string | null
          provider_reference: string | null
          status: string
          transaction_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          method: string
          paid_at?: string | null
          provider_reference?: string | null
          status: string
          transaction_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          method?: string
          paid_at?: string | null
          provider_reference?: string | null
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "marketplace_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_primary: boolean
          product_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_product_variants: {
        Row: {
          attributes: Json
          created_at: string
          id: string
          is_active: boolean
          label: string
          product_id: string
          sku: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          attributes?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          product_id: string
          sku: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          attributes?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          product_id?: string
          sku?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_products: {
        Row: {
          category_id: string | null
          condition: string
          created_at: string
          deposit_amount: number | null
          description: string
          listing_type: string
          location: string | null
          popularity: number
          product_id: string
          published_at: string | null
          rental_price_per_day: number | null
          status: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          condition?: string
          created_at?: string
          deposit_amount?: number | null
          description?: string
          listing_type?: string
          location?: string | null
          popularity?: number
          product_id: string
          published_at?: string | null
          rental_price_per_day?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          condition?: string
          created_at?: string
          deposit_amount?: number | null
          description?: string
          listing_type?: string
          location?: string | null
          popularity?: number
          product_id?: string
          published_at?: string | null
          rental_price_per_day?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_promotion_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          promotion_id: string
          status: string
          updated_at: string
          usage_count: number
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          promotion_id: string
          status?: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          promotion_id?: string
          status?: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_promotion_codes_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "marketplace_promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_promotion_products: {
        Row: {
          created_at: string
          product_id: string
          promotion_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          promotion_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          promotion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_promotion_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_promotion_products_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "marketplace_promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_promotion_redemptions: {
        Row: {
          currency: string
          customer_id: string
          discount_amount: number
          id: string
          order_id: string
          promotion_code_id: string | null
          promotion_id: string
          redeemed_at: string
        }
        Insert: {
          currency: string
          customer_id: string
          discount_amount: number
          id?: string
          order_id: string
          promotion_code_id?: string | null
          promotion_id: string
          redeemed_at?: string
        }
        Update: {
          currency?: string
          customer_id?: string
          discount_amount?: number
          id?: string
          order_id?: string
          promotion_code_id?: string | null
          promotion_id?: string
          redeemed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_promotion_redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_promotion_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_promotion_redemptions_promotion_code_id_fkey"
            columns: ["promotion_code_id"]
            isOneToOne: false
            referencedRelation: "marketplace_promotion_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_promotion_redemptions_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "marketplace_promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_promotions: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          discount_type: string
          discount_value: number
          ends_at: string | null
          id: string
          max_discount_amount: number | null
          min_order_amount: number
          name: string
          seller_organization_id: string
          starts_at: string | null
          status: string
          updated_at: string
          usage_count: number
          usage_limit: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          discount_type: string
          discount_value: number
          ends_at?: string | null
          id?: string
          max_discount_amount?: number | null
          min_order_amount?: number
          name: string
          seller_organization_id: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          max_discount_amount?: number | null
          min_order_amount?: number
          name?: string
          seller_organization_id?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_promotions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_promotions_seller_organization_id_fkey"
            columns: ["seller_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_rentals: {
        Row: {
          created_at: string
          deposit_amount: number
          ends_on: string
          id: string
          order_line_id: string
          returned_at: string | null
          starts_on: string
          status: string
        }
        Insert: {
          created_at?: string
          deposit_amount?: number
          ends_on: string
          id?: string
          order_line_id: string
          returned_at?: string | null
          starts_on: string
          status?: string
        }
        Update: {
          created_at?: string
          deposit_amount?: number
          ends_on?: string
          id?: string
          order_line_id?: string
          returned_at?: string | null
          starts_on?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_rentals_order_line_id_fkey"
            columns: ["order_line_id"]
            isOneToOne: true
            referencedRelation: "marketplace_order_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_return_items: {
        Row: {
          condition: string
          created_at: string
          id: string
          note: string | null
          order_line_id: string
          quantity: number
          return_id: string
        }
        Insert: {
          condition?: string
          created_at?: string
          id?: string
          note?: string | null
          order_line_id: string
          quantity: number
          return_id: string
        }
        Update: {
          condition?: string
          created_at?: string
          id?: string
          note?: string | null
          order_line_id?: string
          quantity?: number
          return_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_return_items_order_line_id_fkey"
            columns: ["order_line_id"]
            isOneToOne: false
            referencedRelation: "marketplace_order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "marketplace_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_return_status_history: {
        Row: {
          changed_by: string
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          return_id: string
          to_status: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          return_id: string
          to_status: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          return_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_return_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_return_status_history_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "marketplace_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_returns: {
        Row: {
          created_by: string
          customer_id: string
          id: string
          order_id: string
          reason: string
          received_at: string | null
          requested_at: string
          resolution: string | null
          resolved_at: string | null
          seller_organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_by: string
          customer_id: string
          id?: string
          order_id: string
          reason: string
          received_at?: string | null
          requested_at?: string
          resolution?: string | null
          resolved_at?: string | null
          seller_organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_by?: string
          customer_id?: string
          id?: string
          order_id?: string
          reason?: string
          received_at?: string | null
          requested_at?: string
          resolution?: string | null
          resolved_at?: string | null
          seller_organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_returns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_returns_seller_organization_id_fkey"
            columns: ["seller_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          order_id: string | null
          product_id: string
          quantity: number
          reason: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          order_id?: string | null
          product_id: string
          quantity: number
          reason: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          order_id?: string | null
          product_id?: string
          quantity?: number
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_id: string
          external_reference: string | null
          id: string
          order_id: string
          seller_organization_id: string
          status: string
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_id: string
          external_reference?: string | null
          id?: string
          order_id: string
          seller_organization_id: string
          status: string
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_id?: string
          external_reference?: string | null
          id?: string
          order_id?: string
          seller_organization_id?: string
          status?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_transactions_seller_organization_id_fkey"
            columns: ["seller_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          category: string | null
          cotisation_status: string | null
          created_at: string | null
          discipline: string | null
          full_name: string | null
          id: string
          licence_no: string | null
          org_id: string | null
          phone: string | null
        }
        Insert: {
          category?: string | null
          cotisation_status?: string | null
          created_at?: string | null
          discipline?: string | null
          full_name?: string | null
          id?: string
          licence_no?: string | null
          org_id?: string | null
          phone?: string | null
        }
        Update: {
          category?: string | null
          cotisation_status?: string | null
          created_at?: string | null
          discipline?: string | null
          full_name?: string | null
          id?: string
          licence_no?: string | null
          org_id?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_fees: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          last_reminder_at: string | null
          member_id: string | null
          notes: string | null
          organization_id: string | null
          paid_at: string | null
          payment_method: string | null
          period_end: string
          period_start: string
          reminder_count: number | null
          status: string | null
          transaction_reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          last_reminder_at?: string | null
          member_id?: string | null
          notes?: string | null
          organization_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          period_end: string
          period_start: string
          reminder_count?: number | null
          status?: string | null
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          last_reminder_at?: string | null
          member_id?: string | null
          notes?: string | null
          organization_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          period_end?: string
          period_start?: string
          reminder_count?: number | null
          status?: string | null
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_fees_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "club_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_fees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          message_id: string | null
          mime_type: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          message_id?: string | null
          mime_type?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          message_id?: string | null
          mime_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_delivery_receipts: {
        Row: {
          id: string
          message_id: string
          occurred_at: string
          profile_id: string
          status: string
        }
        Insert: {
          id?: string
          message_id: string
          occurred_at?: string
          profile_id: string
          status: string
        }
        Update: {
          id?: string
          message_id?: string
          occurred_at?: string
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_delivery_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_delivery_receipts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          profile_id: string
          read_at: string | null
        }
        Insert: {
          id?: string
          message_id: string
          profile_id: string
          read_at?: string | null
        }
        Update: {
          id?: string
          message_id?: string
          profile_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          media_duration: number | null
          media_thumbnail: string | null
          media_type: string | null
          media_url: string | null
          message_type: string | null
          metadata: Json | null
          reply_to_id: string | null
          sender_organization_id: string | null
          sender_profile_id: string | null
          sent_at: string | null
          sent_by_profile_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          media_duration?: number | null
          media_thumbnail?: string | null
          media_type?: string | null
          media_url?: string | null
          message_type?: string | null
          metadata?: Json | null
          reply_to_id?: string | null
          sender_organization_id?: string | null
          sender_profile_id?: string | null
          sent_at?: string | null
          sent_by_profile_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          media_duration?: number | null
          media_thumbnail?: string | null
          media_type?: string | null
          media_url?: string | null
          message_type?: string | null
          metadata?: Json | null
          reply_to_id?: string | null
          sender_organization_id?: string | null
          sender_profile_id?: string | null
          sent_at?: string | null
          sent_by_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_organization_id_fkey"
            columns: ["sender_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sent_by_profile_id_fkey"
            columns: ["sent_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          email_enabled: boolean
          enabled_categories: string[]
          frequency: string
          in_app_enabled: boolean
          muted_until: string | null
          profile_id: string
          push_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          role_overrides: Json
          updated_at: string
        }
        Insert: {
          email_enabled?: boolean
          enabled_categories?: string[]
          frequency?: string
          in_app_enabled?: boolean
          muted_until?: string | null
          profile_id: string
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          role_overrides?: Json
          updated_at?: string
        }
        Update: {
          email_enabled?: boolean
          enabled_categories?: string[]
          frequency?: string
          in_app_enabled?: boolean
          muted_until?: string | null
          profile_id?: string
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          role_overrides?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      official_availability: {
        Row: {
          availability_status: string
          available_from: string | null
          available_until: string | null
          created_at: string
          event_id: string
          id: string
          notes: string | null
          official_profile_id: string
          responded_at: string | null
          updated_at: string
        }
        Insert: {
          availability_status?: string
          available_from?: string | null
          available_until?: string | null
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          official_profile_id: string
          responded_at?: string | null
          updated_at?: string
        }
        Update: {
          availability_status?: string
          available_from?: string | null
          available_until?: string | null
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          official_profile_id?: string
          responded_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "official_availability_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_availability_official_profile_id_fkey"
            columns: ["official_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      official_payments: {
        Row: {
          amount: number
          approved_by: string | null
          created_at: string
          currency_code: string
          due_at: string | null
          event_id: string
          fight_official_assignment_id: string | null
          id: string
          official_profile_id: string
          paid_at: string | null
          recorded_by: string
          reference: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          created_at?: string
          currency_code?: string
          due_at?: string | null
          event_id: string
          fight_official_assignment_id?: string | null
          id?: string
          official_profile_id: string
          paid_at?: string | null
          recorded_by: string
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          created_at?: string
          currency_code?: string
          due_at?: string | null
          event_id?: string
          fight_official_assignment_id?: string | null
          id?: string
          official_profile_id?: string
          paid_at?: string | null
          recorded_by?: string
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "official_payments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_payments_fight_official_assignment_id_fkey"
            columns: ["fight_official_assignment_id"]
            isOneToOne: false
            referencedRelation: "fight_official_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_payments_official_profile_id_fkey"
            columns: ["official_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          accepted_terms_at: string | null
          completed_at: string | null
          completed_steps: string[]
          current_step: string
          draft_data: Json
          profile_id: string
          updated_at: string
        }
        Insert: {
          accepted_terms_at?: string | null
          completed_at?: string | null
          completed_steps?: string[]
          current_step?: string
          draft_data?: Json
          profile_id: string
          updated_at?: string
        }
        Update: {
          accepted_terms_at?: string | null
          completed_at?: string | null
          completed_steps?: string[]
          current_step?: string
          draft_data?: Json
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_internal_role_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          id: string
          internal_role_id: string
          organization_id: string
          profile_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          id?: string
          internal_role_id: string
          organization_id: string
          profile_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          internal_role_id?: string
          organization_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_internal_role_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_internal_role_assignments_internal_role_id_fkey"
            columns: ["internal_role_id"]
            isOneToOne: false
            referencedRelation: "organization_internal_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_internal_role_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_internal_role_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_internal_roles: {
        Row: {
          code: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          label: string
          organization_id: string
          permissions: string[]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          label: string
          organization_id: string
          permissions?: string[]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          label?: string
          organization_id?: string
          permissions?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_internal_roles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_internal_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          invited_by: string
          invited_email: string | null
          invited_profile_id: string | null
          member_role: string
          organization_id: string
          responded_at: string | null
          status: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          invited_by: string
          invited_email?: string | null
          invited_profile_id?: string | null
          member_role?: string
          organization_id: string
          responded_at?: string | null
          status?: string
          token_hash: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string
          invited_email?: string | null
          invited_profile_id?: string | null
          member_role?: string
          organization_id?: string
          responded_at?: string | null
          status?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_invited_profile_id_fkey"
            columns: ["invited_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          joined_at: string | null
          left_at: string | null
          organization_id: string | null
          profile_id: string | null
          role: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          organization_id?: string | null
          profile_id?: string | null
          role?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          organization_id?: string | null
          profile_id?: string | null
          role?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          city_id: string | null
          created_at: string | null
          deactivated_at: string | null
          deactivation_reason: string | null
          description: string | null
          discipline: string | null
          email: string | null
          id: string
          is_verified: boolean | null
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          region_id: string | null
          slug: string | null
          status: string | null
          type: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivation_reason?: string | null
          description?: string | null
          discipline?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          region_id?: string | null
          slug?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivation_reason?: string | null
          description?: string | null
          discipline?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          region_id?: string | null
          slug?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_preferences: {
        Row: {
          created_at: string
          dashboard_density: string
          default_event_id: string | null
          locale: string
          notification_channels: string[]
          organization_id: string
          profile_id: string
          timezone_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dashboard_density?: string
          default_event_id?: string | null
          locale?: string
          notification_channels?: string[]
          organization_id: string
          profile_id: string
          timezone_name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dashboard_density?: string
          default_event_id?: string | null
          locale?: string
          notification_channels?: string[]
          organization_id?: string
          profile_id?: string
          timezone_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_preferences_default_event_id_fkey"
            columns: ["default_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      platform_http_monitor_config: {
        Row: {
          created_at: string
          enabled: boolean
          id: number
          interval_minutes: number
          target_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: number
          interval_minutes?: number
          target_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: number
          interval_minutes?: number
          target_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_http_uptime_checks: {
        Row: {
          completed_at: string | null
          error_code: string | null
          http_status: number | null
          id: string
          request_id: number | null
          requested_at: string
          response_ms: number | null
          status: string
          target_url: string
          timed_out: boolean
        }
        Insert: {
          completed_at?: string | null
          error_code?: string | null
          http_status?: number | null
          id?: string
          request_id?: number | null
          requested_at?: string
          response_ms?: number | null
          status?: string
          target_url: string
          timed_out?: boolean
        }
        Update: {
          completed_at?: string | null
          error_code?: string | null
          http_status?: number | null
          id?: string
          request_id?: number | null
          requested_at?: string
          response_ms?: number | null
          status?: string
          target_url?: string
          timed_out?: boolean
        }
        Relationships: []
      }
      platform_http_uptime_incidents: {
        Row: {
          created_at: string
          failure_count: number
          first_check_id: string | null
          id: string
          last_error_code: string | null
          last_http_status: number | null
          latest_check_id: string | null
          recovery_check_id: string | null
          resolved_at: string | null
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          failure_count?: number
          first_check_id?: string | null
          id?: string
          last_error_code?: string | null
          last_http_status?: number | null
          latest_check_id?: string | null
          recovery_check_id?: string | null
          resolved_at?: string | null
          started_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          failure_count?: number
          first_check_id?: string | null
          id?: string
          last_error_code?: string | null
          last_http_status?: number | null
          latest_check_id?: string | null
          recovery_check_id?: string | null
          resolved_at?: string | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_http_uptime_incidents_first_check_id_fkey"
            columns: ["first_check_id"]
            isOneToOne: false
            referencedRelation: "platform_http_uptime_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_http_uptime_incidents_latest_check_id_fkey"
            columns: ["latest_check_id"]
            isOneToOne: false
            referencedRelation: "platform_http_uptime_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_http_uptime_incidents_recovery_check_id_fkey"
            columns: ["recovery_check_id"]
            isOneToOne: false
            referencedRelation: "platform_http_uptime_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_reference_values: {
        Row: {
          code: string
          created_at: string
          domain: string
          id: string
          is_active: boolean
          label: string
          metadata: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          domain: string
          id?: string
          is_active?: boolean
          label: string
          metadata?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          domain?: string
          id?: string
          is_active?: boolean
          label?: string
          metadata?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          price: number
          seller_id: string | null
          stock: number | null
        }
        Insert: {
          id?: string
          name: string
          price: number
          seller_id?: string | null
          stock?: number | null
        }
        Update: {
          id?: string
          name?: string
          price?: number
          seller_id?: string | null
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_roles: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string | null
          role_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          role_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_system_roles: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          system_role_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          system_role_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          system_role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_system_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_system_roles_system_role_id_fkey"
            columns: ["system_role_id"]
            isOneToOne: false
            referencedRelation: "system_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_verification_documents: {
        Row: {
          created_at: string
          document_type: string
          expires_at: string | null
          file_name: string
          id: string
          mime_type: string
          profile_id: string
          request_id: string
          review_note: string | null
          size_bytes: number
          status: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          document_type: string
          expires_at?: string | null
          file_name: string
          id?: string
          mime_type: string
          profile_id: string
          request_id: string
          review_note?: string | null
          size_bytes: number
          status?: string
          storage_path: string
        }
        Update: {
          created_at?: string
          document_type?: string
          expires_at?: string | null
          file_name?: string
          id?: string
          mime_type?: string
          profile_id?: string
          request_id?: string
          review_note?: string | null
          size_bytes?: number
          status?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_verification_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_verification_documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "profile_verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_verification_requests: {
        Row: {
          created_at: string
          id: string
          identity_number: string | null
          legal_name: string
          nif: string
          organization_id: string | null
          profile_id: string
          registered_address: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          stat_number: string | null
          status: string
          subject_type: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          identity_number?: string | null
          legal_name: string
          nif: string
          organization_id?: string | null
          profile_id: string
          registered_address: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          stat_number?: string | null
          status?: string
          subject_type?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          identity_number?: string | null
          legal_name?: string
          nif?: string
          organization_id?: string | null
          profile_id?: string
          registered_address?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          stat_number?: string | null
          status?: string
          subject_type?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_verification_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_verification_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city_id: string | null
          created_at: string
          deactivated_at: string | null
          deactivation_reason: string | null
          email: string
          full_name: string
          id: string
          is_verified: boolean
          phone: string | null
          photo_url: string | null
          primary_role_id: string | null
          region_id: string | null
          status: string | null
          username: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivation_reason?: string | null
          email: string
          full_name: string
          id: string
          is_verified?: boolean
          phone?: string | null
          photo_url?: string | null
          primary_role_id?: string | null
          region_id?: string | null
          status?: string | null
          username?: string
        }
        Update: {
          city_id?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivation_reason?: string | null
          email?: string
          full_name?: string
          id?: string
          is_verified?: boolean
          phone?: string | null
          photo_url?: string | null
          primary_role_id?: string | null
          region_id?: string | null
          status?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_primary_role_id_fkey"
            columns: ["primary_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      realtime_observability_events: {
        Row: {
          channel_kind: string
          domain: string
          duration_ms: number
          error_category: string | null
          event_id: string
          id: string
          intentional: boolean
          is_initial_status: boolean
          observed_at: string
          source: string
          status: string
          subscription_id: string
        }
        Insert: {
          channel_kind: string
          domain: string
          duration_ms: number
          error_category?: string | null
          event_id: string
          id?: string
          intentional?: boolean
          is_initial_status?: boolean
          observed_at?: string
          source?: string
          status: string
          subscription_id: string
        }
        Update: {
          channel_kind?: string
          domain?: string
          duration_ms?: number
          error_category?: string | null
          event_id?: string
          id?: string
          intentional?: boolean
          is_initial_status?: boolean
          observed_at?: string
          source?: string
          status?: string
          subscription_id?: string
        }
        Relationships: []
      }
      referees: {
        Row: {
          badge_number: string
          certification_level: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          signature_key_hash: string | null
        }
        Insert: {
          badge_number: string
          certification_level?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          signature_key_hash?: string | null
        }
        Update: {
          badge_number?: string
          certification_level?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          signature_key_hash?: string | null
        }
        Relationships: []
      }
      regions: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          slug: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_request_documents: {
        Row: {
          created_at: string
          file_name: string
          id: string
          mime_type: string
          role_request_id: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          mime_type: string
          role_request_id: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string
          role_request_id?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_request_documents_role_request_id_fkey"
            columns: ["role_request_id"]
            isOneToOne: false
            referencedRelation: "role_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_request_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_request_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          reason: string | null
          role_request_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          role_request_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          role_request_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_request_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_request_history_role_request_id_fkey"
            columns: ["role_request_id"]
            isOneToOne: false
            referencedRelation: "role_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      role_requests: {
        Row: {
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          id: string
          profile_id: string
          reason: string
          role_id: string
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          id?: string
          profile_id: string
          reason: string
          role_id: string
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          id?: string
          profile_id?: string
          reason?: string
          role_id?: string
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_requests_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_organization: boolean | null
          label: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_organization?: boolean | null
          label: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_organization?: boolean | null
          label?: string
          slug?: string
        }
        Relationships: []
      }
      seller_agenda_items: {
        Row: {
          all_day: boolean
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          id: string
          kind: string
          location: string | null
          organization_id: string
          priority: string
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          created_by: string
          description?: string | null
          ends_at?: string | null
          id?: string
          kind?: string
          location?: string | null
          organization_id: string
          priority?: string
          starts_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          kind?: string
          location?: string | null
          organization_id?: string
          priority?: string
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_agenda_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_agenda_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_personnel_assignments: {
        Row: {
          created_at: string
          created_by: string
          ends_at: string | null
          id: string
          mission: string
          organization_id: string
          profile_id: string
          scope: string | null
          starts_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          ends_at?: string | null
          id?: string
          mission: string
          organization_id: string
          profile_id: string
          scope?: string | null
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          ends_at?: string | null
          id?: string
          mission?: string
          organization_id?: string
          profile_id?: string
          scope?: string | null
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_personnel_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_personnel_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_personnel_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_personnel_attendance: {
        Row: {
          check_in_at: string | null
          check_out_at: string | null
          created_at: string
          id: string
          note: string | null
          organization_id: string
          profile_id: string
          recorded_by: string
          updated_at: string
          work_date: string
        }
        Insert: {
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          id?: string
          note?: string | null
          organization_id: string
          profile_id: string
          recorded_by: string
          updated_at?: string
          work_date: string
        }
        Update: {
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          id?: string
          note?: string | null
          organization_id?: string
          profile_id?: string
          recorded_by?: string
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_personnel_attendance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_personnel_attendance_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_personnel_attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_personnel_documents: {
        Row: {
          category: string
          created_at: string
          created_by: string
          expires_at: string | null
          file_name: string
          id: string
          mime_type: string | null
          name: string
          organization_id: string
          profile_id: string
          status: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          file_name: string
          id?: string
          mime_type?: string | null
          name: string
          organization_id: string
          profile_id: string
          status?: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          file_name?: string
          id?: string
          mime_type?: string | null
          name?: string
          organization_id?: string
          profile_id?: string
          status?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_personnel_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_personnel_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_personnel_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_personnel_leaves: {
        Row: {
          created_at: string
          created_by: string
          decision_at: string | null
          decision_by: string | null
          ends_on: string
          id: string
          leave_type: string
          organization_id: string
          profile_id: string
          starts_on: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          decision_at?: string | null
          decision_by?: string | null
          ends_on: string
          id?: string
          leave_type: string
          organization_id: string
          profile_id: string
          starts_on: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          decision_at?: string | null
          decision_by?: string | null
          ends_on?: string
          id?: string
          leave_type?: string
          organization_id?: string
          profile_id?: string
          starts_on?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_personnel_leaves_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_personnel_leaves_decision_by_fkey"
            columns: ["decision_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_personnel_leaves_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_personnel_leaves_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_personnel_profiles: {
        Row: {
          availability: string | null
          contract_type: string | null
          created_at: string
          currency_code: string
          department: string | null
          employment_status: string
          location: string | null
          monthly_compensation: number | null
          organization_id: string
          profile_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          availability?: string | null
          contract_type?: string | null
          created_at?: string
          currency_code?: string
          department?: string | null
          employment_status?: string
          location?: string | null
          monthly_compensation?: number | null
          organization_id: string
          profile_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          availability?: string | null
          contract_type?: string | null
          created_at?: string
          currency_code?: string
          department?: string | null
          employment_status?: string
          location?: string | null
          monthly_compensation?: number | null
          organization_id?: string
          profile_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_personnel_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_personnel_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_personnel_profiles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_activations: {
        Row: {
          activation_type: string
          actual_contacts: number
          budget: number | null
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          event_sponsor_id: string
          evidence_path: string | null
          id: string
          location: string | null
          owner_profile_id: string | null
          starts_at: string | null
          status: string
          target_contacts: number | null
          title: string
          updated_at: string
        }
        Insert: {
          activation_type: string
          actual_contacts?: number
          budget?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          ends_at?: string | null
          event_sponsor_id: string
          evidence_path?: string | null
          id?: string
          location?: string | null
          owner_profile_id?: string | null
          starts_at?: string | null
          status?: string
          target_contacts?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          activation_type?: string
          actual_contacts?: number
          budget?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string | null
          event_sponsor_id?: string
          evidence_path?: string | null
          id?: string
          location?: string | null
          owner_profile_id?: string | null
          starts_at?: string | null
          status?: string
          target_contacts?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_activations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_activations_event_sponsor_id_fkey"
            columns: ["event_sponsor_id"]
            isOneToOne: false
            referencedRelation: "event_sponsors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_activations_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_contract_history: {
        Row: {
          changed_by: string
          contract_id: string
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          to_status: string
        }
        Insert: {
          changed_by: string
          contract_id: string
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status: string
        }
        Update: {
          changed_by?: string
          contract_id?: string
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_contract_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_contract_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "sponsor_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_contracts: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          currency_code: string
          document_path: string | null
          ends_on: string
          event_sponsor_id: string
          id: string
          package_id: string | null
          payment_status: string
          reference: string
          signed_at: string | null
          starts_on: string
          status: string
          terminated_reason: string | null
          terms: string | null
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          currency_code?: string
          document_path?: string | null
          ends_on: string
          event_sponsor_id: string
          id?: string
          package_id?: string | null
          payment_status?: string
          reference: string
          signed_at?: string | null
          starts_on: string
          status?: string
          terminated_reason?: string | null
          terms?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          currency_code?: string
          document_path?: string | null
          ends_on?: string
          event_sponsor_id?: string
          id?: string
          package_id?: string | null
          payment_status?: string
          reference?: string
          signed_at?: string | null
          starts_on?: string
          status?: string
          terminated_reason?: string | null
          terms?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_contracts_event_sponsor_id_fkey"
            columns: ["event_sponsor_id"]
            isOneToOne: true
            referencedRelation: "event_sponsors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_contracts_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "sponsor_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_offer_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          snapshot: Json
          sponsor_offer_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          snapshot?: Json
          sponsor_offer_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          snapshot?: Json
          sponsor_offer_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_offer_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_offer_history_sponsor_offer_id_fkey"
            columns: ["sponsor_offer_id"]
            isOneToOne: false
            referencedRelation: "sponsor_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_offers: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          deliverables: Json | null
          duration_months: number | null
          id: string
          message_id: string | null
          previous_amount: number | null
          responded_at: string | null
          sponsor_id: string | null
          status: string | null
          valid_until: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          deliverables?: Json | null
          duration_months?: number | null
          id?: string
          message_id?: string | null
          previous_amount?: number | null
          responded_at?: string | null
          sponsor_id?: string | null
          status?: string | null
          valid_until?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          deliverables?: Json | null
          duration_months?: number | null
          id?: string
          message_id?: string | null
          previous_amount?: number | null
          responded_at?: string | null
          sponsor_id?: string | null
          status?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_offers_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_packages: {
        Row: {
          allocated_count: number
          benefits: string | null
          capacity: number | null
          created_at: string
          created_by: string
          currency_code: string
          description: string | null
          event_id: string | null
          id: string
          name: string
          organization_id: string
          price: number
          status: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          allocated_count?: number
          benefits?: string | null
          capacity?: number | null
          created_at?: string
          created_by: string
          currency_code?: string
          description?: string | null
          event_id?: string | null
          id?: string
          name: string
          organization_id: string
          price?: number
          status?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          allocated_count?: number
          benefits?: string | null
          capacity?: number | null
          created_at?: string
          created_by?: string
          currency_code?: string
          description?: string | null
          event_id?: string | null
          id?: string
          name?: string
          organization_id?: string
          price?: number
          status?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_packages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_packages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_packages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_pipeline: {
        Row: {
          created_at: string
          created_by: string
          currency_code: string
          estimated_value: number | null
          event_id: string | null
          id: string
          lost_reason: string | null
          next_action_at: string | null
          notes: string | null
          organization_id: string
          owner_profile_id: string | null
          probability_percent: number
          sponsor_id: string
          stage: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          currency_code?: string
          estimated_value?: number | null
          event_id?: string | null
          id?: string
          lost_reason?: string | null
          next_action_at?: string | null
          notes?: string | null
          organization_id: string
          owner_profile_id?: string | null
          probability_percent?: number
          sponsor_id: string
          stage?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          currency_code?: string
          estimated_value?: number | null
          event_id?: string | null
          id?: string
          lost_reason?: string | null
          next_action_at?: string | null
          notes?: string | null
          organization_id?: string
          owner_profile_id?: string | null
          probability_percent?: number
          sponsor_id?: string
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_pipeline_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_pipeline_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_pipeline_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_pipeline_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_pipeline_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_pipeline_history: {
        Row: {
          changed_by: string
          created_at: string
          from_stage: string | null
          id: string
          note: string | null
          pipeline_id: string
          to_stage: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          from_stage?: string | null
          id?: string
          note?: string | null
          pipeline_id: string
          to_stage: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          from_stage?: string | null
          id?: string
          note?: string | null
          pipeline_id?: string
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_pipeline_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_pipeline_history_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "sponsor_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_visibility_items: {
        Row: {
          actual_impressions: number
          actual_reach: number
          channel: string
          created_at: string
          created_by: string
          ends_at: string | null
          event_sponsor_id: string
          evidence_path: string | null
          id: string
          placement: string
          starts_at: string | null
          status: string
          target_impressions: number | null
          target_reach: number | null
          updated_at: string
        }
        Insert: {
          actual_impressions?: number
          actual_reach?: number
          channel: string
          created_at?: string
          created_by: string
          ends_at?: string | null
          event_sponsor_id: string
          evidence_path?: string | null
          id?: string
          placement: string
          starts_at?: string | null
          status?: string
          target_impressions?: number | null
          target_reach?: number | null
          updated_at?: string
        }
        Update: {
          actual_impressions?: number
          actual_reach?: number
          channel?: string
          created_at?: string
          created_by?: string
          ends_at?: string | null
          event_sponsor_id?: string
          evidence_path?: string | null
          id?: string
          placement?: string
          starts_at?: string | null
          status?: string
          target_impressions?: number | null
          target_reach?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_visibility_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_visibility_items_event_sponsor_id_fkey"
            columns: ["event_sponsor_id"]
            isOneToOne: false
            referencedRelation: "event_sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          managing_organization_id: string | null
          name: string
          notes: string | null
          organization_id: string | null
          tier: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          managing_organization_id?: string | null
          name: string
          notes?: string | null
          organization_id?: string | null
          tier?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          managing_organization_id?: string | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          tier?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_managing_organization_id_fkey"
            columns: ["managing_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_assignments: {
        Row: {
          assigned_at: string | null
          availability_status: string
          compensation_amount: number | null
          confirmed_at: string | null
          currency_code: string
          ends_at: string | null
          event_id: string | null
          id: string
          phone: string | null
          profile_id: string | null
          role: string
          staff_name: string
          starts_at: string | null
          status: string | null
          zone: string | null
        }
        Insert: {
          assigned_at?: string | null
          availability_status?: string
          compensation_amount?: number | null
          confirmed_at?: string | null
          currency_code?: string
          ends_at?: string | null
          event_id?: string | null
          id?: string
          phone?: string | null
          profile_id?: string | null
          role: string
          staff_name: string
          starts_at?: string | null
          status?: string | null
          zone?: string | null
        }
        Update: {
          assigned_at?: string | null
          availability_status?: string
          compensation_amount?: number | null
          confirmed_at?: string | null
          currency_code?: string
          ends_at?: string | null
          event_id?: string | null
          id?: string
          phone?: string | null
          profile_id?: string | null
          role?: string
          staff_name?: string
          starts_at?: string | null
          status?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_checkins: {
        Row: {
          action: string
          created_at: string
          id: string
          notes: string | null
          occurred_at: string
          recorded_by: string
          staff_assignment_id: string
          zone: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          recorded_by: string
          staff_assignment_id: string
          zone?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          recorded_by?: string
          staff_assignment_id?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_checkins_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_checkins_staff_assignment_id_fkey"
            columns: ["staff_assignment_id"]
            isOneToOne: false
            referencedRelation: "staff_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_payments: {
        Row: {
          amount: number
          approved_by: string | null
          created_at: string
          currency_code: string
          due_at: string | null
          id: string
          paid_at: string | null
          recorded_by: string
          reference: string | null
          staff_assignment_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          created_at?: string
          currency_code?: string
          due_at?: string | null
          id?: string
          paid_at?: string | null
          recorded_by: string
          reference?: string | null
          staff_assignment_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          created_at?: string
          currency_code?: string
          due_at?: string | null
          id?: string
          paid_at?: string | null
          recorded_by?: string
          reference?: string | null
          staff_assignment_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_payments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_payments_staff_assignment_id_fkey"
            columns: ["staff_assignment_id"]
            isOneToOne: false
            referencedRelation: "staff_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          new_status: string
          old_status: string | null
          reason: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          new_status: string
          old_status?: string | null
          reason?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          new_status?: string
          old_status?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number | null
          id: string
          organization_id: string | null
          plan: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          id?: string
          organization_id?: string | null
          plan?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          id?: string
          organization_id?: string | null
          plan?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_kpi_target_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          metric_code: string
          new_values: Json
          previous_values: Json
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          metric_code: string
          new_values?: Json
          previous_values?: Json
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          metric_code?: string
          new_values?: Json
          previous_values?: Json
        }
        Relationships: [
          {
            foreignKeyName: "super_admin_kpi_target_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "super_admin_kpi_target_history_metric_code_fkey"
            columns: ["metric_code"]
            isOneToOne: false
            referencedRelation: "super_admin_kpi_targets"
            referencedColumns: ["metric_code"]
          },
        ]
      }
      super_admin_kpi_targets: {
        Row: {
          created_at: string
          critical_value: number | null
          enabled: boolean
          maturity_value: number | null
          metric_code: string
          notes: string | null
          target_value: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          critical_value?: number | null
          enabled?: boolean
          maturity_value?: number | null
          metric_code: string
          notes?: string | null
          target_value?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          critical_value?: number | null
          enabled?: boolean
          maturity_value?: number | null
          metric_code?: string
          notes?: string | null
          target_value?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "super_admin_kpi_targets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_performance_snapshots: {
        Row: {
          achieved_metrics: number
          captured_at: string
          configured_metrics: number
          critical_metrics: number
          domains: Json
          evaluated_metrics: number
          id: string
          metrics: Json
          overall_score: number | null
          period_days: number
          period_from: string
          period_to: string
          snapshot_date: string
          status: string
          summary: Json
          target_configuration_updated_at: string | null
          watch_metrics: number
        }
        Insert: {
          achieved_metrics?: number
          captured_at?: string
          configured_metrics?: number
          critical_metrics?: number
          domains?: Json
          evaluated_metrics?: number
          id?: string
          metrics?: Json
          overall_score?: number | null
          period_days: number
          period_from: string
          period_to: string
          snapshot_date: string
          status: string
          summary?: Json
          target_configuration_updated_at?: string | null
          watch_metrics?: number
        }
        Update: {
          achieved_metrics?: number
          captured_at?: string
          configured_metrics?: number
          critical_metrics?: number
          domains?: Json
          evaluated_metrics?: number
          id?: string
          metrics?: Json
          overall_score?: number | null
          period_days?: number
          period_from?: string
          period_to?: string
          snapshot_date?: string
          status?: string
          summary?: Json
          target_configuration_updated_at?: string | null
          watch_metrics?: number
        }
        Relationships: []
      }
      super_admin_system_snapshots: {
        Row: {
          active_connections: number
          auth_signins_period: number
          auth_users: number
          cache_hit_rate: number | null
          captured_at: string
          captured_hour: string
          client_rpc_latency_ms: number | null
          connection_usage_rate: number | null
          database_connections: number
          database_size_bytes: number
          deadlocks: number
          id: string
          period_days: number
          realtime_db_backends: number
          rollback_rate: number | null
          storage_available: boolean
          storage_bytes: number
          storage_objects: number
          temp_bytes: number
        }
        Insert: {
          active_connections?: number
          auth_signins_period?: number
          auth_users?: number
          cache_hit_rate?: number | null
          captured_at?: string
          captured_hour: string
          client_rpc_latency_ms?: number | null
          connection_usage_rate?: number | null
          database_connections?: number
          database_size_bytes?: number
          deadlocks?: number
          id?: string
          period_days: number
          realtime_db_backends?: number
          rollback_rate?: number | null
          storage_available?: boolean
          storage_bytes?: number
          storage_objects?: number
          temp_bytes?: number
        }
        Update: {
          active_connections?: number
          auth_signins_period?: number
          auth_users?: number
          cache_hit_rate?: number | null
          captured_at?: string
          captured_hour?: string
          client_rpc_latency_ms?: number | null
          connection_usage_rate?: number | null
          database_connections?: number
          database_size_bytes?: number
          deadlocks?: number
          id?: string
          period_days?: number
          realtime_db_backends?: number
          rollback_rate?: number | null
          storage_available?: boolean
          storage_bytes?: number
          storage_objects?: number
          temp_bytes?: number
        }
        Relationships: []
      }
      system_notifications: {
        Row: {
          action_url: string | null
          content: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          notification_type: string
          title: string
          user_id: string
          user_type: string
        }
        Insert: {
          action_url?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          notification_type: string
          title: string
          user_id: string
          user_type: string
        }
        Update: {
          action_url?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          notification_type?: string
          title?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      system_roles: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          label: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          label: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          label?: string
        }
        Relationships: []
      }
      talent_pool: {
        Row: {
          age: number | null
          availability: string | null
          city: string | null
          contacted_at: string | null
          contacted_by: string | null
          created_at: string | null
          email: string | null
          experience_years: number | null
          fight_record: string | null
          full_name: string
          id: string
          interested_clubs: string[] | null
          looking_for: string | null
          notes: string | null
          phone: string | null
          previous_club: string | null
          primary_discipline: string | null
          status: string | null
          weight_category: string | null
        }
        Insert: {
          age?: number | null
          availability?: string | null
          city?: string | null
          contacted_at?: string | null
          contacted_by?: string | null
          created_at?: string | null
          email?: string | null
          experience_years?: number | null
          fight_record?: string | null
          full_name: string
          id?: string
          interested_clubs?: string[] | null
          looking_for?: string | null
          notes?: string | null
          phone?: string | null
          previous_club?: string | null
          primary_discipline?: string | null
          status?: string | null
          weight_category?: string | null
        }
        Update: {
          age?: number | null
          availability?: string | null
          city?: string | null
          contacted_at?: string | null
          contacted_by?: string | null
          created_at?: string | null
          email?: string | null
          experience_years?: number | null
          fight_record?: string | null
          full_name?: string
          id?: string
          interested_clubs?: string[] | null
          looking_for?: string | null
          notes?: string | null
          phone?: string | null
          previous_club?: string | null
          primary_discipline?: string | null
          status?: string | null
          weight_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_pool_contacted_by_fkey"
            columns: ["contacted_by"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_refunds: {
        Row: {
          amount: number
          created_at: string
          currency_code: string
          external_reference: string | null
          id: string
          processed_amount: number | null
          processed_at: string | null
          processed_by: string | null
          reason: string
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          ticket_sale_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency_code?: string
          external_reference?: string | null
          id?: string
          processed_amount?: number | null
          processed_at?: string | null
          processed_by?: string | null
          reason: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          ticket_sale_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency_code?: string
          external_reference?: string | null
          id?: string
          processed_amount?: number | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          ticket_sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_refunds_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_refunds_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_refunds_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_refunds_ticket_sale_id_fkey"
            columns: ["ticket_sale_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_reservations: {
        Row: {
          created_at: string
          customer_email: string
          customer_profile_id: string | null
          expires_at: string
          id: string
          quantity: number
          status: string
          ticket_type_id: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_profile_id?: string | null
          expires_at: string
          id?: string
          quantity: number
          status?: string
          ticket_type_id: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_profile_id?: string | null
          expires_at?: string
          id?: string
          quantity?: number
          status?: string
          ticket_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_reservations_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_reservations_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_sales: {
        Row: {
          buyer_email: string | null
          buyer_name: string | null
          buyer_phone: string | null
          event_id: string | null
          id: string
          payment_status: string | null
          quantity: number | null
          sold_at: string | null
          sold_by: string | null
          ticket_type_id: string | null
          total_amount: number | null
        }
        Insert: {
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          event_id?: string | null
          id?: string
          payment_status?: string | null
          quantity?: number | null
          sold_at?: string | null
          sold_by?: string | null
          ticket_type_id?: string | null
          total_amount?: number | null
        }
        Update: {
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          event_id?: string | null
          id?: string
          payment_status?: string | null
          quantity?: number | null
          sold_at?: string | null
          sold_by?: string | null
          ticket_type_id?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_sales_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_sales_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_types: {
        Row: {
          category: string
          channels: string[]
          code: string | null
          color_hex: string | null
          conditions: string | null
          currency_code: string
          event_id: string | null
          id: string
          max_per_order: number
          name: string
          price: number
          sales_end: string | null
          sales_start: string | null
          sold_quantity: number | null
          status: string
          total_quantity: number
          zone: string | null
        }
        Insert: {
          category?: string
          channels?: string[]
          code?: string | null
          color_hex?: string | null
          conditions?: string | null
          currency_code?: string
          event_id?: string | null
          id?: string
          max_per_order?: number
          name: string
          price: number
          sales_end?: string | null
          sales_start?: string | null
          sold_quantity?: number | null
          status?: string
          total_quantity: number
          zone?: string | null
        }
        Update: {
          category?: string
          channels?: string[]
          code?: string | null
          color_hex?: string | null
          conditions?: string | null
          currency_code?: string
          event_id?: string | null
          id?: string
          max_per_order?: number
          name?: string
          price?: number
          sales_end?: string | null
          sales_start?: string | null
          sold_quantity?: number | null
          status?: string
          total_quantity?: number
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          buyer_name: string
          event_id: string | null
          id: string
          price: number
          purchased_at: string | null
          ticket_type: string
        }
        Insert: {
          buyer_name: string
          event_id?: string | null
          id?: string
          price: number
          purchased_at?: string | null
          ticket_type: string
        }
        Update: {
          buyer_name?: string
          event_id?: string | null
          id?: string
          price?: number
          purchased_at?: string | null
          ticket_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          capacity: number | null
          coach_id: string | null
          coach_name: string | null
          created_at: string | null
          day_of_week: number | null
          discipline: string | null
          end_time: string | null
          id: string
          organization_id: string | null
          start_time: string | null
          title: string
        }
        Insert: {
          capacity?: number | null
          coach_id?: string | null
          coach_name?: string | null
          created_at?: string | null
          day_of_week?: number | null
          discipline?: string | null
          end_time?: string | null
          id?: string
          organization_id?: string | null
          start_time?: string | null
          title: string
        }
        Update: {
          capacity?: number | null
          coach_id?: string | null
          coach_name?: string | null
          created_at?: string | null
          day_of_week?: number | null
          discipline?: string | null
          end_time?: string | null
          id?: string
          organization_id?: string | null
          start_time?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number | null
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          member_id: string | null
          organization_id: string | null
          transaction_date: string | null
          type: string | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          member_id?: string | null
          organization_id?: string | null
          transaction_date?: string | null
          type?: string | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          member_id?: string | null
          organization_id?: string | null
          transaction_date?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "club_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_disciplines: {
        Row: {
          discipline_id: string
          user_id: string
        }
        Insert: {
          discipline_id: string
          user_id: string
        }
        Update: {
          discipline_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_disciplines_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "discipline_weight_catalog"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "user_disciplines_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      weigh_in_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          measured_weight_kg: number | null
          reason: string | null
          to_status: string
          weigh_in_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          measured_weight_kg?: number | null
          reason?: string | null
          to_status: string
          weigh_in_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          measured_weight_kg?: number | null
          reason?: string | null
          to_status?: string
          weigh_in_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weigh_in_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weigh_in_history_weigh_in_id_fkey"
            columns: ["weigh_in_id"]
            isOneToOne: false
            referencedRelation: "weigh_ins"
            referencedColumns: ["id"]
          },
        ]
      }
      weigh_ins: {
        Row: {
          attempt_number: number
          competition_category_id: string | null
          compliance_status: string
          created_at: string
          event_id: string
          fight_id: string | null
          fighter_id: string
          id: string
          maximum_weight_kg: number | null
          measured_at: string | null
          measured_weight_kg: number | null
          minimum_weight_kg: number | null
          notes: string | null
          registration_id: string | null
          scheduled_at: string | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          attempt_number?: number
          competition_category_id?: string | null
          compliance_status?: string
          created_at?: string
          event_id: string
          fight_id?: string | null
          fighter_id: string
          id?: string
          maximum_weight_kg?: number | null
          measured_at?: string | null
          measured_weight_kg?: number | null
          minimum_weight_kg?: number | null
          notes?: string | null
          registration_id?: string | null
          scheduled_at?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          attempt_number?: number
          competition_category_id?: string | null
          compliance_status?: string
          created_at?: string
          event_id?: string
          fight_id?: string | null
          fighter_id?: string
          id?: string
          maximum_weight_kg?: number | null
          measured_at?: string | null
          measured_weight_kg?: number | null
          minimum_weight_kg?: number | null
          notes?: string | null
          registration_id?: string | null
          scheduled_at?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weigh_ins_competition_category_id_fkey"
            columns: ["competition_category_id"]
            isOneToOne: false
            referencedRelation: "competition_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weigh_ins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weigh_ins_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weigh_ins_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weigh_ins_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weigh_ins_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      discipline_weight_catalog: {
        Row: {
          age_group: string | null
          allow_custom_category: boolean | null
          category_code: string | null
          category_id: string | null
          category_is_active: boolean | null
          category_name: string | null
          competition_level: string | null
          discipline_id: string | null
          discipline_name: string | null
          display_label: string | null
          eligibility_note: string | null
          gender: string | null
          governing_body: string | null
          is_open_weight: boolean | null
          max_inclusive: boolean | null
          max_weight_kg: number | null
          min_inclusive: boolean | null
          min_weight_kg: number | null
          policy_mode: string | null
          ruleset_code: string | null
          ruleset_id: string | null
          ruleset_is_active: boolean | null
          ruleset_is_default: boolean | null
          ruleset_name: string | null
          sort_order: number | null
          source_checked_at: string | null
          source_reference: string | null
          source_title: string | null
          valid_from: string | null
          valid_to: string | null
          variant: string | null
          verification_status: string | null
          version_label: string | null
        }
        Relationships: []
      }
      financial_account_balances: {
        Row: {
          account_id: string | null
          balance: number | null
          currency_code: string | null
          organization_id: string | null
          owner_type: string | null
          profile_id: string | null
          total_expense: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _admin_governance_reason: {
        Args: { p_reason: string; p_required: boolean }
        Returns: string
      }
      _indesy_public_identifier_reserved: {
        Args: { p_identifier: string }
        Returns: boolean
      }
      _korana_allocate_handle: {
        Args: {
          p_base: string
          p_entity_id: string
          p_existing_actor_id?: string
        }
        Returns: string
      }
      _korana_collect_hashtags: {
        Args: { p_content: string; p_hashtags?: string[] }
        Returns: string[]
      }
      _korana_comment_mutation_json: {
        Args: { p_comment_id: string }
        Returns: Json
      }
      _korana_comment_permission: {
        Args: { p_actor_id: string; p_post_id: string }
        Returns: string
      }
      _korana_feed_post_json: {
        Args: { p_actor_id: string; p_post_id: string }
        Returns: Json
      }
      _korana_handle_base: {
        Args: { p_entity_id: string; p_prefix: string; p_value: string }
        Returns: string
      }
      _korana_post_mutation_result: {
        Args: { p_post_id: string }
        Returns: Json
      }
      _korana_public_profile_post_json: {
        Args: { p_post_id: string; p_viewer_actor_id?: string }
        Returns: Json
      }
      _korana_set_post_hashtags: {
        Args: { p_hashtags: string[]; p_post_id: string }
        Returns: undefined
      }
      _korana_sync_organization_actor: {
        Args: { p_organization_id: string }
        Returns: string
      }
      _korana_sync_profile_actor: {
        Args: { p_profile_id: string }
        Returns: string
      }
      _validate_admin_permission_codes: {
        Args: { p_codes: string[] }
        Returns: string[]
      }
      archive_finance_category: {
        Args: { p_category_id: string }
        Returns: string
      }
      assign_event_official_to_fight: {
        Args: {
          p_fight_id: string
          p_position?: number
          p_role: string
          p_user_id: string
        }
        Returns: string
      }
      calculate_final_decision: {
        Args: { p_approved_by?: string; p_fight_id: string }
        Returns: undefined
      }
      calculate_judge_decision: { Args: { p_fight_id: string }; Returns: Json }
      can_access_finance_owner: {
        Args: { p_owner_id: string; p_owner_type: string }
        Returns: boolean
      }
      can_access_financial_account: {
        Args: { p_account_id: string }
        Returns: boolean
      }
      can_manage_event: { Args: { p_event_id: string }; Returns: boolean }
      can_manage_event_poster: {
        Args: { p_event_id: string; p_organization_id: string }
        Returns: boolean
      }
      can_manage_organization: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      create_finance_category: {
        Args: {
          p_description?: string
          p_name: string
          p_operation_type: string
          p_owner_id: string
          p_owner_type: string
          p_sort_order?: number
        }
        Returns: string
      }
      create_my_organization: {
        Args: {
          p_city_id?: string
          p_description?: string
          p_discipline?: string
          p_email?: string
          p_name: string
          p_phone?: string
          p_region_id?: string
          p_type: string
          p_website?: string
        }
        Returns: string
      }
      delete_message: { Args: { p_message_id: string }; Returns: string }
      edit_message: {
        Args: { p_content: string; p_message_id: string }
        Returns: string
      }
      end_round_timer: {
        Args: { p_round_id: string; p_user?: string }
        Returns: undefined
      }
      ensure_financial_account: {
        Args: {
          p_currency_code: string
          p_owner_id: string
          p_owner_type: string
        }
        Returns: string
      }
      ensure_financial_system_account: {
        Args: { p_currency_code: string; p_system_key: string }
        Returns: string
      }
      erp_calendar_archive_item: {
        Args: { p_item_id: string }
        Returns: string
      }
      erp_calendar_create_item: {
        Args: {
          p_all_day?: boolean
          p_context_role?: string
          p_description?: string
          p_ends_at: string
          p_event_type?: string
          p_location?: string
          p_starts_at: string
          p_status?: string
          p_title: string
        }
        Returns: string
      }
      erp_calendar_list_items: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          all_day: boolean
          context_role: string
          created_at: string
          description: string
          ends_at: string
          event_type: string
          id: string
          location: string
          source: string
          starts_at: string
          status: string
          title: string
          updated_at: string
        }[]
      }
      erp_calendar_update_item: {
        Args: {
          p_all_day?: boolean
          p_context_role?: string
          p_description?: string
          p_ends_at: string
          p_event_type?: string
          p_item_id: string
          p_location?: string
          p_starts_at: string
          p_status?: string
          p_title: string
        }
        Returns: string
      }
      fight_official_role_matches_event_role: {
        Args: { p_event_role: string; p_fight_role: string }
        Returns: boolean
      }
      get_finance_account_snapshot: {
        Args: {
          p_currency_code?: string
          p_owner_id: string
          p_owner_type: string
        }
        Returns: Json
      }
      get_finance_categories: {
        Args: {
          p_operation_type?: string
          p_owner_id: string
          p_owner_type: string
        }
        Returns: {
          archived_at: string
          created_at: string
          description: string
          id: string
          name: string
          operation_type: string
          sort_order: number
        }[]
      }
      get_finance_ledger_entries: {
        Args: {
          p_currency_code?: string
          p_from?: string
          p_limit?: number
          p_owner_id: string
          p_owner_type: string
          p_to?: string
        }
        Returns: {
          amount: number
          category_id: string
          category_name: string
          counterparty_name: string
          counterparty_organization_id: string
          counterparty_owner_type: string
          counterparty_profile_id: string
          currency_code: string
          description: string
          entry_id: string
          entry_type: string
          is_manual: boolean
          manual_operation_id: string
          manual_operation_type: string
          occurred_at: string
          payment_id: string
          payment_kind: string
          payment_method: string
          receipt_path: string
          reference: string
          reversed_at: string
          source_id: string
          source_type: string
        }[]
      }
      get_my_admin_permissions: {
        Args: never
        Returns: {
          code: string
          created_at: string
          description: string
          id: string
        }[]
      }
      get_my_auth_context: { Args: never; Returns: Json }
      get_my_profile_verification: { Args: never; Returns: Json }
      get_round_remaining_time: {
        Args: { p_round_id: string }
        Returns: number
      }
      get_user_calendar_feed: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          all_day: boolean
          calendar_key: string
          context_role: string
          description: string
          editable: boolean
          ends_at: string
          event_type: string
          location: string
          metadata: Json
          relation_kind: string
          source_id: string
          source_kind: string
          source_table: string
          starts_at: string
          status: string
          title: string
        }[]
      }
      get_user_calendar_feed_base: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          all_day: boolean
          calendar_key: string
          context_role: string
          description: string
          editable: boolean
          ends_at: string
          event_type: string
          location: string
          metadata: Json
          relation_kind: string
          source_id: string
          source_kind: string
          source_table: string
          starts_at: string
          status: string
          title: string
        }[]
      }
      get_user_remaining_business_calendar_feed: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          all_day: boolean
          calendar_key: string
          context_role: string
          description: string
          editable: boolean
          ends_at: string
          event_type: string
          location: string
          metadata: Json
          relation_kind: string
          source_id: string
          source_kind: string
          source_table: string
          starts_at: string
          status: string
          title: string
        }[]
      }
      get_user_roles: {
        Args: never
        Returns: {
          role_name: string
        }[]
      }
      get_user_training_calendar_feed: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          all_day: boolean
          calendar_key: string
          context_role: string
          description: string
          editable: boolean
          ends_at: string
          event_type: string
          location: string
          metadata: Json
          relation_kind: string
          source_id: string
          source_kind: string
          source_table: string
          starts_at: string
          status: string
          title: string
        }[]
      }
      has_admin_permission: { Args: { p_code: string }; Returns: boolean }
      has_all_admin_permissions: {
        Args: { p_codes: string[] }
        Returns: boolean
      }
      has_any_admin_permission: {
        Args: { p_codes: string[] }
        Returns: boolean
      }
      is_event_official: { Args: { p_event_id: string }; Returns: boolean }
      is_event_registration_applicant: {
        Args: { p_event_id: string }
        Returns: boolean
      }
      is_event_staff: { Args: { p_event_id: string }; Returns: boolean }
      is_organization_member: {
        Args: { target_organization_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      is_registration_applicant: {
        Args: { p_registration_id: string }
        Returns: boolean
      }
      is_sponsor_user: { Args: { p_sponsor_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      korana_attach_post_media: {
        Args: {
          p_alt_text?: string
          p_duration_seconds?: number
          p_file_size_bytes: number
          p_height_px?: number
          p_media_type: string
          p_mime_type: string
          p_position?: number
          p_post_id: string
          p_storage_path: string
          p_width_px?: number
        }
        Returns: Json
      }
      korana_can_manage_actor: {
        Args: { p_actor_id: string }
        Returns: boolean
      }
      korana_can_view_actor: { Args: { p_actor_id: string }; Returns: boolean }
      korana_can_view_comment: {
        Args: { p_comment_id: string }
        Returns: boolean
      }
      korana_can_view_post: { Args: { p_post_id: string }; Returns: boolean }
      korana_comments_snapshot: {
        Args: { p_actor_id?: string; p_post_id: string }
        Returns: Json
      }
      korana_create_comment: {
        Args: {
          p_actor_id: string
          p_content: string
          p_parent_comment_id?: string
          p_post_id: string
        }
        Returns: Json
      }
      korana_create_post: {
        Args: {
          p_actor_id: string
          p_content: string
          p_hashtags?: string[]
          p_reply_control?: string
          p_visibility?: string
        }
        Returns: Json
      }
      korana_delete_comment: { Args: { p_comment_id: string }; Returns: Json }
      korana_delete_post: { Args: { p_post_id: string }; Returns: Json }
      korana_detach_post_media: { Args: { p_media_id: string }; Returns: Json }
      korana_feed_snapshot: {
        Args: {
          p_actor_id?: string
          p_before?: string
          p_limit?: number
          p_mode?: string
        }
        Returns: Json
      }
      korana_feed_snapshot_v2: {
        Args: {
          p_actor_id?: string
          p_before?: string
          p_limit?: number
          p_mode?: string
        }
        Returns: Json
      }
      korana_follow_actor: {
        Args: { p_followed_actor_id: string; p_follower_actor_id: string }
        Returns: Json
      }
      korana_foundation_snapshot: { Args: never; Returns: Json }
      korana_owns_actor: { Args: { p_actor_id: string }; Returns: boolean }
      korana_public_identifier_availability: {
        Args: { p_identifier: string }
        Returns: Json
      }
      korana_public_profile_snapshot: {
        Args: { p_handle: string; p_limit?: number; p_viewer_actor_id?: string }
        Returns: Json
      }
      korana_saved_posts_snapshot: {
        Args: { p_actor_id?: string; p_before?: string; p_limit?: number }
        Returns: Json
      }
      korana_set_post_reaction: {
        Args: { p_actor_id: string; p_post_id: string; p_reaction_type: string }
        Returns: Json
      }
      korana_set_repost: {
        Args: { p_actor_id: string; p_post_id: string; p_reposted: boolean }
        Returns: Json
      }
      korana_set_saved_post: {
        Args: { p_actor_id: string; p_post_id: string; p_saved: boolean }
        Returns: Json
      }
      korana_unfollow_actor: {
        Args: { p_followed_actor_id: string; p_follower_actor_id: string }
        Returns: Json
      }
      korana_update_comment: {
        Args: { p_comment_id: string; p_content: string }
        Returns: Json
      }
      korana_update_post: {
        Args: {
          p_content: string
          p_hashtags?: string[]
          p_post_id: string
          p_reply_control?: string
          p_visibility?: string
        }
        Returns: Json
      }
      list_event_coorganizer_candidates: {
        Args: never
        Returns: {
          city_id: string
          id: string
          name: string
          region_id: string
          type: string
        }[]
      }
      search_event_official_candidates: {
        Args: { p_limit?: number; p_query?: string }
        Returns: {
          full_name: string
          photo_url: string
          profile_id: string
          username: string
        }[]
      }
      list_finance_owners: {
        Args: never
        Returns: {
          label: string
          owner_id: string
          owner_type: string
        }[]
      }
      list_my_event_coorganizations: {
        Args: never
        Returns: {
          event_id: string
          event_title: string
          id: string
          invited_at: string
          organization_id: string
          organization_name: string
          role: string
          status: string
        }[]
      }
      mark_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      marketplace_adjust_customer_loyalty: {
        Args: {
          p_customer_id: string
          p_order_id?: string
          p_points: number
          p_reason: string
        }
        Returns: string
      }
      marketplace_adjust_stock: {
        Args: {
          p_delta: number
          p_product_id: string
          p_reason: string
          p_seller_organization_id: string
        }
        Returns: number
      }
      marketplace_archive_delivery_carrier: {
        Args: { p_id: string }
        Returns: undefined
      }
      marketplace_archive_delivery_zone: {
        Args: { p_id: string }
        Returns: undefined
      }
      marketplace_archive_personnel_document: {
        Args: { p_id: string }
        Returns: undefined
      }
      marketplace_assign_delivery_carrier: {
        Args: {
          p_carrier_id: string
          p_delivery_id: string
          p_tracking_number?: string
        }
        Returns: undefined
      }
      marketplace_can_manage_seller_organization: {
        Args: { p_seller_organization_id: string }
        Returns: boolean
      }
      marketplace_can_manage_seller_personnel: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      marketplace_cancel_inventory_count: {
        Args: { p_count_id: string; p_seller_organization_id: string }
        Returns: string
      }
      marketplace_checkout: {
        Args: {
          p_cart_id: string
          p_customer_email: string
          p_customer_name: string
          p_customer_phone: string
          p_delivery_address: string
          p_fulfillment_method: string
          p_idempotency_key: string
          p_payment_method: string
        }
        Returns: {
          order_id: string
        }[]
      }
      marketplace_checkout_impl: {
        Args: {
          p_cart_id: string
          p_customer_email: string
          p_customer_name: string
          p_customer_phone: string
          p_delivery_address: string
          p_fulfillment_method: string
          p_idempotency_key: string
          p_payment_method: string
        }
        Returns: {
          order_id: string
        }[]
      }
      marketplace_confirm_payment_paid: {
        Args: {
          p_payment_id: string
          p_provider_reference?: string
          p_reason?: string
        }
        Returns: string
      }
      marketplace_consume_order_reservation: {
        Args: { p_order_id: string; p_reason: string }
        Returns: number
      }
      marketplace_create_product: {
        Args: {
          p_category: string
          p_condition: string
          p_deposit_amount: number
          p_description: string
          p_images?: string[]
          p_listing_type: string
          p_location: string
          p_rental_price_per_day: number
          p_sale_price: number
          p_seller_organization_id: string
          p_status: string
          p_stock: number
          p_title: string
        }
        Returns: string
      }
      marketplace_create_return: {
        Args: { p_items: Json; p_order_id: string; p_reason: string }
        Returns: string
      }
      marketplace_current_seller_organization: { Args: never; Returns: string }
      marketplace_decide_personnel_leave: {
        Args: { p_id: string; p_status: string }
        Returns: undefined
      }
      marketplace_delivery_management_snapshot: { Args: never; Returns: Json }
      marketplace_finalize_inventory_count: {
        Args: { p_count_id: string; p_seller_organization_id: string }
        Returns: string
      }
      marketplace_invite_seller_personnel: {
        Args: {
          p_expires_days?: number
          p_identifier: string
          p_member_role?: string
        }
        Returns: string
      }
      marketplace_list_inventory_reservations: {
        Args: { p_seller_organization_id: string }
        Returns: {
          customer_name: string
          order_created_at: string
          order_id: string
          order_status: string
          product_id: string
          product_title: string
          quantity: number
        }[]
      }
      marketplace_mark_personnel_attendance: {
        Args: {
          p_action: string
          p_note?: string
          p_profile_id: string
          p_work_date: string
        }
        Returns: undefined
      }
      marketplace_order_reservation_remaining: {
        Args: { p_order_id: string; p_product_id: string }
        Returns: number
      }
      marketplace_promotions_v2_snapshot: { Args: never; Returns: Json }
      marketplace_release_order_reservation: {
        Args: { p_order_id: string; p_reason: string }
        Returns: number
      }
      marketplace_release_order_reservation_impl: {
        Args: { p_order_id: string; p_reason: string }
        Returns: number
      }
      marketplace_respond_seller_personnel_invitation: {
        Args: { p_accept: boolean; p_invitation_id: string }
        Returns: undefined
      }
      marketplace_revoke_seller_personnel_invitation: {
        Args: { p_invitation_id: string }
        Returns: undefined
      }
      marketplace_save_bundle: {
        Args: {
          p_bundle_id: string
          p_currency: string
          p_description: string
          p_discount_percent: number
          p_ends_at: string
          p_fixed_price: number
          p_items: Json
          p_name: string
          p_pricing_mode: string
          p_starts_at: string
          p_status: string
        }
        Returns: string
      }
      marketplace_save_customer_dispute: {
        Args: {
          p_customer_id: string
          p_description: string
          p_id: string
          p_order_id: string
          p_resolution?: string
          p_status?: string
          p_subject: string
        }
        Returns: string
      }
      marketplace_save_customer_segment: {
        Args: { p_description?: string; p_id: string; p_name: string }
        Returns: string
      }
      marketplace_save_delivery_carrier: {
        Args: {
          p_email?: string
          p_id: string
          p_name: string
          p_notes?: string
          p_phone?: string
          p_status?: string
          p_tracking_url_template?: string
          p_website?: string
        }
        Returns: string
      }
      marketplace_save_delivery_zone: {
        Args: {
          p_areas: Json
          p_currency: string
          p_delivery_fee: number
          p_free_delivery_threshold: number
          p_id: string
          p_max_delivery_days: number
          p_min_delivery_days: number
          p_name: string
          p_status: string
        }
        Returns: string
      }
      marketplace_save_inventory_count: {
        Args: {
          p_count_id: string
          p_counts: Json
          p_seller_organization_id: string
        }
        Returns: number
      }
      marketplace_save_partnership: {
        Args: {
          p_benefit_type: string
          p_benefit_value: number
          p_contact_email: string
          p_contact_name: string
          p_contact_phone: string
          p_currency: string
          p_description: string
          p_ends_at: string
          p_partner_name: string
          p_partner_organization_id: string
          p_partnership_id: string
          p_partnership_type: string
          p_product_ids: string[]
          p_promotion_code: string
          p_starts_at: string
          p_status: string
        }
        Returns: string
      }
      marketplace_save_personnel_assignment: {
        Args: {
          p_ends_at: string
          p_id: string
          p_mission: string
          p_profile_id: string
          p_scope: string
          p_starts_at: string
          p_status?: string
        }
        Returns: string
      }
      marketplace_save_personnel_document: {
        Args: {
          p_category: string
          p_expires_at: string
          p_file_name: string
          p_mime_type: string
          p_name: string
          p_profile_id: string
          p_storage_path: string
        }
        Returns: string
      }
      marketplace_save_personnel_internal_role: {
        Args: {
          p_id: string
          p_is_active?: boolean
          p_label: string
          p_permissions: string[]
        }
        Returns: string
      }
      marketplace_save_personnel_leave: {
        Args: {
          p_ends_on: string
          p_id: string
          p_leave_type: string
          p_profile_id: string
          p_starts_on: string
        }
        Returns: string
      }
      marketplace_save_personnel_profile: {
        Args: {
          p_availability: string
          p_contract_type: string
          p_currency: string
          p_department: string
          p_employment_status: string
          p_location: string
          p_monthly_compensation: number
          p_profile_id: string
        }
        Returns: undefined
      }
      marketplace_save_promotion: {
        Args: {
          p_currency: string
          p_description: string
          p_discount_type: string
          p_discount_value: number
          p_ends_at: string
          p_max_discount_amount: number
          p_min_order_amount: number
          p_name: string
          p_product_ids: string[]
          p_promotion_id: string
          p_starts_at: string
          p_status: string
          p_usage_limit: number
        }
        Returns: string
      }
      marketplace_save_promotion_code: {
        Args: {
          p_code: string
          p_code_id: string
          p_promotion_id: string
          p_status: string
          p_usage_limit: number
        }
        Returns: string
      }
      marketplace_save_seller_agenda_item: {
        Args: {
          p_all_day: boolean
          p_description: string
          p_ends_at: string
          p_id: string
          p_kind: string
          p_location: string
          p_priority: string
          p_starts_at: string
          p_status: string
          p_title: string
        }
        Returns: string
      }
      marketplace_seller_agenda_snapshot: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
      marketplace_seller_customers_snapshot: { Args: never; Returns: Json }
      marketplace_seller_performance_snapshot: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
      marketplace_seller_personnel_assert_member: {
        Args: { p_organization_id: string; p_profile_id: string }
        Returns: undefined
      }
      marketplace_seller_personnel_snapshot: { Args: never; Returns: Json }
      marketplace_seller_personnel_storage_access: {
        Args: { p_name: string }
        Returns: boolean
      }
      marketplace_seller_revenue_snapshot: { Args: never; Returns: Json }
      marketplace_seller_transaction_snapshot: {
        Args: { p_limit?: number }
        Returns: {
          amount: number
          created_at: string
          currency: string
          external_reference: string
          order_id: string
          paid_at: string
          payment_id: string
          payment_method: string
          payment_status: string
          provider_reference: string
          transaction_id: string
          transaction_status: string
          transaction_type: string
        }[]
      }
      marketplace_set_bundle_status: {
        Args: { p_bundle_id: string; p_status: string }
        Returns: string
      }
      marketplace_set_customer_segment_members: {
        Args: { p_customer_ids: string[]; p_segment_id: string }
        Returns: number
      }
      marketplace_set_customer_segment_status: {
        Args: { p_id: string; p_status: string }
        Returns: undefined
      }
      marketplace_set_low_stock_threshold: {
        Args: {
          p_product_id: string
          p_seller_organization_id: string
          p_threshold: number
        }
        Returns: number
      }
      marketplace_set_partnership_status: {
        Args: { p_note: string; p_partnership_id: string; p_status: string }
        Returns: string
      }
      marketplace_set_personnel_access: {
        Args: { p_active: boolean; p_profile_id: string }
        Returns: undefined
      }
      marketplace_set_personnel_internal_role_members: {
        Args: { p_profile_ids: string[]; p_role_id: string }
        Returns: number
      }
      marketplace_set_product_status: {
        Args: {
          p_product_id: string
          p_seller_organization_id: string
          p_target_status: string
        }
        Returns: string
      }
      marketplace_set_promotion_code_status: {
        Args: { p_code_id: string; p_status: string }
        Returns: string
      }
      marketplace_set_promotion_status: {
        Args: { p_promotion_id: string; p_status: string }
        Returns: string
      }
      marketplace_set_seller_agenda_item_status: {
        Args: { p_id: string; p_status: string }
        Returns: undefined
      }
      marketplace_start_inventory_count: {
        Args: { p_note?: string; p_seller_organization_id: string }
        Returns: string
      }
      marketplace_transition_order_status: {
        Args: { p_order_id: string; p_reason?: string; p_target_status: string }
        Returns: string
      }
      marketplace_transition_return: {
        Args: {
          p_note?: string
          p_resolution?: string
          p_return_id: string
          p_status: string
        }
        Returns: undefined
      }
      marketplace_update_product: {
        Args: {
          p_category: string
          p_condition: string
          p_deposit_amount: number
          p_description: string
          p_images?: string[]
          p_listing_type: string
          p_location: string
          p_product_id: string
          p_rental_price_per_day: number
          p_sale_price: number
          p_seller_organization_id: string
          p_status: string
          p_stock: number
          p_title: string
        }
        Returns: string
      }
      messaging_can_access_conversation: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      messaging_can_access_message: {
        Args: { p_message_id: string }
        Returns: boolean
      }
      messaging_can_manage_conversation: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      messaging_can_represent_organization: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      messaging_is_message_operator: {
        Args: { p_message_id: string }
        Returns: boolean
      }
      messaging_search_profile_recipients: {
        Args: { p_limit?: number; p_query?: string }
        Returns: {
          actor_id: string
          actor_type: string
          avatar_url: string
          display_name: string
          handle: string
          is_verified: boolean
          organization_id: string | null
          profile_id: string | null
        }[]
      }
      open_or_create_private_conversation: {
        Args: {
          p_recipient_actor_id: string
          p_sender_organization_id?: string
        }
        Returns: string
      }
      organizer_event_financial_summary: {
        Args: { p_event_id: string }
        Returns: {
          committed_amount: number
          forecast_expense: number
          forecast_revenue: number
          net_result: number
          paid_expense: number
          paid_revenue: number
        }[]
      }
      organizer_event_ticket_metrics: {
        Args: { p_event_id: string }
        Returns: {
          fill_rate: number
          gross_revenue: number
          sold_quantity: number
          total_capacity: number
        }[]
      }
      pause_round_timer: {
        Args: {
          p_event_type: string
          p_reason?: string
          p_round_id: string
          p_user?: string
        }
        Returns: undefined
      }
      platform_http_apply_incident_state: {
        Args: {
          p_check_id: string
          p_error_code: string
          p_http_status: number
          p_observed_at: string
          p_status: string
        }
        Returns: undefined
      }
      platform_http_collect_checks: { Args: never; Returns: number }
      platform_http_enqueue_check: { Args: never; Returns: number }
      platform_http_prune_checks: { Args: never; Returns: number }
      post_financial_payment: {
        Args: {
          p_amount: number
          p_currency_code: string
          p_description: string
          p_idempotency_key: string
          p_occurred_at?: string
          p_payee_id: string
          p_payee_type: string
          p_payer_id: string
          p_payer_type: string
          p_reference: string
          p_source_id: string
          p_source_type: string
        }
        Returns: string
      }
      post_financial_payment_accounts_internal: {
        Args: {
          p_amount: number
          p_created_by?: string
          p_currency_code: string
          p_description: string
          p_idempotency_key: string
          p_occurred_at?: string
          p_payee_account_id: string
          p_payer_account_id: string
          p_payment_kind?: string
          p_reference: string
          p_refunded_payment_id?: string
          p_source_id: string
          p_source_type: string
        }
        Returns: string
      }
      post_financial_payment_internal: {
        Args: {
          p_amount: number
          p_created_by?: string
          p_currency_code: string
          p_description: string
          p_idempotency_key: string
          p_occurred_at?: string
          p_payee_id: string
          p_payee_type: string
          p_payer_id: string
          p_payer_type: string
          p_payment_kind?: string
          p_reference: string
          p_refunded_payment_id?: string
          p_source_id: string
          p_source_type: string
        }
        Returns: string
      }
      post_manual_financial_operation: {
        Args: {
          p_amount: number
          p_category_id?: string
          p_category_name: string
          p_counterparty_name?: string
          p_currency_code: string
          p_description: string
          p_idempotency_key: string
          p_notes?: string
          p_occurred_at?: string
          p_operation_type: string
          p_owner_id: string
          p_owner_type: string
          p_payment_method?: string
          p_receipt_path?: string
          p_reference?: string
        }
        Returns: string
      }
      prune_auth_observability_events: { Args: never; Returns: number }
      prune_realtime_observability_events: { Args: never; Returns: number }
      publish_fight_result: {
        Args: { p_fight_id: string; p_user?: string }
        Returns: undefined
      }
      record_admin_access: {
        Args: { p_action: string; p_details?: Json }
        Returns: undefined
      }
      record_auth_observability_event: {
        Args: {
          p_duration_ms: number
          p_error_category: string
          p_event_id: string
          p_outcome: string
        }
        Returns: boolean
      }
      record_event_invoice_payment: {
        Args: {
          p_amount: number
          p_invoice_id: string
          p_method: string
          p_notes?: string
          p_paid_at?: string
          p_reference?: string
        }
        Returns: string
      }
      record_event_ticket_access: {
        Args: {
          p_manual?: boolean
          p_result?: string
          p_ticket_id: string
          p_zone?: string
        }
        Returns: string
      }
      record_event_ticket_sale: {
        Args: {
          p_buyer_email: string
          p_buyer_name: string
          p_buyer_phone: string
          p_payment_status?: string
          p_quantity: number
          p_ticket_type_id: string
        }
        Returns: string
      }
      record_official_action: {
        Args: {
          p_action_type_id: string
          p_fight_id: string
          p_fighter_id: string
          p_notes?: string
          p_recorded_by?: string
          p_round_id: string
        }
        Returns: undefined
      }
      record_realtime_observability_event: {
        Args: {
          p_channel_kind: string
          p_domain: string
          p_duration_ms: number
          p_error_category: string
          p_event_id: string
          p_intentional: boolean
          p_is_initial_status: boolean
          p_status: string
          p_subscription_id: string
        }
        Returns: boolean
      }
      refund_financial_payment: {
        Args: {
          p_description?: string
          p_idempotency_key: string
          p_occurred_at?: string
          p_payment_id: string
          p_reference?: string
        }
        Returns: string
      }
      register_fight_event: {
        Args: {
          p_event_code: string
          p_event_type: string
          p_fight_id: string
          p_fighter_id?: string
          p_operation_mode?: string
          p_payload?: Json
          p_recorded_by?: string
          p_round_number?: number
          p_source?: string
        }
        Returns: string
      }
      fight_live_decide: {
        Args: { p_fight_id: string; p_method: string; p_winner_id: string | null }
        Returns: string
      }
      fight_live_list_ids: {
        Args: { p_scope: string }
        Returns: { fight_id: string }[]
      }
      fight_live_publish_result: {
        Args: { p_fight_id: string }
        Returns: undefined
      }
      fight_live_record_action: {
        Args: { p_action_type: string; p_corner?: string; p_fight_id: string }
        Returns: string
      }
      fight_live_save_judge_score: {
        Args: {
          p_blue_score: number
          p_fight_id: string
          p_judge_card_id: string
          p_red_score: number
          p_round_number: number
        }
        Returns: undefined
      }
      fight_live_submit_judge_card: {
        Args: { p_judge_card_id: string }
        Returns: undefined
      }
      fight_live_timer_action: {
        Args: {
          p_action: string
          p_fight_id: string
          p_pause_type?: string
          p_reason?: string
        }
        Returns: undefined
      }
      register_my_verification_document: {
        Args: {
          p_document_type: string
          p_expires_at?: string
          p_file_name: string
          p_mime_type: string
          p_request_id: string
          p_size_bytes: number
          p_storage_path: string
        }
        Returns: string
      }
      respond_event_coorganization: {
        Args: { p_accept: boolean; p_invitation_id: string }
        Returns: undefined
      }
      resume_round_timer: {
        Args: { p_round_id: string; p_user?: string }
        Returns: undefined
      }
      reverse_manual_financial_operation: {
        Args: {
          p_idempotency_key: string
          p_occurred_at?: string
          p_operation_id: string
          p_reason?: string
        }
        Returns: string
      }
      review_event_registration: {
        Args: {
          p_eligibility_status: string
          p_payment_status?: string
          p_reason?: string
          p_registration_id: string
          p_status: string
          p_waitlist_position?: number
        }
        Returns: {
          applicant_organization_id: string | null
          applicant_profile_id: string | null
          applicant_type: string
          competition_category_id: string | null
          decision_reason: string | null
          document_paths: string[]
          eligibility_status: string
          event_id: string
          id: string
          license_number: string | null
          medical_certificate_path: string | null
          payment_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
          waitlist_position: number | null
          weight_kg: number | null
        }
      }
      review_event_ticket_refund: {
        Args: {
          p_external_reference?: string
          p_processed_amount?: number
          p_refund_id: string
          p_status: string
        }
        Returns: undefined
      }
      save_my_profile_verification: {
        Args: {
          p_identity_number: string
          p_legal_name: string
          p_nif: string
          p_organization_id: string
          p_registered_address: string
          p_stat_number: string
          p_subject_type: string
        }
        Returns: string
      }
      save_organizer_event_workflow: {
        Args: { p_event_id: string; p_payload: Json; p_status?: string }
        Returns: string
      }
      save_organizer_event_workflow_v2: {
        Args: { p_event_id: string; p_payload: Json; p_status?: string }
        Returns: string
      }
      send_message: {
        Args: {
          p_attachments?: Json
          p_content: string
          p_conversation_id: string
          p_message_type?: string
          p_reply_to_id?: string
          p_sender_organization_id?: string
        }
        Returns: string
      }
      start_fight: {
        Args: {
          p_fight_id: string
          p_round_count: number
          p_round_duration: number
          p_user?: string
        }
        Returns: undefined
      }
      submit_judge_card: {
        Args: { p_judge_card_id: string; p_judge_id?: string }
        Returns: undefined
      }
      submit_my_profile_verification: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      super_admin_analytics_snapshot: {
        Args: { p_from?: string; p_to?: string }
        Returns: Json
      }
      super_admin_auth_observability: {
        Args: { p_from?: string; p_to?: string }
        Returns: Json
      }
      super_admin_business_analytics: {
        Args: { p_from?: string; p_to?: string }
        Returns: Json
      }
      super_admin_capture_performance_snapshot: {
        Args: { p_period_days: number }
        Returns: Json
      }
      super_admin_capture_system_snapshot: {
        Args: { p_client_rpc_latency_ms?: number; p_period_days: number }
        Returns: Json
      }
      super_admin_grant_administrator: {
        Args: { p_profile_id: string; p_reason: string }
        Returns: Json
      }
      super_admin_http_uptime_analytics: {
        Args: { p_from?: string; p_to?: string }
        Returns: Json
      }
      super_admin_kpi_target_configuration: { Args: never; Returns: Json }
      super_admin_list_access_logs: {
        Args: { p_limit?: number }
        Returns: Json
      }
      super_admin_list_administrator_governance: { Args: never; Returns: Json }
      super_admin_list_administrators: { Args: never; Returns: Json }
      super_admin_list_permission_catalog: { Args: never; Returns: Json }
      super_admin_marketplace_analytics: {
        Args: { p_from?: string; p_to?: string }
        Returns: Json
      }
      super_admin_performance_analytics: {
        Args: { p_from?: string; p_to?: string }
        Returns: Json
      }
      super_admin_performance_snapshot_history: {
        Args: { p_limit?: number; p_period_days: number }
        Returns: Json
      }
      super_admin_permissions_governance_snapshot: {
        Args: never
        Returns: Json
      }
      super_admin_reactivate_administrator: {
        Args: { p_profile_id: string; p_reason: string }
        Returns: Json
      }
      super_admin_realtime_observability: {
        Args: { p_from?: string; p_to?: string }
        Returns: Json
      }
      super_admin_revoke_administrator: {
        Args: { p_profile_id: string; p_reason: string }
        Returns: Json
      }
      super_admin_save_kpi_targets: { Args: { p_targets: Json }; Returns: Json }
      super_admin_search_administrator_candidates: {
        Args: { p_limit?: number; p_query: string }
        Returns: Json
      }
      super_admin_search_profiles: {
        Args: { p_limit?: number; p_query?: string }
        Returns: Json
      }
      super_admin_set_admin_permissions: {
        Args: { p_permission_codes: string[]; p_profile_id: string }
        Returns: undefined
      }
      super_admin_set_admin_role: {
        Args: { p_enabled: boolean; p_profile_id: string }
        Returns: undefined
      }
      super_admin_set_administrator_permissions: {
        Args: {
          p_permission_codes: string[]
          p_profile_id: string
          p_reason?: string
        }
        Returns: Json
      }
      super_admin_suspend_administrator: {
        Args: { p_profile_id: string; p_reason: string }
        Returns: Json
      }
      super_admin_system_analytics: {
        Args: { p_from?: string; p_to?: string }
        Returns: Json
      }
      super_admin_system_snapshot_history: {
        Args: { p_limit?: number; p_period_days: number }
        Returns: Json
      }
      sync_timer_to_timeline: { Args: { p_fight_id: string }; Returns: number }
      ticket_type_available_quantity: {
        Args: { p_ticket_type_id: string }
        Returns: number
      }
      transition_event_budget: {
        Args: { p_budget_id: string; p_note?: string; p_status: string }
        Returns: string
      }
      transition_event_operation: {
        Args: { p_note?: string; p_operation_id: string; p_status: string }
        Returns: string
      }
      transition_event_transaction: {
        Args: { p_note?: string; p_status: string; p_transaction_id: string }
        Returns: string
      }
      transition_sponsor_contract: {
        Args: { p_contract_id: string; p_note?: string; p_status: string }
        Returns: string
      }
      transition_sponsor_deliverable: {
        Args: { p_deliverable_id: string; p_note?: string; p_status: string }
        Returns: string
      }
      transition_sponsor_pipeline: {
        Args: { p_note?: string; p_pipeline_id: string; p_stage: string }
        Returns: string
      }
      unaccent: { Args: { "": string }; Returns: string }
      update_fight_statistics: { Args: { p_fight_id: string }; Returns: number }
      update_fighter_career_stats: {
        Args: { p_fighter_id: string }
        Returns: undefined
      }
      update_finance_category: {
        Args: {
          p_category_id: string
          p_description?: string
          p_name: string
          p_sort_order?: number
        }
        Returns: string
      }
      update_my_organization: {
        Args: {
          p_city_id?: string
          p_description?: string
          p_discipline?: string
          p_email?: string
          p_name: string
          p_organization_id: string
          p_phone?: string
          p_region_id?: string
          p_website?: string
        }
        Returns: string
      }
    }
    Enums: {
      fighter_status_type: "amateur" | "professionnel"
      martial_discipline:
        | "MMA"
        | "Judo"
        | "Boxe_Ancienne"
        | "Grappling"
        | "Moraingy"
        | "Boxe_Anglaise"
        | "Kickboxing"
        | "Karate"
        | "Taekwondo"
      user_role:
        | "Fan"
        | "Combattant"
        | "Organisateur"
        | "Coach"
        | "Club"
        | "Federation"
        | "Sponsor"
        | "Vendeur"
        | "Admin_Fan"
        | "Admin_Combattant"
        | "Admin_Organisateur"
        | "Admin_Coach"
        | "Admin_Club"
        | "Admin_Federation"
        | "Admin_Sponsor"
        | "Admin_Vendeur"
        | "Super_Admin"
      user_role_type:
        | "Fan"
        | "Combattant"
        | "Organisateur"
        | "Coach"
        | "Arbitre"
        | "Juge"
        | "Sponsor"
        | "Vendeur"
        | "Club"
        | "Fédération"
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
      fighter_status_type: ["amateur", "professionnel"],
      martial_discipline: [
        "MMA",
        "Judo",
        "Boxe_Ancienne",
        "Grappling",
        "Moraingy",
        "Boxe_Anglaise",
        "Kickboxing",
        "Karate",
        "Taekwondo",
      ],
      user_role: [
        "Fan",
        "Combattant",
        "Organisateur",
        "Coach",
        "Club",
        "Federation",
        "Sponsor",
        "Vendeur",
        "Admin_Fan",
        "Admin_Combattant",
        "Admin_Organisateur",
        "Admin_Coach",
        "Admin_Club",
        "Admin_Federation",
        "Admin_Sponsor",
        "Admin_Vendeur",
        "Super_Admin",
      ],
      user_role_type: [
        "Fan",
        "Combattant",
        "Organisateur",
        "Coach",
        "Arbitre",
        "Juge",
        "Sponsor",
        "Vendeur",
        "Club",
        "Fédération",
      ],
    },
  },
} as const
