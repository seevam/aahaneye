import { Router, Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../config/database';
import { patientProfiles } from '../db/schema';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPatientSchema, updatePatientSchema } from '@eyecare/shared';

const router = Router();

// All routes require auth
router.use(authenticate);

// GET /patients
router.get('/', async (req: Request, res: Response) => {
  try {
    const patients = await db.query.patientProfiles.findMany({
      where: and(
        eq(patientProfiles.userId, req.user!.userId),
        eq(patientProfiles.isActive, true),
      ),
      orderBy: (p, { asc }) => [asc(p.createdAt)],
    });
    res.json({ data: patients });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch patients', statusCode: 500 });
  }
});

// POST /patients
router.post('/', validate(createPatientSchema), async (req: Request, res: Response) => {
  try {
    const [patient] = await db.insert(patientProfiles).values({
      ...req.body,
      userId: req.user!.userId,
    }).returning();

    res.status(201).json({ data: patient });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create patient', statusCode: 500 });
  }
});

// GET /patients/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const patient = await db.query.patientProfiles.findFirst({
      where: and(
        eq(patientProfiles.id, req.params.id),
        eq(patientProfiles.userId, req.user!.userId),
      ),
    });

    if (!patient) {
      res.status(404).json({ error: 'Not Found', message: 'Patient not found', statusCode: 404 });
      return;
    }

    res.json({ data: patient });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch patient', statusCode: 500 });
  }
});

// PUT /patients/:id
router.put('/:id', validate(updatePatientSchema), async (req: Request, res: Response) => {
  try {
    const [updated] = await db.update(patientProfiles)
      .set(req.body)
      .where(and(
        eq(patientProfiles.id, req.params.id),
        eq(patientProfiles.userId, req.user!.userId),
      ))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Not Found', message: 'Patient not found', statusCode: 404 });
      return;
    }

    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update patient', statusCode: 500 });
  }
});

// DELETE /patients/:id (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const [updated] = await db.update(patientProfiles)
      .set({ isActive: false })
      .where(and(
        eq(patientProfiles.id, req.params.id),
        eq(patientProfiles.userId, req.user!.userId),
      ))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Not Found', message: 'Patient not found', statusCode: 404 });
      return;
    }

    res.json({ data: { message: 'Patient removed' } });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete patient', statusCode: 500 });
  }
});

export default router;
