import { NextResponse } from 'next/server';

/**
 * Orchestrator Proxy API Route
 * 
 * This Next.js API route acts as a secure proxy between the client-side frontend
 * and the backend Universal Tactical Orchestrator (AWS Lambda).
 * 
 * It securely holds the AUTH_TOKEN required to communicate with the Orchestrator,
 * preventing it from being exposed in the browser.
 */
export async function POST(req: Request) {
  try {
    // 1. Parse the incoming request from the Next.js client
    const body = await req.json();
    const { action, payload } = body;

    // 2. Validate the request structure
    if (!action) {
      return NextResponse.json({ error: 'Missing required field: action' }, { status: 400 });
    }

    // 3. Retrieve Orchestrator URL and Secret Token from environment variables
    const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL;
    const ORCHESTRATOR_AUTH_TOKEN = process.env.ORCHESTRATOR_AUTH_TOKEN;

    if (!ORCHESTRATOR_URL || !ORCHESTRATOR_AUTH_TOKEN) {
      console.error("Server Configuration Error: Missing Orchestrator environment variables.");
      return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
    }

    // 4. Forward the request to the AWS Lambda Orchestrator
    console.log(`Proxying action '${action}' to Orchestrator...`);
    
    const response = await fetch(ORCHESTRATOR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ORCHESTRATOR_AUTH_TOKEN}` // Securely append the secret token
      },
      body: JSON.stringify({ action, payload })
    });

    // 5. Relay the Orchestrator's response back to the client
    const data = await response.json();
    
    // Pass along the HTTP status code returned by the Orchestrator
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    console.error("Orchestrator Proxy Error:", error);
    return NextResponse.json({ error: 'Failed to communicate with Tactical Backend', details: error.message }, { status: 500 });
  }
}