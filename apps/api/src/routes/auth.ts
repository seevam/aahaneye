import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { eq, or } from 'drizzle-orm';
import { db } from '../config/database';
import { env } from '../config/env';
import { users, refreshTokens } from '../db/schema';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { signupSchema, loginSchema, refreshTokenSchema } from '@eyecare/shared';

const router = Router();

function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign({ userId, role }, env.jwt.secret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
  const refreshToken = crypto.randomBytes(64).toString('hex');
  return { accessToken, refreshToken, expiresIn: 900 }; // 15 min
}

// POST /auth/signup
router.post('/signup', validate(signupSchema), async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, preferredLanguage, timezone } = req.body;

    // Check existing user
    if (email) {
      const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (existing) {
        res.status(409).json({ error: 'Conflict', message: 'Email already registered', statusCode: 409 });
        return;
      }
    }
    if (phone) {
      const existing = await db.query.users.findFirst({ where: eq(users.phone, phone) });
      if (existing) {
        res.status(409).json({ error: 'Conflict', message: 'Phone already registered', statusCode: 409 });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db.insert(users).values({
      name,
      email: email || null,
      phone: phone || null,
      passwordHash,
      preferredLanguage,
      timezone,
    }).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      preferredLanguage: users.preferredLanguage,
      timezone: users.timezone,
    });

    const tokens = generateTokens(user.id, user.role);
    const tokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({ data: { user, ...tokens } });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create account', statusCode: 500 });
  }
});

// POST /auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    const user = await db.query.users.findFirst({
      where: or(eq(users.email, identifier), eq(users.phone, identifier)),
    });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials', statusCode: 401 });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials', statusCode: 401 });
      return;
    }

    const tokens = generateTokens(user.id, user.role);
    const tokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const { passwordHash: _, ...safeUser } = user;
    res.json({ data: { user: safeUser, ...tokens } });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Login failed', statusCode: 500 });
  }
});

// POST /auth/refresh
router.post('/refresh', validate(refreshTokenSchema), async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const stored = await db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.tokenHash, tokenHash),
    });

    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired refresh token', statusCode: 401 });
      return;
    }

    // Rotate: delete old, create new
    await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));

    const user = await db.query.users.findFirst({ where: eq(users.id, stored.userId) });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not found', statusCode: 401 });
      return;
    }

    const tokens = generateTokens(user.id, user.role);
    const newHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: newHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.json({ data: tokens });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Token refresh failed', statusCode: 500 });
  }
});

// DELETE /auth/logout
router.delete('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, req.user!.userId));
    res.json({ data: { message: 'Logged out successfully' } });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Logout failed', statusCode: 500 });
  }
});

export default router;
