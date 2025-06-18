import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "../supabase";
import { generateQuestionsFromTranscript } from "../gemini";
import { getCallTranscript } from "./companion.actions";

export interface QuizAnswer {
  questionIndex: number;
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  timeSpent?: number;
}

export interface QuizSubmission {
  quizId: string;
  answers: QuizAnswer[];
  totalTimeSpent: number;
  startedAt: Date;
  completedAt: Date;
}

// Define types for Supabase relationship data
interface CompanionData {
  subject?: string;
  name?: string;
}

interface QuizData {
  subject?: string;
  quiz_title?: string;
  questions?: unknown;
}

interface QuizResultWithRelations {
  score: number;
  total_questions: number;
  percentage: number;
  time_taken: number;
  completed_at: string;
  companions: CompanionData | CompanionData[] | null;
  quizzes: QuizData | QuizData[] | null;
}

interface SessionWithCompanions {
  call_id: string;
  companion_id: string;
  companions: CompanionData | CompanionData[] | null;
}

export const submitQuizResults = async (submission: QuizSubmission) => {
    try {
      // 1. Authentication
      const { userId } = await auth();
      if (!userId) throw new Error('User not authenticated');
  
      // 2. Data Validation
      if (!submission.quizId) throw new Error('Missing quiz ID');
      if (!submission.answers?.length) throw new Error('No answers provided');
      if (!submission.completedAt) throw new Error('Missing completion time');
  
      // 3. Create Supabase client
      const supabase = createSupabaseClient();
  
      // 4. Verify quiz ownership
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('id, session_id, companion_id')
        .eq('id', submission.quizId)
        .eq('user_id', userId)
        .single();
  
      if (quizError) throw new Error(`Quiz verification failed: ${quizError.message}`);
      if (!quiz) throw new Error('Quiz not found');
  
      // 5. Calculate results
      const correctAnswers = submission.answers.filter(a => a.isCorrect);
      const percentage = (correctAnswers.length / submission.answers.length) * 100;
  
      // ✅ 6. Safely convert dates
      const completedAt = new Date(submission.completedAt);
  
      // 7. Prepare data
      const resultData = {
        user_id: userId,
        quiz_id: submission.quizId,
        session_id: quiz.session_id,
        companion_id: quiz.companion_id,
        answers: submission.answers,
        score: correctAnswers.length,
        total_questions: submission.answers.length,
        percentage: Math.round(percentage * 100) / 100,
        time_taken: submission.totalTimeSpent || 0,
        completed_at: completedAt.toISOString()
      };
  
      // 8. Insert result
      const { data: result, error: insertError } = await supabase
        .from('quiz_results')
        .insert(resultData)
        .select()
        .single();
  
      if (insertError) throw new Error(`Insert failed: ${insertError.message}`);
  
      return result;
  
    } catch (error) {
      console.error('Quiz submission error:', error);
      throw error instanceof Error ? error : new Error('Failed to submit quiz');
    }
  };
  

export const getUserQuizResults = async (limit?: number) => {
  const { userId } = await auth();
  if (!userId) throw new Error('User not authenticated');
  
  const supabase = createSupabaseClient();

  let query = supabase
    .from('quiz_results')
    .select(`
      *,
      quizzes:quiz_id(quiz_title, subject),
      companions:companion_id(name, subject),
      session_history:session_id(created_at)
    `)
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: results, error } = await query;

  if (error) throw new Error(error.message);
  return results || [];
};

export const getQuizResultsForSession = async (sessionId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error('User not authenticated');
  
  const supabase = createSupabaseClient();

  const { data: results, error } = await supabase
    .from('quiz_results')
    .select(`
      *,
      quizzes:quiz_id(quiz_title, subject, questions)
    `)
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) throw new Error(error.message);
  return results || [];
};

