import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useUserRealtime(
  userId: string | undefined,
  tables: string[],
  onChange: () => void,
  onError: (message: string) => void
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
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError(
          `Live updates are unavailable (${error?.message || status}). Apply the latest Supabase migrations and enable Realtime for the health tables.`
        );
      }
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, tableNames, onChange, onError]);
}
