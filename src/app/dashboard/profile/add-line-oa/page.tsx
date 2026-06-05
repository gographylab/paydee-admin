'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle2, Copy, Check, ArrowRight } from 'lucide-react'
import { LINE_OA } from '@/constants/booking'

export default function AddLineOAPage() {
  const router = useRouter()
  const [isChecked, setIsChecked] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyLineId = async () => {
    try {
      await navigator.clipboard.writeText(LINE_OA.id)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleComplete = () => {
    if (isChecked) {
      router.push('/dashboard/trips')
    }
  }

  return (
    <div className="h-screen ">
      {/* Full Height Container with Overflow Control */}
      <div className="h-full overflow-y-auto pt-10">
        <div className="container mx-auto px-4 py-4 md:py-6 lg:py-8">
          <div className="max-w-6xl mx-auto">

            {/* Main Content - Two Column Layout on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">

              {/* Left Column - QR Code & LINE Info */}
              <div className="bg-white rounded-xl shadow-xl p-4 md:p-6">
                <div className="flex flex-col items-center">
                  {/* Step Badge */}
                  <div className="mb-3 md:mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs md:text-sm font-semibold">
                      ขั้นตอนสำคัญ
                    </span>
                  </div>

                  <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1 text-center">
                    เพิ่มเพื่อน LINE OA
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-5 text-center">
                    เพื่อรับทราบผลการสมัครและข่าวสารสำคัญ
                  </p>

                  {/* QR Code - Compact */}
                  <div className="relative w-full max-w-[200px] md:max-w-[240px] aspect-square bg-white rounded-xl flex items-center justify-center mb-4 border-2 border-gray-200 shadow-inner p-2">
                    <Image
                      src={LINE_OA.qrImagePath}
                      alt="LINE OA QR Code"
                      width={240}
                      height={240}
                      className="rounded-xl w-full h-full object-contain"
                      priority
                    />
                  </div>

                  {/* LINE ID Display - Compact */}
                  <div className="w-full mb-4">
                    <label className="block text-[10px] md:text-xs font-medium text-gray-500 mb-1 text-center uppercase tracking-wide">
                      LINE ID
                    </label>
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex items-center gap-2 bg-gray-50 px-3 md:px-4 py-2 md:py-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
                        <span className="text-lg md:text-xl font-mono font-semibold text-gray-900">
                          {LINE_OA.id}
                        </span>
                        <button
                          onClick={handleCopyLineId}
                          className="p-1.5 hover:bg-gray-200 rounded-lg transition-all transform hover:scale-110"
                          title="คัดลอก LINE ID"
                        >
                          {isCopied ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                    {isCopied && (
                      <p className="text-xs text-green-600 text-center mt-1 font-medium">
                        ✓ คัดลอกแล้ว!
                      </p>
                    )}
                  </div>

                  {/* Open LINE Button */}
                  <a
                    href={LINE_OA.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#06C755] hover:bg-[#05b34d] text-white font-semibold text-sm md:text-base rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                    </svg>
                    เปิด LINE เพื่อเพิ่มเพื่อน
                  </a>
                </div>
              </div>

              {/* Right Column - Instructions & Actions */}
              <div className="space-y-3 md:space-y-4">
                {/* Instructions Card - Compact */}
                <div className="bg-white rounded-xl shadow-xl p-4 md:p-5 hidden lg:block">
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <span className="flex items-center justify-center w-7 h-7 bg-blue-100 rounded-full text-blue-600 text-xs font-bold">
                      ?
                    </span>
                    วิธีเพิ่มเพื่อน
                  </h3>

                  <div className="space-y-2 md:space-y-3 ">
                    {/* Step 1 */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-7 h-7 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm mb-0.5">Scan QR Code</p>
                        <p className="text-xs text-gray-600">
                          ใช้แอป LINE เปิดกล้องแล้ว scan QR Code ด้านซ้าย
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-l-2 border-gray-200 ml-3.5 h-4"></div>

                    {/* Step 2 */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-7 h-7 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm mb-0.5">กดเพิ่มเพื่อน</p>
                        <p className="text-xs text-gray-600">
                          คลิกปุ่ม "เพิ่มเพื่อน" ในแอป LINE
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-l-2 border-gray-200 ml-3.5 h-4"></div>

                    {/* Step 3 */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-7 h-7 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm mb-0.5">เสร็จสิ้น</p>
                        <p className="text-xs text-gray-600">
                          กลับมาที่หน้านี้แล้วกดปุ่ม "เสร็จสิ้น"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Alert - Compact */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-3 md:p-4">
                  <div className="flex gap-2.5">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs md:text-sm text-blue-900">
                      <p className="font-bold mb-1">ทีมงานจะติดต่อกลับ</p>
                      <p className="text-blue-800">
                        หลังตรวจสอบเอกสารภายใน <span className="font-semibold">1-2 วันทำการ</span>
                      </p>
                      <p className="text-blue-700 text-xs mt-1">
                        คุณจะได้รับแจ้งเตือนผ่าน LINE OA นี้
                      </p>
                    </div>
                  </div>
                </div>

                {/* Confirmation Checkbox - Compact */}
                <div className="bg-white rounded-xl shadow-xl p-4 md:p-5">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setIsChecked(e.target.checked)}
                        className="w-5 h-5 rounded-lg border-2 border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-0 cursor-pointer transition-all"
                      />
                    </div>
                    <div>
                      <span className="text-sm md:text-base font-semibold text-gray-900 group-hover:text-gray-700 transition-colors block">
                        ฉันได้เพิ่มเพื่อน LINE OA แล้ว
                      </span>
                      <span className="text-xs text-gray-500 mt-0.5 block">
                        กรุณายืนยันก่อนดำเนินการต่อ
                      </span>
                    </div>
                  </label>
                </div>

                {/* Action Buttons - Compact with bottom padding for mobile navbar */}
                <div className="space-y-2 pb-20 md:pb-0">
                  <button
                    onClick={handleComplete}
                    disabled={!isChecked}
                    className={`w-full py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                      isChecked
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    เสร็จสิ้น
                    {isChecked && <ArrowRight className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
