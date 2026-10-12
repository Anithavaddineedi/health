import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import {
  MEDICATION_REMINDERS_UPDATED,
  readLocalMedicationReminders,
} from '@/lib/localMedicationReminders';

interface ReminderRow {
  id: string;
  medication_id: string;
  reminder_time: string;
  timezone: string;
  enabled: boolean;
}

interface MedicationRow {
  id: string;
  name: string;
  dosage: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

function isMissingReminderTable(error: { code?: string; message: string }) {
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    (error.message.includes('medication_reminders') &&
      error.message.toLowerCase().includes('schema cache'))
  );
}

export function MedicationReminderRunner() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let disposed = false;
    let reminders: ReminderRow[] = [];
    let medications = new Map<string, MedicationRow>();

    const loadSchedules = async () => {
      const { data: reminderData, error: reminderError } = await supabase
        .from('medication_reminders')
        .select('id, medication_id, reminder_time, timezone, enabled')
        .eq('user_id', user.id)
        .eq('enabled', true);

      if (reminderError && !isMissingReminderTable(reminderError)) {
        console.error('Unable to load medication reminders:', reminderError.message);
        return;
      }

      let activeReminders: ReminderRow[];
      if (reminderError) {
        try {
          activeReminders = readLocalMedicationReminders(user.id);
        } catch (error) {
          console.error(
            'Unable to load local medication reminders:',
            error instanceof Error ? error.message : 'Unknown error'
          );
          return;
        }
      } else {
        activeReminders = reminderData ?? [];
      }
      const medicationIds = activeReminders.map((reminder) => reminder.medication_id);
      let activeMedications: MedicationRow[] = [];

      if (medicationIds.length > 0) {
        const { data, error } = await supabase
          .from('medications')
          .select('id, name, dosage, status, start_date, end_date')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .in('id', medicationIds);

        if (error) {
          console.error('Unable to load medications for reminders:', error.message);
          return;
        }
        activeMedications = data ?? [];
      }

      if (!disposed) {
        reminders = activeReminders as ReminderRow[];
        medications = new Map(activeMedications.map((medication) => [medication.id, medication]));
      }
    };

    const checkReminders = () => {
      if (disposed || !('Notification' in window) || Notification.permission !== 'granted') return;

      for (const reminder of reminders) {
        const medication = medications.get(reminder.medication_id);
        if (!medication || medication.status !== 'active') continue;

        const now = new Date();
        const localDate = new Intl.DateTimeFormat('en-CA', {
          timeZone: reminder.timezone,
        }).format(now);
        if (medication.start_date && localDate < medication.start_date) continue;
        if (medication.end_date && localDate > medication.end_date) continue;

        const currentTime = new Intl.DateTimeFormat('en-GB', {
          timeZone: reminder.timezone,
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        }).format(now);
        const reminderTime = reminder.reminder_time.slice(0, 5);
        if (currentTime !== reminderTime) continue;

        const firedKey = `health_copilot_reminder_fired:${user.id}:${reminder.id}:${localDate}:${reminderTime}`;
        try {
          if (localStorage.getItem(firedKey)) continue;
        } catch (error) {
          console.error(
            'Unable to check notification history:',
            error instanceof Error ? error.message : 'Unknown error'
          );
          continue;
        }

        const details = medication.dosage ? ` ${medication.dosage}` : '';
        try {
          new Notification(`Medicine reminder: ${medication.name}`, {
            body: `Time to take${details}.`,
            tag: firedKey,
          });
          localStorage.setItem(firedKey, '1');
        } catch (error) {
          console.error(
            'Unable to show or record medication reminder:',
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }
    };

    void loadSchedules();
    const refreshInterval = window.setInterval(() => void loadSchedules(), 60 * 1000);
    const reminderInterval = window.setInterval(checkReminders, 1000);
    const reminderUpdateHandler = () => void loadSchedules();
    const storageHandler = (event: StorageEvent) => {
      if (event.key?.startsWith(`health_copilot_medication_reminders:${user.id}`)) {
        void loadSchedules();
      }
    };
    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        void loadSchedules();
        checkReminders();
      }
    };
    window.addEventListener(MEDICATION_REMINDERS_UPDATED, reminderUpdateHandler);
    window.addEventListener('storage', storageHandler);
    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      disposed = true;
      window.clearInterval(refreshInterval);
      window.clearInterval(reminderInterval);
      window.removeEventListener(MEDICATION_REMINDERS_UPDATED, reminderUpdateHandler);
      window.removeEventListener('storage', storageHandler);
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, [user]);

  return null;
}
