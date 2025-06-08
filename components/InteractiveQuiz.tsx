'use client';

import { useState } from 'react';
import { BookOpenText, Sparkles, Trophy, Clock, Lightbulb, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
};

type Quiz = {
  id: string;
  companionName?: string;
  questions: QuizQuestion[];
};

type InteractiveQuizClientProps = {
  quiz: Quiz;
};

export default function InteractiveQuizClient({ quiz }: InteractiveQuizClientProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizStartTime] = useState<Date>(new Date()); // Track quiz start time

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (isSubmitted) return;
    
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);
    setShowResults(true);
  
    const completedAt = new Date();
    const totalTimeSpent = completedAt.getTime() - quizStartTime.getTime();
  
    // Updated submission payload to include explanations
    const submissionPayload = {
      quizId: quiz.id, 
      answers: quiz.questions.map((q, index) => ({
        questionIndex: index,
        question: q.question,
        selectedAnswer: q.options[selectedAnswers[index]] || '',
        correctAnswer: q.options[q.correctAnswer],
        isCorrect: selectedAnswers[index] === q.correctAnswer,
        explanation: q.explanation || '', // Include explanation here
        timeSpent: 0 // Could track per-question time if needed
      })),
      totalTimeSpent,
      startedAt: quizStartTime,
      completedAt
    };
  
    try {
      const response = await fetch('/api/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionPayload)
      });
  
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      console.log('Quiz submitted successfully:', data.result);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      // You might want to show an error message to the user here
      alert('Failed to submit quiz. Please try again.');
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setShowResults(false);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return "Outstanding! 🎉";
    if (percentage >= 80) return "Great job! 👏";
    if (percentage >= 70) return "Well done! 👍";
    if (percentage >= 60) return "Good effort! 💪";
    return "Keep practicing! 📚";
  };

  const score = calculateScore();
  const percentage = Math.round((score / quiz.questions.length) * 100);
  const allQuestionsAnswered = quiz.questions.every((_, index) => selectedAnswers[index] !== undefined);

  if (showResults) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Results Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full p-4 mb-6">
            <Trophy className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Quiz Results</h1>
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(percentage)}`}>
              {percentage}%
            </div>
            <div className="text-xl text-gray-600 mb-2">
              {score} out of {quiz.questions.length} correct
            </div>
            <div className="text-lg font-medium text-gray-800">
              {getScoreMessage(percentage)}
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="space-y-6 mb-8">
          {quiz.questions.map((question, qIndex) => {
            const userAnswer = selectedAnswers[qIndex];
            const isCorrect = userAnswer === question.correctAnswer;
            
            return (
              <div key={qIndex} className="bg-white shadow-sm border border-gray-200 p-6 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 rounded-full w-8 h-8 flex items-center justify-center font-medium ${
                    isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 mb-4 text-lg">
                      {question.question}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {question.options.map((choice, idx) => {
                        const isUserAnswer = idx === userAnswer;
                        const isCorrectAnswer = idx === question.correctAnswer;
                        
                        let className = "p-3 rounded-lg border ";
                        if (isCorrectAnswer) {
                          className += "border-green-500 bg-green-50 ";
                        } else if (isUserAnswer && !isCorrectAnswer) {
                          className += "border-red-500 bg-red-50 ";
                        } else {
                          className += "border-gray-200 bg-gray-50 ";
                        }
                        
                        return (
                          <div key={idx} className={className}>
                            <div className="flex items-start space-x-2">
                              <span className={`font-medium ${
                                isCorrectAnswer ? 'text-green-600' : 
                                isUserAnswer ? 'text-red-600' : 'text-gray-500'
                              }`}>
                                {String.fromCharCode(65 + idx)}.
                              </span>
                              <span className="text-gray-700 flex-1">{choice}</span>
                              {isCorrectAnswer && <CheckCircle className="h-4 w-4 text-green-600" />}
                              {isUserAnswer && !isCorrectAnswer && <XCircle className="h-4 w-4 text-red-600" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Enhanced Explanation Display */}
                    {question.explanation && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-blue-800 mb-2">
                          <Lightbulb className="h-5 w-5" />
                          <span className="font-semibold">Explanation</span>
                        </div>
                        <p className="text-blue-700 leading-relaxed">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Action Buttons */}
        <div className="text-center space-y-4">
          <button
            onClick={handleRestart}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg mr-4"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Take Quiz Again
          </button>
          
          {/* Optional: Add a button to view saved results */}
          <button
            onClick={() => window.location.href = '/my-journey'}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Trophy className="h-5 w-5 mr-2" />
            View All Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Quiz Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full p-3 mb-4">
          <Sparkles className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Interactive Quiz
        </h1>
        {quiz.companionName && (
          <p className="text-xl text-gray-600">
            Based on your session with <span className="font-semibold text-emerald-600">{quiz.companionName}</span>
          </p>
        )}
        
        {/* Quiz Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-center space-x-2">
              <BookOpenText className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">{quiz.questions.length} Questions</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">{Math.ceil(quiz.questions.length * 0.5)} min</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 max-w-md mx-auto">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Object.keys(selectedAnswers).length}/{quiz.questions.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(Object.keys(selectedAnswers).length / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6 mb-8">
        {quiz.questions.map((question, qIndex) => (
          <div 
            key={qIndex} 
            className="bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6 rounded-xl"
          >
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 rounded-full w-8 h-8 flex items-center justify-center font-medium ${
                selectedAnswers[qIndex] !== undefined 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {qIndex + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800 mb-4 text-lg">
                  {question.question}
                </p>
                
                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {question.options.map((choice, idx) => {
                    const isSelected = selectedAnswers[qIndex] === idx;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSelect(qIndex, idx)}
                        disabled={isSubmitted}
                        className={`p-3 rounded-lg border cursor-pointer transition-all text-left hover:shadow-sm ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-50 shadow-sm' 
                            : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                        } ${isSubmitted ? 'cursor-not-allowed opacity-75' : ''}`}
                      >
                        <div className="flex items-start space-x-2">
                          <span className={`font-medium ${
                            isSelected ? 'text-emerald-600' : 'text-gray-500'
                          }`}>
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <span className="text-gray-700">{choice}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="text-center">
        <button
          onClick={handleSubmit}
          disabled={!allQuestionsAnswered || isSubmitted}
          className={`px-8 py-4 rounded-lg font-medium text-lg transition-all duration-200 ${
            allQuestionsAnswered && !isSubmitted
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md hover:shadow-lg transform hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {!allQuestionsAnswered 
            ? `Answer ${quiz.questions.length - Object.keys(selectedAnswers).length} more question${quiz.questions.length - Object.keys(selectedAnswers).length !== 1 ? 's' : ''}` 
            : isSubmitted 
              ? 'Submitted!' 
              : 'Submit Quiz'
          }
        </button>
        
        {!allQuestionsAnswered && (
          <p className="mt-2 text-sm text-gray-600">
            Please answer all questions before submitting
          </p>
        )}
      </div>
    </div>
  );
}