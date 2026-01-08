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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alpha_rovers: {
        Row: {
          discovered_at: string
          id: string
          image_url: string | null
          name: string
          token_id: string
          trait_count: number
          traits: Json
        }
        Insert: {
          discovered_at?: string
          id?: string
          image_url?: string | null
          name: string
          token_id: string
          trait_count: number
          traits?: Json
        }
        Update: {
          discovered_at?: string
          id?: string
          image_url?: string | null
          name?: string
          token_id?: string
          trait_count?: number
          traits?: Json
        }
        Relationships: []
      }
      expedition_runs: {
        Row: {
          completed_at: string | null
          expedition_id: string
          id: string
          log_entries: Json
          reward_coins: number | null
          reward_item_id: string | null
          rover_name: string
          rover_rarity_score: number
          rover_token_id: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          expedition_id: string
          id?: string
          log_entries?: Json
          reward_coins?: number | null
          reward_item_id?: string | null
          rover_name: string
          rover_rarity_score?: number
          rover_token_id: string
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          expedition_id?: string
          id?: string
          log_entries?: Json
          reward_coins?: number | null
          reward_item_id?: string | null
          rover_name?: string
          rover_rarity_score?: number
          rover_token_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedition_runs_expedition_id_fkey"
            columns: ["expedition_id"]
            isOneToOne: false
            referencedRelation: "expeditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedition_runs_reward_item_id_fkey"
            columns: ["reward_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      expeditions: {
        Row: {
          coin_reward_max: number
          coin_reward_min: number
          created_at: string
          description: string | null
          difficulty: string
          duration_minutes: number
          id: string
          name: string
          required_traits: string[] | null
          reward_item_pool: string[] | null
        }
        Insert: {
          coin_reward_max?: number
          coin_reward_min?: number
          created_at?: string
          description?: string | null
          difficulty: string
          duration_minutes?: number
          id?: string
          name: string
          required_traits?: string[] | null
          reward_item_pool?: string[] | null
        }
        Update: {
          coin_reward_max?: number
          coin_reward_min?: number
          created_at?: string
          description?: string | null
          difficulty?: string
          duration_minutes?: number
          id?: string
          name?: string
          required_traits?: string[] | null
          reward_item_pool?: string[] | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          acquired_at: string
          id: string
          item_id: string
          quantity: number
        }
        Insert: {
          acquired_at?: string
          id?: string
          item_id: string
          quantity?: number
        }
        Update: {
          acquired_at?: string
          id?: string
          item_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          created_at: string
          defense_bonus: number
          description: string | null
          id: string
          image_url: string | null
          item_type: string
          luck_bonus: number
          name: string
          power_bonus: number
          rarity: string
        }
        Insert: {
          created_at?: string
          defense_bonus?: number
          description?: string | null
          id?: string
          image_url?: string | null
          item_type: string
          luck_bonus?: number
          name: string
          power_bonus?: number
          rarity: string
        }
        Update: {
          created_at?: string
          defense_bonus?: number
          description?: string | null
          id?: string
          image_url?: string | null
          item_type?: string
          luck_bonus?: number
          name?: string
          power_bonus?: number
          rarity?: string
        }
        Relationships: []
      }
      rover_equipment: {
        Row: {
          equipped_at: string
          id: string
          item_id: string
          rover_token_id: string
          slot: string
        }
        Insert: {
          equipped_at?: string
          id?: string
          item_id: string
          rover_token_id: string
          slot: string
        }
        Update: {
          equipped_at?: string
          id?: string
          item_id?: string
          rover_token_id?: string
          slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "rover_equipment_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
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
