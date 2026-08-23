export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      daily_recommendations: {
        Row: {
          ai_model: string | null;
          created_at: string;
          generation_ms: number;
          id: string;
          occasion: string;
          outfits: Json;
          recommendation_date: string;
          source: string;
          updated_at: string;
          user_id: string;
          weather: Json;
        };
        Insert: {
          ai_model?: string | null;
          created_at?: string;
          generation_ms: number;
          id?: string;
          occasion: string;
          outfits: Json;
          recommendation_date: string;
          source: string;
          updated_at?: string;
          user_id: string;
          weather: Json;
        };
        Update: {
          ai_model?: string | null;
          created_at?: string;
          generation_ms?: number;
          id?: string;
          occasion?: string;
          outfits?: Json;
          recommendation_date?: string;
          source?: string;
          updated_at?: string;
          user_id?: string;
          weather?: Json;
        };
        Relationships: [];
      };
      outfit_favorites: {
        Row: {
          created_at: string;
          id: string;
          occasion: string;
          outfit: Json;
          source_key: string;
          title: string;
          user_id: string;
          weather: Json;
        };
        Insert: {
          created_at?: string;
          id?: string;
          occasion: string;
          outfit: Json;
          source_key: string;
          title: string;
          user_id: string;
          weather: Json;
        };
        Update: {
          created_at?: string;
          id?: string;
          occasion?: string;
          outfit?: Json;
          source_key?: string;
          title?: string;
          user_id?: string;
          weather?: Json;
        };
        Relationships: [];
      };
      preference_feedback_events: {
        Row: {
          created_at: string;
          event_key: string;
          event_type: string;
          id: string;
          metadata: Json;
          outfit_slot: number | null;
          recommendation_id: string | null;
          style: string | null;
          user_id: string;
          wardrobe_item_id: string | null;
          weight: number;
        };
        Insert: {
          created_at?: string;
          event_key: string;
          event_type: string;
          id?: string;
          metadata?: Json;
          outfit_slot?: number | null;
          recommendation_id?: string | null;
          style?: string | null;
          user_id: string;
          wardrobe_item_id?: string | null;
          weight?: number;
        };
        Update: {
          created_at?: string;
          event_key?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
          outfit_slot?: number | null;
          recommendation_id?: string | null;
          style?: string | null;
          user_id?: string;
          wardrobe_item_id?: string | null;
          weight?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string;
          onboarding_state: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string;
          onboarding_state?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          onboarding_state?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      wardrobe_items: {
        Row: {
          category: string;
          created_at: string;
          demo_key: string | null;
          id: string;
          image_path: string;
          material: string;
          name: string;
          occasions: string[];
          primary_color: string;
          seasons: string[];
          source_ingestion_id: string | null;
          status: string;
          style: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          demo_key?: string | null;
          id?: string;
          image_path: string;
          material: string;
          name: string;
          occasions: string[];
          primary_color: string;
          seasons: string[];
          source_ingestion_id?: string | null;
          status?: string;
          style: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          demo_key?: string | null;
          id?: string;
          image_path?: string;
          material?: string;
          name?: string;
          occasions?: string[];
          primary_color?: string;
          seasons?: string[];
          source_ingestion_id?: string | null;
          status?: string;
          style?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          created_at: string;
          preference_focus: string;
          preference_state: string;
          preferred_occasions: string[];
          preferred_styles: string[];
          style_scores: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          preference_focus?: string;
          preference_state?: string;
          preferred_occasions?: string[];
          preferred_styles?: string[];
          style_scores?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          preference_focus?: string;
          preference_state?: string;
          preferred_occasions?: string[];
          preferred_styles?: string[];
          style_scores?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      wardrobe_ingestions: {
        Row: {
          ai_model: string | null;
          ai_result: Json | null;
          byte_size: number;
          client_request_id: string;
          corrected_fields: string[];
          created_at: string;
          expires_at: string;
          failure_code: string | null;
          id: string;
          image_path: string;
          mime_type: string;
          recognition_ms: number | null;
          status: string;
          updated_at: string;
          user_id: string;
          wardrobe_item_id: string | null;
        };
        Insert: {
          ai_model?: string | null;
          ai_result?: Json | null;
          byte_size: number;
          client_request_id: string;
          corrected_fields?: string[];
          created_at?: string;
          expires_at?: string;
          failure_code?: string | null;
          id?: string;
          image_path: string;
          mime_type: string;
          recognition_ms?: number | null;
          status?: string;
          updated_at?: string;
          user_id: string;
          wardrobe_item_id?: string | null;
        };
        Update: {
          ai_model?: string | null;
          ai_result?: Json | null;
          byte_size?: number;
          client_request_id?: string;
          corrected_fields?: string[];
          created_at?: string;
          expires_at?: string;
          failure_code?: string | null;
          id?: string;
          image_path?: string;
          mime_type?: string;
          recognition_ms?: number | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          wardrobe_item_id?: string | null;
        };
        Relationships: [];
      };
      wardrobe_item_favorites: {
        Row: {
          created_at: string;
          id: string;
          user_id: string;
          wardrobe_item_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          user_id: string;
          wardrobe_item_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          user_id?: string;
          wardrobe_item_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wardrobe_item_favorites_wardrobe_item_id_fkey";
            columns: ["wardrobe_item_id"];
            isOneToOne: false;
            referencedRelation: "wardrobe_items";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
