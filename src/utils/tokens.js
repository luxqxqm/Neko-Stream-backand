import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const accessCookieName = 'nekostream_access';
const refreshCookieName = 'nekostream_refresh';

const baseCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
};

function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString() }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  });
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), version: user.refreshTokenVersion },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_TTL },
  );
}

export function setSessionCookies(response, user) {
  response.cookie(accessCookieName, signAccessToken(user), {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000,
  });
  response.cookie(refreshCookieName, signRefreshToken(user), {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookies(response) {
  response.clearCookie(accessCookieName, baseCookieOptions);
  response.clearCookie(refreshCookieName, baseCookieOptions);
}

export function getAccessToken(request) {
  const authorization = request.get('authorization');
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7);
  return request.cookies[accessCookieName];
}

export function getRefreshToken(request) {
  return request.cookies[refreshCookieName];
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
