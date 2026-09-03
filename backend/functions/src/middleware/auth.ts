import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase-admin';
import { db } from '../config/firebase-admin';

export type UserRole = 'ADMIN' | 'CUSTOMER' | 'STORE_OWNER';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    userId: string;
    role: UserRole;
  };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    return;
  }

  const idToken = authHeader.split(' ')[1];

  auth.verifyIdToken(idToken)
    .then(async (decodedToken) => {
      const uid = decodedToken.uid;

      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        res.status(401).json({ success: false, message: 'User not found.' });
        return;
      }

      const userData = userDoc.data()!;
      req.user = {
        uid,
        userId: uid,
        role: userData.role as UserRole,
      };
      next();
    })
    .catch(() => {
      res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    });
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
      return;
    }

    next();
  };
}
