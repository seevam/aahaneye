import notifee, {
  AndroidImportance,
  AndroidCategory,
  TriggerType,
  TimestampTrigger,
  AndroidVisibility,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import type { ReminderInstance, ReminderSchedule } from '@eyecare/shared';

const CHANNEL_ID = 'medication-alarms';
const CHANNEL_NAME = 'Medication Alarms';

/**
 * Initialize notification channels (call once on app start).
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      importance: AndroidImportance.HIGH,
      sound: 'alarm_default',
      vibration: true,
      bypassDnd: false, // User must enable DND bypass in system settings
    });
  }
}

/**
 * Schedule a local notification for a reminder instance.
 * This fires at the scheduled time even when the device is locked.
 */
export async function scheduleReminderNotification(
  instance: ReminderInstance,
  schedule: ReminderSchedule,
): Promise<string | null> {
  const scheduledTime = new Date(instance.scheduledTime).getTime();

  // Don't schedule notifications in the past
  if (scheduledTime <= Date.now()) return null;

  const medicationName = schedule.customMedicationName || 'Medication';
  const dosageText = schedule.dosageText || 'Time for your dose';

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: scheduledTime,
    alarmManager: {
      allowWhileIdle: true, // Survives Android Doze mode
    },
  };

  const notificationId = `reminder-${instance.id}`;

  await notifee.createTriggerNotification(
    {
      id: notificationId,
      title: `💧 ${medicationName}`,
      body: dosageText,
      data: {
        instanceId: instance.id,
        scheduleId: instance.scheduleId,
        medicationName,
        dosageText,
        snoozeCount: String(instance.snoozeCount),
        snoozeLimit: String(schedule.snoozeLimit),
        snoozeIntervalMinutes: String(schedule.snoozeIntervalMinutes),
      },
      android: {
        channelId: CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.ALARM,
        visibility: AndroidVisibility.PUBLIC,
        fullScreenAction: {
          id: 'alarm',
          launchActivity: 'default',
        },
        sound: schedule.soundId === 'default' ? 'alarm_default' : schedule.soundId,
        vibrationPattern: schedule.vibrationEnabled ? [0, 1000, 500, 1000] : undefined,
        pressAction: { id: 'alarm', launchActivity: 'default' },
        actions: [
          { title: 'TAKEN', pressAction: { id: 'taken' } },
          { title: 'SNOOZE', pressAction: { id: 'snooze' } },
          { title: 'SKIP', pressAction: { id: 'skip' } },
        ],
      },
      ios: {
        sound: 'alarm_default.wav',
        interruptionLevel: 'timeSensitive',
        categoryId: 'medication-alarm',
      },
    },
    trigger,
  );

  return notificationId;
}

/**
 * Schedule notifications for multiple instances at once.
 */
export async function scheduleAllReminders(
  instances: ReminderInstance[],
  schedule: ReminderSchedule,
): Promise<number> {
  let scheduled = 0;
  for (const instance of instances) {
    const id = await scheduleReminderNotification(instance, schedule);
    if (id) scheduled++;
  }
  return scheduled;
}

/**
 * Cancel a specific notification.
 */
export async function cancelReminderNotification(instanceId: string): Promise<void> {
  await notifee.cancelNotification(`reminder-${instanceId}`);
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await notifee.cancelAllNotifications();
}

/**
 * Get the count of currently scheduled notifications.
 */
export async function getScheduledCount(): Promise<number> {
  const triggers = await notifee.getTriggerNotificationIds();
  return triggers.length;
}

/**
 * Schedule a snooze notification (fires in N minutes from now).
 */
export async function scheduleSnooze(
  instance: ReminderInstance,
  schedule: ReminderSchedule,
  snoozeMinutes: number,
): Promise<void> {
  const snoozeTime = Date.now() + snoozeMinutes * 60 * 1000;

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: snoozeTime,
    alarmManager: { allowWhileIdle: true },
  };

  const medicationName = schedule.customMedicationName || 'Medication';

  await notifee.createTriggerNotification(
    {
      id: `snooze-${instance.id}-${instance.snoozeCount + 1}`,
      title: `💧 ${medicationName} (Snoozed)`,
      body: schedule.dosageText || 'Time for your dose',
      data: {
        instanceId: instance.id,
        scheduleId: instance.scheduleId,
        medicationName,
        dosageText: schedule.dosageText || '',
        snoozeCount: String(instance.snoozeCount + 1),
        snoozeLimit: String(schedule.snoozeLimit),
        snoozeIntervalMinutes: String(schedule.snoozeIntervalMinutes),
      },
      android: {
        channelId: CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.ALARM,
        fullScreenAction: { id: 'alarm', launchActivity: 'default' },
        sound: 'alarm_default',
        actions: [
          { title: 'TAKEN', pressAction: { id: 'taken' } },
          { title: 'SNOOZE', pressAction: { id: 'snooze' } },
          { title: 'SKIP', pressAction: { id: 'skip' } },
        ],
      },
      ios: {
        sound: 'alarm_default.wav',
        interruptionLevel: 'timeSensitive',
      },
    },
    trigger,
  );
}

/**
 * Set up iOS notification categories with action buttons.
 */
export async function setupIOSCategories(): Promise<void> {
  if (Platform.OS !== 'ios') return;

  await notifee.setNotificationCategories([
    {
      id: 'medication-alarm',
      actions: [
        { id: 'taken', title: 'TAKEN', foreground: true },
        { id: 'snooze', title: 'SNOOZE' },
        { id: 'skip', title: 'SKIP' },
      ],
    },
  ]);
}
