import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          avatar_url: string | null;
          openai_api_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          avatar_url?: string | null;
          openai_api_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          avatar_url?: string | null;
          openai_api_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          type: "feed" | "reel";
          status: "draft" | "review" | "approved" | "scheduled" | "posted" | "failed";
          caption: string;
          media_url: string | null;
          scheduled_at: string | null;
          posted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "feed" | "reel";
          status?: "draft" | "review" | "approved" | "scheduled" | "posted" | "failed";
          caption: string;
          media_url?: string | null;
          scheduled_at?: string | null;
          posted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "feed" | "reel";
          status?: "draft" | "review" | "approved" | "scheduled" | "posted" | "failed";
          caption?: string;
          media_url?: string | null;
          scheduled_at?: string | null;
          posted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      instagram_accounts: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          avatar_url: string | null;
          access_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          avatar_url?: string | null;
          access_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          avatar_url?: string | null;
          access_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
