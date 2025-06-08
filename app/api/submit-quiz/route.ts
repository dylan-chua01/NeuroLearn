// app/api/submit-quiz/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { submitQuizResults } from '@/lib/actions/quiz-results.actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    if (!body.quizId || !body.answers || !Array.isArray(body.answers)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Submit the quiz results using your existing action
    const result = await submitQuizResults({
      quizId: body.quizId,
      answers: body.answers,
      totalTimeSpent: body.totalTimeSpent || 0,
      startedAt: new Date(body.startedAt),
      completedAt: new Date(body.completedAt)
    });

    return NextResponse.json({
      success: true,
      result,
      message: 'Quiz submitted successfully'
    });

  } catch (error) {
    console.error('Quiz submission API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit quiz'
      },
      { status: 500 }
    );
  }
}