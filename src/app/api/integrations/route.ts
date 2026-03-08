
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { firestore } = initializeFirebase();
    const data = await req.json();
    const { userId, configId, name, ...configData } = data;

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const configRef = doc(firestore, 'user_profiles', userId, 'integration_configs', configId);
    const payload = {
      ...configData,
      id: configId,
      userId,
      name,
      updatedAt: serverTimestamp(),
      status: 'active'
    };

    await setDoc(configRef, payload, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { firestore } = initializeFirebase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const configId = searchParams.get('configId');

    if (!userId || !configId) return NextResponse.json({ error: 'Missing Params' }, { status: 400 });

    const configRef = doc(firestore, 'user_profiles', userId, 'integration_configs', configId);
    await deleteDoc(configRef);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
