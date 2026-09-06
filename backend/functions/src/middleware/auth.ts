import { Request, Response, NextFunction } from 'express';
<<<<<<< HEAD
import { auth } from '../config/firebase-admin';
import { db } from '../config/firebase-admin';
import jwt from 'jsonwebtoken';
=======
import * as admin from 'firebase-admin';
import { auth, db } from '../config/firebase-admin';
>>>>>>> 9a3339e (fix: stabilize signup and Google authentication)

export type UserRole = 'ADMIN' | 'CUSTOMER' | 'STORE_OWNER';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    userId: string;
    role: UserRole;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { uid: string; role?: UserRole };
    req.user = {
      uid: decoded.uid,
      userId: decoded.uid,
      role: decoded.role || 'CUSTOMER',
    };
    next();
    return;
  } catch {
    // Not a custom JWT; fall through to Firebase ID token verification.
  }

  auth.verifyIdToken(token)
    .then(async (decodedToken) => {
      const uid = decodedToken.uid;

      let userDoc = await db.collection('users').doc(uid).get();

      if (!userDoc.exists) {
        const firebaseUser = await auth.getUser(uid).catch(() => null);
        if (!firebaseUser) {
          res.status(401).json({ success: false, message: 'User not found.' });
          return;
        }

        const isGoogleUser = decodedToken.firebase?.sign_in_provider === 'google.com';
        if (!isGoogleUser) {
          res.status(401).json({ success: false, message: 'User not found.' });
          return;
        }

        const now = admin.firestore.FieldValue.serverTimestamp();
        const profileData = {
          name: firebaseUser.displayName || firebaseUser.email || '',
          email: firebaseUser.email || '',
          address: '',
          role: 'CUSTOMER' as UserRole,
          created_at: now,
          updated_at: now,
        };

        await db.collection('users').doc(uid).set(profileData);
        userDoc = await db.collection('users').doc(uid).get();
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