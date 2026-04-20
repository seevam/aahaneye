import { addMinutes, eachDayOfInterval, getDay } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

interface FixedIntervalParams {
  intervalMinutes: number;
  startTime: string;
  endTime: string;
}

interface CountBasedParams {
  count: number;
  gapMinutes: number;
  startTime: string;
}

interface SpecificTimesParams {
  times: string[];
}

interface GeneratedInstance {
  scheduledTimeUtc: Date;
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hours: h, minutes: m };
}

function dateFromDayAndTime(day: Date, timeStr: string): Date {
  const { hours, minutes } = parseTime(timeStr);
  const result = new Date(day);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function generateFixedIntervalTimes(day: Date, params: FixedIntervalParams): Date[] {
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

function generateCountBasedTimes(day: Date, params: CountBasedParams): Date[] {
  const times: Date[] = [];
  let current = dateFromDayAndTime(day, params.startTime);
  for (let i = 0; i < params.count; i++) {
    times.push(new Date(current));
    current = addMinutes(current, params.gapMinutes);
  }
  return times;
}

function generateSpecificTimes(day: Date, params: SpecificTimesParams): Date[] {
  return params.times
    .map((t) => dateFromDayAndTime(day, t))
    .sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Generate reminder instances for a schedule across a date range.
 * Used by the API to create instance records in the database.
 */
export function generateInstancesForSchedule(
  schedulingMode: string,
  schedulingParams: { mode: string; params: Record<string, unknown> },
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
    if (!daysOfWeek.includes(getDay(day))) continue;

    let localTimes: Date[];
    const params = schedulingParams.params;

    switch (schedulingMode) {
      case 'fixed_interval':
        localTimes = generateFixedIntervalTimes(day, params as unknown as FixedIntervalParams);
        break;
      case 'count_based':
        localTimes = generateCountBasedTimes(day, params as unknown as CountBasedParams);
        break;
      case 'specific_times':
        localTimes = generateSpecificTimes(day, params as unknown as SpecificTimesParams);
        break;
      default:
        localTimes = [];
    }

    for (const localTime of localTimes) {
      instances.push({ scheduledTimeUtc: fromZonedTime(localTime, timezone) });
    }
  }

  return instances;
}

/**
 * Resolve conflicts using shift_forward_minimally.
 */
export function resolveConflicts(
  times: Date[],
  minSpacingMinutes: number,
): { resolved: Date[]; unschedulable: string[] } {
  if (times.length <= 1) return { resolved: [...times], unschedulable: [] };

  const sorted = [...times].sort((a, b) => a.getTime() - b.getTime());
  const resolved: Date[] = [sorted[0]];
  const unschedulable: string[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = resolved[resolved.length - 1];
    const current = sorted[i];
    const gapMs = current.getTime() - prev.getTime();
    const gapMin = gapMs / 60000;

    if (gapMin >= minSpacingMinutes) {
      resolved.push(current);
    } else {
      const shiftBy = minSpacingMinutes - gapMin;
      const shifted = addMinutes(current, shiftBy);
      if (shifted.getDate() !== current.getDate()) {
        unschedulable.push(
          `A reminder at ${current.toISOString()} could not be scheduled: shifting by ${minSpacingMinutes}-minute minimum gap would push it past midnight.`,
        );
      } else {
        resolved.push(shifted);
      }
    }
  }

  return { resolved, unschedulable };
}
