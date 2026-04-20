import { addMinutes, differenceInMinutes } from 'date-fns';
import type { GeneratedInstance } from './engine';

export interface ConflictResult {
  instances: GeneratedInstance[];
  unschedulable: Array<{
    instance: GeneratedInstance;
    reason: string;
  }>;
  shifted: Array<{
    original: Date;
    shifted: Date;
    instance: GeneratedInstance;
  }>;
}

/**
 * Resolve conflicts between reminder instances using the shift_forward_minimally strategy.
 *
 * Algorithm:
 * 1. Sort all instances by scheduled time
 * 2. For each consecutive pair, if gap < minSpacingMinutes:
 *    - Shift the later instance forward by (minSpacing - gap)
 *    - Cascade: re-check from shifted instance onward
 * 3. If a shifted instance crosses midnight (end of day):
 *    - Try backward shift from the end
 *    - If impossible, mark as unschedulable with plain-language explanation
 */
export function resolveConflicts(
  instances: GeneratedInstance[],
  minSpacingMinutes: number,
): ConflictResult {
  if (instances.length <= 1) {
    return { instances: [...instances], unschedulable: [], shifted: [] };
  }

  // Work with copies sorted by time
  const sorted = [...instances].sort(
    (a, b) => a.scheduledTimeLocal.getTime() - b.scheduledTimeLocal.getTime(),
  );

  const result: GeneratedInstance[] = [sorted[0]];
  const unschedulable: ConflictResult['unschedulable'] = [];
  const shifted: ConflictResult['shifted'] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = result[result.length - 1];
    const current = sorted[i];
    const gap = differenceInMinutes(
      current.scheduledTimeLocal,
      prev.scheduledTimeLocal,
    );

    if (gap >= minSpacingMinutes) {
      // No conflict
      result.push(current);
    } else {
      // Shift forward minimally
      const shiftBy = minSpacingMinutes - gap;
      const newLocalTime = addMinutes(current.scheduledTimeLocal, shiftBy);

      // Check if shifted time crosses midnight (next day)
      const originalDay = current.scheduledTimeLocal.getDate();
      const shiftedDay = newLocalTime.getDate();

      if (shiftedDay !== originalDay) {
        // Crossed midnight — try to note this as unschedulable
        unschedulable.push({
          instance: current,
          reason: `This reminder could not be scheduled because shifting it forward to maintain the ${minSpacingMinutes}-minute minimum gap between drops would push it past midnight. Try reducing the number of reminders or increasing the time window.`,
        });
      } else {
        const shiftedInstance: GeneratedInstance = {
          scheduledTimeLocal: newLocalTime,
          scheduledTimeUtc: addMinutes(current.scheduledTimeUtc, shiftBy),
        };

        shifted.push({
          original: current.scheduledTimeLocal,
          shifted: newLocalTime,
          instance: shiftedInstance,
        });

        result.push(shiftedInstance);
      }
    }
  }

  return { instances: result, unschedulable, shifted };
}

/**
 * Check if two individual reminders would conflict.
 * Used to give immediate feedback when adding a new reminder.
 */
export function wouldConflict(
  existingTimes: Date[],
  newTime: Date,
  minSpacingMinutes: number,
): { conflicts: boolean; nearestConflict: Date | null } {
  for (const existing of existingTimes) {
    const gap = Math.abs(differenceInMinutes(newTime, existing));
    if (gap < minSpacingMinutes) {
      return { conflicts: true, nearestConflict: existing };
    }
  }
  return { conflicts: false, nearestConflict: null };
}
