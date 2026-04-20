import notifee, { EventType, Event } from '@notifee/react-native';
import { router } from 'expo-router';
import { apiClient } from './api-client';

/**
 * Handle notification events (background and foreground).
 * This processes TAKEN/SNOOZE/SKIP actions from the notification itself,
 * without requiring the user to open the full alarm screen.
 */
export function registerNotificationHandlers(): void {
  // Foreground events
  notifee.onForegroundEvent(handleNotificationEvent);

  // Background events
  notifee.onBackgroundEvent(handleNotificationEvent);
}

async function handleNotificationEvent({ type, detail }: Event): Promise<void> {
  const { notification, pressAction } = detail;
  if (!notification?.data) return;

  const {
    instanceId,
    medicationName,
    dosageText,
    snoozeCount,
    snoozeLimit,
    snoozeIntervalMinutes,
  } = notification.data as Record<string, string>;

  switch (type) {
    case EventType.ACTION_PRESS:
      // User pressed an action button on the notification
      switch (pressAction?.id) {
        case 'taken':
          await markInstanceAction(instanceId, 'taken');
          await notifee.cancelNotification(notification.id!);
          break;

        case 'snooze':
          await markInstanceAction(instanceId, 'snoozed');
          // Snooze notification will be scheduled by the alarm screen or here
          break;

        case 'skip':
          await markInstanceAction(instanceId, 'skipped');
          await notifee.cancelNotification(notification.id!);
          break;

        case 'alarm':
          // User tapped the notification body — open alarm screen
          router.push({
            pathname: '/alarm',
            params: {
              instanceId,
              medicationName,
              dosageText,
              snoozeCount,
              snoozeLimit,
              snoozeIntervalMinutes,
            },
          });
          break;
      }
      break;

    case EventType.PRESS:
      // User tapped the notification itself — open alarm screen
      router.push({
        pathname: '/alarm',
        params: {
          instanceId,
          medicationName,
          dosageText,
          snoozeCount,
          snoozeLimit,
          snoozeIntervalMinutes,
        },
      });
      break;

    case EventType.DISMISSED:
      // Notification was dismissed without action — will be marked missed by timeout
      break;
  }
}

async function markInstanceAction(
  instanceId: string,
  action: 'taken' | 'skipped' | 'snoozed',
): Promise<void> {
  try {
    // We need the patientId to call the API — for now store it in notification data
    // or use a local SQLite lookup. For MVP, we'll try the API and fall back gracefully.
    // The actual patientId resolution will use local storage.
    // For now, log the action — full integration requires local DB.
    console.log(`Instance ${instanceId} marked as ${action}`);
  } catch (err) {
    console.error('Failed to mark instance action:', err);
  }
}
