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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          branch: string | null
          created_at: string | null
          id: string
          is_primary: boolean
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          bank_name: string
          branch?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          branch?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          booking_date: string | null
          cancelled_at: string | null
          commission_amount: number
          created_at: string | null
          customer_id: string | null
          deposit_amount: number | null
          deposit_paid_at: string | null
          full_payment_at: string | null
          id: string
          notes: string | null
          payment_status: string | null
          remaining_amount: number | null
          seller_id: string | null
          status: string | null
          total_amount: number
          trip_schedule_id: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          booking_date?: string | null
          cancelled_at?: string | null
          commission_amount?: number
          created_at?: string | null
          customer_id?: string | null
          deposit_amount?: number | null
          deposit_paid_at?: string | null
          full_payment_at?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          remaining_amount?: number | null
          seller_id?: string | null
          status?: string | null
          total_amount: number
          trip_schedule_id?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          booking_date?: string | null
          cancelled_at?: string | null
          commission_amount?: number
          created_at?: string | null
          customer_id?: string | null
          deposit_amount?: number | null
          deposit_paid_at?: string | null
          full_payment_at?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          remaining_amount?: number | null
          seller_id?: string | null
          status?: string | null
          total_amount?: number
          trip_schedule_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_schedule_id_fkey"
            columns: ["trip_schedule_id"]
            isOneToOne: false
            referencedRelation: "trip_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_schedule_id_fkey"
            columns: ["trip_schedule_id"]
            isOneToOne: false
            referencedRelation: "trips_with_next_schedule"
            referencedColumns: ["next_schedule_id"]
          },
        ]
      }
      coin_bonus_campaigns: {
        Row: {
          campaign_type: Database["public"]["Enums"]["campaign_type"]
          coin_amount: number
          conditions: Json | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          start_date: string
          target_trip_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          campaign_type: Database["public"]["Enums"]["campaign_type"]
          coin_amount: number
          conditions?: Json | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          start_date: string
          target_trip_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          campaign_type?: Database["public"]["Enums"]["campaign_type"]
          coin_amount?: number
          conditions?: Json | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          start_date?: string
          target_trip_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_bonus_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coin_bonus_campaigns_target_trip_id_fkey"
            columns: ["target_trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coin_bonus_campaigns_target_trip_id_fkey"
            columns: ["target_trip_id"]
            isOneToOne: false
            referencedRelation: "trips_with_next_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_redemptions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bank_account_id: string
          cash_amount: number
          coin_amount: number
          conversion_rate: number
          id: string
          notes: string | null
          paid_at: string | null
          rejection_reason: string | null
          requested_at: string
          seller_id: string
          status: Database["public"]["Enums"]["redemption_status"]
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bank_account_id: string
          cash_amount: number
          coin_amount: number
          conversion_rate?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          rejection_reason?: string | null
          requested_at?: string
          seller_id: string
          status?: Database["public"]["Enums"]["redemption_status"]
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bank_account_id?: string
          cash_amount?: number
          coin_amount?: number
          conversion_rate?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          rejection_reason?: string | null
          requested_at?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["redemption_status"]
        }
        Relationships: [
          {
            foreignKeyName: "coin_redemptions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coin_redemptions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coin_redemptions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          coin_type: string | null
          created_at: string
          description: string
          id: string
          metadata: Json | null
          seller_id: string
          source_id: string | null
          source_type: Database["public"]["Enums"]["coin_source_type"]
          transaction_type: Database["public"]["Enums"]["coin_transaction_type"]
          unlocked_from_transaction_id: string | null
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          coin_type?: string | null
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          seller_id: string
          source_id?: string | null
          source_type: Database["public"]["Enums"]["coin_source_type"]
          transaction_type: Database["public"]["Enums"]["coin_transaction_type"]
          unlocked_from_transaction_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          coin_type?: string | null
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          seller_id?: string
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["coin_source_type"]
          transaction_type?: Database["public"]["Enums"]["coin_transaction_type"]
          unlocked_from_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coin_transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coin_transactions_unlocked_from_transaction_id_fkey"
            columns: ["unlocked_from_transaction_id"]
            isOneToOne: false
            referencedRelation: "coin_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payment_type: string
          percentage: number | null
          seller_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_type: string
          percentage?: number | null
          seller_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_type?: string
          percentage?: number | null
          seller_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payments_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string | null
          flag_emoji: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          flag_emoji?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          flag_emoji?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          email: string
          full_name: string
          id: string
          id_card: string | null
          passport_number: string | null
          phone: string | null
          referred_by_code: string | null
          referred_by_seller_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          full_name: string
          id?: string
          id_card?: string | null
          passport_number?: string | null
          phone?: string | null
          referred_by_code?: string | null
          referred_by_seller_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          full_name?: string
          id?: string
          id_card?: string | null
          passport_number?: string | null
          phone?: string | null
          referred_by_code?: string | null
          referred_by_seller_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_referred_by_seller_id_fkey"
            columns: ["referred_by_seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_campaigns: {
        Row: {
          condition_1_data: Json | null
          condition_1_reward_amount: number
          condition_1_reward_type: string
          condition_1_type: string
          condition_2_action: string
          condition_2_bonus_amount: number | null
          condition_2_data: Json | null
          condition_2_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          start_date: string
          target_audience: string | null
          target_seller_ids: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          condition_1_data?: Json | null
          condition_1_reward_amount: number
          condition_1_reward_type: string
          condition_1_type: string
          condition_2_action: string
          condition_2_bonus_amount?: number | null
          condition_2_data?: Json | null
          condition_2_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          start_date: string
          target_audience?: string | null
          target_seller_ids?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          condition_1_data?: Json | null
          condition_1_reward_amount?: number
          condition_1_reward_type?: string
          condition_1_type?: string
          condition_2_action?: string
          condition_2_bonus_amount?: number | null
          condition_2_data?: Json | null
          condition_2_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          start_date?: string
          target_audience?: string | null
          target_seller_ids?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gamification_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_progress: {
        Row: {
          both_completed: boolean
          campaign_id: string
          condition_1_completed: boolean
          condition_1_completed_at: string | null
          condition_2_completed: boolean
          condition_2_completed_at: string | null
          created_at: string
          id: string
          seller_id: string
          updated_at: string
        }
        Insert: {
          both_completed?: boolean
          campaign_id: string
          condition_1_completed?: boolean
          condition_1_completed_at?: string | null
          condition_2_completed?: boolean
          condition_2_completed_at?: string | null
          created_at?: string
          id?: string
          seller_id: string
          updated_at?: string
        }
        Update: {
          both_completed?: boolean
          campaign_id?: string
          condition_1_completed?: boolean
          condition_1_completed_at?: string | null
          condition_2_completed?: boolean
          condition_2_completed_at?: string | null
          created_at?: string
          id?: string
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_progress_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "gamification_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_progress_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      sales_targets: {
        Row: {
          commission_target: number
          created_at: string | null
          id: string
          seller_id: string | null
          target_month: string
          updated_at: string | null
        }
        Insert: {
          commission_target: number
          created_at?: string | null
          id?: string
          seller_id?: string | null
          target_month: string
          updated_at?: string | null
        }
        Update: {
          commission_target?: number
          created_at?: string | null
          id?: string
          seller_id?: string | null
          target_month?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_targets_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_activity_completions: {
        Row: {
          activity_key: string
          coins_awarded: number
          completed_at: string
          id: string
          seller_id: string
          transaction_id: string | null
        }
        Insert: {
          activity_key: string
          coins_awarded?: number
          completed_at?: string
          id?: string
          seller_id: string
          transaction_id?: string | null
        }
        Update: {
          activity_key?: string
          coins_awarded?: number
          completed_at?: string
          id?: string
          seller_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_activity_completions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_activity_completions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "coin_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_campaign_progress: {
        Row: {
          both_completed: boolean | null
          campaign_id: string
          condition_1_completed: boolean | null
          condition_1_completed_at: string | null
          condition_1_transaction_id: string | null
          condition_2_completed: boolean | null
          condition_2_completed_at: string | null
          condition_2_transaction_id: string | null
          created_at: string | null
          id: string
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          both_completed?: boolean | null
          campaign_id: string
          condition_1_completed?: boolean | null
          condition_1_completed_at?: string | null
          condition_1_transaction_id?: string | null
          condition_2_completed?: boolean | null
          condition_2_completed_at?: string | null
          condition_2_transaction_id?: string | null
          created_at?: string | null
          id?: string
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          both_completed?: boolean | null
          campaign_id?: string
          condition_1_completed?: boolean | null
          condition_1_completed_at?: string | null
          condition_1_transaction_id?: string | null
          condition_2_completed?: boolean | null
          condition_2_completed_at?: string | null
          condition_2_transaction_id?: string | null
          created_at?: string | null
          id?: string
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_campaign_progress_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "gamification_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_campaign_progress_condition_1_transaction_id_fkey"
            columns: ["condition_1_transaction_id"]
            isOneToOne: false
            referencedRelation: "coin_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_campaign_progress_condition_2_transaction_id_fkey"
            columns: ["condition_2_transaction_id"]
            isOneToOne: false
            referencedRelation: "coin_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_campaign_progress_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_coins: {
        Row: {
          created_at: string
          locked_balance: number
          redeemable_balance: number
          seller_id: string
          total_earned: number
          total_redeemed: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          locked_balance?: number
          redeemable_balance?: number
          seller_id: string
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          locked_balance?: number
          redeemable_balance?: number
          seller_id?: string
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_coins_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      share_click_events: {
        Row: {
          created_at: string
          id: string
          referer: string | null
          seller_id: string
          trip_id: string
          visitor_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          referer?: string | null
          seller_id: string
          trip_id: string
          visitor_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          referer?: string | null
          seller_id?: string
          trip_id?: string
          visitor_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_click_events_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_click_events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_click_events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips_with_next_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      share_coin_awards: {
        Row: {
          award_type: string
          campaign_id: string | null
          click_count: number
          coins_awarded: number
          created_at: string
          id: string
          seller_id: string
          transaction_id: string | null
          trip_id: string
        }
        Insert: {
          award_type: string
          campaign_id?: string | null
          click_count: number
          coins_awarded: number
          created_at?: string
          id?: string
          seller_id: string
          transaction_id?: string | null
          trip_id: string
        }
        Update: {
          award_type?: string
          campaign_id?: string | null
          click_count?: number
          coins_awarded?: number
          created_at?: string
          id?: string
          seller_id?: string
          transaction_id?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_coin_awards_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "coin_bonus_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_coin_awards_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_coin_awards_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "coin_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_coin_awards_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_coin_awards_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips_with_next_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_schedules: {
        Row: {
          available_seats: number
          created_at: string | null
          departure_date: string
          id: string
          is_active: boolean | null
          registration_deadline: string
          return_date: string
          trip_id: string | null
        }
        Insert: {
          available_seats: number
          created_at?: string | null
          departure_date: string
          id?: string
          is_active?: boolean | null
          registration_deadline: string
          return_date: string
          trip_id?: string | null
        }
        Update: {
          available_seats?: number
          created_at?: string | null
          departure_date?: string
          id?: string
          is_active?: boolean | null
          registration_deadline?: string
          return_date?: string
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_schedules_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_schedules_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips_with_next_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          commission_type: string | null
          commission_value: number
          country_id: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_days: number
          duration_nights: number
          file_link: string | null
          id: string
          is_active: boolean | null
          partner_id: string | null
          price_per_person: number
          title: string
          total_seats: number
          updated_at: string | null
        }
        Insert: {
          commission_type?: string | null
          commission_value: number
          country_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_days: number
          duration_nights: number
          file_link?: string | null
          id?: string
          is_active?: boolean | null
          partner_id?: string | null
          price_per_person: number
          title: string
          total_seats: number
          updated_at?: string | null
        }
        Update: {
          commission_type?: string | null
          commission_value?: number
          country_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_days?: number
          duration_nights?: number
          file_link?: string | null
          id?: string
          is_active?: boolean | null
          partner_id?: string | null
          price_per_person?: number
          title?: string
          total_seats?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_uploaded_at: string | null
          avatar_url: string | null
          commission_goal: number | null
          created_at: string | null
          document_uploaded_at: string | null
          documents_urls: string[] | null
          email: string | null
          first_trip_completed: boolean | null
          first_trip_completed_at: string | null
          full_name: string | null
          id: string
          id_card_uploaded_at: string | null
          id_card_url: string | null
          phone: string | null
          referral_code: string | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_uploaded_at?: string | null
          avatar_url?: string | null
          commission_goal?: number | null
          created_at?: string | null
          document_uploaded_at?: string | null
          documents_urls?: string[] | null
          email?: string | null
          first_trip_completed?: boolean | null
          first_trip_completed_at?: string | null
          full_name?: string | null
          id: string
          id_card_uploaded_at?: string | null
          id_card_url?: string | null
          phone?: string | null
          referral_code?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_uploaded_at?: string | null
          avatar_url?: string | null
          commission_goal?: number | null
          created_at?: string | null
          document_uploaded_at?: string | null
          documents_urls?: string[] | null
          email?: string | null
          first_trip_completed?: boolean | null
          first_trip_completed_at?: string | null
          full_name?: string | null
          id?: string
          id_card_uploaded_at?: string | null
          id_card_url?: string | null
          phone?: string | null
          referral_code?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      seller_booking_stats: {
        Row: {
          booking_count: number | null
          seller_id: string | null
          total_amount: number | null
          total_commission: number | null
          trip_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_schedules_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_schedules_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips_with_next_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      trips_with_next_schedule: {
        Row: {
          commission_type: string | null
          commission_value: number | null
          country_flag: string | null
          country_id: string | null
          country_name: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_days: number | null
          duration_nights: number | null
          file_link: string | null
          id: string | null
          is_active: boolean | null
          next_available_seats: number | null
          next_departure_date: string | null
          next_registration_deadline: string | null
          next_return_date: string | null
          next_schedule_id: string | null
          price_per_person: number | null
          title: string | null
          total_seats: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_locked_or_redeemable_coins: {
        Args: {
          p_amount: number
          p_coin_type: string
          p_description: string
          p_metadata?: Json
          p_seller_id: string
          p_source_id: string
          p_source_type: Database["public"]["Enums"]["coin_source_type"]
        }
        Returns: string
      }
      award_share_coins: {
        Args: { p_campaign_id?: string; p_seller_id: string; p_trip_id: string }
        Returns: Json
      }
      calculate_sales_target_bonus: {
        Args: { p_month: string; p_seller_id: string }
        Returns: number
      }
      check_and_complete_condition_2: {
        Args: { p_seller_id: string }
        Returns: undefined
      }
      complete_gamification_task: {
        Args: { p_campaign_id: string; p_seller_id: string; p_task_data?: Json }
        Returns: Json
      }
      get_active_campaigns: {
        Args: { p_seller_id?: string; p_trip_id?: string }
        Returns: {
          campaign_type: Database["public"]["Enums"]["campaign_type"]
          coin_amount: number
          description: string
          end_date: string
          id: string
          start_date: string
          target_trip_id: string
          title: string
        }[]
      }
      get_available_countries: { Args: never; Returns: Json }
      get_available_seats: { Args: { schedule_id: string }; Returns: number }
      get_booking_stats: {
        Args: never
        Returns: {
          approved_bookings: number
          cancelled_bookings: number
          inprogress_bookings: number
          pending_bookings: number
          rejected_bookings: number
          total_bookings: number
        }[]
      }
      get_sellers_with_emails: {
        Args: never
        Returns: {
          approved_at: string
          approved_by: string
          avatar_uploaded_at: string
          avatar_url: string
          commission_goal: number
          created_at: string
          document_uploaded_at: string
          documents_urls: string[]
          email: string
          full_name: string
          id: string
          id_card_uploaded_at: string
          id_card_url: string
          phone: string
          referral_code: string
          role: string
          status: string
          updated_at: string
        }[]
      }
      get_trip_stats: {
        Args: { p_user_id: string; p_user_role: string }
        Returns: Json
      }
      get_trips_with_seller_data: {
        Args: {
          p_countries?: string[]
          p_filter?: string
          p_page?: number
          p_page_size?: number
          p_user_id: string
          p_user_role: string
        }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      is_storage_admin: { Args: never; Returns: boolean }
      is_storage_file_owner: { Args: { file_path: string }; Returns: boolean }
      refresh_seller_booking_stats: { Args: never; Returns: undefined }
      unlock_coins_for_seller: {
        Args: { p_campaign_id?: string; p_seller_id: string }
        Returns: {
          transaction_id: string
          unlocked_amount: number
        }[]
      }
    }
    Enums: {
      campaign_type:
        | "trip_specific"
        | "date_specific"
        | "sales_milestone"
        | "general"
        | "share_clicks"
      coin_source_type:
        | "booking"
        | "sales_target"
        | "referral"
        | "campaign"
        | "admin"
        | "gamification"
        | "share"
      coin_transaction_type:
        | "earn"
        | "redeem"
        | "bonus"
        | "adjustment"
        | "unlock"
      gamification_condition_1_type:
        | "survey"
        | "onboarding_task"
        | "profile_complete"
        | "referral"
      gamification_condition_2_action: "unlock" | "bonus" | "none"
      gamification_condition_2_type:
        | "first_trip_sold"
        | "trip_count"
        | "sales_amount"
      gamification_reward_type: "earning" | "redeemable"
      redemption_status: "pending" | "approved" | "rejected" | "paid"
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
      campaign_type: [
        "trip_specific",
        "date_specific",
        "sales_milestone",
        "general",
        "share_clicks",
      ],
      coin_source_type: [
        "booking",
        "sales_target",
        "referral",
        "campaign",
        "admin",
        "gamification",
        "share",
      ],
      coin_transaction_type: [
        "earn",
        "redeem",
        "bonus",
        "adjustment",
        "unlock",
      ],
      gamification_condition_1_type: [
        "survey",
        "onboarding_task",
        "profile_complete",
        "referral",
      ],
      gamification_condition_2_action: ["unlock", "bonus", "none"],
      gamification_condition_2_type: [
        "first_trip_sold",
        "trip_count",
        "sales_amount",
      ],
      gamification_reward_type: ["earning", "redeemable"],
      redemption_status: ["pending", "approved", "rejected", "paid"],
    },
  },
} as const
