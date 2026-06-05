'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminTrips, useCountries } from '@/hooks/useAdminTrips'
import { useActivePartners } from '@/hooks/usePartners'
import { useImageUpload } from '@/hooks/useImageUpload'
import { TripFormData, TripScheduleFormData, COMMISSION_TYPES, VALIDATION_RULES } from '@/types/admin'
import { toast } from 'sonner'
import { Combobox } from '@/components/ui/combobox'

export default function CreateTripPage() {
  const router = useRouter()
  const { createTrip, loading: tripLoading, error: tripError } = useAdminTrips()
  const { countries, loading: countriesLoading } = useCountries()
  const { partners, loading: partnersLoading } = useActivePartners()
  const { uploadImage, uploading: imageUploading, error: imageError } = useImageUpload()

  const [formData, setFormData] = useState<TripFormData>({
    title: '',
    description: '',
    price_per_person: '' as any,
    commission_type: 'percentage',
    commission_value: '' as any,
    country_id: '',
    partner_id: '', // Required field
    cover_image_url: '',
    file_link: '',
    is_active: true,
    schedules: [
      {
        departure_date: '',
        return_date: '',
        registration_deadline: '',
        available_seats: '' as any,
        is_active: true
      }
    ]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Trip validation
    if (!formData.title || formData.title.length < VALIDATION_RULES.TITLE_MIN_LENGTH) {
      newErrors.title = `Title must be at least ${VALIDATION_RULES.TITLE_MIN_LENGTH} characters`
    }
    if (formData.title.length > VALIDATION_RULES.TITLE_MAX_LENGTH) {
      newErrors.title = `Title must be less than ${VALIDATION_RULES.TITLE_MAX_LENGTH} characters`
    }

    if (!formData.description || formData.description.length < VALIDATION_RULES.DESCRIPTION_MIN_LENGTH) {
      newErrors.description = `Description must be at least ${VALIDATION_RULES.DESCRIPTION_MIN_LENGTH} characters`
    }

    const priceValue = Number(formData.price_per_person)
    if (!formData.price_per_person || priceValue < VALIDATION_RULES.PRICE_MIN || priceValue > VALIDATION_RULES.PRICE_MAX) {
      newErrors.price_per_person = `Price must be between ฿${VALIDATION_RULES.PRICE_MIN} and ฿${VALIDATION_RULES.PRICE_MAX}`
    }



    if (!formData.country_id) {
      newErrors.country_id = 'Please select a country'
    }

    if (!formData.partner_id) {
      newErrors.partner_id = 'Please select a partner'
    }

    const maxCommission = formData.commission_type === 'percentage'
      ? VALIDATION_RULES.COMMISSION_MAX_PERCENTAGE
      : VALIDATION_RULES.COMMISSION_MAX_FIXED

    const commissionValue = Number(formData.commission_value)
    if (!formData.commission_value || commissionValue < VALIDATION_RULES.COMMISSION_MIN || commissionValue > maxCommission) {
      newErrors.commission_value = `Commission must be between ${VALIDATION_RULES.COMMISSION_MIN} and ${maxCommission}`
    }

    // Schedule validation
    if (formData.schedules.length < VALIDATION_RULES.MIN_SCHEDULES) {
      newErrors.schedules = `At least ${VALIDATION_RULES.MIN_SCHEDULES} schedule is required`
    }

    formData.schedules.forEach((schedule, index) => {
      if (!schedule.departure_date) {
        newErrors[`schedule_${index}_departure`] = 'Departure date is required'
      }
      if (!schedule.return_date) {
        newErrors[`schedule_${index}_return`] = 'Return date is required'
      }
      if (!schedule.registration_deadline) {
        newErrors[`schedule_${index}_deadline`] = 'Registration deadline is required'
      }
      const seatsValue = Number(schedule.available_seats)
      if (!schedule.available_seats || seatsValue < 1 || seatsValue > 1000) {
        newErrors[`schedule_${index}_seats`] = `Available seats must be between 1 and 1000`
      }

      // Date validation
      if (schedule.departure_date && schedule.return_date) {
        const departure = new Date(schedule.departure_date)
        const returnDate = new Date(schedule.return_date)
        if (returnDate <= departure) {
          newErrors[`schedule_${index}_return`] = 'Return date must be after departure date'
        }
      }

      if (schedule.registration_deadline && schedule.departure_date) {
        const deadline = new Date(schedule.registration_deadline)
        const departure = new Date(schedule.departure_date)
        if (deadline >= departure) {
          newErrors[`schedule_${index}_deadline`] = 'Registration deadline must be before departure date'
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleScheduleChange = (index: number, field: keyof TripScheduleFormData, value: any) => {
    const newSchedules = [...formData.schedules]
    newSchedules[index] = { ...newSchedules[index], [field]: value }
    setFormData({ ...formData, schedules: newSchedules })
  }

  const addSchedule = () => {
    if (formData.schedules.length < VALIDATION_RULES.MAX_SCHEDULES) {
      setFormData({
        ...formData,
        schedules: [
          ...formData.schedules,
          {
            departure_date: '',
            return_date: '',
            registration_deadline: '',
            available_seats: '' as any,
            is_active: true
          }
        ]
      })
    }
  }

  const removeSchedule = (index: number) => {
    if (formData.schedules.length > 1) {
      const newSchedules = formData.schedules.filter((_, i) => i !== index)
      setFormData({ ...formData, schedules: newSchedules })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent double submission
    if (isSubmitting) {
      return
    }

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      let coverImageUrl = formData.cover_image_url

      // Upload image if selected
      if (selectedImage) {
        const tempTripId = `temp-${Date.now()}`
        coverImageUrl = await uploadImage(selectedImage, tempTripId)
      }

      const tripData = {
        ...formData,
        cover_image_url: coverImageUrl,
        price_per_person: Number(formData.price_per_person) || 0,
        commission_value: Number(formData.commission_value) || 0,
        schedules: formData.schedules.map(schedule => ({
          ...schedule,
          available_seats: Number(schedule.available_seats) || 1
        }))
      }

      await createTrip(tripData)
      router.push('/dashboard/admin/trips')
    } catch (error) {
      console.error('Failed to create trip:', error)
      setIsSubmitting(false)
    }
  }

  const loading = tripLoading || imageUploading || isSubmitting
  const error = tripError || imageError

  // Prepare countries data for combobox
  const countryOptions = countries.map(country => ({
    value: country.id,
    label: `${country.flag_emoji} ${country.name} (${country.code})`
  }))

  // Prepare partners data for combobox
  const partnerOptions = partners.map(partner => ({
    value: partner.id,
    label: partner.name
  }))

  // Calculate duration for schedule
  const calculateScheduleDuration = (schedule: TripScheduleFormData) => {
    if (!schedule.departure_date || !schedule.return_date) {
      return { days: 0, nights: 0 }
    }

    const departure = new Date(schedule.departure_date)
    const returnDate = new Date(schedule.return_date)
    
    // Calculate difference in milliseconds
    const diffTime = returnDate.getTime() - departure.getTime()
    // Convert to days: return_date - departure_date + 1
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    
    // Days = number of calendar days
    // Nights = days - 1 (nights spent away)
    const days = diffDays
    const nights = Math.max(0, diffDays - 1)
    
    return { days: Math.max(days, 1), nights: Math.max(nights, 0) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              type="button"
              onClick={() => router.push('/dashboard/admin/trips')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">กลับสู่รายการทริป</span>
            </button>
          </div>

          <div>
            <h1 className="text-xl font-medium text-gray-900 mb-1">สร้างทริปใหม่</h1>
            <p className="text-gray-600 text-sm">กรอกข้อมูลทริปและกำหนดการเดินทาง</p>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Trip Information */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-base font-medium text-gray-900 mb-3 border-b border-gray-100 pb-2">ข้อมูลทริป</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อทริป *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  placeholder="เช่น ทัวร์ญี่ปุ่น 5 วัน 4 คืน"
                />
                {errors.title && <p className="mt-2 text-sm text-red-600 font-medium">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ประเทศ *
                </label>
                <Combobox
                  options={countryOptions}
                  value={formData.country_id}
                  onChange={(value) => setFormData({ ...formData, country_id: value })}
                  placeholder="เลือกประเทศ"
                  searchPlaceholder="ค้นหาประเทศ..."
                  emptyMessage="ไม่พบประเทศที่ค้นหา"
                  className={`${errors.country_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  disabled={countriesLoading}
                />
                {errors.country_id && <p className="mt-2 text-sm text-red-600 font-medium">{errors.country_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partner *
                </label>
                <Combobox
                  options={partnerOptions}
                  value={formData.partner_id}
                  onChange={(value) => setFormData({ ...formData, partner_id: value })}
                  placeholder="เลือก Partner"
                  searchPlaceholder="ค้นหา Partner..."
                  emptyMessage="ไม่พบ Partner ที่ค้นหา"
                  className={`${errors.partner_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  disabled={partnersLoading}
                />
                {errors.partner_id && <p className="mt-2 text-sm text-red-600 font-medium">{errors.partner_id}</p>}
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียดทริป *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  placeholder="อธิบายรายละเอียดทริป จุดหมายปลายทาง กิจกรรม..."
                />
                {errors.description && <p className="mt-2 text-sm text-red-600 font-medium">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ราคาต่อคน (฿) *
                </label>
                <input
                  type="number"
                  value={formData.price_per_person}
                  onChange={(e) => setFormData({ ...formData, price_per_person: Number(e.target.value) })}
                  min={VALIDATION_RULES.PRICE_MIN}
                  max={VALIDATION_RULES.PRICE_MAX}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${errors.price_per_person ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  placeholder="เช่น 25000"
                />
                {errors.price_per_person && <p className="mt-2 text-sm text-red-600 font-medium">{errors.price_per_person}</p>}
              </div>

            </div>
          </div>

          {/* Commission Settings */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">ค่าคอมมิชชั่น</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ประเภทค่าคอมมิชชั่น *
                </label>
                <select
                  value={formData.commission_type}
                  onChange={(e) => setFormData({ ...formData, commission_type: e.target.value as 'fixed' | 'percentage' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                >
                  {COMMISSION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวนค่าคอมมิชชั่น *
                </label>
                <input
                  type="number"
                  value={formData.commission_value}
                  onChange={(e) => setFormData({ ...formData, commission_value: Number(e.target.value) })}
                  min={VALIDATION_RULES.COMMISSION_MIN}
                  max={formData.commission_type === 'percentage' ? VALIDATION_RULES.COMMISSION_MAX_PERCENTAGE : VALIDATION_RULES.COMMISSION_MAX_FIXED}
                  step={formData.commission_type === 'percentage' ? '0.1' : '1'}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${errors.commission_value ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  placeholder={formData.commission_type === 'percentage' ? 'เช่น 10' : 'เช่น 2000'}
                />
                {errors.commission_value && <p className="mt-2 text-sm text-red-600 font-medium">{errors.commission_value}</p>}
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">รูปภาพและข้อมูลเพิ่มเติม</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เลือกรูปภาพ (PNG, JPG, WebP, สูงสุด 5MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                />
              </div>

              {previewUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ตัวอย่างรูปภาพ</label>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-w-md h-64 object-cover rounded-xl border border-gray-200"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หรือ URL รูปภาพ
                </label>
                <input
                  type="url"
                  value={formData.cover_image_url}
                  onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ลิงก์เอกสารประกอบ (Google Drive, Dropbox, etc.)
                </label>
                <input
                  type="url"
                  value={formData.file_link}
                  onChange={(e) => setFormData({ ...formData, file_link: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  placeholder="https://drive.google.com/file/..."
                />
                <p className="mt-2 text-xs text-gray-500">
                  สามารถใส่ลิงก์ไปยังเอกสารบน Google Drive, Dropbox หรือแหล่งอื่นๆ
                </p>
                {formData.file_link && (
                  <div className="mt-3">
                    <a
                      href={formData.file_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 hover:text-blue-800 transition-colors duration-200 text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      ดูลิงก์เอกสารประกอบ
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trip Schedules */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">กำหนดการเดินทาง</h2>
              <button
                type="button"
                onClick={addSchedule}
                disabled={formData.schedules.length >= VALIDATION_RULES.MAX_SCHEDULES}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                เพิ่มกำหนดการ
              </button>
            </div>

            {errors.schedules && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 font-medium">{errors.schedules}</p>
              </div>
            )}

            <div className="space-y-6">
              {formData.schedules.map((schedule, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      กำหนดการที่ {index + 1}
                    </h3>
                    {formData.schedules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSchedule(index)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        ลบกำหนดการนี้
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        วันที่เดินทาง *
                      </label>
                      <input
                        type="date"
                        value={schedule.departure_date}
                        onChange={(e) => handleScheduleChange(index, 'departure_date', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${errors[`schedule_${index}_departure`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                      />
                      {errors[`schedule_${index}_departure`] && (
                        <p className="mt-2 text-sm text-red-600 font-medium">{errors[`schedule_${index}_departure`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        วันที่กลับ *
                      </label>
                      <input
                        type="date"
                        value={schedule.return_date}
                        onChange={(e) => handleScheduleChange(index, 'return_date', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${errors[`schedule_${index}_return`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                      />
                      {errors[`schedule_${index}_return`] && (
                        <p className="mt-2 text-sm text-red-600 font-medium">{errors[`schedule_${index}_return`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        วันปิดรับสมัคร *
                      </label>
                      <input
                        type="date"
                        value={schedule.registration_deadline}
                        onChange={(e) => handleScheduleChange(index, 'registration_deadline', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${errors[`schedule_${index}_deadline`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                      />
                      {errors[`schedule_${index}_deadline`] && (
                        <p className="mt-2 text-sm text-red-600 font-medium">{errors[`schedule_${index}_deadline`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ที่นั่งว่าง *
                      </label>
                      <input
                        type="number"
                        value={schedule.available_seats}
                        onChange={(e) => handleScheduleChange(index, 'available_seats', Number(e.target.value))}
                        min={1}
                        max={1000}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${errors[`schedule_${index}_seats`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder="เช่น 30"
                      />
                      {errors[`schedule_${index}_seats`] && (
                        <p className="mt-2 text-sm text-red-600 font-medium">{errors[`schedule_${index}_seats`]}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={schedule.is_active}
                          onChange={(e) => handleScheduleChange(index, 'is_active', e.target.checked)}
                          className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700">เปิดใช้งาน</span>
                      </label>

                      {/* Duration Display */}
                      {schedule.departure_date && schedule.return_date && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-medium text-emerald-800">
                              ระยะเวลา: {(() => {
                                const duration = calculateScheduleDuration(schedule)
                                return `${duration.days} วัน ${duration.nights} คืน`
                              })()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">สถานะทริป</h2>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="ml-3 text-gray-700 font-medium">เปิดใช้งานทริปนี้หลังจากสร้างเสร็จ</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-8">
            <button
              type="button"
              onClick={() => router.push('/dashboard/admin/trips')}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'กำลังสร้างทริป...' : 'สร้างทริป'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
