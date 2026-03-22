import { NextResponse } from 'next/server';

/**
 * Orchestrator Proxy API Route (Cloudflare Pages Compatible)
 * 
 * This route runs on the Cloudflare Edge network. It cannot use full Node.js libraries 
 * like 'firebase-admin'. Its sole purpose is to securely attach the backend service token
 * and forward the user's Firebase JWT to the AWS Lambda Orchestrator for actual verification.
 */
export const runtime = 'edge'; // Explicitly declare Edge runtime for Cloudflare

export async function POST(req: Request) {
  try {
    // 1. Extract the User's Identity (Firebase JWT) from the frontend request
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Proxy Alert: Request missing Authorization header.');
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }

    // 2. Parse the Action Payload
    const body = await req.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ error: 'Bad Request: Missing action' }, { status: 400 });
    }

    // 3. Prepare the upstream request to AWS
    const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL;
    const ORCHESTRATOR_AUTH_TOKEN = process.env.ORCHESTRATOR_AUTH_TOKEN;

    if (!ORCHESTRATOR_URL || !ORCHESTRATOR_AUTH_TOKEN) {
      console.error("Server Configuration Error: Missing Orchestrator environment variables.");
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
    
    console.log(`[Cloudflare Edge] Proxying action '${action}' to AWS Orchestrator...`);

    // 4. Proxy to the Tactical Backend (AWS Lambda)
    // We send BOTH the service-to-service token (in the header) AND the user's JWT (in the body)
    // so the AWS Orchestrator can verify both the source and the user.
    const response = await fetch(ORCHESTRATOR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ORCHESTRATOR_AUTH_TOKEN}` 
      },
      body: JSON.stringify({ 
        action, 
        payload,
        // Pass the user's JWT down to AWS for verification
        userJwt: authHeader.split('Bearer ')[1] 
      })
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    console.error("Orchestrator Proxy Error:", error);
    return NextResponse.json({ error: 'Failed to process request on Edge', details: error.message }, { status: 500 });
  }
}