import * as admin from 'firebase-admin';
import { db, auth } from '../config/firebase-admin';
import { DashboardCounts, AdminUserDetail, AdminStoreDetail, AdminRatingDetail, StoreRow, UserRow } from '../types';

export async function getDashboardExtended(): Promise<{
  total_users: number;
  total_customers: number;
  total_store_owners: number;
  total_stores: number;
  total_ratings: number;
  avg_rating: number | null;
}> {
  const usersSnapshot = await db.collection('users').get();
  const storesSnapshot = await db.collection('stores').get();
  const ratingsSnapshot = await db.collection('ratings').get();

  let total_customers = 0;
  let total_store_owners = 0;
  usersSnapshot.forEach((doc) => {
    const role = doc.data().role;
    if (role === 'CUSTOMER') total_customers++;
    if (role === 'STORE_OWNER') total_store_owners++;
  });

  let totalRatingSum = 0;
  let avg_rating: number | null = null;
  ratingsSnapshot.forEach((doc) => {
    totalRatingSum += doc.data().rating;
  });
  if (ratingsSnapshot.size > 0) {
    avg_rating = Math.round((totalRatingSum / ratingsSnapshot.size) * 10) / 10;
  }

  return {
    total_users: usersSnapshot.size,
    total_customers,
    total_store_owners,
    total_stores: storesSnapshot.size,
    total_ratings: ratingsSnapshot.size,
    avg_rating,
  };
}

export async function getAllUsers(
  filters: { name?: string; email?: string; address?: string; role?: string },
  sort: { sortBy: string; order: 'ASC' | 'DESC' }
): Promise<AdminUserDetail[]> {
  let query: FirebaseFirestore.Query = db.collection('users');

  if (filters.role) {
    query = query.where('role', '==', filters.role.toUpperCase());
  }

  const snapshot = await query.get();
  let users: AdminUserDetail[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    email: doc.data().email,
    address: doc.data().address || null,
    role: doc.data().role,
    created_at: doc.data().created_at?.toDate() || new Date(),
  }));

  if (filters.name) {
    const search = filters.name.toLowerCase();
    users = users.filter((u) => u.name.toLowerCase().includes(search));
  }
  if (filters.email) {
    const search = filters.email.toLowerCase();
    users = users.filter((u) => u.email.toLowerCase().includes(search));
  }
  if (filters.address) {
    const search = filters.address.toLowerCase();
    users = users.filter((u) => u.address && u.address.toLowerCase().includes(search));
  }

  const sortField = sort.sortBy || 'name';
  users.sort((a, b) => {
    let aVal: number | string;
    let bVal: number | string;
    if (sortField === 'created_at') {
      aVal = a.created_at.getTime();
      bVal = b.created_at.getTime();
    } else {
      aVal = String(a[sortField as keyof AdminUserDetail] || '').toLowerCase();
      bVal = String(b[sortField as keyof AdminUserDetail] || '').toLowerCase();
    }
    if (aVal < bVal) return sort.order === 'ASC' ? -1 : 1;
    if (aVal > bVal) return sort.order === 'ASC' ? 1 : -1;
    return 0;
  });

  return users;
}

export async function getUserById(id: string): Promise<{
  user: AdminUserDetail;
  store?: StoreRow;
  avg_rating?: number | null;
  total_ratings?: number;
} | null> {
  const userDoc = await db.collection('users').doc(id).get();
  if (!userDoc.exists) return null;

  const userData = userDoc.data()!;
  const user: AdminUserDetail = {
    id: userDoc.id,
    name: userData.name,
    email: userData.email,
    address: userData.address || null,
    role: userData.role,
    created_at: userData.created_at?.toDate() || new Date(),
  };

  if (user.role === 'STORE_OWNER') {
    const storeSnapshot = await db.collection('stores')
      .where('store_owner_id', '==', id)
      .limit(1)
      .get();

    if (!storeSnapshot.empty) {
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

      const store: StoreRow = {
        id: storeDoc.id,
        name: storeData.name,
        email: storeData.email,
        address: storeData.address,
        store_owner_id: storeData.store_owner_id,
        created_at: storeData.created_at?.toDate() || new Date(),
        updated_at: storeData.updated_at?.toDate() || new Date(),
      };

      return { user, store, avg_rating: avgRating, total_ratings: ratingsSnapshot.size };
    }
  }

  return { user };
}

