import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { AuthenticatedUserPayload } from '../types/index.js';
import { UnauthorizedError } from './app-error.js';

/**
 * Generates a signed JWT access token for an authenticated user.
 * @param payload User ID, role, email, and optional volunteerId
 * @returns Encoded JWT token string
 */
export const generateToken = (payload: AuthenticatedUserPayload): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Verifies and decodes a JWT access token.
 * @param token Raw JWT string
 * @returns Decoded AuthenticatedUserPayload
 * @throws UnauthorizedError if token is invalid or expired
 */
export const verifyToken = (token: string): AuthenticatedUserPayload => {
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthenticatedUserPayload;
    return {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      volunteerId: decoded.volunteerId,
      isMasterAdmin: decoded.isMasterAdmin ?? false,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Authentication token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid authentication token');
    }
    throw new UnauthorizedError('Failed to authenticate token');
  }
};
