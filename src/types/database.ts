import type { Visibility } from './models';

/**
 * Supabase スキーマに対応する型定義（手書き）。
 * 本番では `supabase gen types typescript` で再生成することを推奨する。
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          default_visibility: Visibility;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          bio?: string | null;
          default_visibility?: Visibility;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          lat: number;
          lng: number;
          place_name: string | null;
          image_path: string;
          blurred_path: string | null;
          visibility: Visibility;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lat: number;
          lng: number;
          place_name?: string | null;
          image_path: string;
          blurred_path?: string | null;
          visibility?: Visibility;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['posts']['Insert']>;
        Relationships: [];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['follows']['Insert']>;
        Relationships: [];
      };
      blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['blocks']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      posts_in_bbox: {
        Args: {
          min_lat: number;
          min_lng: number;
          max_lat: number;
          max_lng: number;
        };
        Returns: {
          id: string;
          user_id: string;
          lat: number;
          lng: number;
          place_name: string | null;
          image_path: string;
          blurred_path: string | null;
          visibility: Visibility;
          created_at: string;
          author_username: string;
          author_avatar_url: string | null;
        }[];
      };
    };
    Enums: {
      visibility: Visibility;
    };
    CompositeTypes: Record<string, never>;
  };
}
