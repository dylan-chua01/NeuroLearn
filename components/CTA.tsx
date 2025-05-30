import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const CTA = () => {
  return (
    <section className='relative overflow-hidden'>
      {/* Background Gradient Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-400/20 to-transparent rounded-full blur-xl"></div>
      
      <div className='relative z-10 text-center space-y-6 p-6'>
        {/* CTA Badge */}
        <div className='inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-full shadow-lg'>
          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
          Start learning your way.
        </div>
        
        {/* Main Heading */}
        <h2 className='text-2xl lg:text-3xl text-white font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent leading-tight'>
          Build and Personalise Learning Companion
        </h2>
        
        {/* Description */}
        <p className='text-emerald-600 leading-relaxed text-sm lg:text-base max-w-md mx-auto'>
          Pick a name, subject, voice, & personality - and start learning through voice conversations that feel natural and fun.
        </p>
        
        {/* CTA Image */}
        <div className='relative py-4'>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-100/50 to-transparent rounded-lg"></div>
          <Image 
            src="/images/cta.svg" 
            alt='Build your learning companion' 
            width={280} 
            height={180}
            className='mx-auto relative z-10 drop-shadow-lg'
          />
        </div>
        
        {/* CTA Button */}
        <Link href="/companions/new" className='block'>
          <div className='group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer'>
            <svg className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Build a New Companion
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
        
        {/* Additional Features List */}
        <div className='pt-4 space-y-2'>
          <div className='flex items-center justify-center gap-6 text-xs text-emerald-600 flex-wrap'>
            <div className='flex items-center gap-1'>
              <div className='w-1.5 h-1.5 bg-emerald-500 rounded-full'></div>
              <span>Custom Personalities</span>
            </div>
            <div className='flex items-center gap-1'>
              <div className='w-1.5 h-1.5 bg-amber-500 rounded-full'></div>
              <span>Voice Conversations</span>
            </div>
            <div className='flex items-center gap-1'>
              <div className='w-1.5 h-1.5 bg-teal-500 rounded-full'></div>
              <span>Any Subject</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA