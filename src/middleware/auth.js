import { User } from '../models/User.js';
import { getAccessToken, verifyAccessToken } from '../utils/tokens.js';
import { asyncHandler } from '../utils/http.js';

export const requireAuth = asyncHandler(async (request, response, next) => {
  const token = getAccessToken(request);
  if (!token) return response.status(401).json({ message: 'Authentication required.' });

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return response.status(401).json({ message: 'Authentication required.' });
    request.user = user;
    return next();
  } catch {
    return response.status(401).json({ message: 'Session expired. Please sign in again.' });
  }
});
