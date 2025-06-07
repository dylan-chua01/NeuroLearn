import CompanionsList from "@/components/CompanionsList";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { getUserCompanions, getUserSessions } from "@/lib/actions/companion.actions";
import { getUserQuizResults, getLearningProgress } from "@/lib/actions/quiz-results.actions";
import { currentUser } from "@clerk/nextjs/server"
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

const Profile = async () => {
  const user = await currentUser();

  if(!user) redirect('/sign-in');

  const [companions, sessionHistory, quizResults, learningProgress] = await Promise.all([
    getUserCompanions(user.id),
    getUserSessions(user.id),
    getUserQuizResults(10), // Get last 10 quiz results
    getLearningProgress()
  ]);

  return (
    <main className='min-lg:w-3/4 bg-gradient-to-br from-slate-50 to-emerald-50/30 min-h-screen p-6'>
      {/* Header Section with enhanced stats */}
      <section className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8 mb-8">
        <div className="flex justify-between gap-6 max-sm:flex-col items-center">
          <div className="flex gap-6 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full blur-sm opacity-20"></div>
              <Image 
                src={user.imageUrl} 
                alt={user.firstName!} 
                width={120} 
                height={120} 
                className="rounded-full border-4 border-emerald-500 shadow-lg relative z-10"
              />
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="font-bold text-3xl bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-emerald-600 font-medium">
                {user.emailAddresses[0].emailAddress}
              </p>
            </div>
          </div>
          
          {/* Enhanced Stats Cards */}
          <div className="flex gap-4 max-sm:w-full max-sm:justify-center flex-wrap">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-200 min-w-[140px]">
              <div className="flex gap-3 items-center mb-2">
                <div className="bg-white/20 rounded-lg p-2">
                  <Image src="/icons/check.svg" alt="checkmark" width={24} height={24} className="brightness-0 invert" />
                </div>
                <p className="text-3xl font-bold">{sessionHistory.length}</p>
              </div>
              <div className="text-emerald-100 font-medium">Lessons completed</div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-200 min-w-[140px]">
              <div className="flex gap-3 items-center mb-2">
                <div className="bg-white/20 rounded-lg p-2">
                  <Image src="/icons/cap.svg" alt="graduation cap" width={24} height={24} className="brightness-0 invert" />
                </div>
                <p className="text-3xl font-bold">{companions.length}</p>
              </div>
              <div className="text-amber-100 font-medium">Companions created</div>
            </div>

            {/* New Quiz Results Stats */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-200 min-w-[140px]">
              <div className="flex gap-3 items-center mb-2">
                <div className="bg-white/20 rounded-lg p-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-3xl font-bold">{learningProgress.totalQuizzes}</p>
              </div>
              <div className="text-purple-100 font-medium">Quizzes taken</div>
            </div>

            <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-200 min-w-[140px]">
              <div className="flex gap-3 items-center mb-2">
                <div className="bg-white/20 rounded-lg p-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-3xl font-bold">{Math.round(learningProgress.averageScore)}%</p>
              </div>
              <div className="text-teal-100 font-medium">Average score</div>
            </div>
          </div>
        </div>

        {/* Learning Progress Indicator */}
        {learningProgress.totalQuizzes > 0 && (
          <div className="mt-6 pt-6 border-t border-emerald-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-emerald-800">Learning Progress</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                learningProgress.progressTrend === 'improving' 
                  ? 'bg-green-100 text-green-800' 
                  : learningProgress.progressTrend === 'declining'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {learningProgress.progressTrend === 'improving' ? '📈 Improving' : 
                 learningProgress.progressTrend === 'declining' ? '📉 Needs Focus' : 
                 '➡️ Stable'}
              </span>
            </div>
            
            {/* Subject breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(learningProgress.subjectBreakdown).map(([subject, data]) => (
                <div key={subject} className="bg-emerald-50 rounded-lg p-4">
                  <h4 className="font-medium text-emerald-800 capitalize">{subject}</h4>
                  <p className="text-sm text-emerald-600">{data.count} quizzes</p>
                  <p className="text-lg font-bold text-emerald-700">{Math.round(data.averageScore)}% avg</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Accordion Section with Quiz Results */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 overflow-hidden">
        <Accordion type="multiple" className="w-full">
          {/* Recent Quiz Results */}
          {quizResults.length > 0 && (
            <AccordionItem value="quiz-results" className="border-b border-emerald-100">
              <AccordionTrigger className="text-2xl font-bold text-purple-800 hover:text-purple-600 px-8 py-6 hover:bg-purple-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Recent Quiz Results
                  <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium px-3 py-1 rounded-full ml-2">
                    {quizResults.length}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-8 pb-6 bg-gradient-to-r from-purple-50/30 to-transparent">
                <div className="space-y-4">
                {quizResults.map((result) => (
  <Link key={result.id} href={`/quiz-results/${result.id}`}>
    <div className="border border-purple-100 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-purple-800">{result.quizzes?.quiz_title}</h4>
          <p className="text-sm text-purple-600">
            {result.companions?.name} • {result.quizzes?.subject}
          </p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${
            result.percentage >= 80 ? 'text-green-600' :
            result.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {Math.round(result.percentage)}%
          </div>
          <div className="text-sm text-gray-500">
            {result.score}/{result.total_questions} correct
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>{result.time_taken && `${Math.round(result.time_taken / 60)} mins`}</span>
        <span>{new Date(result.completed_at).toLocaleDateString()}</span>
      </div>
    </div>
  </Link>
))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem value="recent" className="border-b border-emerald-100">
            <AccordionTrigger className="text-2xl font-bold text-emerald-800 hover:text-emerald-600 px-8 py-6 hover:bg-emerald-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                Recent Sessions
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-8 pb-6 bg-gradient-to-r from-emerald-50/30 to-transparent">
              <CompanionsList title="Recent Sessions" companions={sessionHistory} />
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="companions" className="border-0">
            <AccordionTrigger className="text-2xl font-bold text-emerald-800 hover:text-emerald-600 px-8 py-6 hover:bg-emerald-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                My Companions
                <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium px-3 py-1 rounded-full ml-2">
                  {companions.length}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-8 pb-8 bg-gradient-to-r from-amber-50/30 to-transparent">
              <CompanionsList title="My Companions" companions={companions} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </main>
  )
}


export default Profile