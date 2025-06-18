import ClientErrorWrapper from '@/components/ClientErrorWrapper';
import InteractiveQuizClient from '@/components/InteractiveQuiz';
import { generateQuizFromSession } from '@/lib/actions/quiz.actions';
import { notFound } from 'next/navigation';


type QuizPageProps = {
  params: {
    sessionId: string;
  };
};


export default async function QuizPage({ params }: QuizPageProps) {
  const { sessionId } = await params;

  if (!sessionId || typeof sessionId !== 'string') {
    notFound();
  }

  try {
    const quiz = await generateQuizFromSession(sessionId);

    if (!quiz || !quiz.questions || !Array.isArray(quiz.questions)) {
      throw new Error('Invalid quiz data format');
    }

    return <InteractiveQuizClient quiz={{ ...quiz, id: quiz.id }} />;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return <ClientErrorWrapper message={message} />;
  }
}