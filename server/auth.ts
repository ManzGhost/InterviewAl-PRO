import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from './types';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'interviewai_super_secret_jwt_key_2025_prod_secure_random';
const ACCESS_TOKEN_EXPIRATION = '24h';
const REFRESH_TOKEN_EXPIRATION = '7d';

export interface AuthJwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateTokens(user: User) {
  const payload: AuthJwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });

  return { accessToken, refreshToken };
}

export function verifyToken(token: string): AuthJwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthJwtPayload;
  } catch (err) {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required. Please log in.',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please re-authenticate.',
    });
  }

  const user = db.getUserById(decoded.userId);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User associated with this token no longer exists.',
    });
  }

  req.user = user;
  next();
}

export function isSuperAdminUser(user?: User): boolean {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  return user.role === 'SUPER_ADMIN' && email === 'admin@interviewai.com';
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access denied. Administrator privileges required.',
      });
    }
    next();
  });
}

export function requireCandidate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required.',
      });
    }
    // Permitted for all authenticated users (CANDIDATE, USER, ADMIN, SUPER_ADMIN)
    next();
  });
}
