'use server';

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "../supabase";
import { fetchCallTranscript } from "../vapi";
import { createClient } from "@supabase/supabase-js";

interface CreateCompanion {
  name: string;
  subject: string;
  topic: string;
  style: string;
  voice: string;
  language: string;
  userPlan?: string;
}

interface GetAllCompanions {
  limit?: number;
  page?: number;
  subject?: string;
  topic?: string;
}

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
  if (!userId) return [];
  
  const supabase = createSupabaseClient();

  let query = supabase.from('companions').select().eq('author', userId);

  if(subject && topic) {
    query = query.ilike('subject', `%${subject}`).or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);
  } else if(subject) {
    query = query.ilike('subject', `%${subject}%`);
  } else if(topic) {
    query = query.or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);
  }

  query = query.range((page - 1) * limit, page * limit - 1);

  const { data: companions, error } = await query;

  if(error) throw new Error(error.message);

  return companions || [];
};

export const getCompanion = async (id: string) => {
  const { userId } = await auth();
  if (!userId) return null;
  
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from('companions')
    .select()
    .eq('id', id)
    .eq('author', userId);

  if(error) return null;

  return data?.[0] || null;
};

export const createSessionHistory = async (companionId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error('User not authenticated');
  
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('session_history')
    .insert({
      companion_id: companionId,
      user_id: userId,
    })
    .select()
    .single();

  if(error) throw new Error(error.message);

  return data;
};

export const updateSessionHistory = async (sessionId: string, callId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error('User not authenticated');
  
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('session_history')
    .update({ call_id: callId })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select()
    .single();

  if(error) throw new Error(error.message);

  return data;
};

export const getRecentSessions = async (limit = 10) => {
  const { userId } = await auth();
  if (!userId) return [];
  
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('session_history')
    .select(`companions:companion_id (*)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if(error) throw new Error(error.message);

  return data?.map(({companions}) => companions).filter(Boolean) || [];
};

export const getUserSessions = async (userId: string, limit = 10) => {
  const { userId: currentUserId } = await auth();
  if (!currentUserId || currentUserId !== userId) return [];
  
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('session_history')
    .select(`companions:companion_id (*)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if(error) throw new Error(error.message);

  return data?.map(({companions}) => companions).filter(Boolean) || [];
};

export const getUserCompanions = async (userId: string) => {
  const { userId: currentUserId } = await auth();
  if (!currentUserId || currentUserId !== userId) return [];
  
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('companions')
    .select()
    .eq('author', userId);

  if(error) throw new Error(error.message);

  return data || [];
};

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
    .eq('author', userId);

  if(error) throw new Error(error.message);

  const companionCount = data?.length || 0;

  return companionCount < limit;
};

export const deleteCompanion = async (id: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error('User not authenticated');
  
  const supabase = createSupabaseClient();

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

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error } = await supabase
    .from('companions')
    .select('id', { count: 'exact' })
    .eq('author', userId)
    .gte('created_at', startOfMonth);

  if (error) throw new Error(error.message);

  return (count ?? 0) < 3;
};

interface SessionWithCallId {
  id: string;
  call_id: string;
  created_at: string;
  companions: {
    name: string;
    subject: string;
  } | null;
}

