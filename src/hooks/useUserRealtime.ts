import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useUserRealtime(
  userId: string | undefined,
  tables: string[],
  onChange: () => void,
  onError: (message: string) => void,
  onSubscribed?: () => void
) {
  const tableNames = tables.join(',');

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`health-data-${userId}-${tableNames}`);
    for (const table of tableNames.split(',')) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        onChange
      );
    }
    channel.subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        onSubscribed?.();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError(
          `Live updates are unavailable (${error?.message || status}). Confirm the latest Supabase migrations are applied and the health tables are enabled in the supabase_realtime publication.`
        );
      }
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, tableNames, onChange, onError, onSubscribed]);
}
