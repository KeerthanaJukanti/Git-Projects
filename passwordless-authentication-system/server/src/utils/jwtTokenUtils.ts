import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { Response } from 'express';
import { generateSecureToken, createTokenHash } from './security.js';

// Dynamic JWT configuration
const ACCESS_TTL = process.env.JWT_ACCESS_EXPIRES;
const REFRESH_TTL = process.env.JWT_REFRESH_EXPIRES;
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
const COOKIE_PATH = process.env.COOKIE_PATH;

export function signAccessToken(userId: string) {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error('JWT_ACCESS_SECRET is not defined');
  }
  return jwt.sign({ sub: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TTL } as SignOptions);
}

export function signRefreshToken(userId: string) {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }
  return jwt.sign({ sub: userId, typ: 'refresh' }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL } as SignOptions);
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none'),
    path: COOKIE_PATH,
    ...(COOKIE_DOMAIN && { domain: COOKIE_DOMAIN })
  };

  // Calculate max age from JWT expiry times
  const accessMaxAge = parseJwtExpiryToMs(ACCESS_TTL!);
  const refreshMaxAge = parseJwtExpiryToMs(REFRESH_TTL!);

  res.cookie('access_token', accessToken, {
    ...cookieOptions,
    maxAge: accessMaxAge
  });
  res.cookie('refresh_token', refreshToken, {
    ...cookieOptions,
    maxAge: refreshMaxAge
  });
}

export function clearAuthCookies(res: Response) {
  const cookieOptions = {
    path: COOKIE_PATH,
    ...(COOKIE_DOMAIN && { domain: COOKIE_DOMAIN })
  };
  
  res.clearCookie('access_token', cookieOptions);
  res.clearCookie('refresh_token', cookieOptions);
}

export function randomToken(): string { 
  return generateSecureToken(32); 
}

export function hashToken(token: string): string { 
  return createTokenHash(token); 
}

/**
 * Parses JWT expiry string (e.g., '15m', '1d', '2h') to milliseconds
 * @param expiry - JWT expiry string
 * @returns Expiry time in milliseconds
 */
function parseJwtExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid JWT expiry format: ${expiry}`);
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: throw new Error(`Unsupported JWT expiry unit: ${unit}`);
  }
}
