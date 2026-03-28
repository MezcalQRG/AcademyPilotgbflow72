
'use server';

import { generateCampaignStructure } from "@/ai/flows/generate-campaign-structure";
import { enhanceImage } from "@/ai/flows/enhance-image";
import { publishCampaign } from "@/ai/flows/publish-campaign";
import { testMetaConnection } from "@/ai/flows/test-meta-connection";
import { getAdImages } from "@/ai/flows/get-ad-images";
import { reasoningBasedAgentResponse as reasoningBasedAgentResponseFlow, type ReasoningBasedAgentResponseInput } from '@/ai/flows/reasoning-based-agent-response';
import { generateSystemPrompt } from "@/ai/flows/generate-system-prompt";
import { chatAssistant as chatAssistantFlow, type ChatAssistantInput } from "@/ai/flows/global-chat-ai-assistant";
import { receiveAutomationSuggestions as receiveAutomationSuggestionsFlow, type AutomationSuggestionInput } from '@/ai/flows/receive-automation-suggestions';
import { interpretTaxRules as interpretTaxRulesFlow, type InterpretTaxRulesInput } from '@/ai/flows/tax-rule-interpreter';
import type { CampaignStructure, Campaign, PublishResult, AdImage } from "@/lib/types";
import type { AgentProfile } from "@/lib/synth-types";
import { geocodeAddress, findFranchise } from '@/lib/academies';
import { unstable_cache as cache } from 'next/cache';
import { headers } from 'next/headers';
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { createRequestId, logger, serializeError } from '@/lib/logger';
import axios from 'axios';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'https://hmir4kw9lg.execute-api.us-east-2.amazonaws.com/Prod/orchestrate/';
const ORCHESTRATOR_AUTH_TOKEN = process.env.ORCHESTRATOR_AUTH_TOKEN || '123456789';

