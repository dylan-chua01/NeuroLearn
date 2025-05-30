import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import NavItems from './NavItems'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

const NavBar = () => {
  return (
    <nav className='sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16 lg:h-20'>
          {/* Logo Section */}
          <Link href="/" className='group'>
            <div className='flex items-center gap-3 transition-all duration-300 hover:scale-105'>
              <div className='relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 p-2 shadow-lg group-hover:shadow-xl transition-all duration-300'>
                <Image 
                  src="/icons/neuroLearn_logo.png" 
                  alt='NeuroLearn Logo' 
                  width={40} 
                  height={38}
                  className='transition-transform duration-300 group-hover:scale-110'
                />
                {/* Subtle glow effect */}
                <div className='absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl'></div>
              </div>
              
              {/* Brand text */}
              <div className='hidden sm:block'>
                <h1 className='text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent'>
                  NeuroLearn
                </h1>
                <p className='text-xs text-gray-500 font-medium tracking-wide'>
                  AI Learning Platform
                </p>
              </div>
            </div>
          </Link>

          {/* Navigation and Auth Section */}
          <div className='flex items-center gap-6 lg:gap-8'>
            {/* Navigation Items */}
            <div className='hidden md:block'>
              <NavItems />
            </div>

            {/* Mobile menu button - you can implement this if needed */}
            <button className='md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors'>
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
              </svg>
            </button>

            {/* Authentication Section */}
            <div className='flex items-center'>
              <SignedOut>
                <SignInButton>
                  <button className='group relative px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95'>
                    {/* Button glow effect */}
                    <div className='absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300'></div>
                    
                    <div className='relative flex items-center gap-2'>
                      <svg className='w-4 h-4 transition-transform group-hover:scale-110' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1' />
                      </svg>
                      <span>Sign In</span>
                    </div>
                  </button>
                </SignInButton>
              </SignedOut>
              
              <SignedIn>
                <div className='flex items-center gap-4'>
                  {/* Welcome text - optional */}
                  <div className='hidden lg:block text-right'>
                    <p className='text-sm text-gray-600'>Welcome back!</p>
                  </div>
                  
                  {/* Enhanced user button container */}
                  <div className='relative'>
                    <div className='p-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'>
                      <UserButton 
                        appearance={{
                          elements: {
                            avatarBox: "w-10 h-10 ring-2 ring-white shadow-md hover:ring-blue-200 transition-all duration-300",
                            userButtonPopoverCard: "shadow-2xl border-0 bg-white/95 backdrop-blur-md",
                            userButtonPopoverActionButton: "hover:bg-blue-50 transition-colors duration-200",
                          }
                        }}
                      />
                    </div>
                    
                    {/* Online indicator */}
                    <div className='absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse'></div>
                  </div>
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu - Hidden by default, implement toggle if needed */}
      <div className='md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-md'>
        <div className='px-4 py-3'>
          <NavItems />
        </div>
      </div>
    </nav>
  )
}

export default NavBar