'use client'

import { useState, Suspense } from 'react'
import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout, AuthButton } from '@/components/auth'
import { useAuthForm } from '@/hooks/useAuthForm'
import { getRoleFromParams } from '@/lib/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import AuthSkeleton from '@/components/auth/AuthSkeleton'

function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)

  const searchParams = useSearchParams()
  const { loading, error, isRedirecting, setError, handleEmailAuth, handleGoogleAuth } = useAuthForm()
  
  const userRole = getRoleFromParams(searchParams)

  // Focus management for accessibility
  const emailRef = React.useRef<HTMLInputElement>(null)
  const checkboxRef = React.useRef<HTMLButtonElement>(null)
  
  React.useEffect(() => {
    // Auto-focus email input when component mounts
    if (emailRef.current) {
      emailRef.current.focus()
    }
  }, [])

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if terms are accepted
    if (!acceptTerms) {
      setError('กรุณายอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว')
      // Scroll to checkbox and focus
      checkboxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => {
        checkboxRef.current?.focus()
      }, 300)
      return
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }

    await handleEmailAuth(email, password, false, userRole)
  }

  const handleGoogleRegister = async () => {
    // Check if terms are accepted
    if (!acceptTerms) {
      setError('กรุณายอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว')
      // Scroll to checkbox and focus
      checkboxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => {
        checkboxRef.current?.focus()
      }, 300)
      return
    }

    await handleGoogleAuth(userRole)
  }

  return (
    <AuthLayout
      title="สมัครสมาชิก"
      subtitle={
        <>
          มีบัญชีแล้ว?{' '}
          <Link href="/auth/login" className="font-medium text-primary-blue hover:text-secondary-blue">
            เข้าสู่ระบบ
          </Link>
        </>
      }
      error={error}
      errorId="register-error"
    >

      <form className="space-y-6" onSubmit={handleEmailRegister}>
        <div className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
              อีเมล
            </Label>
            <Input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={`modern-input ${error ? 'error shake' : ''}`}
              placeholder="กรอกอีเมลของคุณ"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-describedby={error ? "register-error" : undefined}
              aria-invalid={!!error}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
              รหัสผ่าน
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={`modern-input ${error && error.includes('รหัสผ่าน') ? 'error shake' : ''}`}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={error ? "register-error" : undefined}
              aria-invalid={!!error}
            />
            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-1">
                <div className="flex space-x-1">
                  <div className={`h-1 w-full rounded ${password.length >= 6 ? 'bg-green-400' : 'bg-gray-200'}`} style={password.length >= 6 ? {backgroundColor: '#4ade80'} : {}} />
                  <div className={`h-1 w-full rounded ${password.length >= 8 ? 'bg-green-400' : 'bg-gray-200'}`} style={password.length >= 8 ? {backgroundColor: '#4ade80'} : {}} />
                  <div className={`h-1 w-full rounded ${/[A-Z]/.test(password) ? 'bg-green-400' : 'bg-gray-200'}`} style={/[A-Z]/.test(password) ? {backgroundColor: '#4ade80'} : {}} />
                  <div className={`h-1 w-full rounded ${/[0-9]/.test(password) ? 'bg-green-400' : 'bg-gray-200'}`} style={/[0-9]/.test(password) ? {backgroundColor: '#4ade80'} : {}} />
                </div>
                <p className="text-xs text-gray-500">
                  ความแข็งแกร่ง: อย่างน้อย 6 ตัวอักษร, 8+ ตัวอักษร, ตัวพิมพ์ใหญ่, ตัวเลข
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
              ยืนยันรหัสผ่าน
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={`modern-input ${error && error.includes('ไม่ตรงกัน') ? 'error shake' : confirmPassword && password && confirmPassword === password ? 'success' : ''}`}
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-describedby={error ? "register-error" : undefined}
              aria-invalid={!!error}
            />
            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className="flex items-center text-xs">
                {password === confirmPassword ? (
                  <div className="flex items-center" style={{color: '#16a34a'}}>
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    รหัสผ่านตรงกัน
                  </div>
                ) : (
                  <div className="flex items-center" style={{color: '#dc2626'}}>
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    รหัสผ่านไม่ตรงกัน
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Terms and Privacy Checkbox */}
        <div className="pt-4">
          <div className={`flex items-start space-x-3 p-4 rounded-lg border transition-all ${
            error && error.includes('เงื่อนไข')
              ? 'border-red-300 bg-red-50 shake'
              : 'border-gray-200 bg-gray-50'
          }`}>
            <Checkbox
              ref={checkboxRef}
              id="accept-terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => {
                setAcceptTerms(checked as boolean)
                if (checked && error && error.includes('เงื่อนไข')) {
                  setError('')
                }
              }}
              className="mt-0.5"
            />
            <label
              htmlFor="accept-terms"
              className="text-xs text-gray-600 leading-relaxed cursor-pointer select-none"
            >
              ฉันยอมรับ
              <a
                href="https://www.paydee.me/seller-rules"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-blue hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {' '}เงื่อนไขการใช้งาน
              </a> และ
                <a
                href="https://www.paydee.me/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-blue hover:underline"
                onClick={(e) => e.stopPropagation()}
                >
                นโยบายความเป็นส่วนตัว
                </a>ของเรา
            </label>
          </div>
          {!acceptTerms && error && error.includes('เงื่อนไข') && (
            <p className="text-xs text-red-600 mt-2 pl-4 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              กรุณายอมรับเงื่อนไขการใช้งานก่อนสมัครสมาชิก
            </p>
          )}
        </div>

        <div className="space-y-5 pt-2">
          {/* Register Button */}
          <AuthButton
            type="submit"
            loading={loading}
            disabled={isRedirecting || (password !== confirmPassword && confirmPassword !== '')}
            loadingText={error ? 'สมัครไม่สำเร็จ' : isRedirecting ? 'กำลังเข้าสู่หน้าหลัก...' : 'กำลังสร้างบัญชี...'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }
          >
            สมัครสมาชิก
          </AuthButton>

          {/* Divider */}
          <div className="auth-divider">
            <span>หรือ</span>
          </div>

          {/* Google Register Button */}
          <AuthButton
            variant="secondary"
            onClick={handleGoogleRegister}
            loading={loading}
            disabled={loading}
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            }
          >
            สมัครด้วย Google
          </AuthButton>
        </div>
      </form>

      {/* Next Steps Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
        <div className="flex items-start">
          <svg className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" style={{color: '#176daf'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold mb-1" style={{color: '#176daf'}}>หลังจากสมัครสมาชิก</h4>
            <p className="text-xs leading-relaxed" style={{color: '#1e40af'}}>
              คุณจะต้องกรอกข้อมูลส่วนตัวเพิ่มเติมและรอการอนุมัติจากแอดมิน
              เพื่อเริ่มใช้งานระบบจัดการทริปและได้รับคอมมิชชัน
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <RegisterForm />
    </Suspense>
  )
}
