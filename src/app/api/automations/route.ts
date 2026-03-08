
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { firestore } = initializeFirebase();
    const data = await req.json();
    const { userId, ...ruleData } = data;

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rulesRef = collection(firestore, 'user_profiles', userId, 'automation_rules');
    const newRuleRef = doc(rulesRef);
    
    const payload = {
      ...ruleData,
      id: newRuleRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(newRuleRef, payload);
    return NextResponse.json({ success: true, id: newRuleRef.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { firestore } = initializeFirebase();
    const data = await req.json();
    const { userId, ruleId, ...updates } = data;

    if (!userId || !ruleId) return NextResponse.json({ error: 'Missing Params' }, { status: 400 });

    const ruleRef = doc(firestore, 'user_profiles', userId, 'automation_rules', ruleId);
    await updateDoc(ruleRef, { ...updates, updatedAt: serverTimestamp() });
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
    const ruleId = searchParams.get('ruleId');

    if (!userId || !ruleId) return NextResponse.json({ error: 'Missing Params' }, { status: 400 });

    const ruleRef = doc(firestore, 'user_profiles', userId, 'automation_rules', ruleId);
    await deleteDoc(ruleRef);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