async function resolveAppBaseUrl() {
  const requestHeaders = await headers();
  const forwardedProto = requestHeaders.get('x-forwarded-proto');
  const forwardedHost = requestHeaders.get('x-forwarded-host');
  const host = forwardedHost || requestHeaders.get('host');

  if (host) {
    return `${forwardedProto || 'https'}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL || 'https://graciebarra.ai';
}

async function resolveTenantSlugForEmail(email: string): Promise<string | null> {
  const admin = getFirebaseAdmin();
  const normalizedEmail = email.trim().toLowerCase();

  const profileByExactEmail = await admin
    .firestore()
    .collection('user_profiles')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (!profileByExactEmail.empty) {
    const tenantSlug = profileByExactEmail.docs[0].data()?.tenantSlug;
    return typeof tenantSlug === 'string' && tenantSlug.length > 0 ? tenantSlug : null;
  }

  const profileByNormalizedEmail = await admin
    .firestore()
    .collection('user_profiles')
    .where('email', '==', normalizedEmail)
    .limit(1)
    .get();

  if (!profileByNormalizedEmail.empty) {
    const tenantSlug = profileByNormalizedEmail.docs[0].data()?.tenantSlug;
    return typeof tenantSlug === 'string' && tenantSlug.length > 0 ? tenantSlug : null;
  }

  return null;
}

function normalizeCheckoutEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeTenantSlug(rawSlug: string) {
  return rawSlug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateTemporaryPassword() {
  const random = Math.random().toString(36).slice(2);
  // Strong enough temporary password for initial bootstrap sign-in.
  return `GbAi!${random}#${Date.now().toString(36)}`;
}

function getDefaultWeeklySchedule() {
  return {
    timezone: process.env.TZ || 'America/New_York',
    monday: { open: '09:00', close: '20:00', closed: false },
    tuesday: { open: '09:00', close: '20:00', closed: false },
    wednesday: { open: '09:00', close: '20:00', closed: false },
    thursday: { open: '09:00', close: '20:00', closed: false },
    friday: { open: '09:00', close: '20:00', closed: false },
    saturday: { open: '10:00', close: '14:00', closed: false },
    sunday: { open: '10:00', close: '14:00', closed: true },
  };
}

type CompleteCheckoutOnboardingInput = {
  email: string;
  fullName: string;
  phoneNumber: string;
  tenantSlug: string;
  planTitle?: string;
};

export async function completeCheckoutOnboardingAction(input: CompleteCheckoutOnboardingInput) {
  const requestId = createRequestId();

  try {
    const email = normalizeCheckoutEmail(input.email || '');
    const tenantSlug = normalizeTenantSlug(input.tenantSlug || '');
    const fullName = (input.fullName || '').trim();
    const phoneNumber = (input.phoneNumber || '').trim();

    if (!email || !tenantSlug || !fullName) {
      return { error: 'Missing required onboarding fields.', requestId };
    }

    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const appBaseUrl = await resolveAppBaseUrl();

    const slugConflict = await db
      .collection('user_profiles')
      .where('tenantSlug', '==', tenantSlug)
      .limit(1)
      .get();

    const landingConflict = await db.collection('landing_pages').doc(tenantSlug).get();

    if (!slugConflict.empty || landingConflict.exists) {
      return {
        error: `The academy slug '${tenantSlug}' is already in use.`,
        requestId,
      };
    }

    let existingUser = null;
    try {
      existingUser = await admin.auth().getUserByEmail(email);
    } catch (error: any) {
      if (error?.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    if (existingUser) {
      return {
        error: 'An account with this email already exists. Please sign in instead.',
        requestId,
      };
    }

    const temporaryPassword = generateTemporaryPassword();
    const createdUser = await admin.auth().createUser({
      email,
      password: temporaryPassword,
      displayName: fullName,
      emailVerified: false,
      disabled: false,
    });

    const onboardingPath = `/${tenantSlug}/dashboard/settings?tab=account&onboarding=1`;
    const onboardingUrl = `${appBaseUrl}${onboardingPath}`;

    const actionCodeSettings = {
      url: `${onboardingUrl}&email=${encodeURIComponent(email)}`,
      handleCodeInApp: true,
    };

    const [magicLoginLink, verifyEmailLink] = await Promise.all([
      admin.auth().generateSignInWithEmailLink(email, actionCodeSettings),
      admin.auth().generateEmailVerificationLink(email, actionCodeSettings),
    ]);

    const now = admin.firestore.FieldValue.serverTimestamp();
    const bootstrapBatch = db.batch();

    const profileRef = db.collection('user_profiles').doc(createdUser.uid);
    const landingRef = db.collection('landing_pages').doc(tenantSlug);
    const tenantRef = db.collection('tenants').doc(tenantSlug);
    const scheduleRef = db.collection('tenants').doc(tenantSlug).collection('settings').doc('schedule');

    bootstrapBatch.set(
      profileRef,
      {
        id: createdUser.uid,
        uid: createdUser.uid,
        email,
        name: fullName,
        role: 'academy_owner',
        tenantSlug,
        phoneNumber,
        onboardingCompleted: false,
        securitySetupRequired: true,
        hasPassword: true,
        googleConnected: false,
        emailVerified: false,
        schemaVersion: 1,
        bootstrapCompletedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    bootstrapBatch.set(
      landingRef,
      {
        slug: tenantSlug,
        userId: createdUser.uid,
        ownerUid: createdUser.uid,
        branchName: fullName,
        headline: `Welcome to ${fullName}`,
        isPublic: false,
        isPublished: false,
        contactPhone: phoneNumber || null,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    bootstrapBatch.set(
      tenantRef,
      {
        slug: tenantSlug,
        ownerUid: createdUser.uid,
        status: 'active',
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    bootstrapBatch.set(
      scheduleRef,
      {
        ...getDefaultWeeklySchedule(),
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    await bootstrapBatch.commit();

    let emailWarning: string | null = null;
    try {
      await dispatchOrchestratorAction(
        'SEND_EMAIL',
        {
          userEmail: email,
          templateType: 'account-created',
          userData: {
            user_name: fullName,
            company_name: tenantSlug,
            login_url: magicLoginLink,
            // Backward-compatible aliases for future template updates.
            name: fullName,
            loginUrl: magicLoginLink,
            magic_link: magicLoginLink,
            verifyEmailUrl: verifyEmailLink,
            verify_email_url: verifyEmailLink,
            welcomeMessage: `Gracias por crear tu cuenta en graciebarra.ai para ${input.planTitle || 'tu nueva academia'}.`,
            welcome_message: 'Confirma tu email para activar todos los accesos de dashboard.',
            academySlug: tenantSlug,
            location: tenantSlug,
          },
          redirectUrl: onboardingPath,
        },
        requestId
      );
    } catch (error: any) {
      emailWarning = error?.message || 'Unable to send account email at this time.';
      logger.error('Account-created template dispatch failed', {
        requestId,
        scope: 'server-action.completeCheckoutOnboardingAction',
        email,
        tenantSlug,
        error: serializeError(error),
      });
    }

    return {
      success: true,
      requestId,
      uid: createdUser.uid,
      email,
      temporaryPassword,
      redirectPath: onboardingPath,
      verifyEmailLink,
      emailWarning,
    };
  } catch (error: any) {
    logger.error('Checkout onboarding failed', {
      requestId,
      scope: 'server-action.completeCheckoutOnboardingAction',
      error: serializeError(error),
      input: {
        email: input?.email,
        tenantSlug: input?.tenantSlug,
      },
    });

    return {
      error: error?.message || 'Failed to complete checkout onboarding.',
      requestId,
    };
  }
}

/**
 * High-authority directive to initiate a tactical magic link login via AWS SES.
 */
export async function initiateTacticalLoginAction(email: string) {
  const requestId = createRequestId();

  try {
    const admin = getFirebaseAdmin();
    const appBaseUrl = await resolveAppBaseUrl();
    const tenantSlug = await resolveTenantSlugForEmail(email);
    const continuePath = tenantSlug ? `/${tenantSlug}/dashboard` : '/dashboard';
    
    // 1. Generate the secure tactical link
    const actionCodeSettings = {
      // Tenant-aware redirect when available, fallback for unknown profiles.
      url: `${appBaseUrl}${continuePath}?email=${encodeURIComponent(email)}`,
      handleCodeInApp: true,
    };
    
    const loginLink = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);
    
    // 2. Dispatch the link via AWS Orchestrator SES sector
    const result = await dispatchOrchestratorAction('SEND_EMAIL', {
      userEmail: email,
      templateType: 'magic-link',
      userData: {
        magic_link: loginLink,
        user_name: email.split('@')[0].toUpperCase(),
      }
    }, requestId);

    return result;
  } catch (error: any) {
    logger.error('Auth handshake initialization failure', {
      requestId,
      scope: 'server-action.initiateTacticalLogin',
      email,
      error: serializeError(error),
    });
    return { error: error.message, requestId };
  }
}

/**
 * Universal Adapter for the AWS Tactical Orchestrator.
 * Funnels mission-critical requests to the centralized AWS gateway.
 */
export async function dispatchOrchestratorAction(action: string, payload: any, requestId = createRequestId()) {
  try {
    logger.info('Dispatching orchestrator action', {
      requestId,
      scope: 'server-action.dispatchOrchestratorAction',
      action,
    });

    const response = await axios.post(ORCHESTRATOR_URL, {
      action,
      payload
    }, {
      headers: {
        'Authorization': `Bearer ${ORCHESTRATOR_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      }
    });

    return {
      ...response.data,
      requestId: response.data?.requestId || requestId,
    };
  } catch (error: any) {
    logger.error('Orchestrator action failed', {
      requestId,
      scope: 'server-action.dispatchOrchestratorAction',
      action,
      error: serializeError(error),
      upstream: error.response?.data,
    });

    const message = error.response?.data?.error || 'Operational link failure';
    throw new Error(`${message} (requestId: ${requestId})`);
  }
}

export async function createCampaignAction(data: {
  adAccountID: string;
  apiKey: string;
  pageID: string;
  businessInformation: string;
  imageURIs: string[];
  isAutopilot: boolean;
}): Promise<{ status: "success" | "error", message: string, data?: CampaignStructure }> {
  const requestId = createRequestId();

  try {
    const result = await generateCampaignStructure({
        businessInformation: data.businessInformation,
        imageURIs: data.imageURIs,
        isAutopilot: data.isAutopilot,
    });
    return {
      status: "success",
      message: "Campaign generated successfully.",
      data: result,
    };
  } catch (error) {
    logger.error('Campaign generation failed', {
      requestId,
      scope: 'server-action.createCampaignAction',
      error: serializeError(error),
    });
    return {
      status: "error",
      message: "Failed to generate campaign structure.",
    };
  }
}

export async function getCampaignsAction(data: {
    adAccountID: string;
    apiKey: string;
}): Promise<{ status: "success" | "error", message: string, data?: Campaign[] }> {
    try {
        const campaignsResponse = await fetch(`https://graph.facebook.com/v20.0/act_${data.adAccountID}/campaigns?fields=name,status,objective&access_token=${data.apiKey}`);
        const campaignsResult = await campaignsResponse.json();
        if (campaignsResult.error) throw new Error(campaignsResult.error.message);
        return { status: "success", message: "Campaigns fetched.", data: campaignsResult.data };
    } catch (error: any) {
        return { status: "error", message: error.message };
    }
}

export async function enhanceImageAction(data: {
    imageUri: string;
    prompt: string;
}): Promise<{ status: "success" | "error", message: string, data?: { enhancedImageUri: string } }> {
    try {
        const result = await enhanceImage(data);
        return { status: "success", message: "Image enhanced.", data: result };
    } catch (error) {
        return { status: "error", message: "Failed to enhance image." };
    }
}

export async function publishCampaignAction(data: any): Promise<{ status: "success" | "error", message: string, data?: PublishResult }> {
    try {
        const result = await publishCampaign(data);
        return { status: "success", message: `Campaign published! Ad ID: ${result.adId}`, data: result };
    } catch (error: any) {
        return { status: "error", message: error.message };
    }
}

export async function testConnectionAction(data: { adAccountID: string, apiKey: string }): Promise<{ status: "success" | "error", message: string, data?: { accountName: string } }> {
    try {
        const result = await testMetaConnection(data);
        if (result.connected) return { status: "success", message: `Connected to ${result.accountName}`, data: { accountName: result.accountName! } };
        return { status: "error", message: result.error || "Connection failed." };
    } catch (error: any) {
        return { status: "error", message: error.message };
    }
}

export async function getAdImagesAction(data: { adAccountID: string, apiKey: string }): Promise<{ status: "success" | "error", message: string, data?: AdImage[] }> {
    try {
        const result = await getAdImages(data);
        if (result.success) return { status: "success", message: "Images loaded.", data: result.images };
        return { status: "error", message: result.error || "Failed to fetch images." };
    } catch (error: any) {
        return { status: "error", message: error.message };
    }
}

export async function reasoningBasedAgentResponse(input: ReasoningBasedAgentResponseInput) {
  return reasoningBasedAgentResponseFlow(input);
}

export async function chatAssistantAction(input: ChatAssistantInput) {
  return chatAssistantFlow(input);
}

export async function generateSystemPromptAction(description: string) {
  const requestId = createRequestId();

  if (!description || description.trim().length < 10) {
    return { error: "Please provide a more detailed description (at least 10 characters)." };
  }
  try {
    const result = await generateSystemPrompt({ description });
    return { systemPrompt: result.systemPrompt };
  } catch (error) {
    logger.error('System prompt generation failed', {
      requestId,
      scope: 'server-action.generateSystemPromptAction',
      error: serializeError(error),
    });
    return { error: "An unexpected error occurred while generating the prompt." };
  }
}

export async function deployAgentAction(agent: AgentProfile) {
    const { elevenLabs, name, systemPrompt, twilio } = agent;
    const apiKey = elevenLabs?.apiKey;

    if (!apiKey) return { error: "ElevenLabs API Key is required." };

    try {
        let agentId = elevenLabs.agentId;
        const agentApiUrl = agentId 
            ? `https://api.elevenlabs.io/v1/convai/agents/${agentId}`
            : "https://api.elevenlabs.io/v1/convai/agents/create";
        
        const agentPayload: any = { name: name };

        if (systemPrompt) {
          const finalSystemPrompt = `${systemPrompt}\n\n{{contexto_adicional}}`;
          agentPayload.conversation_config = {
              agent: {
                  prompt: { prompt: finalSystemPrompt },
                  first_message: "Oss! Welcome to the academy. How can I assist your training journey today?"
              }
          }
        }
        
        const agentResponse = await fetch(agentApiUrl, {
            method: agentId ? 'PATCH' : 'POST',
            headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify(agentPayload),
        });

        const agentResponseData = await agentResponse.json();
        if (!agentResponse.ok) throw new Error(`Agent API Failed: ${agentResponseData.detail || JSON.stringify(agentResponseData)}`);
        agentId = agentResponseData.id;

        let phoneNumberId = elevenLabs.phoneNumberId;
        if (twilio?.phoneNumber) {
            const getNumbersUrl = "https://api.elevenlabs.io/v1/convai/phone-numbers";
            const getNumbersResponse = await fetch(getNumbersUrl, { headers: { 'xi-api-key': apiKey } });
            const getNumbersData = await getNumbersResponse.json();
            const existingNumber = getNumbersData.find((num: any) => num.phone_number === twilio.phoneNumber);

            if (existingNumber) {
                phoneNumberId = existingNumber.phone_number_id;
            } else {
                if (!twilio.accountSid || !twilio.authToken) throw new Error("Twilio SID/Token required for new import.");
                const importResponse = await fetch("https://api.elevenlabs.io/v1/convai/phone-numbers/import", {
                    method: 'POST',
                    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        provider: "twilio",
                        label: `Academy Agent: ${name}`,
                        phone_number: twilio.phoneNumber,
                        sid: twilio.accountSid,
                        token: twilio.authToken
                    }),
                });
                const importData = await importResponse.json();
                if (!importResponse.ok) throw new Error(`Twilio Import Failed: ${importData.detail || JSON.stringify(importData)}`);
                phoneNumberId = importData.id;
            }
            
            const linkResponse = await fetch(`https://api.elevenlabs.io/v1/convai/phone-numbers/${phoneNumberId}`, {
                method: 'PATCH',
                headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ agent_id: agentId }),
            });
            if (!linkResponse.ok) throw new Error("Failed to link phone number.");
        }

        return { success: true, data: { agentId, phoneNumberId: phoneNumberId || undefined } };
    } catch (error: any) {
        return { error: error.message || "Deployment failed." };
    }
}

export async function makeOutboundCallAction(
    apiKey: string, 
    agentId: string, 
    phoneNumberId: string, 
    toNumber: string, 
    additionalContext?: string
) {
  if (!apiKey || !agentId || !phoneNumberId || !toNumber) return { error: "Missing required parameters." };

  const body: any = {
    agent_id: agentId,
    agent_phone_number_id: phoneNumberId,
    to_number: toNumber,
  };

  if (additionalContext && additionalContext.trim() !== '') {
    body.conversation_config_override = {
      agent: {
        prompt: {
          dynamic_variables: { contexto_adicional: additionalContext }
        }
      }
    };
  }

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Call initiation failed.");
    }
    
    const responseData = await response.json();
    return { success: true, message: `Call initiated to ${toNumber}.`, data: responseData };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function receiveAutomationSuggestionsAction(input: AutomationSuggestionInput) {
  return receiveAutomationSuggestionsFlow(input);
}

export async function interpretTaxRulesAction(input: InterpretTaxRulesInput) {
  return interpretTaxRulesFlow(input);
}

/**
 * Fetches academy photos using the REST API for server-side execution.
 */
export const getAcademyPhotos = cache(
  async (address: string): Promise<string[]> => {
    const geocoded = await geocodeAddress(address);
    if (!geocoded) return [];

    const academies = await findFranchise(geocoded, 50000);
    if (!academies || academies.length === 0) return [];

    const photos: string[] = [];
    academies.forEach(academy => {
      if (academy.photos) {
        academy.photos.forEach(photo => {
          if (photo.name) photos.push(photo.name);
        });
      }
    });
    
    return Array.from(new Set(photos));
  },
  ['academy-photos'],
  { revalidate: 3600 }
);
