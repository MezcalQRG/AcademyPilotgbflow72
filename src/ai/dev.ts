import { config } from 'dotenv';
config();

import '@/ai/flows/ai-ad-content-generator.ts';
import '@/ai/flows/generate-campaign-structure.ts';
import '@/ai/flows/enhance-image.ts';
import '@/ai/flows/publish-campaign.ts';
import '@/ai/flows/test-meta-connection.ts';
import '@/ai/flows/get-ad-images.ts';
