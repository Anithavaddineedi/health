export interface LocalMedicationReminder {
  id: string;
  medication_id: string;
  reminder_time: string;
  timezone: string;
  enabled: boolean;
}

export const MEDICATION_REMINDERS_UPDATED = 'health-copilot:medication-reminders-updated';

export function notifyMedicationRemindersUpdated() {
  window.dispatchEvent(new Event(MEDICATION_REMINDERS_UPDATED));
}

function storageKey(userId: string) {
  return `health_copilot_medication_reminders:${userId}`;
}

export function readLocalMedicationReminders(userId: string): LocalMedicationReminder[] {
  const serialized = localStorage.getItem(storageKey(userId));
  if (!serialized) return [];

  const parsed: unknown = JSON.parse(serialized);
  if (!Array.isArray(parsed)) {
    throw new Error('Saved local medication reminders have an invalid format.');
  }

  return parsed.filter(
    (reminder): reminder is LocalMedicationReminder =>
      typeof reminder === 'object' &&
      reminder !== null &&
      typeof reminder.id === 'string' &&
      typeof reminder.medication_id === 'string' &&
      typeof reminder.reminder_time === 'string' &&
      typeof reminder.timezone === 'string' &&
      typeof reminder.enabled === 'boolean'
  );
}

export function saveLocalMedicationReminder(
  userId: string,
  medicationId: string,
  time: string
): LocalMedicationReminder[] {
  const reminders = readLocalMedicationReminders(userId).filter(
    (reminder) => reminder.medication_id !== medicationId
  );

  if (time) {
    reminders.push({
      id: `local-${medicationId}`,
      medication_id: medicationId,
      reminder_time: time,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      enabled: true,
    });
  }

  localStorage.setItem(storageKey(userId), JSON.stringify(reminders));
  notifyMedicationRemindersUpdated();
  return reminders;
}
