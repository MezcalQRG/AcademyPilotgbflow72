
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
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import axios from 'axios';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'https://2cgrii72ke.execute-api.us-east-1.amazonaws.com/orchestrate';
const ORCHESTRATOR_TOKEN = process.env.ORCHESTRATOR_TOKEN || '123456789';

/**
 * High-authority directive to initiate a tactical magic link login via AWS SES.
 */
export async function initiateTacticalLoginAction(email: string) {
  try {
    const admin = getFirebaseAdmin();
    
    // 1. Generate the secure tactical link
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://graciebarra.ai'}/dashboard?email=${encodeURIComponent(email)}`,
      handleCodeInApp: true,
    };
    
    const loginLink = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);
    
    // 2. Dispatch the link via AWS Orchestrator SES sector
    const result = await dispatchOrchestratorAction('SEND_EMAIL', {
      userEmail: email,
      templateType: 'magic-link',
      userData: {
        loginUrl: loginLink,
        name: email.split('@')[0].toUpperCase(),
      }
    });

    return result;
  } catch (error: any) {
    console.error('[AUTH ERROR] Handshake initialization failure:', error);
    return { error: error.message };
  }
}

/**
 * Universal Adapter for the AWS Tactical Orchestrator.
 * Funnels mission-critical requests to the centralized AWS gateway.
 */
export async function dispatchOrchestratorAction(action: string, payload: any) {
  try {
    const response = await axios.post(ORCHESTRATOR_URL, {
      action,
      payload
    }, {
      headers: {
        'Authorization': `Bearer ${ORCHESTRATOR_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error: any) {
    console.error(`[ORCHESTRATOR ERROR] Action ${action} failed:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Operational link failure');
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
    console.error(error);
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
  if (!description || description.trim().length < 10) {
    return { error: "Please provide a more detailed description (at least 10 characters)." };
  }
  try {
    const result = await generateSystemPrompt({ description });
    return { systemPrompt: result.systemPrompt };
  } catch (error) {
    console.error("Error generating system prompt:", error);
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
