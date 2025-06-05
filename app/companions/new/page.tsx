import CompanionForm from '@/components/CompanionForm'
import { newActiveCompanionPermissions, newCompanionPermissions } from '@/lib/actions/companion.actions';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import React from 'react'
import Image from 'next/image';
import Link from 'next/link';



const NewCompanion = async () => {
  const { userId, has } = await auth();
  if (!userId) redirect('/sign-in');

    // Step 2: Check if the user has any valid subscription or feature flag
    const hasPlan =
    has({ plan: 'core' }) ||
    has({ plan: 'basic' });

  // Step 3: If no plan at all, block access
  if (!hasPlan) {
    redirect('/subscription'); // 👈 force them to subscribe
  }


  const [canCreateCompanion, canCreateActiveCompanion] = await Promise.all([
    newCompanionPermissions(),
    newActiveCompanionPermissions()
  ]);

  const canAccess = canCreateCompanion && canCreateActiveCompanion;

  return (
    <main className='min-lg:w-1/3 min-md:w-2/3 items-center justify-center'>
    {canAccess ? (
      <article className='w-full gap-4 flex flex-col items-center'>
         <h1 className="text-4xl font-extrabold text-blue-700 mb-2">
            🎓 Build Your Companion
          </h1>
        <CompanionForm />
      </article>
    ) : (
      <article className='companion-limit'>
        <Image src="/images/limit.svg" alt="Companion limit reached" width={360} height={230} />
        <div className='cta-badge'>
          Upgrade your plan
        </div>
        <h1>You’ve Reached Your Limit</h1>
        <p>You’ve reached your companion limit for this month. Upgrade to create more companions and access premium features.</p>

        <Link href="/subscription" className='btn-primary w-full justify-center'>
          Upgrade My Plan
        </Link>
      </article>
    )}
  </main>
  )
}

export default NewCompanion
