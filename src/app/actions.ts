"use server";

import { generateCampaignStructure } from "@/ai/flows/generate-campaign-structure";
import { enhanceImage } from "@/ai/flows/enhance-image";
import { publishCampaign } from "@/ai/flows/publish-campaign";
import { testMetaConnection } from "@/ai/flows/test-meta-connection";
import { getAdImages } from "@/ai/flows/get-ad-images";
import type { CampaignStructure, Campaign, PublishResult, AdImage } from "@/lib/types";

type CampaignActionState = {
  status: "success" | "error";
  message: string;
  data?: CampaignStructure;
};

export async function createCampaignAction(data: {
  adAccountID: string;
  apiKey: string;
  pageID: string;
  businessInformation: string;
  imageURIs: string[];
  isAutopilot: boolean;
}): Promise<CampaignActionState> {
  try {
    const result = await generateCampaignStructure({
        businessInformation: data.businessInformation,
        imageURIs: data.imageURIs,
        isAutopilot: data.isAutopilot,
    });
    return {
      status: "success" as const,
      message: "Campaign generated successfully.",
      data: result,
    };
  } catch (error) {
    console.error(error);
    return {
      status: "error" as const,
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
