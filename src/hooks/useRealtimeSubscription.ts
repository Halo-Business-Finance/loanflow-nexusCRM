import { useEffect, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeSubscriptionOptions {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  schema?: string
  onInsert?: (payload: any) => void
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
  onChange?: (payload: any) => void
}

export function useRealtimeSubscription({
  table,
  event = '*',
  schema = 'public',
  onInsert,
  onUpdate,
  onDelete,
  onChange
}: UseRealtimeSubscriptionOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    // Create a unique channel name
    const channelName = `realtime-${table}-${Date.now()}`
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event: event,
          schema: schema,
          table: table
        },
        (payload: any) => {
          console.log(`Real-time ${payload.eventType} on ${table}:`, payload)
          
          // Call specific event handlers
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload)
              break
            case 'UPDATE':
              onUpdate?.(payload)
              break
            case 'DELETE':
              onDelete?.(payload)
              break
          }
          
          // Call general change handler
          onChange?.(payload)
        }
      )
      .subscribe((status) => {
        console.log(`Real-time subscription status for ${table}:`, status)
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        console.log(`Cleaning up real-time subscription for ${table}`)
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [table, event, schema, onInsert, onUpdate, onDelete, onChange])

  return {
    isConnected: channelRef.current?.state === 'joined'
  }
}