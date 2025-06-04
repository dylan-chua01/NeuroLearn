export const dynamic = 'force-dynamic';

import CTA from '@/components/CTA'
import CompanionsList from '@/components/CompanionsList'
import { getAllCompanions, getRecentSessions } from '@/lib/actions/companion.actions'
import React from 'react'

const Page = async () => {
  const companions = await getAllCompanions({ limit: 3 });
  const recentSessionsCompanions = await getRecentSessions(10);

  return (
    <main className="bg-gradient-to-br from-slate-50 to-emerald-50/30 min-h-screen">


      <div className="px-6 space-y-12">
        {/* Popular Companions Section */}
        <section className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
              Popular Companions
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 to-transparent ml-4"></div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-50/50 to-transparent rounded-xl p-6">
            <CompanionsList
              title="Popular Companions"
              companions={companions}
              classNames="w-full"
            />
          </div>
        </section>

        {/* Recent Sessions Section */}
        <section className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full"></div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
              Recently Completed Sessions
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 to-transparent ml-4"></div>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50/50 to-transparent rounded-xl p-6">
            <CompanionsList
              title='Recently completed sessions'
              companions={recentSessionsCompanions}
              classNames='w-full'
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-lg p-8 text-white">
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
            <CTA />
          </div>
        </section>
        
        <section className="grid md:grid-cols-3 gap-6 py-8">
          {/* <div className="bg-white rounded-xl shadow-md border border-emerald-100 p-6 text-center group hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-emerald-800 mb-2">Lightning Fast</h3>
            <p className="text-emerald-600 text-sm">Get instant responses and seamless interactions</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-emerald-100 p-6 text-center group hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-emerald-800 mb-2">Smart Learning</h3>
            <p className="text-emerald-600 text-sm">AI-powered companions that adapt to your style</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-emerald-100 p-6 text-center group hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-emerald-800 mb-2">Community Driven</h3>
            <p className="text-emerald-600 text-sm">Join thousands of learners worldwide</p>
          </div> */}
        </section>
      </div>
    </main>
  );
}

export default Page