export const getLearningProgress = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error('User not authenticated');
  
  const supabase = createSupabaseClient();

  // Get all quiz results with related data
  const { data: results, error } = await supabase
    .from('quiz_results')
    .select(`
      score,
      total_questions,
      percentage,
      time_taken,
      completed_at,
      companions:companion_id(subject),
      quizzes:quiz_id(subject)
    `)
    .eq('user_id', userId)
    .order('completed_at', { ascending: true });

  if (error) throw new Error(error.message);

  if (!results || results.length === 0) {
    return {
      totalQuizzes: 0,
      averageScore: 0,
      totalTimeSpent: 0,
      subjectBreakdown: {},
      progressTrend: 'stable' as const,
      recentActivity: {
        quizzesThisWeek: 0,
        averageScoreThisWeek: 0
      }
    };
  }

  // Type the results properly
  const typedResults = results as QuizResultWithRelations[];

  // Calculate statistics
  const totalQuizzes = typedResults.length;
  const averageScore = typedResults.reduce((sum, r) => sum + r.percentage, 0) / totalQuizzes;
  const totalTimeSpent = typedResults.reduce((sum, r) => sum + (r.time_taken || 0), 0);

  // Group by subject - Fix the type issue
  const subjectBreakdown = typedResults.reduce((acc, result) => {
    // Handle the nested relationship data properly
    const companionSubject = Array.isArray(result.companions) 
      ? result.companions[0]?.subject 
      : result.companions?.subject;
    
    const quizSubject = Array.isArray(result.quizzes) 
      ? result.quizzes[0]?.subject 
      : result.quizzes?.subject;
    
    const subject = companionSubject || quizSubject || 'General';
    
    if (!acc[subject]) {
      acc[subject] = { count: 0, totalScore: 0, averageScore: 0 };
    }
    acc[subject].count++;
    acc[subject].totalScore += result.percentage;
    acc[subject].averageScore = acc[subject].totalScore / acc[subject].count;
    return acc;
  }, {} as Record<string, { count: number; totalScore: number; averageScore: number }>);

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentResults = typedResults.filter(r => 
    new Date(r.completed_at) > sevenDaysAgo
  );

  // Calculate progress trend
  let progressTrend: 'improving' | 'declining' | 'stable' = 'stable';
  if (typedResults.length >= 4) {
    const midpoint = Math.floor(typedResults.length / 2);
    const firstHalf = typedResults.slice(0, midpoint);
    const secondHalf = typedResults.slice(midpoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, r) => sum + r.percentage, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, r) => sum + r.percentage, 0) / secondHalf.length;
    
    if (secondHalfAvg > firstHalfAvg + 5) progressTrend = 'improving';
    else if (secondHalfAvg < firstHalfAvg - 5) progressTrend = 'declining';
  }

  return {
    totalQuizzes,
    averageScore: Math.round(averageScore * 100) / 100,
    totalTimeSpent,
    subjectBreakdown,
    progressTrend,
    recentActivity: {
      quizzesThisWeek: recentResults.length,
      averageScoreThisWeek: recentResults.length > 0 
        ? Math.round((recentResults.reduce((sum, r) => sum + r.percentage, 0) / recentResults.length) * 100) / 100
        : 0
    }
  };
};

// 3. Update your existing quiz.actions.ts to include result tracking
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

  // Type the session data properly
  const typedSession = session as SessionWithCompanions;

  // Get transcript
  const { data: transcriptData } = await getCallTranscript(typedSession.call_id);
  const transcript = transcriptData?.transcript;
  if (!transcript) throw new Error('No transcript available');

  // Generate questions
  const questions = await generateQuestionsFromTranscript(transcript);

  // Extract companion data safely
  const companionData = Array.isArray(typedSession.companions) 
    ? typedSession.companions[0]
    : typedSession.companions;

  // Store quiz with metadata
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      session_id: sessionId,
      call_id: typedSession.call_id,
      questions,
      user_id: userId,
      companion_id: typedSession.companion_id,
      subject: companionData?.subject || 'general',
      quiz_title: `Quiz on ${companionData?.name || 'Session'}`
    })
    .select()
    .single();

  if (quizError) throw new Error(quizError.message);

  return {
    ...quiz,
    subject: companionData?.subject,
    companionName: companionData?.name
  };
};