import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const profileKeys = {
  all: ['profile'] as const,
  current: () => [...profileKeys.all, 'current'] as const,
  detail: (userId: string) => [...profileKeys.all, userId] as const,
}

/**
 * Get current user profile
 * Cached for 5 minutes, auto-refresh on window focus
 */
export function useProfile() {
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: async () => {
      const res = await fetch('/api/profile')
      if (!res.ok) throw new Error('Failed to fetch profile')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  })
}

/**
 * Get specific user profile by ID
 */
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: async () => {
      const res = await fetch(`/api/profile/${userId}`)
      if (!res.ok) throw new Error('Failed to fetch user profile')
      return res.json()
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Update profile with optimistic updates
 * UI changes instantly before API response
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (profileData: any) => {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })
      if (!res.ok) throw new Error('Failed to update profile')
      return res.json()
    },
    // OPTIMISTIC UPDATE: Show changes immediately
    onMutate: async (newProfile) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileKeys.current() })

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(profileKeys.current())

      // Optimistically update
      queryClient.setQueryData(profileKeys.current(), (old: any) => {
        if (!old) return old
        return { ...old, ...newProfile }
      })

      return { previousProfile }
    },
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(profileKeys.current(), context.previousProfile)
      }
    },
    // Refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.current() })
    },
  })
}

/**
 * Update avatar with progress tracking
 */
export function useUpdateAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Failed to upload avatar')
      return res.json()
    },
    onSuccess: (data) => {
      // Update profile with new avatar URL
      queryClient.setQueryData(profileKeys.current(), (old: any) => {
        if (!old) return old
        return { ...old, avatar_url: data.avatar_url }
      })
    },
  })
}

/**
 * Delete account
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (password: string) => {
      const res = await fetch('/api/profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) throw new Error('Failed to delete account')
      return res.json()
    },
    onSuccess: () => {
      // Clear all cache on account deletion
      queryClient.clear()
    },
  })
}

/**
 * Complete seller verification
 */
export function useCompleteVerification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (verificationData: any) => {
      const res = await fetch('/api/profile/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationData),
      })
      if (!res.ok) throw new Error('Failed to submit verification')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.current() })
    },
  })
}

/**
 * Update LINE notification settings
 */
export function useUpdateLineSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settings: { line_user_id?: string; notify_enabled?: boolean }) => {
      const res = await fetch('/api/profile/line-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Failed to update LINE settings')
      return res.json()
    },
    // Optimistic update
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: profileKeys.current() })
      const previousProfile = queryClient.getQueryData(profileKeys.current())

      queryClient.setQueryData(profileKeys.current(), (old: any) => {
        if (!old) return old
        return { ...old, ...newSettings }
      })

      return { previousProfile }
    },
    onError: (err, variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(profileKeys.current(), context.previousProfile)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.current() })
    },
  })
}
