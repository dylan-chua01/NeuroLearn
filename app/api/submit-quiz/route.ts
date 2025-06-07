// app/api/submit-quiz/route.ts
import { submitQuizResults } from '@/lib/actions/quiz-results.actions';
import { NextResponse } from 'next/server';


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await submitQuizResults(body);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('[SubmitQuiz API Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}