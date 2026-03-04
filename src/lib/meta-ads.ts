'use server';

function dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

const API_VERSION = 'v20.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

type CampaignBudget = {
    type: 'daily' | 'lifetime';
    dailyBudget?: number;
    lifetimeBudget?: number;
}

export async function uploadImage(adAccountId: string, accessToken: string, imageUri: string): Promise<{ hash: string }> {
    const formData = new FormData();
    formData.append('filename', dataURItoBlob(imageUri));
    formData.append('access_token', accessToken);

    const response = await fetch(`${BASE_URL}/act_${adAccountId}/adimages`, {
        method: 'POST',
        body: formData,
    });
    const data = await response.json();
    if (data.error) {
        throw new Error(`Meta API Error (uploadImage): ${data.error.message}`);
    }
    const imageHash = data.images[Object.keys(data.images)[0]].hash;
    return { hash: imageHash };
}

export async function createCampaign(adAccountId: string, accessToken: string, campaignName: string, objective: string, budget?: CampaignBudget, bidStrategy?: string): Promise<{ id: string }> {
    const formData = new FormData();
    formData.append('name', campaignName);
    formData.append('objective', objective);
    formData.append('status', 'PAUSED');
    formData.append('special_ad_categories', '[]');
    formData.append('access_token', accessToken);

    if (budget) {
        if (budget.type === 'daily' && budget.dailyBudget) {
            formData.append('daily_budget', (budget.dailyBudget * 100).toString());
        } else if (budget.type === 'lifetime' && budget.lifetimeBudget) {
            formData.append('lifetime_budget', (budget.lifetimeBudget * 100).toString());
        }
        if (bidStrategy) {
            formData.append('bid_strategy', bidStrategy);
        }
    }

    const response = await fetch(`${BASE_URL}/act_${adAccountId}/campaigns`, {
        method: 'POST',
        body: formData,
    });
    const data = await response.json();
    if (data.error) throw new Error(`Meta API Error (createCampaign): ${data.error.message}`);
    return data;
}

type AdSetBudgetConfig = {
    type: 'daily' | 'lifetime';
    dailyBudget?: number;
    lifetimeBudget?: number;
    startTime?: string;
    endTime?: string;
}

export async function createAdSet(adAccountId: string, accessToken: string, campaignId: string, adSetName: string, budgetConfig: AdSetBudgetConfig | null, targeting: any, optimizationGoal: string, isDynamicCreative: boolean = false): Promise<{ id: string }> {
    const formData = new FormData();
    formData.append('name', adSetName);
    formData.append('optimization_goal', optimizationGoal);
    formData.append('billing_event', 'IMPRESSIONS');
    formData.append('campaign_id', campaignId);
    formData.append('targeting', JSON.stringify(targeting));
    formData.append('status', 'PAUSED');
    formData.append('access_token', accessToken);

    if (budgetConfig) {
        if (budgetConfig.type === 'lifetime') {
            formData.append('lifetime_budget', (budgetConfig.lifetimeBudget! * 100).toString());
            formData.append('start_time', budgetConfig.startTime!);
            formData.append('end_time', budgetConfig.endTime!);
        } else {
            formData.append('daily_budget', (budgetConfig.dailyBudget! * 100).toString());
        }
    }

    if (isDynamicCreative) formData.append('is_dynamic_creative', 'true');

    const response = await fetch(`${BASE_URL}/act_${adAccountId}/adsets`, {
        method: 'POST',
        body: formData,
    });
    const data = await response.json();
    if (data.error) throw new Error(`Meta API Error (createAdSet): ${data.error.message}`);
    return data;
}

export async function createAdCreative(adAccountId: string, accessToken: string, pageId: string, message: string | null, imageHash: string | null, ctaType: string | null, ctaLink: string | null, assetFeedSpec?: any): Promise<{ id: string }> {
    const formData = new FormData();
    formData.append('access_token', accessToken);

    if (assetFeedSpec) {
        formData.append('name', `Dynamic Creative for ${pageId}`);
        formData.append('asset_feed_spec', JSON.stringify({ ...assetFeedSpec, page_ids: [pageId] }));
    } else {
        const objectStorySpec: any = {
            page_id: pageId,
            link_data: {
                image_hash: imageHash,
                link: ctaLink,
                message: message,
            }
        };
        if (ctaType && ctaType !== 'NONE') {
            objectStorySpec.link_data.call_to_action = { type: ctaType, value: { link: ctaLink } };
        }
        formData.append('name', `Creative for ${pageId}`);
        formData.append('object_story_spec', JSON.stringify(objectStorySpec));
    }

    const response = await fetch(`${BASE_URL}/act_${adAccountId}/adcreatives`, {
        method: 'POST',
        body: formData,
    });
    const data = await response.json();
    if (data.error) throw new Error(`Meta API Error (createAdCreative): ${data.error.message}`);
    return data;
}

export async function createAd(adAccountId: string, accessToken: string, adSetId: string, creativeId: string, adName: string): Promise<{ id: string }> {
    const formData = new FormData();
    formData.append('name', adName);
    formData.append('adset_id', adSetId);
    formData.append('creative', JSON.stringify({ creative_id: creativeId }));
    formData.append('status', 'PAUSED');
    formData.append('access_token', accessToken);

    const response = await fetch(`${BASE_URL}/act_${adAccountId}/ads`, {
        method: 'POST',
        body: formData,
    });
    const data = await response.json();
    if (data.error) throw new Error(`Meta API Error (createAd): ${data.error.message}`);
    return data;
}
