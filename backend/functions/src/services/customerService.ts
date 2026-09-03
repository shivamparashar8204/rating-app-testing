import * as admin from 'firebase-admin';
import { db } from '../config/firebase-admin';
import { StoreWithUserRating } from '../types';

export async function getAllStores(userId: string, search?: string): Promise<StoreWithUserRating[]> {
  const storesSnapshot = await db.collection('stores').get();
  const storeIds = storesSnapshot.docs.map((d) => d.id);

  const allRatingsSnapshot = await db.collection('ratings').get();
  const storeRatingSums = new Map<string, { sum: number; count: number }>();
  allRatingsSnapshot.forEach((doc) => {
    const data = doc.data();
    const storeId = data.store_id;
    const existing = storeRatingSums.get(storeId) || { sum: 0, count: 0 };
    existing.sum += data.rating;
    existing.count += 1;
    storeRatingSums.set(storeId, existing);
  });

  const userRatingsSnapshot = await db.collection('ratings')
    .where('user_id', '==', userId)
    .get();
  const userRatingMap = new Map<string, number>();
  userRatingsSnapshot.forEach((doc) => {
    userRatingMap.set(doc.data().store_id, doc.data().rating);
  });

  const stores: StoreWithUserRating[] = [];

  for (const storeDoc of storesSnapshot.docs) {
    const storeData = storeDoc.data();

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      const nameMatch = storeData.name.toLowerCase().includes(term);
      const addressMatch = storeData.address.toLowerCase().includes(term);
      if (!nameMatch && !addressMatch) continue;
    }

    const ratingInfo = storeRatingSums.get(storeDoc.id);
    let avgRating: number | null = null;
    if (ratingInfo && ratingInfo.count > 0) {
      avgRating = Math.round((ratingInfo.sum / ratingInfo.count) * 10) / 10;
    }

    stores.push({
      id: storeDoc.id,
      name: storeData.name,
      email: storeData.email,
      address: storeData.address,
      store_owner_id: storeData.store_owner_id,
      avg_rating: avgRating,
      user_rating: userRatingMap.get(storeDoc.id) ?? null,
    });
  }

  stores.sort((a, b) => a.name.localeCompare(b.name));
  return stores;
}

export async function submitRating(userId: string, storeId: string, rating: number): Promise<{ insertId: string }> {
  const ratingDocId = `${userId}_${storeId}`;
  const ratingRef = db.collection('ratings').doc(ratingDocId);
  const existingDoc = await ratingRef.get();

  if (existingDoc.exists) {
    throw new Error('DUPLICATE_RATING');
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  await ratingRef.set({
    user_id: userId,
    store_id: storeId,
    rating,
    created_at: now,
    updated_at: now,
  });

  return { insertId: ratingDocId };
}

export async function findRatingById(ratingId: string): Promise<{ id: string; user_id: string; store_id: string; rating: number } | null> {
  const doc = await db.collection('ratings').doc(ratingId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    id: doc.id,
    user_id: data.user_id,
    store_id: data.store_id,
    rating: data.rating,
  };
}

export async function updateRating(ratingId: string, rating: number): Promise<void> {
  await db.collection('ratings').doc(ratingId).update({
    rating,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function findStoreById(storeId: string): Promise<{ id: string } | null> {
  const doc = await db.collection('stores').doc(storeId).get();
  if (!doc.exists) return null;
  return { id: doc.id };
}
