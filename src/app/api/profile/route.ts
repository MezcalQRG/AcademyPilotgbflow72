
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function PATCH(req: Request) {
  try {
    const { firestore } = initializeFirebase();
    const data = await req.json();
    const { userId, ...profileUpdates } = data;

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profileRef = doc(firestore, 'user_profiles', userId);
    await updateDoc(profileRef, {
      ...profileUpdates,
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
