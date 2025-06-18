'use server';

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "../supabase";
import { fetchCallTranscript } from "../vapi";
import { createClient } from "@supabase/supabase-js";

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

const createServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // This should be your service role key
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Server-side PDF processing function
const extractTextFromPDF = async (fileBuffer: ArrayBuffer): Promise<string> => {
  try {
    // Dynamic import to avoid bundling issues
    const pdf = (await import('pdf-parse')).default;
    const data = await pdf(Buffer.from(fileBuffer));
    return data.text.trim();
  } catch (error) {
    console.error('PDF extraction failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to extract text from PDF: ${errorMessage}`);
  }
};

export const uploadPDF = async (file: File, companionId?: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error('User not authenticated');
  
  const supabaseServiceRole = createServiceRoleClient();
  const supabaseClient = createSupabaseClient();

  // Enhanced file validation
  if (!file) {
    console.error('❌ No file provided');
    throw new Error('No file provided');
  }
  
  if (file.type !== 'application/pdf') {
    console.error('❌ Invalid file type:', file.type);
    throw new Error('Only PDF files are allowed');
  }
  
  if (file.size > 1 * 1024 * 1024) { // 1MB limit
    console.error('❌ File too large:', `${(file.size / 1024).toFixed(0)}KB`);
    throw new Error('File size must be less than 1MB');
  }
  
  if (file.size < 100) { // Minimum size check
    console.error('❌ File too small:', file.size);
    throw new Error('File appears to be too small or corrupted');
  }
  
  try {
    // Convert File to ArrayBuffer for server-side processing
    const fileBuffer = await file.arrayBuffer();
    
    // Extract text using PDF.js
    const extractedText = await extractTextFromPDF(fileBuffer);
    
    // Validate and potentially truncate extracted content
    let finalText = extractedText;
    if (extractedText.length > 20000) { 
      console.warn('⚠️ Large text content detected, truncating from', extractedText.length, 'to 20000 characters');
      finalText = extractedText.slice(0, 20000) + '\n\n... [Content truncated for optimal AI processing]';
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${userId}/${timestamp}-${sanitizedName}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseServiceRole.storage
      .from('companion-pdfs')
      .upload(filename, fileBuffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600' // 1 hour cache
      });
    
    if (uploadError) {
      console.error('❌ Storage upload failed:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabaseServiceRole.storage
      .from('companion-pdfs')
      .getPublicUrl(uploadData.path);
    
    
    const result = {
      url: urlData.publicUrl,
      filename: file.name,
      content: finalText,
      path: uploadData.path,
      size: file.size,
      uploadedAt: new Date().toISOString()
    };
    
    // Update companion if ID provided
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
        .eq('author', userId)
        .select();
      
      if (updateError) {
        console.error('❌ Database update failed:', updateError);
        // Clean up uploaded file if database update fails
        await supabaseServiceRole.storage
          .from('companion-pdfs')
          .remove([uploadData.path]);
        throw new Error(`Database update failed: ${updateError.message}`);
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ PDF processing failed:', error);
    console.error('🔍 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      fileName: file.name,
      fileSize: file.size
    });
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const removePDF = async (companionId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error('User not authenticated');
  
  const supabase = createSupabaseClient();
  const supabaseServiceRole = createServiceRoleClient();
  
  // Get current companion data
  const { data: companion, error: getError } = await supabase
    .from('companions')
    .select('pdf_url, author')
    .eq('id', companionId)
    .single();
    
  if (getError || !companion) throw new Error('Companion not found');
  if (companion.author !== userId) throw new Error('Not authorized');
  
  // Remove from storage if exists using service role client
  if (companion.pdf_url) {
    // Extract path from URL
    const urlParts = companion.pdf_url.split('/');
    const path = urlParts.slice(-2).join('/'); // userId/filename
    
    await supabaseServiceRole.storage
      .from('companion-pdfs')
      .remove([path]);
  }
  
  // Update companion record using regular client
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

// Type definition for the extended companion data
interface CompanionDataWithPDF extends Omit<CreateCompanion, 'pdf_url' | 'pdf_name' | 'pdf_content' | 'has_pdf'> {
  author: string;
  pdf_url: string | null;
  pdf_name: string | null;
  pdf_content: string | null;
  has_pdf: boolean;
  created_at: string;
}

export const createCompanionWithPDF = async (
  formData: CreateCompanion & { pdfFile?: File }
) => {
  const { userId: author } = await auth();
  if (!author) throw new Error('User not authenticated');
  
  const supabaseClient = createSupabaseClient();
  
  try {
    let pdfData = null;
    
    // Handle PDF upload if provided
    if (formData.pdfFile) {
      pdfData = await uploadPDF(formData.pdfFile);
    }
    
    // Create companion with PDF data
    const companionData: CompanionDataWithPDF = {
      ...formData,
      author,
      pdf_url: pdfData?.url || null,
      pdf_name: pdfData?.filename || null,
      pdf_content: pdfData?.content || null,
      has_pdf: !!pdfData,
      created_at: new Date().toISOString()
    };
    
    // Remove fields that don't exist in the database schema
    const { pdfFile, ...dataToInsert } = companionData as CompanionDataWithPDF & { pdfFile?: File };
    
    const { data, error } = await supabaseClient
      .from("companions")
      .insert([dataToInsert])
      .select();

    if (error) {
      console.error('❌ Companion creation failed:', error);
      
      // Clean up uploaded file if companion creation fails
      if (pdfData?.path) {
        const supabaseServiceRole = createServiceRoleClient();
        await supabaseServiceRole.storage
          .from('companion-pdfs')
          .remove([pdfData.path]);
      }
      
      throw new Error(`Failed to create companion: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.error('❌ No data returned from companion creation');
      throw new Error('Failed to create companion: No data returned');
    }
    
    return data[0];
    
  } catch (error) {
    console.error('❌ Create companion with PDF failed:', error);
    console.error('🔍 Full error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      formData: {
        name: formData.name,
        subject: formData.subject,
        hasPDF: !!formData.pdfFile
      }
    });
    throw error;
  }
};