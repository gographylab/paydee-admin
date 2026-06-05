'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface Campaign {
  id: string
  title: string
  coin_amount: number
  campaign_type: string
  target_trip_id: string | null
}

// Query keys for campaigns
export const campaignKeys = {
  all: ['campaigns'] as const,
  active: () => [...campaignKeys.all, 'active'] as const,
  byTrip: (tripId: string) => [...campaignKeys.active(), tripId] as const,
}

/**
 * Fetch all active campaigns
 * This prevents N+1 queries by fetching all campaigns once
 */
async function fetchActiveCampaigns(): Promise<Campaign[]> {
  const supabase = createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('coin_bonus_campaigns')
    .select('id, title, coin_amount, campaign_type, target_trip_id')
    .eq('is_active', true)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('coin_amount', { ascending: false })

  if (error) {
    console.error('Error fetching campaigns:', error)
    throw error
  }

  return data || []
}

/**
 * Hook to get all active campaigns
 */
export function useActiveCampaigns() {
  return useQuery({
    queryKey: campaignKeys.active(),
    queryFn: fetchActiveCampaigns,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    retry: 1,
  })
}

/**
 * Hook to get campaign for a specific trip
 * Uses the cached active campaigns to avoid N+1 queries
 */
export function useTripCampaign(tripId: string) {
  const { data: campaigns, isLoading, error } = useActiveCampaigns()

  const tripCampaign = campaigns?.find(
    (campaign) =>
      campaign.target_trip_id === tripId || campaign.campaign_type === 'general'
  ) || null

  return {
    campaign: tripCampaign,
    isLoading,
    error,
  }
}