export async function getAllStores(
  filters: { name?: string; email?: string; address?: string },
  sort: { sortBy: string; order: 'ASC' | 'DESC' }
): Promise<AdminStoreDetail[]> {
  const storesSnapshot = await db.collection('stores').get();
  const usersSnapshot = await db.collection('users').get();

  const usersMap = new Map<string, { name: string; email: string }>();
  usersSnapshot.forEach((doc) => {
    usersMap.set(doc.id, { name: doc.data().name, email: doc.data().email });
  });

  let stores: AdminStoreDetail[] = [];

  for (const storeDoc of storesSnapshot.docs) {
    const storeData = storeDoc.data();
    const owner = usersMap.get(storeData.store_owner_id) || { name: 'Unknown', email: 'unknown' };

    const ratingsSnapshot = await db.collection('ratings')
      .where('store_id', '==', storeDoc.id)
      .get();

    let avgRating: number | null = null;
    if (ratingsSnapshot.size > 0) {
      let sum = 0;
      ratingsSnapshot.forEach((doc) => { sum += doc.data().rating; });
      avgRating = Math.round((sum / ratingsSnapshot.size) * 10) / 10;
    }

    stores.push({
      id: storeDoc.id,
      name: storeData.name,
      email: storeData.email,
      address: storeData.address,
      store_owner_id: storeData.store_owner_id,
      owner_name: owner.name,
      owner_email: owner.email,
      avg_rating: avgRating,
      total_ratings: ratingsSnapshot.size,
    });
  }

  if (filters.name) {
    const search = filters.name.toLowerCase();
    stores = stores.filter((s) => s.name.toLowerCase().includes(search));
  }
  if (filters.email) {
    const search = filters.email.toLowerCase();
    stores = stores.filter((s) => s.email.toLowerCase().includes(search));
  }
  if (filters.address) {
    const search = filters.address.toLowerCase();
    stores = stores.filter((s) => s.address.toLowerCase().includes(search));
  }

  const sortField = sort.sortBy || 'name';
  stores.sort((a, b) => {
    const aVal = String(a[sortField as keyof AdminStoreDetail] || '').toLowerCase();
    const bVal = String(b[sortField as keyof AdminStoreDetail] || '').toLowerCase();
    if (aVal < bVal) return sort.order === 'ASC' ? -1 : 1;
    if (aVal > bVal) return sort.order === 'ASC' ? 1 : -1;
    return 0;
  });

  return stores;
}

export async function getStoreById(id: string): Promise<AdminStoreDetail | null> {
  const storeDoc = await db.collection('stores').doc(id).get();
  if (!storeDoc.exists) return null;

  const storeData = storeDoc.data()!;
  const ownerDoc = await db.collection('users').doc(storeData.store_owner_id).get();
  const owner = ownerDoc.exists ? ownerDoc.data()! : { name: 'Unknown', email: 'unknown' };

  const ratingsSnapshot = await db.collection('ratings')
    .where('store_id', '==', id)
    .get();

  let avgRating: number | null = null;
  if (ratingsSnapshot.size > 0) {
    let sum = 0;
    ratingsSnapshot.forEach((doc) => { sum += doc.data().rating; });
    avgRating = Math.round((sum / ratingsSnapshot.size) * 10) / 10;
  }

  return {
    id: storeDoc.id,
    name: storeData.name,
    email: storeData.email,
    address: storeData.address,
    store_owner_id: storeData.store_owner_id,
    owner_name: owner.name,
    owner_email: owner.email,
    avg_rating: avgRating,
    total_ratings: ratingsSnapshot.size,
  };
}

export async function createStore(
  name: string,
  email: string,
  address: string,
  storeOwnerId: string
): Promise<StoreRow> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const storeRef = await db.collection('stores').add({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    address: address.trim(),
    store_owner_id: storeOwnerId,
    created_at: now,
    updated_at: now,
  });

  const doc = await storeRef.get();
  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name,
    email: data.email,
    address: data.address,
    store_owner_id: data.store_owner_id,
    created_at: data.created_at?.toDate() || new Date(),
    updated_at: data.updated_at?.toDate() || new Date(),
  };
}

export async function createUser(
  name: string,
  email: string,
  address: string,
  password: string,
  role: string
): Promise<AdminUserDetail> {
  const userRecord = await auth.createUser({
    email: email.trim().toLowerCase(),
    password,
    displayName: name.trim(),
  });

  const now = admin.firestore.FieldValue.serverTimestamp();
  await db.collection('users').doc(userRecord.uid).set({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    address: address.trim(),
    role: role.toUpperCase(),
    created_at: now,
    updated_at: now,
  });

  return {
    id: userRecord.uid,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    address: address.trim(),
    role: role.toUpperCase() as 'ADMIN' | 'CUSTOMER' | 'STORE_OWNER',
    created_at: new Date(),
  };
}

