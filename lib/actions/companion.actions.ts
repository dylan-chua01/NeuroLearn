'use server';

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "../supabase";


export const createCompanion = async (formData: CreateCompanion) => {
  const { userId: author } = await auth(); // no need for `await` here
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("companions")
    .insert([{ ...formData, author }])
    .select();

  if (error || !data) throw new Error(error?.message || 'Failed to create a companion');

  return data[0];
};

export const getAllCompanions = async ({ limit = 10, page = 1, subject, topic }: GetAllCompanions) => {
  const supabase = createSupabaseClient();

  let query = supabase.from('companions').select();

  if(subject && topic) {
    query = query.ilike('subject', `%${subject}`).or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`)
  } else if(subject) {
    query = query.ilike('subject', `%${subject}%`)
  } else if(topic) {
    query = query.or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`)
  }

  query = query.range((page - 1) * limit, page * limit - 1)

  const { data: companions, error } = await query;

  if(error) throw new Error(error.message);

  return companions;
}

export const getCompanion = async (id: string) => {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase.from('companions').select().eq('id', id);

  if(error) return console.log(error);

  return data[0];
}

export const addToSessionHistory = async (companionId: string) => {
  const { userId } = await auth();
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from('session_history').insert({
    companion_id: companionId,
    user_id: userId,
  })

  if(error) throw new Error(error.message);

  return data;

}

export const getRecentSessions = async (limit = 10) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from('session_history').select(`companions:companion_id (*)`).order('created_at', { ascending: false })
  .limit(limit)

  if(error) throw new Error(error.message);

  return data.map(({companions}) => companions)
}

export const getUserSessions = async (userId: string, limit = 10) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from('session_history').select(`companions:companion_id (*)`)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(limit)

  if(error) throw new Error(error.message);

  return data.map(({companions}) => companions)
}

export const getUserCompanions = async (userId: string) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
  .from('companions')
  .select()
  .eq('author', userId)

  if(error) throw new Error(error.message);

  return data;
}

export const newCompanionPermissions = async () => {
  const { userId, has } = await auth();
  const supabase = createSupabaseClient();

  let limit = 0;

  if(has({ plan: 'pro' })) {
    return true;
  } else if(has({ feature: "3_companion_limit"})) {
    limit = 3;
  } else if(has({ feature: "10_companion_limit" })) {
    limit = 10;
  }

  const { data, error } = await supabase
    .from('companions')
    .select('id', { count: 'exact' })
    .eq('author', userId)

    if(error) throw new Error(error.message);

    const companionCount = data?.length;

    if(companionCount >= limit) {
      return false
    } else {
      return true;
    }
}

export const deleteCompanion = async (id: string) => {
  const { userId } = await auth();
  const supabase = createSupabaseClient();

  // First, check if the current user is the author of the companion
  const { data: companion, error: getError } = await supabase
    .from("companions")
    .select("author")
    .eq("id", id)
    .single();

  if (getError) throw new Error(getError.message);
  if (!companion || companion.author !== userId)
    throw new Error("You are not authorized to delete this companion");

  const { error: deleteError } = await supabase
    .from("companions")
    .delete()
    .eq("id", id);

  if (deleteError) throw new Error(deleteError.message);

  return true;
};

export const newActiveCompanionPermissions = async () => {
  const { userId, has } = await auth();
  const supabase = createSupabaseClient();

  // If on Pro or Core, allow unlimited
  if (has({ plan: 'pro' }) || has({ plan: 'core_learner' })) {
    return true;
  }

  // For Basic, enforce 10 companions/month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error } = await supabase
    .from('companions')
    .select('id', { count: 'exact' })
    .eq('author', userId)
    .gte('created_at', startOfMonth);

  if (error) throw new Error(error.message);

  return (count ?? 0) < 10;
};