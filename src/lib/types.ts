export type CampaignStructure = {
  campaignName: string;
  adSetName: string;
  adCreativeTexts: string[];
  campaignObjective: string;
  optimizationGoal: string;
  callToActionType: string;
};

export type Campaign = {
  id: string;
  name: string;
  status: string;
  objective: string;
  creative?: {
    thumbnail_url?: string;
    ad_copy?: string;
  }
};

export type PublishResult = {
  campaignId: string;
  adSetId: string;
  adId: string;
};

export type AdImage = {
    hash: string;
    name: string;
    url: string;
    permalink_url: string;
};
