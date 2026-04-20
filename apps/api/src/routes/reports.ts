import { Router, Request, Response } from 'express';
import { eq, and, between, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { reminderInstances, reminderSchedules, patientProfiles } from '../db/schema';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { dateRangeSchema } from '@eyecare/shared';

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

// GET /patients/:patientId/reports/adherence?startDate=&endDate=
router.get('/:patientId/reports/adherence', validate(dateRangeSchema, 'query'), async (req: Request, res: Response) => {
  try {
    if (!(await verifyPatientOwnership(req.params.patientId, req.user!.userId))) {
      res.status(404).json({ error: 'Not Found', message: 'Patient not found', statusCode: 404 });
      return;
    }

    const { startDate, endDate } = req.query as unknown as { startDate: string; endDate: string };

    // Get all instances in the date range
    const instances = await db.query.reminderInstances.findMany({
      where: and(
        eq(reminderInstances.patientId, req.params.patientId),
        between(
          reminderInstances.scheduledTime,
          new Date(startDate),
          new Date(endDate + 'T23:59:59Z'),
        ),
      ),
      with: { schedule: true },
    });

    // Calculate per-medication stats
    const byMedication: Record<string, {
      medicationName: string;
      total: number;
      taken: number;
      missed: number;
      skipped: number;
      snoozed: number;
      adherenceRate: number;
      lastMissed: string | null;
    }> = {};

    for (const inst of instances) {
      const medName = inst.schedule?.customMedicationName || inst.schedule?.medicationId || 'Unknown';
      if (!byMedication[medName]) {
        byMedication[medName] = {
          medicationName: medName,
          total: 0,
          taken: 0,
          missed: 0,
          skipped: 0,
          snoozed: 0,
          adherenceRate: 0,
          lastMissed: null,
        };
      }

      const med = byMedication[medName];
      med.total++;

      switch (inst.status) {
        case 'taken': med.taken++; break;
        case 'missed':
          med.missed++;
          if (!med.lastMissed || inst.scheduledTime.toISOString() > med.lastMissed) {
            med.lastMissed = inst.scheduledTime.toISOString();
          }
          break;
        case 'skipped': med.skipped++; break;
        case 'snoozed': med.snoozed++; break;
      }
    }

    // Calculate adherence rates
    for (const med of Object.values(byMedication)) {
      const actionable = med.total - med.skipped;
      med.adherenceRate = actionable > 0 ? Math.round((med.taken / actionable) * 100) : 0;
    }

    // Overall adherence
    const totalScheduled = instances.length;
    const totalTaken = instances.filter((i) => i.status === 'taken').length;
    const totalSkipped = instances.filter((i) => i.status === 'skipped').length;
    const totalActionable = totalScheduled - totalSkipped;
    const overallRate = totalActionable > 0 ? Math.round((totalTaken / totalActionable) * 100) : 0;

    res.json({
      data: {
        overall: {
          total: totalScheduled,
          taken: totalTaken,
          missed: instances.filter((i) => i.status === 'missed').length,
          skipped: totalSkipped,
          adherenceRate: overallRate,
        },
        byMedication: Object.values(byMedication),
        period: { startDate, endDate },
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to generate report', statusCode: 500 });
  }
});

export default router;
