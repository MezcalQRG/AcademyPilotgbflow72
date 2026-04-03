'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, PauseCircle, XCircle, ShieldAlert, Timer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useAuth } from '@/firebase';
import { getIdToken } from 'firebase/auth';

type Mode = 'pause' | 'cancel';
type Step = 'idle' | 'confirm' | 'otp-sent' | 'executing' | 'done';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface MembershipDangerZoneProps {
  /** Academy name shown in the confirm-name prompt for cancel. */
  academyName: string;
  /** Tenant slug for display and confirmation. */
  slug: string;
}

export function MembershipDangerZone({ academyName, slug }: MembershipDangerZoneProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const auth = useAuth();

  const [mode, setMode] = useState<Mode>('pause');
  const [step, setStep] = useState<Step>('idle');
  const [otp, setOtp] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer
  useEffect(() => {
    if (otpExpiry === null) return;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((otpExpiry - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(timerRef.current!);
        setStep('confirm');
        setOtp('');
        toast({ variant: 'destructive', title: 'CODE EXPIRED', description: 'Request a new verification code.' });
      }
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [otpExpiry, toast]);

  function reset() {
    setStep('idle');
    setOtp('');
    setConfirmName('');
    setOtpExpiry(null);
    setTimeLeft(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function getToken(): Promise<string | null> {
    if (!auth?.currentUser) return null;
    try {
      return await getIdToken(auth.currentUser, /* forceRefresh */ false);
    } catch {
      return null;
    }
  }

  function openConfirm(selectedMode: Mode) {
    setMode(selectedMode);
    setStep('confirm');
    setOtp('');
    setConfirmName('');
  }

  async function handleRequestOtp() {
    if (mode === 'cancel' && confirmName.trim() !== (academyName || slug)) {
      toast({ variant: 'destructive', title: 'NAME MISMATCH', description: 'Type your academy name exactly to proceed.' });
      return;
    }

    const token = await getToken();
    if (!token) {
      toast({ variant: 'destructive', title: 'AUTH REQUIRED', description: 'Please sign in again.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'request-otp', mode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request code');

      setOtpExpiry(data.expiresAt);
      setStep('otp-sent');
      toast({ title: 'CODE SENT', description: 'Check your email for the 6-digit verification code.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'REQUEST FAILED', description: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleExecute() {
    if (!otp || otp.trim().length !== 6) {
      toast({ variant: 'destructive', title: 'INVALID CODE', description: 'Enter the 6-digit code from your email.' });
      return;
    }

    const token = await getToken();
    if (!token) {
      toast({ variant: 'destructive', title: 'AUTH REQUIRED', description: 'Please sign in again.' });
      return;
    }

    setLoading(true);
    setStep('executing');
    try {
      const res = await fetch('/api/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'execute', mode, otp: otp.trim(), confirmName: confirmName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStep('otp-sent');
        throw new Error(data.error || 'Verification failed');
      }

      setStep('done');
      if (mode === 'pause') {
        toast({ title: 'ACCOUNT PAUSED', description: 'Your membership is paused. Data remains in Firebase.' });
      } else {
        toast({ variant: 'destructive', title: 'ACCOUNT CANCELLED', description: 'All data has been securely archived and deleted.' });
        // Small delay then redirect to root
        setTimeout(() => { window.location.href = '/'; }, 3000);
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'FAILED', description: err.message });
      setLoading(false);
    } finally {
      if (step !== 'done') setLoading(false);
    }
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerDisplay = `${minutes}:${String(seconds).padStart(2, '0')}`;

  // ─── DONE STATE ──────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <Card className="rounded-none border-2 border-destructive/40 bg-destructive/5">
        <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
          {mode === 'pause' ? (
            <PauseCircle className="w-12 h-12 text-yellow-500" />
          ) : (
            <XCircle className="w-12 h-12 text-destructive" />
          )}
          <p className="font-black uppercase tracking-widest text-sm">
            {mode === 'pause' ? 'Membership Paused' : 'Membership Cancelled'}
          </p>
          <p className="text-xs text-muted-foreground">
            {mode === 'pause'
              ? 'Your account is paused. Contact support to resume at any time.'
              : 'Your data has been archived in secure storage for 31 days. Redirecting...'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── OTP + CONFIRM FORM ──────────────────────────────────────────────────────
  if (step === 'otp-sent' || step === 'executing') {
    return (
      <Card className={`rounded-none border-2 ${mode === 'cancel' ? 'border-destructive' : 'border-yellow-500/60'}`}>
        <CardHeader className={`border-b-2 ${mode === 'cancel' ? 'border-destructive/40 bg-destructive/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
          <CardTitle className="text-sm font-black uppercase italic tracking-tight flex items-center gap-2">
            <ShieldAlert className={`h-4 w-4 ${mode === 'cancel' ? 'text-destructive' : 'text-yellow-500'}`} />
            {mode === 'pause' ? 'Verify to Pause' : 'Verify to Cancel'}
          </CardTitle>
          {otpExpiry && (
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
              <Timer className="h-3 w-3" />
              Code expires in: <span className={`font-mono ${timeLeft < 60 ? 'text-destructive' : ''}`}>{timerDisplay}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest">
              Verification Code (6 digits)
            </Label>
            <Input
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="rounded-none border-2 h-12 font-mono text-center text-2xl tracking-[0.5em]"
              maxLength={6}
              inputMode="numeric"
              disabled={loading}
            />
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
              Check your email for the 6-digit code.
            </p>
          </div>
        </CardContent>
        <CardFooter className="p-6 flex gap-3 border-t border-border">
          <Button
            variant="outline"
            onClick={reset}
            disabled={loading}
            className="rounded-none border-2 font-black uppercase text-[10px] h-11"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExecute}
            disabled={loading || otp.length !== 6}
            className={`flex-1 rounded-none font-black uppercase italic tracking-widest h-11 ${
              mode === 'cancel' ? 'bg-destructive hover:bg-destructive/90 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
              : mode === 'pause' ? <PauseCircle className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />
            }
            {loading ? (mode === 'pause' ? 'Pausing...' : 'Cancelling...') : (mode === 'pause' ? 'Confirm Pause' : 'Confirm Cancellation')}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // ─── CONFIRM STEP (before requesting OTP) ────────────────────────────────────
  if (step === 'confirm') {
    return (
      <Card className={`rounded-none border-2 ${mode === 'cancel' ? 'border-destructive' : 'border-yellow-500/60'}`}>
        <CardHeader className={`border-b-2 ${mode === 'cancel' ? 'border-destructive/40 bg-destructive/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
          <CardTitle className="text-sm font-black uppercase italic tracking-tight flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${mode === 'cancel' ? 'text-destructive' : 'text-yellow-500'}`} />
            {mode === 'pause' ? 'Pause Membership' : 'Cancel Membership'}
          </CardTitle>
          <CardDescription className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">
            {mode === 'pause'
              ? 'Your account will be locked. All data remains in Firebase and can be resumed.'
              : 'This is permanent. All data will be archived for 31 days then permanently deleted.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {mode === 'cancel' && (
            <div className="rounded-none border-2 border-destructive/40 bg-destructive/5 p-4 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-destructive">What will be deleted:</p>
              <ul className="text-[9px] text-muted-foreground space-y-1 ml-2">
                <li>• Your full Firebase account and profile</li>
                <li>• All leads, callback queue, and automations</li>
                <li>• Landing page, tenant settings, integrations</li>
                <li>• All voice call sessions</li>
              </ul>
              <p className="text-[9px] text-muted-foreground mt-2">
                A secure backup is stored in S3 for 31 days. Academy slug <strong>{slug}</strong> will be permanently reserved.
              </p>
              
              <div className="space-y-2 border-t border-destructive/20 pt-4 mt-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-destructive">
                  Type your academy name to confirm
                </Label>
                <Input
                  value={confirmName}
                  onChange={e => setConfirmName(e.target.value)}
                  placeholder={academyName || slug}
                  className="rounded-none border-2 border-destructive/40 h-12 bg-destructive/5"
                  disabled={loading}
                />
                <p className="text-[9px] text-destructive/70 uppercase tracking-wider">
                  Type exactly: <strong>{academyName || slug}</strong>
                </p>
              </div>
            </div>
          )}
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            We will send a 6-digit verification code to your email to proceed.
          </p>
        </CardContent>
        <CardFooter className="p-6 flex gap-3 border-t border-border">
          <Button
            variant="outline"
            onClick={reset}
            disabled={loading}
            className="rounded-none border-2 font-black uppercase text-[10px] h-11"
          >
            Go Back
          </Button>
          <Button
            onClick={handleRequestOtp}
            disabled={loading}
            className={`flex-1 rounded-none font-black uppercase italic tracking-widest h-11 ${
              mode === 'cancel' ? 'bg-destructive hover:bg-destructive/90 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
              : <ShieldAlert className="h-4 w-4 mr-2" />
            }
            Send Verification Code
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // ─── IDLE ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-destructive">Danger Zone</span>
      </div>

      {/* Pause */}
      <Card className="rounded-none border-2 border-yellow-500/40 bg-card">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-black uppercase italic tracking-tight flex items-center gap-2">
            <PauseCircle className="h-4 w-4 text-yellow-500" />
            Pause Membership
          </CardTitle>
          <CardDescription className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">
            Temporarily disable your academy. All data is preserved and the account can be resumed at any time.
            No data is deleted while paused.
          </CardDescription>
        </CardHeader>
        <CardFooter className="p-5 pt-0">
          <Button
            variant="outline"
            onClick={() => openConfirm('pause')}
            className="rounded-none border-2 border-yellow-500/60 text-yellow-600 hover:bg-yellow-500/10 font-black uppercase italic tracking-widest text-[10px] h-10 gap-2"
          >
            <PauseCircle className="h-4 w-4" />
            Pause Membership
          </Button>
        </CardFooter>
      </Card>

      {/* Cancel */}
      <Card className="rounded-none border-2 border-destructive/40 bg-card">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-black uppercase italic tracking-tight flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            Cancel Membership
            <Badge className="rounded-none bg-destructive/10 text-destructive border-destructive/20 text-[8px] font-black uppercase">Permanent</Badge>
          </CardTitle>
          <CardDescription className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">
            Permanently close your academy. All Firestore data and your Firebase account will be deleted.
            A secure backup is kept for 31 days then auto-deleted. The academy slug <strong>{slug}</strong> will be reserved.
          </CardDescription>
        </CardHeader>
        <CardFooter className="p-5 pt-0">
          <Button
            variant="outline"
            onClick={() => openConfirm('cancel')}
            className="rounded-none border-2 border-destructive/60 text-destructive hover:bg-destructive/10 font-black uppercase italic tracking-widest text-[10px] h-10 gap-2"
          >
            <XCircle className="h-4 w-4" />
            Cancel Membership
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
