import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "../supabase";
import { getCallTranscript } from "./companion.actions";
import { generateQuestionsFromTranscript } from "../gemini";

export const generateQuizFromSession = async (sessionId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error('User not authenticated');
  
  const supabase = createSupabaseClient();

  // Get session with companion details
  const { data: session, error: sessionError } = await supabase
    .from('session_history')
    .select(`
      call_id, 
      companion_id,
      companions:companion_id(name, subject)
    `)
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (sessionError || !session) {
    throw new Error(sessionError?.message || 'Session not found');
  }

  // Get transcript
  const { data: transcriptData } = await getCallTranscript(session.call_id);
  const transcript = transcriptData?.transcript;
  if (!transcript) throw new Error('No transcript available');

  // Generate questions
  const questions = await generateQuestionsFromTranscript(transcript);

  // ✅ Safely extract companion data (handle array or single object)
  const companion = Array.isArray(session.companions)
    ? session.companions[0]
    : session.companions;

  // Store quiz with metadata
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      session_id: sessionId,
      call_id: session.call_id,
      questions,
      user_id: userId,
      companion_id: session.companion_id,
      subject: companion?.subject || 'general',
      quiz_title: `Quiz on ${companion?.name || 'Session'}`
    })
    .select()
    .single();

  if (quizError) throw new Error(quizError.message);

  return {
    ...quiz,
    subject: companion?.subject,
    companionName: companion?.name
  };
};
