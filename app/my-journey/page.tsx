import CompanionsList from "@/components/CompanionsList";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { getUserCompanions, getUserSessions } from "@/lib/actions/companion.actions";
import { currentUser } from "@clerk/nextjs/server"
import Image from "next/image";
import { redirect } from "next/navigation";

const Profile = async () => {
  const user = await currentUser();

  if(!user) redirect('/sign-in');

  const companions = await getUserCompanions(user.id);
  const sessionHistory = await getUserSessions(user.id);

  return (
    <main className='min-lg:w-3/4 bg-gradient-to-br from-slate-50 to-emerald-50/30 min-h-screen p-6'>
      {/* Header Section with Cathay Pacific styling */}
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
          
          {/* Stats Cards with Cathay Pacific colors */}
          <div className="flex gap-6 max-sm:w-full max-sm:justify-center">
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
          </div>
        </div>
      </section>

      {/* Accordion Section with enhanced styling */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 overflow-hidden">
        <Accordion type="multiple" className="w-full">
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