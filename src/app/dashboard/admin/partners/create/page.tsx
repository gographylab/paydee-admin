'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePartners, usePartnerLogoUpload } from '@/hooks/usePartners'
import { PartnerFormData } from '@/types/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import Image from 'next/image'

export default function CreatePartnerPage() {
  const router = useRouter()
  const { createPartner } = usePartners()
  const { uploadLogo, uploading } = usePartnerLogoUpload()

  const [formData, setFormData] = useState<PartnerFormData>({
    name: '',
    description: '',
    logo_url: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    is_active: true
  })

  const [logoPreview, setLogoPreview] = useState<string>('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof PartnerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file must be less than 5MB')
      return
    }

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Logo must be JPEG, PNG, or WebP format')
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Store file for later upload
    setLogoFile(file)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Partner name must be at least 2 characters'
    }

    if (formData.name.length > 100) {
      newErrors.name = 'Partner name must be less than 100 characters'
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email format'
    }

    if (formData.website && !formData.website.startsWith('http')) {
      newErrors.website = 'Website must start with http:// or https://'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    try {
      setSubmitting(true)

      // Upload logo first if there's a file
      let logoUrl = formData.logo_url
      if (logoFile) {
        try {
          logoUrl = await uploadLogo(logoFile)
        } catch (error: any) {
          toast.error(error.message || 'Failed to upload logo')
          setSubmitting(false)
          return
        }
      }

      // Create partner with logo URL
      await createPartner({
        ...formData,
        logo_url: logoUrl
      })

      toast.success('Partner created successfully')
      router.push('/dashboard/admin/partners')
    } catch (error: any) {
      // Error already handled in hook
      console.error('Create partner error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Partner</h1>
          <p className="text-sm text-gray-600 mt-1">
            เพิ่ม Partner ใหม่ที่ให้บริการทริป
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Partner Logo */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Partner Logo</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              {logoPreview || formData.logo_url ? (
                <div className="relative h-32 w-32 rounded-full overflow-hidden bg-gray-100">
                  <Image
                    src={logoPreview || formData.logo_url || ''}
                    alt="Partner logo"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center">
                  <PhotoIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="logo-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Logo (รูปวงกลม แนะนำ 400x400px)
              </Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
              <p className="text-xs text-gray-500 mt-1">
                JPEG, PNG, or WebP. Max 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

          <div>
            <Label htmlFor="name">
              Partner Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="ชื่อ Partner"
              required
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="รายละเอียดเกี่ยวกับ partner..."
              rows={4}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>

          <div>
            <Label htmlFor="contact_email">Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleInputChange('contact_email', e.target.value)}
              placeholder="contact@partner.com"
            />
            {errors.contact_email && (
              <p className="text-sm text-red-600 mt-1">{errors.contact_email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="contact_phone">Phone</Label>
            <Input
              id="contact_phone"
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => handleInputChange('contact_phone', e.target.value)}
              placeholder="02-XXX-XXXX"
            />
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://www.partner.com"
            />
            {errors.website && (
              <p className="text-sm text-red-600 mt-1">{errors.website}</p>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Status</h2>
              <p className="text-sm text-gray-600 mt-1">
                เปิดใช้งาน partner นี้ในระบบ
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || uploading}
          >
            {submitting ? 'Creating...' : 'Create Partner'}
          </Button>
        </div>
      </form>
    </div>
  )
}
