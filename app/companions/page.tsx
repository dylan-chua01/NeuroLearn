export const dynamic = 'force-dynamic';

import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import Link from 'next/link';
import CompanionCard from '@/components/CompanionCard';
import SearchInput from '@/components/SearchInput';
import SubjectFilter from '@/components/SubjectFilter';
import { getAllCompanions } from '@/lib/actions/companion.actions';
import { getSubjectColor } from '@/lib/utils';
import { Button } from "@/components/ui/button";

const CompanionsLibrary = async ({ searchParams }: SearchParams) => {
  const { userId } = await auth();
  const filters = await searchParams;
  const subject = filters.subject ? filters.subject: '';
  const topic = filters.topic ? filters.topic: '';

  const companions = await getAllCompanions({ subject, topic });
  console.log(companions);

  // Not signed in
  if (!userId) {
    return (
      <main>
        <section className='flex justify-between gap-4 max-sm:flex-col'>
          <h1>Companion Library</h1>
        </section>

        <section className='flex flex-col items-center justify-center min-h-[400px] text-center space-y-6'>
          <div className='w-24 h-24 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center'>
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className='space-y-3'>
            <h2 className='text-2xl font-bold text-gray-800'>Sign in to view your companions</h2>
            <p className='text-gray-600 max-w-md'>
              Create and manage your AI learning companions. Sign in to get started on your personalized learning journey.
            </p>
          </div>
          <Link href="/sign-in">
            <Button className='bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl'>
              Sign In to Continue
            </Button>
            </Link>
        </section>
      </main>
    );
  }

  // Signed in but no companions
  if (companions.length === 0) {
    const hasFilters = subject || topic;
    
    return (
      <main>
        <section className='flex justify-between gap-4 max-sm:flex-col'>
          <h1>Companion Library</h1>
          <div className='flex gap-4'>
            <SearchInput />
            <SubjectFilter />
          </div>
        </section>

        <section className='flex flex-col items-center justify-center min-h-[400px] text-center space-y-6'>
          <div className='w-24 h-24 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center'>
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div className='space-y-3'>
            {hasFilters ? (
              <>
                <h2 className='text-2xl font-bold text-gray-800'>No companions found</h2>
                <p className='text-gray-600 max-w-md'>
                  No companions match your current filters. Try adjusting your search or clear the filters to see all your companions.
                </p>
              </>
            ) : (
              <>
                <h2 className='text-2xl font-bold text-gray-800'>Create your first companion</h2>
                <p className='text-gray-600 max-w-md'>
                  You haven't created any AI companions yet. Start building your personalized learning experience by creating your first companion.
                </p>
              </>
            )}
          </div>
          <div className='flex gap-4'>
            {hasFilters && (
              <Link href="/companions">
                <button className='bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-300'>
                  Clear Filters
                </button>
              </Link>
            )}
            <Link href="/create-companion">
              <button className='bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl'>
                Create Companion
              </button>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // Has companions - show normal view
  return (
    <main>
      <section className='flex justify-between gap-4 max-sm:flex-col'>
        <h1>Companion Library</h1>
        <div className='flex gap-4'>
          <SearchInput />
          <SubjectFilter />
        </div>
      </section>

      <section className='companions-grid'>
        {companions.map((companion)=> (
          <CompanionCard key={companion.id} {...companion} color={getSubjectColor(companion.subject)} />
        ))}
      </section>
    </main>
  );
}

export default CompanionsLibrary;