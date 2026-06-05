import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { apiCache } from '@/lib/cache'

interface BackgroundSyncOptions {
  enabled?: boolean
  interval?: number // ในหน่วยมิลลิวินาที
  userRole?: string | null
}

export function useBackgroundSync({ 
  enabled = true, 
  interval = 60000, // 1 นาที
  userRole 
}: BackgroundSyncOptions = {}) {
  const lastCheckRef = useRef<number>(Date.now())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    // เฉพาะ seller เท่านั้น
    if (!enabled || userRole !== 'seller') {
      return
    }

    const checkForUpdates = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // เช็ค last updated time ของ trips
        const { data: tripsData } = await supabase
          .from('trips')
          .select('updated_at')
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)

        if (tripsData && tripsData.length > 0) {
          const updatedAt = tripsData[0].updated_at
          if (!updatedAt) return
          
          const lastTripUpdate = new Date(updatedAt).getTime()
          
          // ถ้า trip มีการ update หลังจากครั้งสุดท้ายที่เช็ค
          if (lastTripUpdate > lastCheckRef.current) {
            console.log('🔄 Trips updated by admin, clearing seller cache...')
            
            // Clear all cache ฝั่ง seller
            apiCache.clear()
            
            // Trigger page refresh หรือ re-fetch data
            window.dispatchEvent(new CustomEvent('tripsUpdated'))
          }
          
          lastCheckRef.current = Date.now()
        }
      } catch (error) {
        console.error('Background sync error:', error)
      }
    }

    // เช็คทันทีเมื่อเริ่มต้น
    checkForUpdates()

    // ตั้ง interval สำหรับเช็คเป็นระยะ
    intervalRef.current = setInterval(checkForUpdates, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, interval, userRole, supabase])

  // Manual refresh function
  const triggerRefresh = () => {
    apiCache.clear()
    window.dispatchEvent(new CustomEvent('tripsUpdated'))
  }

  return { triggerRefresh }
}