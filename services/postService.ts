import { supabase } from "../lib/supabase";
import { Post } from "../types";

export const fetchPosts = async (userId: string) => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .order("scheduled_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const createPost = async (post: Omit<Post, "id"> & { user_id: string }) => {
  const { data, error } = await supabase.from("posts").insert([post]).select().single();
  if (error) throw error;
  return data;
};

export const updatePost = async (id: string, updates: Partial<Post>) => {
  const { data, error } = await supabase.from("posts").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
};

export const deletePost = async (id: string) => {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
};

// ユーザーのOpenAI APIキーを取得
export const fetchOpenAIApiKey = async (userId: string): Promise<string | null> => {
  const { data, error } = await supabase.from("users").select("openai_api_key").eq("id", userId).single();
  if (error) throw error;
  return data?.openai_api_key || null;
};

// ユーザーのOpenAI APIキーを保存
export const saveOpenAIApiKey = async (userId: string, apiKey: string): Promise<void> => {
  const { error } = await supabase.from("users").update({ openai_api_key: apiKey }).eq("id", userId);
  if (error) throw error;
};
