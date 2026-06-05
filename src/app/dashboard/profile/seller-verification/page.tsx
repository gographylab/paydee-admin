'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

import { createClient } from '@/lib/supabase/client'
import { uploadSellerFile, updateSellerFiles } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { IoChevronBackSharp } from "react-icons/io5";

import {
  FiAlertTriangle,
  FiCheck,
  FiClipboard,
  FiFileText,
  FiLoader,
  FiPlus,
  FiShield,
  FiUser,
  FiX
} from 'react-icons/fi'

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: string | null
  referral_code: string | null
  avatar_url: string | null
}

// Constants - Professional business styling with brand colors
const UPLOAD_AREA_CLASSES = {
  base: "border-2 border-dashed rounded-2xl bg-white p-8 hover:border-opacity-75 transition-all duration-300 group",
  primary: "border-gray-300 hover:bg-blue-50/50 hover:border-secondary-blue",
  success: "border-gray-300 hover:bg-green-50/50 hover:border-green-300"
}

const ICON_CONTAINER_CLASSES = {
  base: "mx-auto flex items-center justify-center group-hover:scale-105 transition-transform duration-200",
  primary: "w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl",
  success: "w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-xl"
}

const SUCCESS_CARD_CLASSES = "bg-green-50 border-green-200"

// Professional Reusable Components
interface FileSuccessDisplayProps {
  fileName: string
  description: string
  onRemove: () => void
  loading: boolean
}

const FileSuccessDisplay = ({ fileName, description, onRemove, loading }: FileSuccessDisplayProps) => (
  <Card className={SUCCESS_CARD_CLASSES}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <FiCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">{fileName}</p>
            <p className="text-xs text-green-600">{description}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={loading}
          className="text-red-600 hover:text-red-800 hover:bg-red-100"
        >
          <FiX className="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
)

