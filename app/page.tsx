export const dynamic = 'force-dynamic';
import CompanionsList from '@/components/CompanionsList';
import TranscriptsList from '@/components/TranscriptsList';
import { LoadButton } from '@/components/ui/loadingbutton';
import { canViewTranscripts, getAllCompanions, getRecentSessions } from '@/lib/actions/companion.actions';
import React from 'react';


const Page = async () => {
  const companions = await getAllCompanions({ limit: 3 });
  const recentSessionsCompanions = await getRecentSessions(5);
  const hasAccess = await canViewTranscripts();

  return (
    <main className="bg-gradient-to-br from-slate-50 to-emerald-50/30 min-h-screen py-10">
      <div className="w-full px-4 md:px-10 lg:px-16 space-y-16">

        {/* Create New Companion CTA */}
        <section className="bg-white border border-emerald-100 shadow-md rounded-2xl p-6 flex justify-between items-center hover:shadow-lg transition">
          <div>
            <h2 className="text-2xl font-bold text-emerald-800">Create a New Companion</h2>
            <p className="text-emerald-600 mt-1">Build a customized AI tailored to your needs.</p>
          </div>
          <LoadButton
            href="/companions/new"
            variant="primary"
            className="hover:scale-105 hover:cursor-pointer"
          >
            Create Now
          </LoadButton>
        </section>

        {/* Popular Companions Section */}
        <section className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-10 w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
              Your Popular Companions
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 to-transparent ml-4" />
          </div>
          <CompanionsList
            title="Popular Companions"
            companions={companions}
            classNames="w-full"
          />
        </section>

        {/* Recently Completed Sessions Section */}
        <section className="bg-white rounded-2xl shadow-lg border border-amber-100 p-10 w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
              Recently Completed Sessions
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent ml-4" />
          </div>
          <CompanionsList
            title="Recently completed sessions"
            companions={recentSessionsCompanions}
            classNames="w-full"
          />
        </section>

         {/* Session Transcripts Section */}
         <section className="bg-white rounded-2xl shadow-lg border border-blue-100 p-10 w-full">
  <div className="flex items-center gap-3 mb-4">
    <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
    <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
      Session Transcripts and Quiz
    </h2>
    <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent ml-4" />
  </div>

  {/* Added note below title */}
  <p className="text-blue-600 mb-6 text-sm italic">
    📘 A quiz will be generated automatically based on the content of each session.
  </p>

  {hasAccess ? (
        <TranscriptsList />
      ) : (
        <div className="text-gray-500 italic text-sm">
          Upgrade to Pro or Core Learner to view your call transcripts.
        </div>
      )}
</section>


      </div>
    </main>
  );
};

export default Page;
