import { generateQuizFromSession } from '@/lib/actions/quiz.actions';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ message: 'Missing sessionId' }, { status: 400 });
  }

  try {
    const quiz = await generateQuizFromSession(sessionId);
    return NextResponse.json(quiz);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