export default function SellerVerificationPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  // Bank account states
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [branch, setBranch] = useState('')

  // File states
  const [idCardFile, setIdCardFile] = useState<File | null>(null)
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [documentFiles, setDocumentFiles] = useState<File[]>([])

  // Preview URLs
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [progressPercent, setProgressPercent] = useState(0)
  const [error, setError] = useState('')

  // File input refs
  const idCardInputRef = useRef<HTMLInputElement>(null)
  const profileInputRef = useRef<HTMLInputElement>(null)
  const documentsInputRef = useRef<HTMLInputElement>(null)

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
        .select('id, full_name, phone, role, status, referral_code, avatar_url')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile(profile)
        setFullName(profile.full_name || '')
        setPhone(profile.phone || '')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  // Helper functions
  const compressImage = async (file: File, maxWidth = 1024, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        // Draw and compress
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            resolve(file) // Fallback to original
          }
        }, file.type, quality)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileChange = async (
    file: File,
    setFile: (file: File) => void,
    setPreview: (url: string) => void
  ) => {
    setError('')

    // Compress image if it's an image file
    let processedFile = file
    if (file.type.startsWith('image/')) {
      toast.loading('กำลังประมวลผลรูปภาพ...', { id: 'compress' })
      processedFile = await compressImage(file)
      toast.dismiss('compress')

      const reduction = ((file.size - processedFile.size) / file.size * 100).toFixed(1)
    }

    setFile(processedFile)
    const previewUrl = URL.createObjectURL(processedFile)
    setPreview(previewUrl)
  }

  const removeFile = (
    previewUrl: string | null,
    setFile: (file: File | null) => void,
    setPreview: (url: string | null) => void
  ) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreview(null)
    }
    setFile(null)
  }

  // Handle file selection
  const handleIdCardChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await handleFileChange(file, setIdCardFile, setIdCardPreview)
  }

  const handleProfileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await handleFileChange(file, setProfileFile, setProfilePreview)
  }

  const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setDocumentFiles([...documentFiles, ...files])
    setError('')
    if (documentsInputRef.current) {
      documentsInputRef.current.value = ''
    }
  }

  const removeDocument = (indexToRemove: number) => {
    setDocumentFiles(documentFiles.filter((_, index) => index !== indexToRemove))
  }

  const removeIdCardFile = () => removeFile(idCardPreview, setIdCardFile, setIdCardPreview)
  const removeProfileFile = () => removeFile(profilePreview, setProfileFile, setProfilePreview)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setUploadProgress('')

    try {
      if (!userProfile) {
        toast.error('ไม่พบข้อมูลผู้ใช้')
        return
      }

      // Validate required fields
      if (!fullName || !phone) {
        toast.error('กรุณากรอกชื่อ-นามสกุล และเบอร์โทรศัพท์')
        return
      }

      if (!bankName || !accountNumber || !accountName) {
        toast.error('กรุณากรอกข้อมูลธนาคารให้ครบถ้วน')
        return
      }

      // Validate account number (at least 9 digits)
      const accountNumberDigits = accountNumber.replace(/\D/g, '')
      if (accountNumberDigits.length < 9) {
        toast.error('กรอกเลขที่บัญชีให้ถูกต้อง')
        return
      }

      // Validate account name (at least 4 characters)
      if (accountName.trim().length < 4) {
        toast.error('กรอกชื่อบัญชีให้ถูกต้อง')
        return
      }

      if (!idCardFile) {
        toast.error('กรุณาอัปโหลดรูปบัตรประชาชน')
        return
      }

      const updates: any = {
        full_name: fullName,
        phone: phone,
      }

      // Prepare upload tasks for parallel execution
      const uploadTasks: Promise<any>[] = []
      const totalTasks = 1 + (profileFile ? 1 : 0) + documentFiles.length
      let completedTasks = 0

      const updateProgress = (increment = 1) => {
        completedTasks += increment
        const percent = Math.round((completedTasks / totalTasks) * 100)
        setProgressPercent(percent)
      }

      // Upload ID card (required) - parallel task
      setUploadProgress('กำลังอัปโหลดไฟล์...')
      setProgressPercent(0)

      uploadTasks.push(
        uploadSellerFile(idCardFile, userProfile.id, 'id-card').then(result => {
          updates.id_card_url = result.url
          updates.id_card_uploaded_at = new Date().toISOString()
          updateProgress()
          return { type: 'id-card', result }
        })
      )

      // Upload profile image (optional) - parallel task
      if (profileFile) {
        uploadTasks.push(
          uploadSellerFile(profileFile, userProfile.id, 'profile').then(result => {
            updates.avatar_url = result.url
            updates.avatar_uploaded_at = new Date().toISOString()
            updateProgress()
            return { type: 'profile', result }
          })
        )
      }

      // Upload documents (optional) - parallel tasks
      const documentUrls: string[] = []
      if (documentFiles.length > 0) {
        documentFiles.forEach((file, index) => {
          uploadTasks.push(
            uploadSellerFile(
              file,
              userProfile.id,
              'documents',
              `document-${index + 1}-${Date.now()}.pdf`
            ).then(result => {
              documentUrls.push(result.url)
              updateProgress()
              return { type: 'document', result, index }
            })
          )
        })
      }

      // Execute all uploads in parallel
      await Promise.all(uploadTasks)

      if (documentUrls.length > 0) {
        updates.documents_urls = documentUrls
        updates.document_uploaded_at = new Date().toISOString()
      }

      // Update user profile
      setUploadProgress('กำลังบันทึกข้อมูล...')
      await updateSellerFiles(userProfile.id, updates)

      // Save bank account information
      setUploadProgress('กำลังบันทึกข้อมูลธนาคาร...')
      const { error: bankError } = await supabase
        .from('bank_accounts')
        .upsert({
          seller_id: userProfile.id,
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
          branch: branch || null,
          is_primary: true
        }, {
          onConflict: 'seller_id,is_primary'
        })

      if (bankError) {
        toast.error('ไม่สามารถบันทึกข้อมูลธนาคารได้: ' + bankError.message)
        return
      }

      // Update status to pending for approval
      setUploadProgress('กำลังอัปเดตสถานะ...')
      const { error: statusError } = await supabase
        .from('user_profiles')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id)

      if (statusError) {
        console.error('Error updating status:', statusError)
      }

      // Notify other components about profile update
      const profileUpdateEvent = new CustomEvent('profileUpdated', {
        detail: { userId: userProfile.id, updates: { ...updates, status: 'pending' } }
      })
      window.dispatchEvent(profileUpdateEvent)

      // Send LINE notification to admin (non-blocking)
      fetch('/api/notifications/line/profile-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.id,
          fullName: fullName,
          phone: phone
        })
      }).catch(err => console.error('Failed to send LINE notification:', err))

      // Success - show toast and redirect to LINE OA page
      toast.success('ส่งข้อมูลเรียบร้อย!')

      // Redirect to LINE OA page
      setTimeout(() => {
        router.push('/dashboard/profile/add-line-oa')
      }, 500)

    } catch (err: any) {
      console.error('Verification submission error:', err)
      toast.error(err.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
      setUploadProgress('')
      setProgressPercent(0)
    }
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <FiLoader className="w-12 h-12 text-primary-blue animate-spin" />
          <p className="text-gray-600 text-sm font-medium">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen ">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm md:bg-gray-50 md:shadow-none md:border-0 rounded-2xl">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/profile')}
            className="hover:bg-gray-100 transition-colors"
          >
            <IoChevronBackSharp className="w-6 h-6 text-gray-600" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-gray-900">การยืนยันตัวตน</h1>
            <p className="text-sm text-secondary-blue font-medium">เพื่อความปลอดภัยและความน่าเชื่อถือ</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {/* Professional Info Card */}
        <Card className="mb-8 overflow-hidden border border-gray-200 shadow-lg">
          <div style={{background: "linear-gradient(to right, #176daf, #5c9ad2)"}} className="text-white p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <FiShield className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">การยืนยันตัวตน</h3>
                <p className="text-blue-100 text-sm leading-relaxed">เพื่อความปลอดภัยของลูกค้าและสร้างความน่าเชื่อถือให้กับธุรกิจของคุณ</p>
              </div>
            </div>
          </div>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50 shadow-sm mb-6">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <FiAlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-red-800 text-sm font-medium leading-relaxed">{error}</div>
              </div>
            </CardContent>
          </Card>
        )}

        <form id="verification-form" onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info - Professional styling */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <div style={{background: "linear-gradient(to bottom right, #176daf, #5c9ad2)"}} className="w-10 h-10 rounded-full text-white flex items-center justify-center mr-4 font-bold text-sm">
                  1
                </div>
                ข้อมูลส่วนตัว
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                กรอกข้อมูลส่วนตัวของคุณให้ถูกต้องตามบัตรประชาชน
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700">
                  ชื่อ-นามสกุล <span className="text-primary-blue">*</span>
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  disabled={loading}
                  className="h-12 text-base border-gray-200 focus:border-primary-blue focus:ring-2 focus:ring-blue-100"
                  placeholder="กรอกชื่อ-นามสกุลตามบัตรประชาชน"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                  เบอร์โทรศัพท์ <span className="text-primary-blue">*</span>
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  disabled={loading}
                  className="h-12 text-base border-gray-200 focus:border-primary-blue focus:ring-2 focus:ring-blue-100"
                  placeholder="เบอร์โทรศัพท์สำหรับติดต่อ"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* ID Card Upload - Professional styling */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <div style={{background: "linear-gradient(to bottom right, #176daf, #5c9ad2)"}} className="w-10 h-10 rounded-full text-white flex items-center justify-center mr-4 font-bold text-sm">
                  2
                </div>
                บัตรประชาชน <span className="text-primary-blue font-semibold ml-1">*</span>
              </CardTitle>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <FiShield className="w-5 h-5 text-primary-blue mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-primary-blue font-medium mb-1">การตรวจสอบความปลอดภัย</p>
                      <p className="text-sm text-secondary-blue">เพื่อสร้างความเชื่อมั่นและความปลอดภัยให้กับลูกค้า</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardHeader>
            <CardContent>
              <div className={`${UPLOAD_AREA_CLASSES.base} ${UPLOAD_AREA_CLASSES.primary}`}>
                {idCardFile ? (
                  <div className="space-y-6">
                    <div className="mx-auto w-full max-w-md h-64 border-2 border-gray-200 rounded-2xl overflow-hidden bg-white shadow-md">
                      <img
                        src={idCardPreview || ''}
                        alt="ID Card Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <FiCheck className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-green-800">บัตรประชาชน</p>
                              <p className="text-xs text-green-600">อัปโหลดเรียบร้อยแล้ว</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={removeIdCardFile}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 hover:bg-red-100"
                          >
                            <FiX className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-6 text-center">
                    <div className={`${ICON_CONTAINER_CLASSES.base} ${ICON_CONTAINER_CLASSES.primary}`}>
                      <FiFileText className="w-10 h-10 text-primary-blue" />
                    </div>
                    <div>
                      <label htmlFor="idCardFile" className="cursor-pointer">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="h-12 px-6 border-2 border-gray-200 text-primary-blue bg-white hover:bg-blue-50 hover:border-secondary-blue shadow-sm font-semibold"
                          asChild
                        >
                          <span>
                            <FiPlus className="w-5 h-5 mr-2" />
                            เลือกไฟล์บัตรประชาชน
                          </span>
                        </Button>
                        <input
                          id="idCardFile"
                          name="idCardFile"
                          type="file"
                          className="sr-only"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={loading}
                          ref={idCardInputRef}
                          onChange={handleIdCardChange}
                        />
                      </label>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">คำแนะนำการถ่ายภาพ:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-primary-blue rounded-full"></div>
                          <span>วางบนพื้นเรียบ</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-primary-blue rounded-full"></div>
                          <span>ข้อมูลชัดเจน</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-primary-blue rounded-full"></div>
                          <span>แสงสว่างพอ</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-primary-blue rounded-full"></div>
                          <span>JPG/PNG/WebP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Image Upload - Professional styling */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <div style={{background: "linear-gradient(to bottom right, #5c9ad2, #176daf)"}} className="w-10 h-10 rounded-full text-white flex items-center justify-center mr-4 font-bold text-sm">
                  3
                </div>
                รูปโปรไฟล์
                <Badge variant="outline" className="ml-3 text-blue-600 border-blue-200 bg-blue-50">
                  ไม่บังคับ
                </Badge>
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                อัปโหลดรูปโปรไฟล์เพื่อแสดงในหน้า Seller ของคุณ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`${UPLOAD_AREA_CLASSES.base} ${UPLOAD_AREA_CLASSES.success}`}>
                {profileFile ? (
                  <div className="space-y-6">
                    <div className="mx-auto w-40 h-40 border-2 border-gray-200 rounded-full overflow-hidden bg-white shadow-md">
                      <img
                        src={profilePreview || ''}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <FiCheck className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-green-600">รูปโปรไฟล์พร้อมใช้งาน</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={removeProfileFile}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 hover:bg-red-100"
                          >
                            <FiX className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-6 text-center">
                    <div className={`${ICON_CONTAINER_CLASSES.base} ${ICON_CONTAINER_CLASSES.success}`}>
                      <FiUser className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <label htmlFor="profileFile" className="cursor-pointer">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="h-12 px-6 border-2 border-gray-200 text-green-600 bg-white hover:bg-green-50 hover:border-green-300 shadow-sm font-medium"
                          asChild
                        >
                          <span>
                            <FiPlus className="w-5 h-5 mr-2" />
                            เลือกรูปโปรไฟล์
                          </span>
                        </Button>
                        <input
                          id="profileFile"
                          name="profileFile"
                          type="file"
                          className="sr-only"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={loading}
                          ref={profileInputRef}
                          onChange={handleProfileChange}
                        />
                      </label>
                    </div>
                    <p className="text-sm text-gray-600 bg-white rounded-lg px-4 py-2 border border-gray-200">
                      ใช้สำหรับแสดงในโปรไฟล์ Seller ของคุณ
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents Upload - Professional styling */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <div style={{background: "linear-gradient(to bottom right, #9ca3af, #6b7280)"}} className="w-10 h-10 rounded-full text-white flex items-center justify-center mr-4 font-bold text-sm">
                  4
                </div>
                เอกสารเพิ่มเติม
                <Badge variant="outline" className="ml-3 text-gray-600 border-gray-300 bg-white">
                  ไม่บังคับ
                </Badge>
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                เช่น ประวัติการทำงาน ใบประกาศนียบัตร ใบรับรองต่างๆ เพื่อเพิ่มความน่าเชื่อถือ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentFiles.length > 0 && (
                <Card className="bg-white border-gray-200 mb-6 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <FiClipboard className="w-4 h-4 text-gray-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">
                          เอกสารที่เลือก ({documentFiles.length} ไฟล์)
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDocumentFiles([])}
                        disabled={loading}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-800"
                      >
                        ลบทั้งหมด
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {documentFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                              <FiFileText className="h-6 w-6 text-gray-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(1)} MB • PDF</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDocument(index)}
                            disabled={loading}
                            className="flex-shrink-0 text-red-600 hover:text-red-800 hover:bg-red-100"
                            title="ลบไฟล์นี้"
                          >
                            <FiX className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-2xl bg-white p-8 hover:border-gray-400 hover:bg-gray-50/50 transition-all duration-300 group">
                <div className="space-y-6 text-center">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <FiFileText className="w-10 h-10 text-gray-600" />
                  </div>
                  <div>
                    <label htmlFor="documentsFile" className="cursor-pointer">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="h-12 px-6 border-2 border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 shadow-sm font-medium"
                        asChild
                      >
                        <span>
                          <FiPlus className="w-5 h-5 mr-2" />
                          {documentFiles.length > 0 ? 'เพิ่มเอกสาร' : 'อัปโหลดเอกสาร'}
                        </span>
                      </Button>
                      <input
                        id="documentsFile"
                        name="documentsFile"
                        type="file"
                        className="sr-only"
                        accept="application/pdf"
                        multiple
                        disabled={loading}
                        ref={documentsInputRef}
                        onChange={handleDocumentsChange}
                      />
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 bg-white rounded-lg px-4 py-2 border border-gray-200">
                    รองรับไฟล์ PDF • ขนาดไม่เกิน 10MB ต่อไฟล์
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Account Information - Professional styling */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <div style={{background: "linear-gradient(to bottom right, #fe9813, #febf12)"}} className="w-10 h-10 rounded-full text-white flex items-center justify-center mr-4 font-bold text-sm">
                  5
                </div>
                ข้อมูลบัญชีธนาคาร
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                กรอกข้อมูลบัญชีธนาคารสำหรับรับเงินค่าคอมมิชชั่น
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="bankName" className="block text-sm font-semibold text-gray-700">
                    ชื่อธนาคาร <span className="text-primary-blue">*</span>
                  </label>
                  <select
                    id="bankName"
                    name="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 text-base w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-primary-blue"
                  >
                    <option value="">เลือกธนาคาร</option>
                    <option value="กสิกรไทย">ธนาคารกสิกรไทย</option>
                    <option value="กรุงเทพ">ธนาคารกรุงเทพ</option>
                    <option value="กรุงไทย">ธนาคารกรุงไทย</option>
                    <option value="ไทยพาณิชย์">ธนาคารไทยพาณิชย์</option>
                    <option value="กรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา</option>
                    <option value="ทหารไทยธนชาต">ธนาคารทหารไทยธนชาต</option>
                    <option value="ออมสิน">ธนาคารออมสิน</option>
                    <option value="อาคารสงเคราะห์">ธนาคารอาคารสงเคราะห์</option>
                    <option value="เกียรตินาคินภัทร">ธนาคารเกียรตินาคินภัทร</option>
                    <option value="ซีไอเอ็มบีไทย">ธนาคารซีไอเอ็มบีไทย</option>
                    <option value="ยูโอบี">ธนาคารยูโอบี</option>
                    <option value="แลนด์ แอนด์ เฮ้าส์">ธนาคารแลนด์ แอนด์ เฮ้าส์</option>
                    <option value="ไอซีบีซี">ธนาคารไอซีบีซี (ไทย)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="accountNumber" className="block text-sm font-semibold text-gray-700">
                    เลขที่บัญชี <span className="text-primary-blue">*</span>
                  </label>
                  <Input
                    id="accountNumber"
                    name="accountNumber"
                    type="text"
                    placeholder="xxx-x-xxxxx-x"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 text-base border-gray-200 focus:border-primary-blue focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="accountName" className="block text-sm font-semibold text-gray-700">
                    ชื่อบัญชี <span className="text-primary-blue">*</span>
                  </label>
                  <Input
                    id="accountName"
                    name="accountName"
                    type="text"
                    placeholder="ชื่อเจ้าของบัญชี"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 text-base border-gray-200 focus:border-primary-blue focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="branch" className="block text-sm font-semibold text-gray-700">
                    สาขา
                  </label>
                  <Input
                    id="branch"
                    name="branch"
                    type="text"
                    placeholder="สาขาที่เปิดบัญชี (ไม่บังคับ)"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    disabled={loading}
                    className="h-12 text-base border-gray-200 focus:border-primary-blue focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
               <div>
                  <p className='text-sm text-red-600'>
                    *กรอกข้อมูลให้ถูกต้องตามบัญชีธนาคารของคุณ เพื่อป้องกันปัญหาในการรับเงินค่าคอมมิชชั่น
                  </p>
                </div>
            </CardContent>
          </Card>
        </form>

        {/* Professional Progress Bar */}
        {uploadProgress && (
          <div className="mt-8 -mx-4 px-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <FiLoader className="animate-spin h-4 w-4 text-primary-blue" />
                    </div>
                    <div className="text-sm text-primary-blue font-semibold">{uploadProgress}</div>
                    <div className="text-sm text-primary-blue font-bold ml-auto bg-white px-3 py-1 rounded-full shadow-sm">{progressPercent}%</div>
                  </div>

                  {/* Professional Progress Bar */}
                  <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      style={{background: "linear-gradient(to right, #176daf, #5c9ad2)", width: `${progressPercent}%`}}
                      className="h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                    />
                  </div>

                  {progressPercent > 0 && (
                    <div className="text-xs text-center font-medium text-primary-blue/80">
                      กำลังดำเนินการ... กรุณารอสักครู่
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Professional Submit Button */}
        <div className="bg-white pt-8 pb-20 md:pb-8 mt-8 -mx-4 px-4 border-t border-gray-200">
          <Button
            type="submit"
            form="verification-form"
            disabled={loading}
            size="lg"
            style={{background: "linear-gradient(to right, #176daf, #5c9ad2)"}} className="w-full h-14 text-base font-bold text-white hover:opacity-90 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {loading ? (
              <div className="flex items-center justify-center relative z-10">
                <div className="w-6 h-6 mr-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>กำลังส่งข้อมูล...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center relative z-10">
                <FiShield className="w-5 h-5 mr-3" />
                <span>ส่งข้อมูลเพื่อยืนยันตัวตน</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}