export async function updateUser(
  id: string,
  data: { name?: string; email?: string; address?: string; password?: string; role?: string }
): Promise<AdminUserDetail | null> {
  const updates: Record<string, unknown> = {};
  updates.updated_at = admin.firestore.FieldValue.serverTimestamp();

  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.email !== undefined) {
    updates.email = data.email.trim().toLowerCase();
    await auth.updateUser(id, { email: data.email.trim().toLowerCase() });
  }
  if (data.address !== undefined) updates.address = data.address.trim();
  if (data.role !== undefined) updates.role = data.role.toUpperCase();
  if (data.password !== undefined && data.password !== '') {
    await auth.updateUser(id, { password: data.password });
  }

  if (Object.keys(updates).length <= 1) {
    const doc = await db.collection('users').doc(id).get();
    if (!doc.exists) return null;
    const d = doc.data()!;
    return {
      id: doc.id,
      name: d.name,
      email: d.email,
      address: d.address || null,
      role: d.role,
      created_at: d.created_at?.toDate() || new Date(),
    };
  }

  await db.collection('users').doc(id).update(updates);

  const doc = await db.collection('users').doc(id).get();
  if (!doc.exists) return null;
  const d = doc.data()!;
  return {
    id: doc.id,
    name: d.name,
    email: d.email,
    address: d.address || null,
    role: d.role,
    created_at: d.created_at?.toDate() || new Date(),
  };
}

export async function updateStore(
  id: string,
  data: { name?: string; email?: string; address?: string }
): Promise<AdminStoreDetail | null> {
  const updates: Record<string, unknown> = {};
  updates.updated_at = admin.firestore.FieldValue.serverTimestamp();

  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.email !== undefined) updates.email = data.email.trim().toLowerCase();
  if (data.address !== undefined) updates.address = data.address.trim();

  if (Object.keys(updates).length <= 1) {
    return getStoreById(id);
  }

  await db.collection('stores').doc(id).update(updates);
  return getStoreById(id);
}

export async function getAllRatings(
  filters: { customerName?: string; storeName?: string; rating?: number },
  sort: { sortBy: string; order: 'ASC' | 'DESC' }
): Promise<AdminRatingDetail[]> {
  const ratingsSnapshot = await db.collection('ratings').get();
  const usersSnapshot = await db.collection('users').get();
  const storesSnapshot = await db.collection('stores').get();

  const usersMap = new Map<string, { name: string; email: string }>();
  usersSnapshot.forEach((doc) => {
    usersMap.set(doc.id, { name: doc.data().name, email: doc.data().email });
  });

  const storesMap = new Map<string, { name: string; email: string }>();
  storesSnapshot.forEach((doc) => {
    storesMap.set(doc.id, { name: doc.data().name, email: doc.data().email });
  });

  let ratings: AdminRatingDetail[] = ratingsSnapshot.docs.map((doc) => {
    const data = doc.data();
    const user = usersMap.get(data.user_id) || { name: 'Unknown', email: 'unknown' };
    const store = storesMap.get(data.store_id) || { name: 'Unknown', email: 'unknown' };
    return {
      id: doc.id,
      rating: data.rating,
      user_id: data.user_id,
      user_name: user.name,
      user_email: user.email,
      store_id: data.store_id,
      store_name: store.name,
      store_email: store.email,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
    };
  });

  if (filters.customerName) {
    const search = filters.customerName.toLowerCase();
    ratings = ratings.filter((r) => r.user_name.toLowerCase().includes(search));
  }
  if (filters.storeName) {
    const search = filters.storeName.toLowerCase();
    ratings = ratings.filter((r) => r.store_name.toLowerCase().includes(search));
  }
  if (filters.rating !== undefined) {
    ratings = ratings.filter((r) => r.rating === filters.rating);
  }

  const sortField = sort.sortBy || 'created_at';
  ratings.sort((a, b) => {
    let aVal: number | string;
    let bVal: number | string;
    if (sortField === 'created_at' || sortField === 'updated_at') {
      const aDate = a[sortField as keyof AdminRatingDetail] as Date;
      const bDate = b[sortField as keyof AdminRatingDetail] as Date;
      aVal = aDate instanceof Date ? aDate.getTime() : 0;
      bVal = bDate instanceof Date ? bDate.getTime() : 0;
    } else {
      aVal = String(a[sortField as keyof AdminRatingDetail] || '').toLowerCase();
      bVal = String(b[sortField as keyof AdminRatingDetail] || '').toLowerCase();
    }
    if (aVal < bVal) return sort.order === 'ASC' ? -1 : 1;
    if (aVal > bVal) return sort.order === 'ASC' ? 1 : -1;
    return 0;
  });

  return ratings;
}

