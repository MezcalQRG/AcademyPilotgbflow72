
import { z } from "zod";

export const AgentProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, { message: "Agent name is required." }),
  createdAt: z.string().datetime(),
  
  elevenLabs: z.object({
    apiKey: z.string().optional(),
    voiceId: z.string().optional(),
    modelId: z.string().default('eleven_multilingual_v2').optional(),
    agentId: z.string().optional(),
    phoneNumberId: z.string().optional(),
  }),

  systemPromptDescription: z.string().optional(),
  systemPrompt: z.string().optional(),

  twilio: z.object({
    accountSid: z.string().optional(),
    authToken: z.string().optional(),
    phoneNumber: z.string().optional(),
  }),

  status: z.enum(['draft', 'deployed']).default('draft'),
});

export type AgentProfile = z.infer<typeof AgentProfileSchema>;
