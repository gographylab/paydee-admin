'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '../../../../../../database.types'
import { RiDeleteBin2Line } from "react-icons/ri"

interface TripWithSchedules extends Tables<'trips'> {
  countries?: {
    name: string
    flag_emoji: string | null
  }
  trip_schedules?: Array<{
    id: string
    departure_date: string
    return_date: string
    registration_deadline: string
    available_seats: number
    is_active: boolean | null
  }>
}

interface Seller {
  id: string
  full_name: string | null
  email: string | null
  referral_code: string | null
  status?: string | null
}

interface CreateBookingModalProps {
  onClose: () => void
  onBookingCreated: () => void
  sellers: Seller[]
  trips: TripWithSchedules[]
}

interface CustomerForm {
  full_name: string
  email: string
  phone: string
  id_card: string
  passport_number: string
  date_of_birth: string
}

export default function CreateBookingModal({ 
  onClose, 
  onBookingCreated, 
  sellers, 
  trips 
}: CreateBookingModalProps) {
  const [step, setStep] = useState(1) // 1: Trip Selection, 2: Customer Info, 3: Confirmation
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [selectedTripId, setSelectedTripId] = useState('')
  const [selectedScheduleId, setSelectedScheduleId] = useState('')
  const [selectedSellerId, setSelectedSellerId] = useState('')
  const [customers, setCustomers] = useState<CustomerForm[]>([
    {
      full_name: '',
      email: '',
      phone: '',
      id_card: '',
      passport_number: '',
      date_of_birth: ''
    }
  ])
  const [notes, setNotes] = useState('')

  const supabase = createClient()

  const selectedTrip = trips.find(t => t.id === selectedTripId)
  const selectedSchedule = selectedTrip?.trip_schedules?.find(s => s.id === selectedScheduleId)
  const selectedSeller = sellers.find(s => s.id === selectedSellerId)

  // Calculate totals
  const calculateCommission = (trip: TripWithSchedules) => {
    if (!trip) return 0
    if (trip.commission_type === 'percentage') {
      return (trip.price_per_person * trip.commission_value) / 100
    }
    return trip.commission_value
  }

  const totalAmount = selectedTrip ? selectedTrip.price_per_person * customers.length : 0
  const totalCommission = selectedTrip ? calculateCommission(selectedTrip) * customers.length : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const addCustomer = () => {
    setCustomers([...customers, {
      full_name: '',
      email: '',
      phone: '',
      id_card: '',
      passport_number: '',
      date_of_birth: ''
    }])
  }

  const removeCustomer = (index: number) => {
    if (customers.length > 1) {
      setCustomers(customers.filter((_, i) => i !== index))
    }
  }

  const updateCustomer = (index: number, field: keyof CustomerForm, value: string) => {
    const newCustomers = [...customers]
    newCustomers[index] = { ...newCustomers[index], [field]: value }
    setCustomers(newCustomers)
  }

  const validateStep1 = () => {
    if (!selectedTripId || !selectedScheduleId) {
      setError('กรุณาเลือกทริปและกำหนดการเดินทาง')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i]
      if (!customer.full_name || !customer.email) {
        setError(`กรุณากรอกข้อมูลผู้เดินทางคนที่ ${i + 1} ให้ครบถ้วน (ชื่อและอีเมล)`)
        return false
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(customer.email)) {
        setError(`รูปแบบอีเมลของผู้เดินทางคนที่ ${i + 1} ไม่ถูกต้อง`)
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    setError(null)
    
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedTripId,
          selectedScheduleId,
          selectedSellerId: selectedSellerId || null,
          customers,
          notes
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking')
      }

      onBookingCreated()
      
    } catch (err: any) {
      console.error('Error creating booking:', err)
      setError(err.message || 'เกิดข้อผิดพลาดในการสร้างการจอง')
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">เลือกทริปและกำหนดการ</h3>
      
      {/* Trip Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          เลือกทริป *
        </label>
        <select
          value={selectedTripId}
          onChange={(e) => {
            setSelectedTripId(e.target.value)
            setSelectedScheduleId('') // Reset schedule when trip changes
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- เลือกทริป --</option>
          {trips.map((trip) => (
            <option key={trip.id} value={trip.id}>
              {trip.countries?.flag_emoji} {trip.title} - {formatCurrency(trip.price_per_person)}
            </option>
          ))}
        </select>
      </div>

      {/* Schedule Selection */}
      {selectedTrip && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เลือกกำหนดการเดินทาง *
          </label>
          <select
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- เลือกกำหนดการ --</option>
            {selectedTrip.trip_schedules
              ?.filter(schedule => schedule.is_active && new Date(schedule.departure_date) > new Date())
              .map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                {formatDate(schedule.departure_date)} - {formatDate(schedule.return_date)} 
                ({schedule.available_seats} ที่นั่งเหลือ)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Seller Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          กำหนด Seller (ไม่บังคับ)
        </label>
        <select
          value={selectedSellerId}
          onChange={(e) => setSelectedSellerId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- เลือก Seller --</option>
          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {seller.id.slice(-5)} - {seller.full_name || seller.email}
            </option>
          ))}
        </select>
      </div>

      {/* Trip Info */}
      {selectedTrip && selectedSchedule && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">ข้อมูลทริปที่เลือก</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>ทริป:</strong> {selectedTrip.title}</p>
            <p><strong>ประเทศ:</strong> {selectedTrip.countries?.name}</p>
            <p><strong>วันเดินทาง:</strong> {formatDate(selectedSchedule.departure_date)} - {formatDate(selectedSchedule.return_date)}</p>
            <p><strong>ราคาต่อคน:</strong> {formatCurrency(selectedTrip.price_per_person)}</p>
            <p><strong>คอมมิชชั่นต่อคน:</strong> {formatCurrency(calculateCommission(selectedTrip))}</p>
            <p><strong>ที่นั่งเหลือ:</strong> {selectedSchedule.available_seats} ที่นั่ง</p>
          </div>
        </div>
      )}
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">ข้อมูลผู้เดินทาง</h3>
        <button
          onClick={addCustomer}
          className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + เพิ่มผู้เดินทาง
        </button>
      </div>

      {customers.map((customer, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">
              ผู้เดินทางคนที่ {index + 1} {index === 0 && '(ผู้ติดต่อหลัก)'}
            </h4>
            {index > 0 && (
              <button
                onClick={() => removeCustomer(index)}
                className="text-red-400 hover:text-red-600 text-xl font-medium transition-colors duration-200"
              >
                <RiDeleteBin2Line className='w-10 hover:cursor-pointer hover:scale-110 transition-transform duration-200' />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อ-นามสกุล *
              </label>
              <input
                type="text"
                value={customer.full_name}
                onChange={(e) => updateCustomer(index, 'full_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="กรอกชื่อ-นามสกุล"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                อีเมล *
              </label>
              <input
                type="email"
                value={customer.email}
                onChange={(e) => updateCustomer(index, 'email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                value={customer.phone}
                onChange={(e) => updateCustomer(index, 'phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="08x-xxx-xxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันเกิด
              </label>
              <input
                type="date"
                value={customer.date_of_birth}
                onChange={(e) => updateCustomer(index, 'date_of_birth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
{/* 
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เลขบัตรประชาชน
              </label>
              <input
                type="text"
                value={customer.id_card}
                onChange={(e) => updateCustomer(index, 'id_card', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="x-xxxx-xxxxx-xx-x"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หมายเลขพาสปอร์ต
              </label>
              <input
                type="text"
                value={customer.passport_number}
                onChange={(e) => updateCustomer(index, 'passport_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="xxxxxxxx"
              />
            </div> */}
          </div>
        </div>
      ))}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          หมายเหตุเพิ่มเติม
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="หมายเหตุเพิ่มเติมสำหรับการจองนี้..."
        />
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">ยืนยันการจอง</h3>
      
      {/* Trip Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">สรุปการจอง</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>ทริป:</span>
            <span className="font-medium">{selectedTrip?.title}</span>
          </div>
          <div className="flex justify-between">
            <span>วันเดินทาง:</span>
            <span>{selectedSchedule ? `${formatDate(selectedSchedule.departure_date)} - ${formatDate(selectedSchedule.return_date)}` : ''}</span>
          </div>
          <div className="flex justify-between">
            <span>จำนวนผู้เดินทาง:</span>
            <span>{customers.length} คน</span>
          </div>
          <div className="flex justify-between">
            <span>ราคาต่อคน:</span>
            <span>{formatCurrency(selectedTrip?.price_per_person || 0)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
            <span>ยอดรวม:</span>
            <span className="text-blue-600">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>คอมมิชชั่นรวม:</span>
            <span className="text-green-600">{formatCurrency(totalCommission)}</span>
          </div>
          {selectedSeller && (
            <div className="flex justify-between">
              <span>Seller:</span>
              <span>{selectedSeller.full_name} ({selectedSeller.referral_code})</span>
            </div>
          )}
        </div>
      </div>

      {/* Customer Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3">รายชื่อผู้เดินทาง</h4>
        <div className="space-y-2">
          {customers.map((customer, index) => (
            <div key={index} className="text-sm text-blue-800">
              <span className="font-medium">{index + 1}. {customer.full_name}</span>
              <span className="ml-2 text-blue-600">({customer.email})</span>
              {index === 0 && <span className="ml-2 text-blue-500 text-xs">(ผู้ติดต่อหลัก)</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">สร้างการจองใหม่</h2>
            <p className="text-sm text-gray-500 mt-1">ขั้นตอนที่ {step} จาก 3</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-8 py-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between max-w-lg mx-auto relative">
            {/* Background progress line */}
            <div className="absolute top-4 left-6 right-6 h-1 bg-gray-200 rounded-full"></div>
            {/* Active progress line */}
            <div 
              className="absolute top-4 left-6 h-1 bg-green-500 rounded-full transition-all duration-500 ease-in-out"
              style={{ 
                width: step === 1 ? '0%' : 
                       step === 2 ? 'calc(50% - 24px)' : 
                       'calc(100% - 48px)' 
              }}
            ></div>
            
            {[
              { number: 1, label: 'เลือกทริป' },
              { number: 2, label: 'ข้อมูลผู้เดินทาง' },
              { number: 3, label: 'ยืนยันการจอง' }
            ].map((stepData) => (
              <div key={stepData.number} className="relative z-10">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    stepData.number < step 
                      ? 'bg-green-500 text-white shadow-lg' 
                      : stepData.number === step
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white text-gray-400 border-2 border-gray-200'
                  }`}>
                    {stepData.number < step ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      stepData.number
                    )}
                  </div>
                  <span className={`text-sm text-center mt-3 font-medium transition-colors duration-300 ${
                    stepData.number < step 
                      ? 'text-green-600' 
                      : stepData.number === step
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }`}>
                    {stepData.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            {step > 1 ? 'ย้อนกลับ' : 'ยกเลิก'}
          </button>

          <div className="flex gap-2">
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                ถัดไป
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                สร้างการจอง
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
