/**
 * Hand-authored to match supabase/migrations/0001_init.sql, in the shape the
 * Supabase client's generics expect (Row/Insert/Update/Relationships per table).
 * If you adopt the Supabase CLI, regenerate with:
 *   supabase gen types typescript --linked > src/lib/db/database.types.ts
 */

export type Rarity = 3 | 4 | 5;

type NoRelationships = [];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string; created_at: string };
        Insert: { id: string; username: string; created_at?: string };
        Update: { username?: string };
        Relationships: NoRelationships;
      };
      currencies: {
        Row: { user_id: string; gems: number; gold: number; xp_items: number };
        Insert: { user_id: string; gems?: number; gold?: number; xp_items?: number };
        Update: { gems?: number; gold?: number; xp_items?: number };
        Relationships: NoRelationships;
      };
      owned_characters: {
        Row: {
          id: string;
          user_id: string;
          character_key: string;
          level: number;
          exp: number;
          star: number;
          dupe_shards: number;
          acquired_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          character_key: string;
          level?: number;
          exp?: number;
          star?: number;
          dupe_shards?: number;
          acquired_at?: string;
        };
        Update: { level?: number; exp?: number; star?: number; dupe_shards?: number };
        Relationships: NoRelationships;
      };
      stage_progress: {
        Row: {
          user_id: string;
          stage_id: string;
          cleared: boolean;
          stars: number;
          best_rounds: number | null;
        };
        Insert: {
          user_id: string;
          stage_id: string;
          cleared?: boolean;
          stars?: number;
          best_rounds?: number | null;
        };
        Update: { cleared?: boolean; stars?: number; best_rounds?: number | null };
        Relationships: NoRelationships;
      };
      endless_runs: {
        Row: { user_id: string; best_wave: number; updated_at: string };
        Insert: { user_id: string; best_wave?: number; updated_at?: string };
        Update: { best_wave?: number; updated_at?: string };
        Relationships: NoRelationships;
      };
      gacha_state: {
        Row: {
          user_id: string;
          pulls_since_5star: number;
          pulls_since_4star: number;
          guaranteed_featured: boolean;
          total_pulls: number;
        };
        Insert: {
          user_id: string;
          pulls_since_5star?: number;
          pulls_since_4star?: number;
          guaranteed_featured?: boolean;
          total_pulls?: number;
        };
        Update: {
          pulls_since_5star?: number;
          pulls_since_4star?: number;
          guaranteed_featured?: boolean;
          total_pulls?: number;
        };
        Relationships: NoRelationships;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
