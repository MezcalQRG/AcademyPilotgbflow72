import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function PATCH(req: Request) {
  try {
    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const data = await req.json();
    const { userId, ...profileUpdates } = data;

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profileRef = db.collection('user_profiles').doc(userId);
    await profileRef.set({
      ...profileUpdates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
