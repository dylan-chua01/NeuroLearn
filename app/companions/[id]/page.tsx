import CompanionComponent from "@/components/CompanionComponent";
import { getCompanion } from "@/lib/actions/companion.actions";
import { getSubjectColor } from "@/lib/utils";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";

interface CompanionSessionPageProps {
  params: Promise<{ id: string}>;
}

const CompanionSession = async ({ params }: CompanionSessionPageProps) => {
  const { id } = await params;
  const companion = await getCompanion(id);
  const user = await currentUser();

  const { name, subject, title, topic, duration } = companion;

  if(!user) redirect('/sign-in');

  if(!name) redirect('/companions');

  return (
    <main className="min-h-screen">


      {/* Main content card */}
      <div className="container mx-auto px-6 -mt-6 pb-8">
        <article className="bg-white rounded-3xl shadow-2xl border border-emerald-100/50 overflow-hidden backdrop-blur-sm">
          {/* Accent stripe */}
          <div className="h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600"></div>
          
          <div className="p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              {/* Left section - Companion info */}
              <div className="flex items-start gap-6">
                {/* Subject icon with Cathay styling */}
                <div 
                  className="size-20 lg:size-24 flex items-center justify-center rounded-2xl shadow-lg ring-4 ring-white relative overflow-hidden group transition-all duration-300 hover:scale-105"
                  style={{ 
                    background: `linear-gradient(135deg, ${getSubjectColor(subject)}15, ${getSubjectColor(subject)}25)`,
                    borderColor: getSubjectColor(subject) + '30'
                  }}
                >
                  {/* Subtle pattern overlay */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-2 right-2 w-8 h-8 border border-current rounded-full"></div>
                    <div className="absolute bottom-3 left-3 w-4 h-4 bg-current rounded-full"></div>
                  </div>
                  <Image 
                    src={`/icons/${subject}.svg`} 
                    alt={subject} 
                    width={40} 
                    height={40}
                    className="relative z-10 transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                {/* Text content */}
                <div className="flex-1 space-y-4">
                  {/* Name and subject badge */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-4">
                      <h2 className="text-3xl lg:text-4xl font-light text-slate-800 tracking-tight">
                        {name}
                      </h2>
                      <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-700 border border-teal-200/50 shadow-sm">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mr-2"></div>
                        {subject}
                      </div>
                    </div>
                    
                    {/* Topic */}
                    <p className="text-xl text-slate-600 font-light leading-relaxed max-w-2xl">
                      {topic}
                    </p>
                  </div>

                  {/* Additional info for mobile */}
                  <div className="lg:hidden mt-6 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Session Duration</p>
                        <p className="text-2xl font-light text-slate-700">{duration} minutes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right section - Duration (desktop) */}
              <div className="hidden lg:block">
                <div className="text-right">
                  <div className="inline-flex flex-col items-center p-6 bg-gradient-to-br from-slate-50 to-teal-50/50 rounded-2xl border border-teal-100/50 shadow-lg">
                    <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg mb-3">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-500 font-medium mb-1">Duration</p>
                    <p className="text-3xl font-light text-slate-700">{duration}</p>
                    <p className="text-sm text-slate-500">minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Companion component with enhanced styling */}
        <div className="mt-8">
          <CompanionComponent
            {...companion}
            companionId={id}
            userName={user.firstName!}
            userImage={user.imageUrl!}
          />
        </div>
      </div>

      {/* Subtle background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-gradient-to-l from-emerald-100/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-gradient-to-r from-teal-100/20 to-transparent rounded-full blur-3xl"></div>
      </div>
    </main>
  )
}

export default CompanionSession