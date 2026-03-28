'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { initiateTacticalLoginAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { showErrorToast } from '@/lib/client-errors';
import { Shield, Zap, Mail, Loader2, UserPlus, Lock, Chrome } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useAuth, signInWithEmailPasswordAsync, signInWithGoogle } from '@/firebase';
import {
  magicLinkSchema,
  passwordLoginSchema,
  type MagicLinkFormValues,
  type PasswordLoginFormValues,
} from '@/lib/auth-schemas';

type AuthMethod = 'magic-link' | 'password';

interface AuthModalProps {
  mode: 'admin' | 'student';
  trigger: React.ReactNode;
}

export function AuthModal({ mode, trigger }: AuthModalProps) {
  const auth = useAuth();
  const [authMethod, setAuthMethod] = useState<AuthMethod>('magic-link');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  const magicLinkForm = useForm<MagicLinkFormValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: '' },
  });

  const passwordForm = useForm<PasswordLoginFormValues>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const resetState = () => {
    setIsSent(false);
    setAuthMethod('magic-link');
    magicLinkForm.reset();
    passwordForm.reset();
  };

  const handleTabChange = (method: AuthMethod) => {
    const currentEmail =
      authMethod === 'magic-link'
        ? magicLinkForm.getValues('email')
        : passwordForm.getValues('email');

    setAuthMethod(method);

    if (method === 'magic-link') {
      magicLinkForm.setValue('email', currentEmail, { shouldValidate: false });
      return;
    }

    passwordForm.setValue('email', currentEmail, { shouldValidate: false });
  };

  const handleMagicLink = async (data: MagicLinkFormValues) => {
    setIsLoading(true);

    try {
      const result = await initiateTacticalLoginAction(data.email);
      if (result.error) {
        throw new Error(result.error);
      }

      setIsSent(true);
      toast({
        title: 'DISPATCH COMPLETE',
        description: 'Secure tactical link transmitted via AWS SES.',
      });
    } catch (error: any) {
      showErrorToast(
        toast,
        'DISPATCH FAILURE',
        error,
        'Failed to transmit authentication link through the matrix.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (data: PasswordLoginFormValues) => {
    setIsLoading(true);

    try {
      await signInWithEmailPasswordAsync(auth, data.email, data.password);
      toast({ title: 'ACCESS GRANTED', description: 'Authentication successful.' });
    } catch (error: any) {
      const code = error?.code as string | undefined;
      const friendlyMessage =
        code === 'auth/wrong-password' || code === 'auth/invalid-credential'
          ? 'Incorrect password. Verify and retry.'
          : code === 'auth/user-not-found'
            ? 'No account found for this email.'
            : code === 'auth/too-many-requests'
              ? 'Too many attempts. Try again later or use Magic Link.'
              : 'Authentication failed. Check your credentials.';

      showErrorToast(toast, 'ACCESS DENIED', error, friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);

    try {
      await signInWithGoogle(auth);
      toast({ title: 'ACCESS GRANTED', description: 'Google authentication successful.' });
    } catch (error: any) {
      showErrorToast(toast, 'GOOGLE AUTH FAILED', error, 'Could not sign in with Google. Try another method.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const tabClass = (method: AuthMethod) =>
    `flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
      authMethod === method
        ? 'border-primary text-primary'
        : 'border-transparent text-muted-foreground hover:text-foreground'
    }`;

  const inputClass = (hasError: boolean) =>
    `rounded-none border-2 h-14 pl-12 font-bold focus-visible:ring-primary ${
      hasError ? 'border-destructive' : 'border-border'
    }`;

  return (
    <Dialog onOpenChange={(open) => !open && resetState()}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-none border-4 border-border bg-background shadow-2xl p-0 overflow-hidden max-w-md">
        <DialogHeader className="p-8 pb-6 bg-primary text-white border-b-4 border-border">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-white" />
            <DialogTitle className="font-headline text-3xl font-black uppercase italic tracking-tighter">
              {mode === 'admin' ? 'Command Login' : 'Unit Login'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-white/80 font-bold uppercase tracking-widest text-[10px] mt-2">
            Secure Handshake Required for Hub Access
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="w-full rounded-none border-2 border-border h-12 font-black uppercase tracking-widest text-[10px] hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-3"
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Chrome className="h-4 w-4" />
                Continuar con Google
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="bg-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                O inicia sesión con
              </span>
            </div>
          </div>

          <div className="flex border-b-2 border-border">
            <button type="button" className={tabClass('magic-link')} onClick={() => handleTabChange('magic-link')}>
              <Mail className="inline h-3 w-3 mr-1" />
              Magic Link
            </button>
            <button type="button" className={tabClass('password')} onClick={() => handleTabChange('password')}>
              <Lock className="inline h-3 w-3 mr-1" />
              Contraseña
            </button>
          </div>

          {authMethod === 'magic-link' && !isSent && (
            <Form {...magicLinkForm}>
              <form onSubmit={magicLinkForm.handleSubmit(handleMagicLink)} className="space-y-5">
                <FormField
                  control={magicLinkForm.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Email
                      </Label>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="UNIT@EXAMPLE.COM"
                            autoComplete="email"
                            className={`${inputClass(!!fieldState.error)} uppercase`}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wide" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest h-14 shadow-xl text-base"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      DISPATCH ACCESS LINK <Zap className="ml-2 h-4 w-4 fill-current" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          {authMethod === 'magic-link' && isSent && (
            <div className="text-center py-8 space-y-5 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 bg-primary/10 border-4 border-primary flex items-center justify-center rotate-45 mx-auto">
                <Mail className="h-8 w-8 text-primary -rotate-45" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-primary">Link Dispatched</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground max-w-[200px] mx-auto">
                  Check your email for the secure SES handshake link.
                </p>
              </div>
            </div>
          )}

          {authMethod === 'password' && (
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordLogin)} className="space-y-5">
                <FormField
                  control={passwordForm.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Email
                      </Label>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="UNIT@EXAMPLE.COM"
                            autoComplete="email"
                            className={`${inputClass(!!fieldState.error)} uppercase`}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wide" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Contraseña
                      </Label>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className={inputClass(!!fieldState.error)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wide" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest h-14 shadow-xl text-base"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      INICIAR SESIÓN <Lock className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="bg-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                ¿Nueva unidad operacional?
              </span>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            className="w-full rounded-none border-2 border-border h-12 font-black uppercase italic text-[10px] tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all"
          >
            <Link href={`/checkout?mode=${mode}&step=1`}>
              CREAR CUENTA {mode === 'admin' ? 'DE ACADEMIA' : 'DE ESTUDIANTE'} <UserPlus className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
