import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { requestPasswordlessLink, verifyPasswordlessLink, refreshToken, logout, registerUser, clearAllData } from '../services/magicLinkAuthService.js';
import { registrationSchema, passwordlessRequestSchema, tokenSchema } from '../utils/validation.js';

export const authRouter = Router();

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS),
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS),
  standardHeaders: process.env.RATE_LIMIT_STANDARD_HEADERS as 'draft-6' | 'draft-7' | undefined,
  legacyHeaders: process.env.RATE_LIMIT_LEGACY_HEADERS === 'true',
  message: process.env.RATE_LIMIT_MESSAGE
});

authRouter.post('/register', limiter, async (req, res, next) => {
  try {
    const userData = registrationSchema.parse(req.body);
    await registerUser(userData);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/passwordless/request', limiter, async (req, res, next) => {
  try {
    const { email } = passwordlessRequestSchema.parse(req.body);
    await requestPasswordlessLink(email);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/passwordless/verify', async (req, res, next) => {
  try {
    const token = tokenSchema.parse(req.query.token);
    const redirectUrl = await verifyPasswordlessLink(token, req, res);
    res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    await refreshToken(req, res);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', async (_req, res, next) => {
  try {
    await logout(_req, res);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

authRouter.delete('/clear-all-data', async (_req, res, next) => {
  try {
    const result = await clearAllData();
    res.json({ 
      ok: true, 
      message: 'All data cleared successfully',
      usersDeleted: result.usersDeleted,
      tokensDeleted: result.tokensDeleted
    });
  } catch (error) {
    next(error);
  }
});
