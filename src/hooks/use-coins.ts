import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const coinKeys = {
  all: ['coins'] as const,
  balance: () => [...coinKeys.all, 'balance'] as const,
  transactions: () => [...coinKeys.all, 'transactions'] as const,
  campaigns: () => [...coinKeys.all, 'campaigns'] as const,
  redemptions: () => [...coinKeys.all, 'redemptions'] as const,
}

export function useCoinBalance() {
  return useQuery({
    queryKey: coinKeys.balance(),
    queryFn: async () => {
      const response = await fetch('/api/coins')
      if (!response.ok) throw new Error('Failed to fetch coin balance')
      return response.json()
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  })
}

export function useCoinTransactions() {
  return useQuery({
    queryKey: coinKeys.transactions(),
    queryFn: async () => {
      const response = await fetch('/api/coins/transactions')
      if (!response.ok) throw new Error('Failed to fetch transactions')
      return response.json()
    },
  })
}

export function useCoinCampaigns() {
  return useQuery({
    queryKey: coinKeys.campaigns(),
    queryFn: async () => {
      const response = await fetch('/api/coins/campaigns')
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      return response.json()
    },
  })
}

export function useRedeemCoins() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch('/api/coins/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      if (!response.ok) throw new Error('Failed to redeem coins')
      return response.json()
    },
    onSuccess: () => {
      // Invalidate balance and transactions
      queryClient.invalidateQueries({ queryKey: coinKeys.balance() })
      queryClient.invalidateQueries({ queryKey: coinKeys.transactions() })
    },
  })
}

// Admin hooks for coin management
export function useAdminCoinRedemptions() {
  return useQuery({
    queryKey: [...coinKeys.redemptions(), 'admin'],
    queryFn: async () => {
      const response = await fetch('/api/admin/coins/redemptions')
      if (!response.ok) throw new Error('Failed to fetch redemptions')
      return response.json()
    },
  })
}

export function useUpdateRedemptionStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/admin/coins/redemptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Failed to update redemption status')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...coinKeys.redemptions(), 'admin'] })
    },
  })
}

export function useAdminCoinCampaigns() {
  return useQuery({
    queryKey: [...coinKeys.campaigns(), 'admin'],
    queryFn: async () => {
      const response = await fetch('/api/admin/coins/campaigns')
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      return response.json()
    },
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (campaign: any) => {
      const response = await fetch('/api/admin/coins/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      })
      if (!response.ok) throw new Error('Failed to create campaign')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...coinKeys.campaigns(), 'admin'] })
      queryClient.invalidateQueries({ queryKey: coinKeys.campaigns() })
    },
  })
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...campaign }: any & { id: string }) => {
      const response = await fetch(`/api/admin/coins/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      })
      if (!response.ok) throw new Error('Failed to update campaign')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...coinKeys.campaigns(), 'admin'] })
      queryClient.invalidateQueries({ queryKey: coinKeys.campaigns() })
    },
  })
}