export async function getRatingById(id: string): Promise<AdminRatingDetail | null> {
  const doc = await db.collection('ratings').doc(id).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  const userDoc = await db.collection('users').doc(data.user_id).get();
  const storeDoc = await db.collection('stores').doc(data.store_id).get();

  return {
    id: doc.id,
    rating: data.rating,
    user_id: data.user_id,
    user_name: userDoc.exists ? userDoc.data()!.name : 'Unknown',
    user_email: userDoc.exists ? userDoc.data()!.email : 'unknown',
    store_id: data.store_id,
    store_name: storeDoc.exists ? storeDoc.data()!.name : 'Unknown',
    store_email: storeDoc.exists ? storeDoc.data()!.email : 'unknown',
    created_at: data.created_at?.toDate() || new Date(),
    updated_at: data.updated_at?.toDate() || new Date(),
  };
}

export async function createRating(
  userId: string,
  storeId: string,
  rating: number
): Promise<{ id: string }> {
  const ratingDocId = `${userId}_${storeId}`;
  const now = admin.firestore.FieldValue.serverTimestamp();
  await db.collection('ratings').doc(ratingDocId).set({
    user_id: userId,
    store_id: storeId,
    rating,
    created_at: now,
    updated_at: now,
  });
  return { id: ratingDocId };
}

export async function updateRating(id: string, rating: number): Promise<void> {
  await db.collection('ratings').doc(id).update({
    rating,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function deleteRating(id: string): Promise<void> {
  await db.collection('ratings').doc(id).delete();
}

export async function getRecentReviews(): Promise<AdminRatingDetail[]> {
  const snapshot = await db.collection('ratings')
    .orderBy('created_at', 'desc')
    .limit(5)
    .get();

  const ratings: AdminRatingDetail[] = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const userDoc = await db.collection('users').doc(data.user_id).get();
    const storeDoc = await db.collection('stores').doc(data.store_id).get();
    ratings.push({
      id: doc.id,
      rating: data.rating,
      user_id: data.user_id,
      user_name: userDoc.exists ? userDoc.data()!.name : 'Unknown',
      user_email: userDoc.exists ? userDoc.data()!.email : 'unknown',
      store_id: data.store_id,
      store_name: storeDoc.exists ? storeDoc.data()!.name : 'Unknown',
      store_email: storeDoc.exists ? storeDoc.data()!.email : 'unknown',
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
    });
  }
  return ratings;
}

export async function getTopRatedStores(): Promise<AdminStoreDetail[]> {
  const allStores = await getAllStores({}, { sortBy: 'avg_rating', order: 'DESC' });
  return allStores.slice(0, 5);
}

export async function getRecentlyRegisteredCustomers(): Promise<AdminUserDetail[]> {
  const snapshot = await db.collection('users')
    .where('role', '==', 'CUSTOMER')
    .orderBy('created_at', 'desc')
    .limit(5)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    email: doc.data().email,
    address: doc.data().address || null,
    role: doc.data().role,
    created_at: doc.data().created_at?.toDate() || new Date(),
  }));
}

export async function getRecentlyAddedStores(): Promise<AdminStoreDetail[]> {
  const snapshot = await db.collection('stores')
    .orderBy('created_at', 'desc')
    .limit(5)
    .get();

  const stores: AdminStoreDetail[] = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const ownerDoc = await db.collection('users').doc(data.store_owner_id).get();
    const owner = ownerDoc.exists ? ownerDoc.data()! : { name: 'Unknown', email: 'unknown' };

    const ratingsSnapshot = await db.collection('ratings')
      .where('store_id', '==', doc.id)
      .get();

    let avgRating: number | null = null;
    if (ratingsSnapshot.size > 0) {
      let sum = 0;
      ratingsSnapshot.forEach((r) => { sum += r.data().rating; });
      avgRating = Math.round((sum / ratingsSnapshot.size) * 10) / 10;
    }

    stores.push({
      id: doc.id,
      name: data.name,
      email: data.email,
      address: data.address,
      store_owner_id: data.store_owner_id,
      owner_name: owner.name,
      owner_email: owner.email,
      avg_rating: avgRating,
      total_ratings: ratingsSnapshot.size,
    });
  }
  return stores;
}

export async function getStoreOwnerUsers(): Promise<AdminUserDetail[]> {
  const snapshot = await db.collection('users')
    .where('role', '==', 'STORE_OWNER')
    .orderBy('created_at', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    email: doc.data().email,
    address: doc.data().address || null,
    role: doc.data().role,
    created_at: doc.data().created_at?.toDate() || new Date(),
  }));
}

export async function getCustomerUsers(): Promise<AdminUserDetail[]> {
  const snapshot = await db.collection('users')
    .where('role', '==', 'CUSTOMER')
    .orderBy('created_at', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    email: doc.data().email,
    address: doc.data().address || null,
    role: doc.data().role,
    created_at: doc.data().created_at?.toDate() || new Date(),
  }));
}

export async function findUserByIdForAdmin(id: string): Promise<UserRow | null> {
  const doc = await db.collection('users').doc(id).get();
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
