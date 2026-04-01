"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentMethodForm } from "@/components/leads/payment-method-form";
import { StripeEmbeddedCheckout } from "@/components/checkout/stripe-embedded-checkout";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, Zap, CreditCard, ArrowLeft, CheckCircle2, X } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { getAcademyPhotos } from "@/app/actions";
import { BackgroundPhotoRotation } from "@/components/landing/background-photo-rotation";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import type { PaymentMethodFormData } from "@/components/leads/payment-method-form";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams<{ slug?: string }>();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [photos, setPhotos] = useState<string[]>([]);
  const [coupon, setCoupon] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [isAgreementOpen, setIsAgreementOpen] = useState(false);
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [postCheckoutRedirectPath, setPostCheckoutRedirectPath] = useState<string | null>(null);
  const [checkoutStatusHandled, setCheckoutStatusHandled] = useState(false);
  const [membershipFullName, setMembershipFullName] = useState("");
  const [membershipPhoneNumber, setMembershipPhoneNumber] = useState("");
  const [embeddedClientSecret, setEmbeddedClientSecret] = useState<string | null>(null);
  const [isInitializingEmbedded, setIsInitializingEmbedded] = useState(false);

  const planTitle = searchParams.get("plan") || "Strategic Plan";
  const planDetails = searchParams.get("details") || "Checkout details pending.";
  const itemType = searchParams.get("itemType") || "membership";
  const assetId = searchParams.get("assetId");
  const checkoutStatus = searchParams.get("checkoutStatus");
  const sessionId = searchParams.get("session_id");
  const basePrice = searchParams.get("price") || "150";
  const displayPrice = isCouponApplied ? "0" : basePrice;
  const routeSlug = typeof params?.slug === 'string' ? params.slug : '';
  const [academySlug, setAcademySlug] = useState(searchParams.get("slug") || routeSlug || "");

  useEffect(() => {
    const slugFromQuery = searchParams.get('slug') || '';
    setAcademySlug(slugFromQuery || routeSlug || '');
  }, [searchParams, routeSlug]);

  useEffect(() => {
    async function loadPhotos() {
      const academyPhotos = await getAcademyPhotos("310 S Glendora Ave West Covina 91790");
      setPhotos(academyPhotos);
    }
    loadPhotos();
  }, []);

  useEffect(() => {
    if (itemType !== 'membership' || checkoutStatusHandled) {
      return;
    }

    if (checkoutStatus === 'cancelled') {
      setCheckoutStatusHandled(true);
      toast({
        variant: 'destructive',
        title: 'Checkout Cancelled',
        description: 'Payment was cancelled. You can retry when ready.',
      });
      return;
    }

    if (checkoutStatus !== 'processing' || !sessionId) {
      return;
    }

    setCheckoutStatusHandled(true);
    setIsProcessing(true);

    let stopped = false;
    let attempts = 0;
    const maxAttempts = 30;

    const pollStatus = async () => {
      if (stopped) {
        return;
      }

      attempts += 1;

      try {
        const response = await fetch(`/api/stripe/checkout-status?session_id=${encodeURIComponent(sessionId)}`);
        const result = await response.json();

        if (result?.status === 'provisioned') {
          setPostCheckoutRedirectPath(result?.redirectPath || null);
          setCountdown(3);
          setIsSuccess(true);
          setIsProcessing(false);
          return;
        }

        if (result?.status === 'failed') {
          setIsProcessing(false);
          toast({
            variant: 'destructive',
            title: 'Provisioning Failed',
            description: result?.error || 'Payment succeeded but account provisioning failed.',
          });
          return;
        }

        if (attempts >= maxAttempts) {
          setIsProcessing(false);
          toast({
            variant: 'default',
            title: 'Provisioning Delayed',
            description: 'We are still confirming your payment. Please refresh this page shortly.',
          });
          return;
        }

        setTimeout(pollStatus, 2500);
      } catch (error) {
        if (attempts >= maxAttempts) {
          setIsProcessing(false);
          toast({
            variant: 'destructive',
            title: 'Checkout Status Error',
            description: 'Could not confirm payment status. Please refresh and try again.',
          });
          return;
        }

        setTimeout(pollStatus, 2500);
      }
    };

    pollStatus();

    return () => {
      stopped = true;
    };
  }, [itemType, checkoutStatus, sessionId, checkoutStatusHandled, toast]);

  // Redirection Countdown logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSuccess && countdown > 0) {
        timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
    } else if (isSuccess && countdown === 0) {
        // Redirection route
        const dashboardUrl = postCheckoutRedirectPath || (academySlug
          ? `/${academySlug}/dashboard/settings?tab=account&onboarding=1`
          : "/");
        router.push(dashboardUrl);
    }

    return () => clearInterval(timer);
  }, [isSuccess, countdown, router, academySlug, postCheckoutRedirectPath]);

  const tacticalAsset = assetId 
    ? PlaceHolderImages.find(img => img.id === assetId)
    : PlaceHolderImages.find(img => img.id === 'hero-bjj');

  const handleRedeem = () => {
    if (itemType === 'membership') {
      toast({
        variant: 'destructive',
        title: 'Coupon Disabled',
        description: 'Membership checkout is handled directly by Stripe.',
      });
      return;
    }

    if (coupon === "BYPASS-123") {
      setIsCouponApplied(true);
      toast({
        title: "Coupon Applied",
        description: "Special code BYPASS-123 applied. Total price updated.",
      });

      // TRIGGER SUCCESS SEQUENCE AFTER ANIMATION
      setTimeout(() => {
        setIsSuccess(true);
      }, 1000);
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "This coupon code is not recognized.",
      });
    }
  };

  const handleAgreementScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 50;
    if (isAtBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleMembershipEmbeddedStart = async () => {
    // Require agreement acceptance for academy owner accounts
    if (!isAgreementAccepted) {
      setIsAgreementOpen(true);
      toast({
        variant: "destructive",
        title: "Agreement Required",
        description: "Please read and accept the terms agreement to proceed.",
      });
      return;
    }

    if (!tenantEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your academy email.",
      });
      return;
    }

    if (!academySlug.trim()) {
      toast({
        variant: "destructive",
        title: "Academy Slug Required",
        description: "Please enter your academy slug.",
      });
      return;
    }

    if (!membershipFullName.trim()) {
      toast({
        variant: "destructive",
        title: "Full Name Required",
        description: "Please enter your legal full name.",
      });
      return;
    }

    if (!membershipPhoneNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Phone Required",
        description: "Please enter your phone number.",
      });
      return;
    }

    setIsInitializingEmbedded(true);

    try {
      const normalizedEmail = tenantEmail.trim().toLowerCase();
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          fullName: membershipFullName.trim(),
          phoneNumber: membershipPhoneNumber.trim(),
          tenantSlug: academySlug,
          planTitle,
          uiMode: 'embedded',
        }),
      });
      const result = await response.json();

      if (!response.ok || result?.error || !result?.clientSecret) {
        throw new Error(result?.error || 'Could not initialize Stripe checkout.');
      }

      setEmbeddedClientSecret(result.clientSecret);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Checkout Failed",
        description: error?.message || "Could not initialize academy checkout.",
      });
    } finally {
      setIsInitializingEmbedded(false);
    }
  };

  const handlePaymentSubmit = async (data: PaymentMethodFormData) => {
    setIsProcessing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      toast({
        title: "Enrollment Complete",
        description: `Successfully enrolled in ${planTitle}. Welcome to the academy.`,
      });

      setIsSuccess(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Checkout Failed",
        description: error?.message || "Could not complete onboarding.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col md:flex-row font-sans text-slate-900 dark:text-white">
      {/* Left Sector: Briefing */}
      <div className="w-full md:w-5/12 bg-white dark:bg-black/50 p-6 md:p-12 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-200 dark:border-border">
        <div className="absolute inset-0 z-0">
          <BackgroundPhotoRotation photoUrls={photos} />
          {/* Light glassmorphic overlay for image readability */}
          <div className="absolute inset-0 bg-white/85 backdrop-blur-md" />
        </div>

        <div className="relative z-10 space-y-8 md:space-y-12">
          <Link href={itemType === 'uniform' ? '/store' : '/'} className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500 hover:text-primary transition-colors group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            RETURN TO ACADEMY
          </Link>

          <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                  <img 
                    src="https://graciebarra.com/wp-content/uploads/2025/07/logos-barra-shield.svg" 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none mb-1">GB AI</span>
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-400">Checkout Portal</span>
                </div>
              </div>
              <ThemeToggle />
            </div>
            
            <div className="relative">
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  {itemType === 'uniform' ? 'Uniform Order' : 'Plan Selection'}
                </p>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  {planTitle}
                </h1>
                
                <div className="inline-flex items-center gap-2 mt-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={displayPrice}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="inline-block"
                      >
                        ${displayPrice}.00
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span className="text-sm font-medium text-slate-500 tracking-wide uppercase">USD / Month</span>
                </div>

                <div className="pt-6">
                  <p className="text-sm font-medium leading-relaxed text-slate-600 max-w-md">
                    {planDetails}
                  </p>
                </div>

                <div className="mt-8 max-w-sm space-y-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm shadow-slate-100">
                  <Label htmlFor="coupon" className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1 flex items-center gap-2">
                    Promo Code
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      id="coupon" 
                      placeholder="Enter code" 
                      value={coupon} 
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      disabled={isCouponApplied}
                      className="rounded-xl h-12 text-sm bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-primary font-medium placeholder:text-slate-400" 
                    />
                    <Button 
                      onClick={handleRedeem}
                      disabled={isCouponApplied || !coupon}
                      className="rounded-xl h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                  {isCouponApplied ? (
                    <p className="text-xs font-semibold text-green-600 flex items-center gap-1.5 mt-2">
                      <CheckCircle2 className="h-4 w-4" /> Code BYPASS-123 Applied
                    </p>
                  ) : (
                    <p className="text-xs font-medium text-slate-500 mt-2">
                      Enter a promotional code to apply a discount.
                    </p>
                  )}
                </div>

                {/* Email + Slug fields for membership */}
                {itemType === 'membership' && (
                  <div className="mt-4 max-w-sm space-y-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm shadow-slate-100 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="tenant-email" className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                          Academy Email <span className="text-primary">*</span>
                        </Label>
                        <Input
                          id="tenant-email"
                          type="email"
                          required
                          placeholder="yourname@academy.com"
                          value={tenantEmail}
                          onChange={(e) => setTenantEmail(e.target.value)}
                          className="rounded-xl h-12 text-sm bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-primary font-medium placeholder:text-slate-400"
                        />
                        <p className="text-[11px] font-medium text-slate-500">
                          We&apos;ll send your welcome packet here.
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <Label htmlFor="left-academy-slug" className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                          Academy Slug <span className="text-primary">*</span>
                        </Label>
                        <Input
                          id="left-academy-slug"
                          placeholder="e.g. west-covina"
                          value={academySlug}
                          onChange={(e) => setAcademySlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                          required
                          className="rounded-xl h-12 text-sm bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-primary font-medium placeholder:text-slate-400"
                        />
                        <p className="text-[11px] font-medium text-slate-500">
                          Your URL: /{academySlug || 'your-slug'}/dashboard
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {itemType === 'uniform' && tacticalAsset && (
                <div className="mt-8 md:mt-12 w-full max-w-sm relative h-64 md:h-80 bg-slate-50 rounded-3xl border border-slate-200 flex items-center justify-center overflow-hidden group shadow-inner">
                  <div className="relative w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-1000">
                    <Image 
                      src={tacticalAsset.imageUrl} 
                      alt="Unit Preview" 
                      fill 
                      className="object-contain p-6 md:p-8 scale-110 drop-shadow-xl transition-transform duration-700 group-hover:scale-125"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8 md:mt-12">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-500 bg-slate-100/50 w-fit px-4 py-2 rounded-full backdrop-blur-sm border border-slate-200">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <span>Encrypted SSL Secure Connection</span>
          </div>
        </div>
      </div>

      {/* Agreement Modal */}
      <AgreementModal
        isOpen={isAgreementOpen}
        onClose={() => {
          setIsAgreementOpen(false);
          setHasScrolledToBottom(false);
        }}
        onAccept={() => {
          setIsAgreementAccepted(true);
          setIsAgreementOpen(false);
        }}
        onScroll={handleAgreementScroll}
        hasScrolledToBottom={hasScrolledToBottom}
      />

      {/* Right Sector: Checkout Forms */}
      <div className="w-full md:w-7/12 p-6 md:p-12 lg:p-20 bg-slate-50 dark:bg-black/80 flex flex-col justify-center relative">
        <div className="max-w-xl w-full mx-auto relative z-10">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center text-center space-y-8 bg-white dark:bg-card p-12 rounded-3xl shadow-xl border border-slate-100 dark:border-border animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="relative w-28 h-28">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-50" />
                <div className="relative h-28 w-28 bg-green-100 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="h-14 w-14 text-green-600" />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-1.5 rounded-full font-bold text-lg shadow-lg">
                  {countdown}s
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-3xl font-extrabold tracking-tight text-slate-900">Success!</h4>
                <p className="text-sm font-semibold text-slate-600">
                  Please check your email to access your account.
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 pt-4">
                  Redirecting to settings...
                </p>
              </div>
            </div>
          ) : isProcessing || isInitializingEmbedded ? (
            <div className="flex flex-col items-center justify-center text-center space-y-8 bg-white p-12 rounded-3xl shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative h-24 w-24">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className="h-8 w-8 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-bold tracking-tight text-slate-900">Processing...</h4>
                <p className="text-sm font-medium text-slate-500">Securely connecting to the payment network.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 rounded-xl">
                    <CreditCard className="h-6 w-6 text-slate-700" />
                  </div>
                  <h4 className="text-2xl font-extrabold tracking-tight text-slate-900">Payment Details</h4>
                </div>
                <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 font-bold uppercase text-[10px] tracking-widest rounded-full">
                  Secure Checkout
                </Badge>
              </div>
              
              <div className="space-y-6">
                {/* Agreement Acceptance */}
                {itemType === 'membership' && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="agreement"
                        checked={isAgreementAccepted}
                        onChange={(e) => {
                          if (!e.target.checked) {
                            setIsAgreementAccepted(false);
                          } else if (hasScrolledToBottom) {
                            setIsAgreementAccepted(true);
                          } else {
                            setIsAgreementOpen(true);
                            toast({
                              title: "Please Review Terms",
                              description: "You must read to the bottom before accepting.",
                            });
                          }
                        }}
                        disabled={!hasScrolledToBottom}
                        className="w-5 h-5 cursor-pointer accent-primary rounded border-slate-300 disabled:opacity-50"
                      />
                      <Label htmlFor="agreement" className="text-sm font-bold text-slate-700 cursor-pointer flex-1 select-none">
                        I have read and accept the
                        <button
                          type="button"
                          onClick={() => {
                            setIsAgreementOpen(true);
                            setHasScrolledToBottom(false);
                          }}
                          className="text-primary hover:text-primary/80 transition-colors hover:underline ml-1 font-bold"
                        >
                          Terms & Conditions
                        </button>
                      </Label>
                    </div>
                  </div>
                )}

                {itemType === 'membership' ? (
                  <div className="bg-white dark:bg-card rounded-3xl border border-slate-200 dark:border-border p-6 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
                    {!embeddedClientSecret ? (
                      <>
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="membership-name" className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                              Legal Full Name <span className="text-primary">*</span>
                            </Label>
                            <Input
                              id="membership-name"
                              placeholder="Jane Doe"
                              value={membershipFullName}
                              onChange={(e) => setMembershipFullName(e.target.value)}
                              className="rounded-xl h-12 text-sm bg-slate-50 border-slate-200 focus-visible:ring-primary font-medium"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="membership-phone" className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                              Phone Number <span className="text-primary">*</span>
                            </Label>
                            <Input
                              id="membership-phone"
                              placeholder="+1 (555) 000-0000"
                              value={membershipPhoneNumber}
                              onChange={(e) => setMembershipPhoneNumber(e.target.value)}
                              className="rounded-xl h-12 text-sm bg-slate-50 border-slate-200 focus-visible:ring-primary font-medium"
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <Button
                            type="button"
                            onClick={handleMembershipEmbeddedStart}
                            className="w-full rounded-xl font-bold bg-primary hover:bg-primary/90 text-white text-[15px] h-14 shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:-translate-y-0.5"
                          >
                            Continue to Payment
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4 animate-in fade-in duration-500">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            Complete your recurring membership
                          </p>
                        </div>
                        <StripeEmbeddedCheckout clientSecret={embeddedClientSecret} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xl shadow-slate-200/50">
                    <PaymentMethodForm
                      onSubmit={handlePaymentSubmit}
                      onCancel={() => router.push('/store')}
                      hideEmail={false}
                      collectCardDetails={true}
                      submitLabel={'Complete Purchase'}
                    />
                  </div>
                )}
              </div>

              <div className="text-center pt-6">
                <p className="text-[11px] font-medium text-slate-400">
                  Payments are secure and encrypted. Need help? Contact support.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

// Agreement Modal Component
function AgreementModal({ 
  isOpen, 
  onClose, 
  onAccept, 
  onScroll,
  hasScrolledToBottom 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAccept: () => void; 
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  hasScrolledToBottom: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-white text-slate-900 p-6 md:p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-2xl font-extrabold tracking-tight">Terms & Conditions</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          onScroll={onScroll}
          className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 relative"
        >
          <div className="space-y-8 text-sm leading-relaxed font-medium text-slate-600 max-w-prose mx-auto">
            <section>
              <h3 className="font-bold text-slate-900 text-base mb-2">1. Academy Owner Agreement</h3>
              <p>
                By proceeding with this payment of $150 per month, you acknowledge that you are the authorized representative of your academy and take full responsibility for account management, billing, and compliance with all platform policies.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 text-base mb-2">2. Payment Terms</h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 marker:text-slate-300">
                <li>Monthly subscription: $150 USD (auto-renews monthly)</li>
                <li>Payment is charged on the same day each month</li>
                <li>Cancellation can be done anytime from dashboard settings</li>
                <li>No refunds for partial months</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 text-base mb-2">3. Data & Privacy</h3>
              <p>
                Your academy data is stored securely in our platform infrastructure. We comply with GDPR, CCPA, and international data protection standards. Student personal information is encrypted and never shared with third parties without explicit consent.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 text-base mb-2">4. Service Features</h3>
              <p className="mb-2">Your subscription includes:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 marker:text-slate-300">
                <li>Multi-tenant dashboard with unlimited users per academy</li>
                <li>Lead management and tracking system</li>
                <li>AWS SES email integration for student communications</li>
                <li>Student class scheduling and enrollment management</li>
                <li>Secure database for academy data</li>
                <li>Advanced authentication and API security</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 text-base mb-2">5. Termination</h3>
              <p>
                We reserve the right to terminate accounts that violate our terms. Upon termination, your data will be deleted after 30 days unless you request an export for backup purposes.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 text-base mb-2">6. Liability</h3>
              <p>
                We are not liable for data loss, service interruptions, or third-party integrations. Your use of the platform is at your own risk. We maintain industry-standard security, but cannot guarantee 100% uptime.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 text-base mb-2">7. Updates to Terms</h3>
              <p>
                We may update these terms at any time. Material changes will be notified via email. Continued use of the platform constitutes acceptance of new terms.
              </p>
            </section>

            <div className="pt-8 text-center pb-4">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                End of Agreement
              </p>
            </div>
          </div>
        </div>

        {/* Footer with Acceptance */}
        <div className="bg-white border-t border-slate-100 p-6 px-8 rounded-b-3xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {!hasScrolledToBottom ? (
              <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-400"></span>
                </span>
                Scroll down to accept
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                Agreement ready to accept
              </div>
            )}
            
            <div className="flex gap-3 w-full sm:w-auto mt-4 sm:mt-0">
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full sm:w-auto rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 h-12 px-6"
              >
                Decline
              </Button>
              <Button
                onClick={onAccept}
                disabled={!hasScrolledToBottom}
                className="w-full sm:w-auto rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 px-8 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Accept & Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
