'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UserCircleIcon, PhoneIcon, IdentificationIcon, BanknotesIcon } from '@heroicons/react/24/outline'
import { IoChevronBackSharp } from "react-icons/io5"
import { BsShieldCheck, BsExclamationTriangle, BsClock, BsCheckCircle } from "react-icons/bs"
import Image from 'next/image'

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: string | null
  referral_code: string | null
  avatar_url: string | null
  id_card_url: string | null
  created_at: string | null
}

interface BankAccount {
  id: string
  seller_id: string
  bank_name: string
  account_number: string
  account_name: string
  branch: string | null
  is_primary: boolean
  created_at: string | null
  updated_at?: string | null
}

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone, role, status, referral_code, avatar_url, id_card_url, created_at')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile(profile)

        // Fetch bank account information
        const { data: bank } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('seller_id', user.id)
          .eq('is_primary', true)
          .single()

        if (bank) {
          setBankAccount(bank)
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // Get verification status info
  const getVerificationStatus = () => {
    if (!userProfile) return { status: 'unknown', text: 'ยืนยันตัวตน', color: 'blue', icon: BsShieldCheck }

    // Check if basic info is filled
    const hasBasicInfo = userProfile.full_name && userProfile.phone

    if (!hasBasicInfo) {
      return {
        status: 'not_started',
        text: 'ยืนยันตัวตน',
        subtext: 'ต้องดำเนินการ',
        color: 'red',
        icon: BsExclamationTriangle,
        needsAction: true
      }
    }

    if (userProfile.status === 'pending') {
      return {
        status: 'pending',
        text: 'อยู่ระหว่างตรวจสอบ',
        subtext: 'รอการอนุมัติ',
        color: 'yellow',
        icon: BsClock,
        needsAction: false
      }
    }

    if (userProfile.status === 'approved') {
      return {
        status: 'approved',
        text: 'ยืนยันแล้ว',
        subtext: 'ข้อมูลถูกต้อง',
        color: 'green',
        icon: BsCheckCircle,
        needsAction: false
      }
    }

    return {
      status: 'not_approved',
      text: 'ยืนยันตัวตน',
      subtext: 'จำเป็นต้องอัปเดต',
      color: 'red',
      icon: BsExclamationTriangle,
      needsAction: true
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber
    const visibleDigits = 2
    const masked = '*'.repeat(accountNumber.length - visibleDigits * 2)
    return accountNumber.slice(0, visibleDigits) + masked + accountNumber.slice(-visibleDigits)
  }

  const verificationInfo = getVerificationStatus()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    )
  }

  return (
    <div className="w-full  pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm md:bg-gray-50 md:shadow-none md:border-0 rounded-2xl">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/trips')}
            className="hover:bg-gray-100 transition-colors"
          >
            <IoChevronBackSharp className="w-8 h-8 text-gray-600" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-gray-900">โปรไฟล์</h1>
            <p className="text-sm text-gray-500 font-medium">ข้อมูลส่วนตัวและการยืนยันตัวตน</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-3 border-white shadow-lg">
                {userProfile?.avatar_url ? (
                  <Image
                    src={userProfile.avatar_url}
                    alt={userProfile.full_name || 'User'}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <UserCircleIcon className={`w-full h-full text-gray-400 ${userProfile?.avatar_url ? 'hidden' : ''}`} />
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {userProfile?.full_name || 'ไม่ระบุชื่อ'}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md font-mono">
                  ID: {userProfile?.id ? userProfile.id.slice(-5) : 'ไม่มี'}
                </span>
                <span className="text-sm text-gray-600">
                  สมัครเมื่อ: {userProfile?.created_at ? formatDate(userProfile.created_at) : 'ไม่ทราบ'}
                </span>
              </div>
            </div>
          </div>

          {/* Verification Status Card */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 shadow-sm ${verificationInfo.color === 'red'
            ? 'bg-red-50 text-red-700 border-red-200'
            : verificationInfo.color === 'yellow'
            ? 'bg-yellow-50 text-primary-yellow border-secondary-yellow'
            : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            <div className="relative">
              <verificationInfo.icon className="text-lg" />
              {verificationInfo.needsAction && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="font-semibold">{verificationInfo.text}</div>
              {verificationInfo.subtext && (
                <div className="text-xs opacity-75">{verificationInfo.subtext}</div>
              )}
            </div>
          </div>
        </div>

        {/* Professional Action Button */}
        {verificationInfo.needsAction && (
          <div className="mb-6">
            <Button
              onClick={() => router.push('/dashboard/profile/seller-verification')}
              style={{background: "linear-gradient(to right, #176daf, #5c9ad2)"}}
              className="w-full text-white py-4 px-6 rounded-xl font-bold shadow-xl hover:opacity-90 hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-3 relative overflow-hidden group h-14"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <BsExclamationTriangle className="w-5 h-5 relative z-10" />
              <span className="relative z-10">ยืนยันตัวตนเพื่อเริ่มขาย</span>
            </Button>
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">ข้อมูลส่วนตัว</h3>

          <div className="space-y-4">
            {/* Full Name */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <UserCircleIcon className="w-5 h-5 text-primary-blue" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700 mb-1">ชื่อ-นามสกุล</p>
                <p className="text-gray-900 font-medium">{userProfile?.full_name || 'ยังไม่กรอก'}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <PhoneIcon className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700 mb-1">เบอร์โทรศัพท์</p>
                <p className="text-gray-900 font-medium">{userProfile?.phone || 'ยังไม่กรอก'}</p>
              </div>
            </div>

            {/* ID Card Status */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                userProfile?.id_card_url ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <IdentificationIcon className={`w-5 h-5 ${
                  userProfile?.id_card_url ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700 mb-1">บัตรประชาชน</p>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900 font-medium">
                    {userProfile?.id_card_url ? 'อัปโหลดแล้ว' : 'ยังไม่อัปโหลด'}
                  </p>
                  {userProfile?.id_card_url && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ เสร็จสิ้น
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Account Information */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">ข้อมูลบัญชีธนาคาร</h3>

          {bankAccount ? (
            <div className="space-y-4">
              {/* Bank Name */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <BanknotesIcon className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700 mb-1">ธนาคาร</p>
                  <p className="text-gray-900 font-medium">ธนาคาร{bankAccount.bank_name}</p>
                </div>
              </div>

              {/* Account Number */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-primary-blue font-bold text-sm">#</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700 mb-1">เลขที่บัญชี</p>
                  <p className="text-gray-900 font-medium font-mono">{maskAccountNumber(bankAccount.account_number)}</p>
                </div>
              </div>

              {/* Account Name */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <UserCircleIcon className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700 mb-1">ชื่อบัญชี</p>
                  <p className="text-gray-900 font-medium">{bankAccount.account_name}</p>
                </div>
              </div>

              {/* Branch (if available) */}
              {bankAccount.branch && (
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">🏪</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-700 mb-1">สาขา</p>
                    <p className="text-gray-900 font-medium">{bankAccount.branch}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-4 p-6 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <BanknotesIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800 mb-1">ยังไม่มีข้อมูลบัญชีธนาคาร</p>
                <p className="text-xs text-yellow-700">กรุณายืนยันตัวตนเพื่อเพิ่มข้อมูลบัญชีธนาคาร</p>
              </div>
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm block md:hidden">
          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">การตั้งค่า</h3>
              <p className="text-gray-600">จัดการบัญชีและการเข้าสู่ระบบ</p>
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full flex items-center justify-center gap-4 px-6 py-4 text-base font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 hover:shadow-lg transition-all duration-200 border-2 border-red-200 hover:border-red-300 h-16"
            >
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}