import { z } from 'zod';

// Shared email field: strip whitespace + normalize casing before validation
const emailField = z
  .string()
  .min(1, 'El email es requerido')
  .trim()
  .toLowerCase()
  .email('Email inválido');

export const magicLinkSchema = z.object({
  email: emailField,
});

export const passwordLoginSchema = z.object({
  email: emailField,
  // Trim accidental surrounding whitespace; enforce length bounds (OWASP)
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .trim()
    .min(8, 'Mínimo 8 caracteres')
    .max(128, 'Contraseña demasiado larga'),
});

export type MagicLinkFormValues = z.infer<typeof magicLinkSchema>;
export type PasswordLoginFormValues = z.infer<typeof passwordLoginSchema>;
