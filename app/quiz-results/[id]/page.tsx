import { notFound, redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { currentUser } from '@clerk/nextjs/server';

// Define the structure of an answer object
type Answer = {
  questionIndex?: number;
  question?: string;
  selectedAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
  isCorrect: boolean;
};

// Define the structure of the full quiz result
type QuizResult = {
  id: string;
  score: number;
  percentage: number;
  time_taken: number;
  total_questions: number;
  completed_at: string;
  answers: Answer[];
  quizzes: {
    quiz_title: string;
    subject: string;
  };
  companions: {
    name: string;
  };
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  const supabase = createServerComponentClient({ cookies });

  const { data: result, error } = await supabase
    .from('quiz_results')
    .select(
      `
      id,
      score,
      percentage,
      time_taken,
      total_questions,
      completed_at,
      answers,
      quizzes (
        quiz_title,
        subject
      ),
      companions (
        name
      )
    `
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .single<QuizResult>();

  if (!result || error) {
    return notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md mt-10">
      <h1 className="text-3xl font-bold text-purple-800 mb-4">
        Quiz: {result.quizzes.quiz_title}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Subject: {result.quizzes.subject}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            Companion: {result.companions.name}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">
            Score: {result.score}/{result.total_questions} (
            {Math.round(result.percentage)}%)
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Completed on:{' '}
            {new Date(result.completed_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {result.answers && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-purple-800 mb-4">
            Your Answers
          </h2>
          <div className="space-y-4">
            {Array.isArray(result.answers) ? (
              result.answers.map((answer, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">
                      Question {answer.questionIndex ?? index + 1}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        answer.isCorrect
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>

                  {answer.question && (
                    <p className="text-gray-700 mb-3 font-medium">
                      {answer.question}
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-2">
                    {answer.selectedAnswer && (
                      <p className="text-sm">
                        <span className="font-medium text-gray-600">
                          Your Answer:
                        </span>
                        <span
                          className={`ml-1 ${
                            answer.isCorrect
                              ? 'text-green-700'
                              : 'text-red-700'
                          }`}
                        >
                          {answer.selectedAnswer}
                        </span>
                      </p>
                    )}

                    {answer.correctAnswer && (
                      <p className="text-sm">
                        <span className="font-medium text-gray-600">
                          Correct Answer:
                        </span>
                        <span className="text-green-700 ml-1 font-medium">
                          {answer.correctAnswer}
                        </span>
                      </p>
                    )}

                    {answer.explanation && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Explanation:</span>{' '}
                        {answer.explanation}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">
                  Answer details not available in expected format.
                </p>
                <pre className="text-xs text-gray-500 mt-2 overflow-auto">
                  {JSON.stringify(result.answers, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}