export async function getSessionsWithCallIds() {
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
    .not('call_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20)
    .returns<SessionWithCallId[]>();

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

const createServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

interface PDFExtractionResult {
  url: string;
  filename: string;
  content: string;
  path: string;
  size: number;
  uploadedAt: string;
}

const extractTextFromPDF = async (fileBuffer: ArrayBuffer): Promise<string> => {
  const pdf = (await import('pdf-parse')).default;
  const data = await pdf(Buffer.from(fileBuffer));
  return data.text.trim();
};

export const uploadPDF = async (file: File, companionId?: string): Promise<PDFExtractionResult> => {
  const { userId } = await auth();
  if (!userId) throw new Error('User not authenticated');
  
  const supabaseServiceRole = createServiceRoleClient();
  const supabaseClient = createSupabaseClient();

  if (!file) throw new Error('No file provided');
  if (file.type !== 'application/pdf') throw new Error('Only PDF files are allowed');
  if (file.size > 1 * 1024 * 1024) throw new Error('File size must be less than 1MB');
  if (file.size < 100) throw new Error('File appears to be too small or corrupted');
  
  try {
    const fileBuffer = await file.arrayBuffer();
    const extractedText = await extractTextFromPDF(fileBuffer);
    
    let finalText = extractedText;
    if (extractedText.length > 20000) {
      finalText = extractedText.slice(0, 20000) + '\n\n... [Content truncated for optimal AI processing]';
    }
    
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${userId}/${timestamp}-${sanitizedName}`;

    const { data: uploadData, error: uploadError } = await supabaseServiceRole.storage
      .from('companion-pdfs')
      .upload(filename, fileBuffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600'
      });
    
    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);
    
    const { data: urlData } = supabaseServiceRole.storage
      .from('companion-pdfs')
      .getPublicUrl(uploadData.path);
    
    const result: PDFExtractionResult = {
      url: urlData.publicUrl,
      filename: file.name,
      content: finalText,
      path: uploadData.path,
      size: file.size,
      uploadedAt: new Date().toISOString()
    };
    
    if (companionId) {
      const { error: updateError } = await supabaseClient
        .from('companions')
        .update({
          pdf_url: result.url,
          pdf_name: result.filename,
          pdf_content: result.content,
          has_pdf: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', companionId)
        .eq('author', userId);
      
      if (updateError) {
        await supabaseServiceRole.storage
          .from('companion-pdfs')
          .remove([uploadData.path]);
        throw new Error(`Database update failed: ${updateError.message}`);
      }
    }
    
    return result;
  } catch (error) {
    console.error('PDF processing failed:', error);
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const removePDF = async (companionId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error('User not authenticated');
  
  const supabase = createSupabaseClient();
  const supabaseServiceRole = createServiceRoleClient();
  
  const { data: companion, error: getError } = await supabase
    .from('companions')
    .select('pdf_url, author')
    .eq('id', companionId)
    .single();
    
  if (getError || !companion) throw new Error('Companion not found');
  if (companion.author !== userId) throw new Error('Not authorized');
  
  if (companion.pdf_url) {
    const urlParts = companion.pdf_url.split('/');
    const path = urlParts.slice(-2).join('/');
    await supabaseServiceRole.storage.from('companion-pdfs').remove([path]);
  }
  
  const { error: updateError } = await supabase
    .from('companions')
    .update({
      pdf_url: null,
      pdf_name: null,
      pdf_content: null,
      has_pdf: false
    })
    .eq('id', companionId)
    .eq('author', userId);
    
  if (updateError) throw new Error(updateError.message);
  
  return true;
};

export const createCompanionWithPDF = async (
  formData: CreateCompanion & { pdfFile?: File }
) => {
  const { userId: author } = await auth();
  if (!author) throw new Error('User not authenticated');
  
  const supabaseClient = createSupabaseClient();
  
  try {
    let pdfData: PDFExtractionResult | null = null;
    
    if (formData.pdfFile) {
      pdfData = await uploadPDF(formData.pdfFile);
    }
    
    const companionData = {
      ...formData,
      author,
      pdf_url: pdfData?.url || null,
      pdf_name: pdfData?.filename || null,
      pdf_content: pdfData?.content || null,
      has_pdf: !!pdfData,
      created_at: new Date().toISOString()
    };
    
    const { pdfFile, userPlan, ...cleanCompanionData } = companionData;
    
    const { data, error } = await supabaseClient
      .from("companions")
      .insert([cleanCompanionData])
      .select();

    if (error) {
      if (pdfData?.path) {
        const supabaseServiceRole = createServiceRoleClient();
        await supabaseServiceRole.storage
          .from('companion-pdfs')
          .remove([pdfData.path]);
      }
      throw new Error(`Failed to create companion: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      throw new Error('Failed to create companion: No data returned');
    }
    
    return data[0];
  } catch (error) {
    console.error('Create companion with PDF failed:', error);
    throw error;
  }
};