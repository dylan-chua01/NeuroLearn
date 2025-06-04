import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white mt-20'>
      {/* Main Footer Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8'>
          
          {/* Brand Section */}
          <div className='lg:col-span-1'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-3 shadow-lg'>
                <Image 
                  src="/icons/neuroLearn_logo.png" 
                  alt='NeuroLearn Logo' 
                  width={40} 
                  height={38}
                  className='brightness-0 invert'
                />
                <div className='absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-xl'></div>
              </div>
              <div>
                <h3 className='text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent'>
                  NeuroLearn
                </h3>
                <p className='text-sm text-gray-400'>AI Learning Platform</p>
              </div>
            </div>
            
            <p className='text-gray-300 text-sm leading-relaxed mb-6'>
              Revolutionizing education through AI-powered personalized learning experiences. 
              Unlock your potential with intelligent tutoring companions.
            </p>
            
            {/* Social Media Links */}
            <div className='flex items-center gap-4'>
              {[
                { name: 'Twitter', icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
                { name: 'LinkedIn', icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z' },
              ].map((social) => (
                <Link 
                  key={social.name}
                  href="#"
                  className='p-2 rounded-lg bg-gray-800 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 hover:scale-110 group'
                  aria-label={social.name}
                >
                  <svg className='w-5 h-5 text-gray-400 group-hover:text-white transition-colors' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={social.icon} />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className='text-lg font-semibold mb-6 text-white'>Platform</h4>
            <ul className='space-y-4'>
              {[
                { name: 'AI Companions', href: '/companions' },
                { name: 'Learning Paths', href: '/paths' },
                
                
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className='text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm flex items-center group'
                  >
                    <span className='group-hover:translate-x-1 transition-transform duration-200'>{link.name}</span>
                    <svg className='w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className='text-lg font-semibold mb-6 text-white'>Company</h4>
            <ul className='space-y-4'>
              {[
                { name: 'About Us', href: '/about' },
                { name: 'Our Mission', href: '/mission' },
                { name: 'Careers', href: '/careers' },
                { name: 'Blog', href: '/blog' },
                
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className='text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm flex items-center group'
                  >
                    <span className='group-hover:translate-x-1 transition-transform duration-200'>{link.name}</span>
                    <svg className='w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Newsletter */}
          <div>
            <h4 className='text-lg font-semibold mb-6 text-white'>Stay Connected</h4>
            
            {/* Support Links */}
            <ul className='space-y-4 mb-8'>
              {[
                
                { name: 'Contact Support', href: '/support' },
                { name: 'Privacy Policy', href: '/privacy' },
                { name: 'Terms of Service', href: '/terms' }
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className='text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm flex items-center group'
                  >
                    <span className='group-hover:translate-x-1 transition-transform duration-200'>{link.name}</span>
                    <svg className='w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>

           
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className='border-t border-gray-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
            <div className='flex items-center gap-6 text-sm text-gray-400'>
              <p>© {currentYear} NeuroLearn. All rights reserved.</p>
              <div className='hidden md:flex items-center gap-1'>
                <span>Made with</span>
                <svg className='w-4 h-4 text-red-500 animate-pulse' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/>
                </svg>
                <span>for learners worldwide</span>
              </div>
            </div>
            
            <div className='flex items-center gap-6 text-sm text-gray-400'>
              <div className='flex items-center gap-2'>
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                <span>All systems operational</span>
              </div>
              <Link href='/status' className='hover:text-blue-400 transition-colors'>
                System Status
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer