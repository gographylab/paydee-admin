'use client'

import { ReactNode } from 'react'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: ReactNode
  error?: string
  errorId?: string
}

export default function AuthLayout({ children, title, subtitle, error, errorId }: AuthLayoutProps) {
  useEffect(() => {
    // Pre-initialize Supabase client and auth session
    const supabase = createClient()
    supabase.auth.getSession()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="min-h-screen flex flex-col">
          {/* Mobile Header with Logo */}
          <div className="bg-gradient-to-r px-6 py-8" style={{background: 'linear-gradient(to right, #176daf, #5c9ad2)'}}>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4">
                  <Image
                    src="/images/paydeeLOGO.svg"
                    alt="PayDee"
                    width={60}
                    height={60}
                    className="w-15 h-15"
                  />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
              <div className="text-blue-100 text-sm">{subtitle}</div>
            </div>
          </div>

          {/* Mobile Form */}
          <div className="flex-1 px-6 py-8 bg-white">
            <div className="max-w-sm mx-auto">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6" role="alert" aria-live="polite" id={errorId}>
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="text-red-700 text-sm leading-relaxed">{error}</div>
                  </div>
                </div>
              )}
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Split Layout */}
      <div className="hidden lg:flex min-h-screen">
        {/* Left Side - Brand Section */}
        <div className="flex-1 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #176daf 0%, #176daf 50%, #5c9ad2 100)'}}>
          {/* Decorative Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full" style={{background: 'linear-gradient(135deg, rgba(23, 109, 175, 0.9) 0%, rgba(92, 154, 210, 0.9) 100%)'}}></div>
            <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full blur-xl" style={{backgroundColor: 'rgba(254, 152, 19, 0.2)'}}></div>
            <div className="absolute top-1/2 left-10 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center items-center h-full px-12 text-center">
            {/* Logo */}
            <div className="mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 inline-block">
                <Image
                  src="/images/paydeeLOGO.svg"
                  alt="PayDee"
                  width={120}
                  height={120}
                  className="w-30 h-30"
                />
              </div>
            </div>

            {/* Welcome Text */}
            <div className="max-w-md">
              <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
                ยินดีต้อนรับสู่ PayDee
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed mb-8">
                แพลตฟอร์มการจัดการทริปและการจองที่ทันสมัย เพื่อประสบการณ์การเดินทางที่ดีที่สุด
              </p>

              {/* Feature Highlights */}
              <div className="space-y-4 text-left">
                <div className="flex items-center text-blue-100">
                  <svg className="w-5 h-5 mr-3" style={{color: '#fe9813'}} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>จัดการทริปและการจองอย่างมืออาชีพ</span>
                </div>
                <div className="flex items-center text-blue-100">
                  <svg className="w-5 h-5 mr-3" style={{color: '#fe9813'}} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>ระบบคอมมิชชันที่โปร่งใสและยุติธรรม</span>
                </div>
                <div className="flex items-center text-blue-100">
                  <svg className="w-5 h-5 mr-3" style={{color: '#fe9813'}} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>รายงานและการวิเคราะห์แบบเรียลไทม์</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form Section */}
        <div className="flex-1 flex items-center justify-center p-12 bg-white">
          <div className="w-full max-w-md">
            {/* Form Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">{title}</h2>
              <div className="text-gray-600">{subtitle}</div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6" role="alert" aria-live="polite" id={errorId}>
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="text-red-700 text-sm leading-relaxed">{error}</div>
                </div>
              </div>
            )}

            {/* Form Content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}