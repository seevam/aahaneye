import { addMinutes, parse, format, eachDayOfInterval, getDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import type {
  SchedulingMode,
  FixedIntervalParams,
  CountBasedParams,
  SpecificTimesParams,
} from '@eyecare/shared';

export interface GeneratedInstance {
  scheduledTimeLocal: Date; // in patient timezone
  scheduledTimeUtc: Date;  // converted to UTC
}

/**
 * Parse a HH:mm string into hours and minutes
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hours: h, minutes: m };
}

/**
 * Create a Date from a day and HH:mm time string
 */
function dateFromDayAndTime(day: Date, timeStr: string): Date {
  const { hours, minutes } = parseTime(timeStr);
  const result = new Date(day);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Generate times for a fixed interval schedule within a single day.
 * "Every N minutes between startTime and endTime"
 */
function generateFixedIntervalTimes(
  day: Date,
  params: FixedIntervalParams,
): Date[] {
  const times: Date[] = [];
  const start = dateFromDayAndTime(day, params.startTime);
  const end = dateFromDayAndTime(day, params.endTime);

  let current = start;
  while (current <= end) {
    times.push(new Date(current));
    current = addMinutes(current, params.intervalMinutes);
  }

  return times;
}

/**
 * Generate times for a count-based schedule within a single day.
 * "X times, Y minutes apart, starting at Z"
 */
function generateCountBasedTimes(
  day: Date,
  params: CountBasedParams,
): Date[] {
  const times: Date[] = [];
  let current = dateFromDayAndTime(day, params.startTime);

  for (let i = 0; i < params.count; i++) {
    times.push(new Date(current));
    current = addMinutes(current, params.gapMinutes);
  }

  return times;
}

/**
 * Generate times for a specific-times schedule within a single day.
 */
function generateSpecificTimes(
  day: Date,
  params: SpecificTimesParams,
): Date[] {
  return params.times
    .map((t) => dateFromDayAndTime(day, t))
    .sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Generate all reminder instances for a schedule across a date range.
 * Returns times in both local (patient TZ) and UTC.
 */
export function generateInstances(
  mode: SchedulingMode,
  params: FixedIntervalParams | CountBasedParams | SpecificTimesParams,
  timezone: string,
  startDate: string,
  endDate: string,
  daysOfWeek: number[] = [0, 1, 2, 3, 4, 5, 6],
): GeneratedInstance[] {
  const days = eachDayOfInterval({
    start: new Date(startDate),
    end: new Date(endDate),
  });

  const instances: GeneratedInstance[] = [];

  for (const day of days) {
    const dayOfWeek = getDay(day); // 0 = Sunday
    if (!daysOfWeek.includes(dayOfWeek)) continue;

    let localTimes: Date[];

    switch (mode) {
      case 'fixed_interval':
        localTimes = generateFixedIntervalTimes(day, params as FixedIntervalParams);
        break;
      case 'count_based':
        localTimes = generateCountBasedTimes(day, params as CountBasedParams);
        break;
      case 'specific_times':
        localTimes = generateSpecificTimes(day, params as SpecificTimesParams);
        break;
      default:
        localTimes = [];
    }

    for (const localTime of localTimes) {
      // Convert local time to UTC for storage
      const utcTime = fromZonedTime(localTime, timezone);

      instances.push({
        scheduledTimeLocal: localTime,
        scheduledTimeUtc: utcTime,
      });
    }
  }

  return instances;
}
