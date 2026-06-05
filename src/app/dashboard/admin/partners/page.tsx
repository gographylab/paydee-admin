'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePartners } from '@/hooks/usePartners'
import { Partner } from '@/types/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import Image from 'next/image'

export default function PartnersPage() {
  const router = useRouter()
  const { partners, loading, pagination, fetchPartners, deletePartner } = usePartners()
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  })

  useEffect(() => {
    loadPartners()
  }, [filter, search])

  useEffect(() => {
    // Calculate stats from partners list
    const active = partners.filter(p => p.is_active).length
    const inactive = partners.filter(p => !p.is_active).length
    setStats({
      total: partners.length,
      active,
      inactive
    })
  }, [partners])

  const loadPartners = async (page: number = 1) => {
    const filters: any = {}
    if (filter !== 'all') {
      filters.status = filter
    }
    if (search) {
      filters.search = search
    }
    await fetchPartners(page, filters)
  }

  const handleSearch = () => {
    setSearch(searchInput)
    loadPartners()
  }

  const handleDelete = async (id: string) => {
    if (deleting) return // Prevent multiple clicks

    try {
      // Set deleting state
      setDeleting(id)
      // Reset confirm state immediately
      setDeleteConfirm(null)
      // Then delete
      await deletePartner(id)
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setDeleting(null)
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {isActive ? 'Active' : 'Inactive'}
      </span>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            จัดการข้อมูล Partner ที่ให้บริการทริปต่างๆ
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/admin/partners/create')}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          เพิ่ม Partner
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Partners</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Partners</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive Partners</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              onClick={() => setFilter('active')}
              size="sm"
            >
              Active
            </Button>
            <Button
              variant={filter === 'inactive' ? 'default' : 'outline'}
              onClick={() => setFilter('inactive')}
              size="sm"
            >
              Inactive
            </Button>
          </div>

          {/* Search */}
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="ค้นหาชื่อ partner..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} size="sm">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Partners Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading partners...</p>
          </div>
        ) : partners.length === 0 ? (
          <div className="p-8 text-center">
            <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ไม่พบข้อมูล Partner</p>
            <Button
              onClick={() => router.push('/dashboard/admin/partners/create')}
              className="mt-4"
              size="sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              เพิ่ม Partner แรก
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {partner.logo_url ? (
                          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                            <Image
                              src={partner.logo_url}
                              alt={partner.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {partner.name}
                          </p>
                          {partner.description && (
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {partner.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {partner.contact_email && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">📧</span>
                            <span className="truncate max-w-[200px]">{partner.contact_email}</span>
                          </div>
                        )}
                        {partner.contact_phone && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">📱</span>
                            <span>{partner.contact_phone}</span>
                          </div>
                        )}
                        {!partner.contact_email && !partner.contact_phone && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(partner.is_active)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(partner.created_at).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/admin/partners/edit/${partner.id}`)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        {deleteConfirm === partner.id ? (
                          <div className="flex gap-1">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(partner.id)}
                              disabled={deleting === partner.id}
                            >
                              {deleting === partner.id ? 'Deleting...' : 'Confirm'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirm(null)}
                              disabled={deleting === partner.id}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirm(partner.id)}
                            className="text-red-600 hover:text-red-700"
                            disabled={deleting !== null}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {partners.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {partners.length} of {pagination.total} partners
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => loadPartners(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadPartners(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
