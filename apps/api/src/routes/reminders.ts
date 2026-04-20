import { Router, Request, Response } from 'express';
import { eq, and, between } from 'drizzle-orm';
import { addDays, format } from 'date-fns';
import { db } from '../config/database';
import { reminderSchedules, reminderInstances, patientProfiles } from '../db/schema';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createReminderSchema, instanceActionSchema, dateRangeSchema } from '@eyecare/shared';
import { generateInstancesForSchedule } from '../services/scheduling';

const router = Router();
router.use(authenticate);

// Helper: verify patient belongs to user
async function verifyPatientOwnership(patientId: string, userId: string): Promise<boolean> {
  const patient = await db.query.patientProfiles.findFirst({
    where: and(
      eq(patientProfiles.id, patientId),
      eq(patientProfiles.userId, userId),
    ),
  });
  return !!patient;
}

// GET /patients/:patientId/reminders
router.get('/:patientId/reminders', async (req: Request, res: Response) => {
  try {
    if (!(await verifyPatientOwnership(req.params.patientId, req.user!.userId))) {
      res.status(404).json({ error: 'Not Found', message: 'Patient not found', statusCode: 404 });
      return;
    }

    const schedules = await db.query.reminderSchedules.findMany({
      where: and(
        eq(reminderSchedules.patientId, req.params.patientId),
        eq(reminderSchedules.isActive, true),
      ),
      with: { medication: true },
    });

    res.json({ data: schedules });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch reminders', statusCode: 500 });
  }
});

// POST /patients/:patientId/reminders
router.post('/:patientId/reminders', validate(createReminderSchema), async (req: Request, res: Response) => {
  try {
    if (!(await verifyPatientOwnership(req.params.patientId, req.user!.userId))) {
      res.status(404).json({ error: 'Not Found', message: 'Patient not found', statusCode: 404 });
      return;
    }

    const [schedule] = await db.insert(reminderSchedules).values({
      ...req.body,
      patientId: req.params.patientId,
    }).returning();

    // Auto-generate instances for the next 7 days
    const endDate = schedule.endDate || format(addDays(new Date(schedule.startDate), 6), 'yyyy-MM-dd');
    const maxEndDate = format(addDays(new Date(), 6), 'yyyy-MM-dd');
    const effectiveEnd = endDate < maxEndDate ? endDate : maxEndDate;

    const generated = generateInstancesForSchedule(
      schedule.schedulingMode,
      schedule.schedulingParams as { mode: string; params: Record<string, unknown> },
      schedule.timezone,
      schedule.startDate,
      effectiveEnd,
      schedule.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
    );

    if (generated.length > 0) {
      await db.insert(reminderInstances).values(
        generated.map((inst) => ({
          scheduleId: schedule.id,
          patientId: req.params.patientId,
          scheduledTime: inst.scheduledTimeUtc,
        })),
      );
    }

    res.status(201).json({ data: { schedule, instancesCreated: generated.length } });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create reminder', statusCode: 500 });
  }
});

// GET /patients/:patientId/reminders/:id
router.get('/:patientId/reminders/:id', async (req: Request, res: Response) => {
  try {
    if (!(await verifyPatientOwnership(req.params.patientId, req.user!.userId))) {
      res.status(404).json({ error: 'Not Found', message: 'Patient not found', statusCode: 404 });
      return;
    }

    const schedule = await db.query.reminderSchedules.findFirst({
      where: and(
        eq(reminderSchedules.id, req.params.id),
        eq(reminderSchedules.patientId, req.params.patientId),
      ),
      with: { medication: true },
    });

    if (!schedule) {
      res.status(404).json({ error: 'Not Found', message: 'Reminder not found', statusCode: 404 });
      return;
    }

    res.json({ data: schedule });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch reminder', statusCode: 500 });
  }
});

// DELETE /patients/:patientId/reminders/:id
router.delete('/:patientId/reminders/:id', async (req: Request, res: Response) => {
  try {
    if (!(await verifyPatientOwnership(req.params.patientId, req.user!.userId))) {
      res.status(404).json({ error: 'Not Found', message: 'Patient not found', statusCode: 404 });
      return;
    }

    const [updated] = await db.update(reminderSchedules)
      .set({ isActive: false })
      .where(and(
        eq(reminderSchedules.id, req.params.id),
        eq(reminderSchedules.patientId, req.params.patientId),
      ))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Not Found', message: 'Reminder not found', statusCode: 404 });
      return;
    }

    res.json({ data: { message: 'Reminder deactivated' } });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete reminder', statusCode: 500 });
  }
});

// POST /patients/:patientId/reminders/preview - Preview generated instances without saving
router.post('/:patientId/reminders/preview', async (req: Request, res: Response) => {
  try {
    if (!(await verifyPatientOwnership(req.params.patientId, req.user!.userId))) {
      res.status(404).json({ error: 'Not Found', message: 'Patient not found', statusCode: 404 });
      return;
    }

    const { schedulingMode, schedulingParams, timezone, startDate, endDate, daysOfWeek } = req.body;
    const effectiveEnd = endDate || format(addDays(new Date(startDate), 6), 'yyyy-MM-dd');

    const instances = generateInstancesForSchedule(
      schedulingMode,
      schedulingParams,
      timezone || 'UTC',
      startDate,
      effectiveEnd,
      daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
    );

    res.json({
      data: {
        instances: instances.map((i) => ({ scheduledTime: i.scheduledTimeUtc.toISOString() })),
        count: instances.length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to preview instances', statusCode: 500 });
  }
});

// GET /patients/:patientId/instances?startDate=&endDate=
router.get('/:patientId/instances', validate(dateRangeSchema, 'query'), async (req: Request, res: Response) => {
  try {
    if (!(await verifyPatientOwnership(req.params.patientId, req.user!.userId))) {
      res.status(404).json({ error: 'Not Found', message: 'Patient not found', statusCode: 404 });
      return;
    }

    const { startDate, endDate } = req.query as unknown as { startDate: string; endDate: string };

    const instances = await db.query.reminderInstances.findMany({
      where: and(
        eq(reminderInstances.patientId, req.params.patientId),
        between(reminderInstances.scheduledTime, new Date(startDate), new Date(endDate + 'T23:59:59Z')),
      ),
      with: { schedule: true },
      orderBy: (i, { asc }) => [asc(i.scheduledTime)],
    });

    res.json({ data: instances });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch instances', statusCode: 500 });
  }
});

// POST /patients/:patientId/instances/:id/action
router.post('/:patientId/instances/:id/action', validate(instanceActionSchema), async (req: Request, res: Response) => {
  try {
    if (!(await verifyPatientOwnership(req.params.patientId, req.user!.userId))) {
      res.status(404).json({ error: 'Not Found', message: 'Patient not found', statusCode: 404 });
      return;
    }

    const instance = await db.query.reminderInstances.findFirst({
      where: and(
        eq(reminderInstances.id, req.params.id),
        eq(reminderInstances.patientId, req.params.patientId),
      ),
    });

    if (!instance) {
      res.status(404).json({ error: 'Not Found', message: 'Instance not found', statusCode: 404 });
      return;
    }

    const { action, notes } = req.body;

    const [updated] = await db.update(reminderInstances)
      .set({
        status: action,
        actualTime: new Date(),
        notes: notes || instance.notes,
        snoozeCount: action === 'snoozed' ? instance.snoozeCount + 1 : instance.snoozeCount,
      })
      .where(eq(reminderInstances.id, req.params.id))
      .returning();

    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update instance', statusCode: 500 });
  }
});

export default router;
