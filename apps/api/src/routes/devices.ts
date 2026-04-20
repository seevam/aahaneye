import { Router, Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../config/database';
import { devices } from '../db/schema';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerDeviceSchema } from '@eyecare/shared';

const router = Router();
router.use(authenticate);

// POST /devices
router.post('/', validate(registerDeviceSchema), async (req: Request, res: Response) => {
  try {
    const [device] = await db.insert(devices).values({
      ...req.body,
      userId: req.user!.userId,
      lastSeenAt: new Date(),
    }).returning();

    res.status(201).json({ data: device });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to register device', statusCode: 500 });
  }
});

// PUT /devices/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { pushToken } = req.body;

    const [updated] = await db.update(devices)
      .set({ pushToken, lastSeenAt: new Date() })
      .where(and(
        eq(devices.id, req.params.id),
        eq(devices.userId, req.user!.userId),
      ))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Not Found', message: 'Device not found', statusCode: 404 });
      return;
    }

    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update device', statusCode: 500 });
  }
});

export default router;
