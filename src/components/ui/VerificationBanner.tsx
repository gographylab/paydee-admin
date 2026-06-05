'use client'

import { BsExclamationTriangle, BsClock, BsCheckCircle, BsShieldCheck } from "react-icons/bs"

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: string | null
}

interface VerificationBannerProps {
  userProfile: UserProfile | null
  onVerify: () => void
}

export default function VerificationBanner({ userProfile, onVerify }: VerificationBannerProps) {
  if (!userProfile || userProfile.role === 'admin') return null

  // Check if basic info is filled
  const hasBasicInfo = userProfile.full_name && userProfile.phone

  // Don't show banner if already approved
  if (userProfile.status === 'approved') return null

  let bannerConfig = {
    type: 'error',
    title: 'ต้องยืนยันตัวตน',
    message: 'กรุณากรอกข้อมูลเพื่อเริ่มใช้งานระบบ',
    buttonText: 'ยืนยันตัวตนเลย',
    icon: BsExclamationTriangle,
    showButton: true
  }

  if (hasBasicInfo && userProfile.status === 'pending') {
    bannerConfig = {
      type: 'warning',
      title: 'รอการอนุมัติ',
      message: 'ข้อมูลของคุณอยู่ระหว่างการตรวจสอบ กรุณารอสักครู่',
      buttonText: 'แก้ไขข้อมูล',
      icon: BsClock,
      showButton: true
    }
  }

  const bgColor = bannerConfig.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-primary-yellow-light border-secondary-yellow'
  const textColor = bannerConfig.type === 'error' ? 'text-red-800' : 'text-primary-yellow'
  const iconColor = bannerConfig.type === 'error' ? 'text-red-500' : 'text-primary-yellow'
  const buttonColor = bannerConfig.type === 'error' 
    ? 'bg-red-600 hover:bg-red-700 text-white' 
    : 'bg-primary-yellow hover:bg-primary-yellow text-white'

  return (
    <div className={`mb-6 p-4 rounded-xl border-l-4 ${bgColor} animate-fadeIn`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <div className={`mr-4 ${iconColor}`}>
            <bannerConfig.icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${textColor}`}>
              {bannerConfig.title}
            </h3>
            <p className={`text-sm ${textColor} opacity-80 mt-1`}>
              {bannerConfig.message}
            </p>
          </div>
        </div>
        
        {bannerConfig.showButton && (
          <button
            onClick={onVerify}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${buttonColor} shadow-lg hover:shadow-xl transform hover:scale-105`}
          >
            {bannerConfig.buttonText}
          </button>
        )}
      </div>
    </div>
  )
}
