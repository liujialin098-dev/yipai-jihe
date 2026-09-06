export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      fashion_topic_impressions: {
        Row: {
          user_id: string;
          topic_key: string;
          content_id: string;
          first_seen_at: string;
        };
        Insert: {
          user_id: string;
          topic_key: string;
          content_id: string;
          first_seen_at?: string;
        };
        Update: {
          user_id?: string;
          topic_key?: string;
          content_id?: string;
          first_seen_at?: string;
        };
        Relationships: [];
      };
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
      outfit_canvases: {
        Row: {
          background_theme: string;
          created_at: string;
          id: string;
          items: Json;
          source_recommendation_id: string | null;
          source_slot: number | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          background_theme?: string;
          created_at?: string;
          id?: string;
          items: Json;
          source_recommendation_id?: string | null;
          source_slot?: number | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          background_theme?: string;
          created_at?: string;
          id?: string;
          items?: Json;
          source_recommendation_id?: string | null;
          source_slot?: number | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      outfit_diary_entries: {
        Row: {
          created_at: string;
          id: string;
          item_ids: string[];
          note: string;
          occasion: string;
          outfit_snapshot: Json;
          source: string;
          source_outfit_slot: number | null;
          source_recommendation_id: string | null;
          title: string;
          updated_at: string;
          user_id: string;
          worn_on: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_ids: string[];
          note?: string;
          occasion: string;
          outfit_snapshot: Json;
          source: string;
          source_outfit_slot?: number | null;
          source_recommendation_id?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
          worn_on: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_ids?: string[];
          note?: string;
          occasion?: string;
          outfit_snapshot?: Json;
          source?: string;
          source_outfit_slot?: number | null;
          source_recommendation_id?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
          worn_on?: string;
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
      fashion_content_reads: {
        Row: {
          content_id: string;
          created_at: string;
          read_at: string;
          user_id: string;
        };
        Insert: {
          content_id: string;
          created_at?: string;
          read_at?: string;
          user_id: string;
        };
        Update: {
          content_id?: string;
          created_at?: string;
          read_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          created_at: string;
          display_name: string;
          onboarding_state: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          avatar_path?: string | null;
          created_at?: string;
          display_name?: string;
          onboarding_state?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          avatar_path?: string | null;
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
          audience: string;
          brand: string | null;
          category: string;
          created_at: string;
          cutout_path: string | null;
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
          audience?: string;
          brand?: string | null;
          category: string;
          created_at?: string;
          cutout_path?: string | null;
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
          audience?: string;
          brand?: string | null;
          category?: string;
          created_at?: string;
          cutout_path?: string | null;
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
          clothing_preference: string;
          created_at: string;
          fashion_last_prompted_at: string | null;
          fashion_personalized: boolean;
          fashion_topics: string[];
          fashion_unread_enabled: boolean;
          preference_focus: string;
          preference_state: string;
          preferred_occasions: string[];
          preferred_styles: string[];
          style_scores: Json;
          updated_at: string;
          user_id: string;
          weather_admin1: string | null;
          weather_city: string | null;
          weather_latitude: number | null;
          weather_longitude: number | null;
          weather_timezone: string | null;
        };
        Insert: {
          clothing_preference?: string;
          created_at?: string;
          fashion_last_prompted_at?: string | null;
          fashion_personalized?: boolean;
          fashion_topics?: string[];
          fashion_unread_enabled?: boolean;
          preference_focus?: string;
          preference_state?: string;
          preferred_occasions?: string[];
          preferred_styles?: string[];
          style_scores?: Json;
          updated_at?: string;
          user_id: string;
          weather_admin1?: string | null;
          weather_city?: string | null;
          weather_latitude?: number | null;
          weather_longitude?: number | null;
          weather_timezone?: string | null;
        };
        Update: {
          clothing_preference?: string;
          created_at?: string;
          fashion_last_prompted_at?: string | null;
          fashion_personalized?: boolean;
          fashion_topics?: string[];
          fashion_unread_enabled?: boolean;
          preference_focus?: string;
          preference_state?: string;
          preferred_occasions?: string[];
          preferred_styles?: string[];
          style_scores?: Json;
          updated_at?: string;
          user_id?: string;
          weather_admin1?: string | null;
          weather_city?: string | null;
          weather_latitude?: number | null;
          weather_longitude?: number | null;
          weather_timezone?: string | null;
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
      record_fashion_impression: {
        Args: { p_topic_key: string; p_content_id: string };
        Returns: undefined;
      };
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
