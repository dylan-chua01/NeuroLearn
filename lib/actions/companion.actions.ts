'use server';

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "../supabase";
import { fetchCallTranscript } from "../vapi";

export const createCompanion = async (formData: CreateCompanion) => {
  const { userId: author } = await auth();
  if (!author) throw new Error('User not authenticated');
  
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("companions")
    .insert([{ ...formData, author }])
    .select();

  if (error || !data) throw new Error(error?.message || 'Failed to create a companion');

  return data[0];
};

export const getAllCompanions = async ({ limit = 10, page = 1, subject, topic }: GetAllCompanions) => {
  const { userId } = await auth();
  if (!userId) return []; // Return empty array if not authenticated
  
  const supabase = createSupabaseClient();

  let query = supabase.from('companions').select().eq('author', userId); // Only get user's companions

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

  return companions || [];
}

export const getCompanion = async (id: string) => {
  const { userId } = await auth();
  if (!userId) return null;
  
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from('companions')
    .select()
    .eq('id', id)
    .eq('author', userId); // Only get if user owns it

  if(error) {
    console.log(error);
    return null;
  }

  return data?.[0] || null;
}

// NEW: Create session history row when call starts (without call_id)
export const createSessionHistory = async (companionId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error('User not authenticated');
  
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('session_history')
    .insert({
      companion_id: companionId,
      user_id: userId,
      // call_id will be null initially
    })
    .select()
    .single();

  if(error) throw new Error(error.message);

  return data; // Return the created row with its ID
}

// UPDATED: Update existing session with call_id
export const updateSessionHistory = async (sessionId: string, callId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error('User not authenticated');
  
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('session_history')
    .update({ call_id: callId })
    .eq('id', sessionId)
    .eq('user_id', userId) // Security check
    .select()
    .single();

  if(error) throw new Error(error.message);

  return data;
}

// DEPRECATED: Keep for backward compatibility but rename
export const addToSessionHistory = async (companionId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error('User not authenticated');
  
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from('session_history').insert({
    companion_id: companionId,
    user_id: userId,
    
  })

  if(error) throw new Error(error.message);

  return data;
}

export const getRecentSessions = async (limit = 10) => {
  const { userId } = await auth();
  if (!userId) return []; // Return empty array if not authenticated
  
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('session_history')
    .select(`companions:companion_id (*)`)
    .eq('user_id', userId) // Only get current user's sessions
    .order('created_at', { ascending: false })
    .limit(limit)

  if(error) throw new Error(error.message);

  return data?.map(({companions}) => companions).filter(Boolean) || [];
}

export const getUserSessions = async (userId: string, limit = 10) => {
  const { userId: currentUserId } = await auth();
  if (!currentUserId || currentUserId !== userId) return []; // Security check
  
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from('session_history').select(`companions:companion_id (*)`)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(limit)

  if(error) throw new Error(error.message);

  return data?.map(({companions}) => companions).filter(Boolean) || [];
}

export const getUserCompanions = async (userId: string) => {
  const { userId: currentUserId } = await auth();
  if (!currentUserId || currentUserId !== userId) return []; // Security check
  
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
  .from('companions')
  .select()
  .eq('author', userId)

  if(error) throw new Error(error.message);

  return data || [];
}

export const newCompanionPermissions = async () => {
  const { userId, has } = await auth();
  if (!userId) return false;
  
  const supabase = createSupabaseClient();

  let limit = 0;

  if(has({ plan: 'pro_learner' })) {
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

    const companionCount = data?.length || 0;

    if(companionCount >= limit) {
      return false
    } else {
      return true;
    }
}

export const deleteCompanion = async (id: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error('User not authenticated');
  
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
  if (!userId) return false;
  
  const supabase = createSupabaseClient();

  if (has({ plan: 'pro_learner' }) || has({ plan: 'core_learner' })) {
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


export async function getSessionsWithCallIds() {
  try {
    const { userId } = await auth();
    if (!userId) return [];
    
    const supabase = createSupabaseClient();

    const { data: sessions, error } = await supabase
      .from('session_history')
      .select(`
        id,
        call_id,
        created_at,
        companions:companion_id (
          name,
          subject
        )
      `)
      .eq('user_id', userId)
      .not('call_id', 'is', null) // Only get sessions that have a call ID
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching sessions with call IDs:', error);
      throw new Error('Failed to fetch session transcripts');
    }

    return (sessions || []).map(session => ({
      id: session.id,
      callId: session.call_id,
      companionName: session.companions?.name || 'Unknown Companion',
      companionSubject: session.companions?.subject || 'general',
      createdAt: session.created_at
    }));
  } catch (error) {
    console.error('Error fetching sessions with call IDs:', error);
    throw new Error('Failed to fetch session transcripts');
  }
}

export async function getCallTranscript(callId: string) {
  try {
    const transcript = await fetchCallTranscript(callId);
    return {
      success: true,
      data: transcript
    };
  } catch (error) {
    console.error('Error fetching call transcript:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transcript'
    };
  }
}


export const canViewTranscripts = async () => {
  const { userId, has } = await auth();
  if (!userId) return false;

  return has({ plan: 'pro_learner' });
};