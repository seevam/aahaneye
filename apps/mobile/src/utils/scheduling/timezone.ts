import { fromZonedTime, toZonedTime } from 'date-fns-tz';

/**
 * Convert a local time in a patient's timezone to UTC.
 */
export function localToUtc(localDate: Date, timezone: string): Date {
  return fromZonedTime(localDate, timezone);
}

/**
 * Convert a UTC time to the patient's local timezone.
 */
export function utcToLocal(utcDate: Date, timezone: string): Date {
  return toZonedTime(utcDate, timezone);
}

/**
 * Check if a given date falls within a DST transition for the timezone.
 * Used to detect spring-forward / fall-back ambiguities.
 */
export function isDstTransition(date: Date, timezone: string): {
  isTransition: boolean;
  type: 'spring-forward' | 'fall-back' | null;
} {
  // Check by comparing UTC offsets for the hour before and after
  const hourBefore = new Date(date.getTime() - 60 * 60 * 1000);
  const hourAfter = new Date(date.getTime() + 60 * 60 * 1000);

  const localBefore = toZonedTime(hourBefore, timezone);
  const localAfter = toZonedTime(hourAfter, timezone);

  const offsetBefore = hourBefore.getTime() - localBefore.getTime();
  const offsetAfter = hourAfter.getTime() - localAfter.getTime();

  if (offsetBefore === offsetAfter) {
    return { isTransition: false, type: null };
  }

  // Spring forward: clocks jump ahead, offset increases (UTC offset becomes less negative)
  // Fall back: clocks fall back, offset decreases
  const type = offsetAfter > offsetBefore ? 'spring-forward' : 'fall-back';
  return { isTransition: true, type };
}

/**
 * Handle DST spring-forward: if a scheduled time falls in the skipped hour,
 * shift to the first valid time after the jump.
 */
export function handleSpringForward(
  scheduledLocalTime: Date,
  timezone: string,
): Date {
  // Convert to UTC and back — if the round-trip changes the time,
  // it was in the skipped hour
  const utc = fromZonedTime(scheduledLocalTime, timezone);
  const roundTrip = toZonedTime(utc, timezone);

  // If the round-trip gives a different time, the original was in the gap
  if (roundTrip.getTime() !== scheduledLocalTime.getTime()) {
    // The UTC conversion already pushed it to the correct post-jump time
    return roundTrip;
  }

  return scheduledLocalTime;
}
