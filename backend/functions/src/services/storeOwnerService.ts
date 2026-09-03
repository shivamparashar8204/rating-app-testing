import * as admin from 'firebase-admin';
import { db } from '../config/firebase-admin';
import { RatingWithUser, StoreOwnerProfile } from '../types';

interface DashboardData {
  store: { id: string; name: string; email: string; address: string };
  averageRating: number | null;
  totalRatings: number;
}

export async function getDashboard(userId: string): Promise<DashboardData | null> {
  const storeSnapshot = await db.collection('stores')
    .where('store_owner_id', '==', userId)
    .limit(1)
    .get();

  if (storeSnapshot.empty) return null;

  const storeDoc = storeSnapshot.docs[0];
  const storeData = storeDoc.data();

  const ratingsSnapshot = await db.collection('ratings')
    .where('store_id', '==', storeDoc.id)
    .get();

  let avgRating: number | null = null;
  if (ratingsSnapshot.size > 0) {
    let sum = 0;
    ratingsSnapshot.forEach((doc) => { sum += doc.data().rating; });
    avgRating = Math.round((sum / ratingsSnapshot.size) * 10) / 10;
  }

  return {
    store: { id: storeDoc.id, name: storeData.name, email: storeData.email, address: storeData.address },
    averageRating: avgRating,
    totalRatings: ratingsSnapshot.size,
  };
}

export async function getRatingsForStore(userId: string): Promise<RatingWithUser[]> {
  const storeSnapshot = await db.collection('stores')
    .where('store_owner_id', '==', userId)
    .limit(1)
    .get();

  if (storeSnapshot.empty) return [];

  const storeId = storeSnapshot.docs[0].id;

  const ratingsSnapshot = await db.collection('ratings')
    .where('store_id', '==', storeId)
    .orderBy('created_at', 'desc')
    .get();

  const ratings: RatingWithUser[] = [];
  for (const doc of ratingsSnapshot.docs) {
    const data = doc.data();
    const userDoc = await db.collection('users').doc(data.user_id).get();
    ratings.push({
      id: doc.id,
      rating: data.rating,
      user_id: data.user_id,
      user_name: userDoc.exists ? userDoc.data()!.name : 'Unknown',
      user_email: userDoc.exists ? userDoc.data()!.email : 'unknown',
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
    });
  }
  return ratings;
}

export async function getProfile(userId: string): Promise<StoreOwnerProfile | null> {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) return null;

  const userData = userDoc.data()!;

  const storeSnapshot = await db.collection('stores')
    .where('store_owner_id', '==', userId)
    .limit(1)
    .get();

  if (storeSnapshot.empty) {
    return {
      id: userId,
      name: userData.name,
      email: userData.email,
      address: userData.address || null,
      role: userData.role,
      store_id: '',
      store_name: '',
      store_email: '',
      store_address: '',
    };
  }

  const storeDoc = storeSnapshot.docs[0];
  const storeData = storeDoc.data();

  return {
    id: userId,
    name: userData.name,
    email: userData.email,
    address: userData.address || null,
    role: userData.role,
    store_id: storeDoc.id,
    store_name: storeData.name,
    store_email: storeData.email,
    store_address: storeData.address,
  };
}
