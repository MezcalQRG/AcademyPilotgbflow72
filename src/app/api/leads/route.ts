
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { firestore } = initializeFirebase();
    const data = await req.json();
    const { userId, ...leadData } = data;

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const leadsRef = collection(firestore, 'user_profiles', userId, 'leads');
    const newLeadRef = doc(leadsRef);
    
    const payload = {
      ...leadData,
      id: newLeadRef.id,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(newLeadRef, payload);
    return NextResponse.json({ success: true, id: newLeadRef.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { firestore } = initializeFirebase();
    const data = await req.json();
    const { userId, leadId, ...updates } = data;

    if (!userId || !leadId) return NextResponse.json({ error: 'Missing Params' }, { status: 400 });

    const leadRef = doc(firestore, 'user_profiles', userId, 'leads', leadId);
    await updateDoc(leadRef, { ...updates, updatedAt: serverTimestamp() });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
