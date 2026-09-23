import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { asyncHandler, publicUser } from '../utils/http.js';
import {
  clearSessionCookies,
  getRefreshToken,
  setSessionCookies,
  verifyRefreshToken,
} from '../utils/tokens.js';

const router = Router();
const username = z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username may use letters, numbers, and underscores only.');
const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = z.string().min(8, 'Password must be at least 8 characters.').max(72, 'Password must be at most 72 characters.');
const registerSchema = z.object({ username, email, password });
const loginSchema = z.object({ email, password: z.string().min(1).max(72) });

function invalidBody(response, error) {
  return response.status(422).json({
    message: 'Please correct the highlighted fields.',
    fields: error.flatten().fieldErrors,
  });
}

router.post('/register', asyncHandler(async (request, response) => {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) return invalidBody(response, parsed.error);

  const { username: name, email: address, password: plainPassword } = parsed.data;
  const [existingEmail, existingUsername] = await Promise.all([
    User.exists({ email: address }),
    User.exists({ username: name }),
  ]);
  if (existingEmail) return response.status(409).json({ message: 'An account with this email already exists.' });
  if (existingUsername) return response.status(409).json({ message: 'This username is already taken.' });

  const passwordHash = await bcrypt.hash(plainPassword, env.BCRYPT_ROUNDS);
  try {
    const user = await User.create({ username: name, email: address, passwordHash });
    setSessionCookies(response, user);
    return response.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error?.code === 11000) return response.status(409).json({ message: 'Email or username is already in use.' });
    throw error;
  }
}));

router.post('/login', asyncHandler(async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) return invalidBody(response, parsed.error);

  const user = await User.findOne({ email: parsed.data.email }).select('+passwordHash +refreshTokenVersion');
  const passwordMatches = user && await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!passwordMatches) return response.status(401).json({ message: 'Incorrect email or password.' });

  setSessionCookies(response, user);
  return response.json({ user: publicUser(user) });
}));

router.post('/refresh', asyncHandler(async (request, response) => {
  const token = getRefreshToken(request);
  if (!token) return response.status(401).json({ message: 'Session expired. Please sign in again.' });

  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub).select('+refreshTokenVersion');
    if (!user || user.refreshTokenVersion !== payload.version) throw new Error('Invalid refresh token');
    setSessionCookies(response, user);
    return response.json({ user: publicUser(user) });
  } catch {
    clearSessionCookies(response);
    return response.status(401).json({ message: 'Session expired. Please sign in again.' });
  }
}));

router.post('/logout', asyncHandler(async (request, response) => {
  const token = getRefreshToken(request);
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await User.updateOne(
        { _id: payload.sub, refreshTokenVersion: payload.version },
        { $inc: { refreshTokenVersion: 1 } },
      );
    } catch {
      // Always clear browser cookies, even if an old token cannot be verified.
    }
  }
  clearSessionCookies(response);
  return response.status(204).end();
}));

router.get('/me', requireAuth, (request, response) => response.json({ user: publicUser(request.user) }));

export default router;
