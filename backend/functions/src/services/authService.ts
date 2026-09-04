import * as admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import { db, auth } from '../config/firebase-admin';
import { UserRow, SafeUser, UserRole } from '../types';

function toSafeUser(user: UserRow): SafeUser {
  const { password_hash: _, ...safeUser } = user;
  return safeUser;
}

function docToUserRow(doc: FirebaseFirestore.DocumentSnapshot): UserRow | null {
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name,
    email: data.email,
    address: data.address || null,
    password_hash: data.password_hash || null,
    google_id: data.google_id || null,
    role: data.role,
    created_at: data.created_at?.toDate() || new Date(),
    updated_at: data.updated_at?.toDate() || new Date(),
  };
}

export async function findFirebaseUser(uid: string): Promise<{ uid: string; email: string | null; displayName: string | null } | null> {
  try {
    const userRecord = await auth.getUser(uid);
    return { uid: userRecord.uid, email: userRecord.email || null, displayName: userRecord.displayName || null };
  } catch {
    return null;
  }
}

export async function createUserFromFirebase(
  uid: string,
  name: string,
  address: string,
  role: UserRole,
  email: string
): Promise<SafeUser> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  await db.collection('users').doc(uid).set({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    address: address.trim(),
    role,
    created_at: now,
    updated_at: now,
  });

  return {
    id: uid,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    address: address.trim(),
    role,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

export async function createUser(
  name: string,
  email: string,
  address: string,
  password: string,
  role: UserRole = 'CUSTOMER'
): Promise<SafeUser> {
  const now = admin.firestore.FieldValue.serverTimestamp();

  const existingSnapshot = await db.collection('users')
    .where('email', '==', email.trim().toLowerCase())
    .limit(1)
    .get();

  if (!existingSnapshot.empty) {
    throw new Error('Email already registered');
  }

  const userRecord = await auth.createUser({
    email: email.trim().toLowerCase(),
    password,
    displayName: name.trim(),
  });

  const passwordHash = await bcrypt.hash(password, 10);

  await db.collection('users').doc(userRecord.uid).set({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    address: address.trim(),
    password_hash: passwordHash,
    role,
    created_at: now,
    updated_at: now,
  });

  return {
    id: userRecord.uid,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    address: address.trim(),
    role,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

export async function verifyPassword(email: string, password: string): Promise<boolean> {
  const user = await findUserByEmail(email);
  if (!user || !user.password_hash) {
    return false;
  }
  return bcrypt.compare(password, user.password_hash);
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const snapshot = await db.collection('users')
    .where('email', '==', email.trim().toLowerCase())
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return docToUserRow(snapshot.docs[0]);
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const doc = await db.collection('users').doc(id).get();
  return docToUserRow(doc);
}

export async function findUserByGoogleId(googleId: string): Promise<UserRow | null> {
  const snapshot = await db.collection('users')
    .where('google_id', '==', googleId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return docToUserRow(snapshot.docs[0]);
}

export async function linkGoogleId(userId: string, googleId: string): Promise<void> {
  await db.collection('users').doc(userId).update({
    google_id: googleId,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function createGoogleUser(
  name: string,
  email: string,
  googleId: string
): Promise<SafeUser> {
  const userRecord = await auth.createUser({
    email: email.trim().toLowerCase(),
    displayName: name,
    emailVerified: true,
  });

  const now = admin.firestore.FieldValue.serverTimestamp();
  await db.collection('users').doc(userRecord.uid).set({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    address: '',
    google_id: googleId,
    role: 'CUSTOMER',
    created_at: now,
    updated_at: now,
  });

  return {
    id: userRecord.uid,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    address: '',
    role: 'CUSTOMER',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

export async function updatePassword(userId: string, newPassword: string): Promise<void> {
  await auth.updateUser(userId, { password: newPassword });
  await db.collection('users').doc(userId).update({
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function deleteUser(userId: string): Promise<void> {
  await auth.deleteUser(userId);
  await db.collection('users').doc(userId).delete();
}
