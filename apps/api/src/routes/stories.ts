import { Router, Request, Response } from 'express';
import { eq, and, lte, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { stories } from '../db/schema';
import { optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { paginationSchema } from '@eyecare/shared';

const router = Router();

// GET /stories (public, optional auth)
router.get('/', optionalAuth, validate(paginationSchema, 'query'), async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const offset = (page - 1) * limit;

    const results = await db.query.stories.findMany({
      where: and(
        eq(stories.visibility, 'published'),
        lte(stories.publishTime, new Date()),
      ),
      orderBy: [desc(stories.publishTime)],
      limit,
      offset,
    });

    res.json({ data: results, meta: { page, limit } });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch stories', statusCode: 500 });
  }
});

// GET /stories/:id
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const story = await db.query.stories.findFirst({
      where: eq(stories.id, req.params.id),
    });

    if (!story || (story.visibility !== 'published' && !req.user)) {
      res.status(404).json({ error: 'Not Found', message: 'Story not found', statusCode: 404 });
      return;
    }

    res.json({ data: story });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch story', statusCode: 500 });
  }
});

export default router;
