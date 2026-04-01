import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from "@/components/ui/toaster";
import { AuthLinkHandler } from "@/components/auth/auth-link-handler";
import Script from 'next/script';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Academia Pilot | AI-Powered Commercial Automation',
  description: 'Revolutionize your academy with AI-driven marketing, lead qualification, and customer service.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <FirebaseClientProvider>
            <AuthLinkHandler />
            {children}
          </FirebaseClientProvider>
          <Toaster />
          {googleMapsKey && (
            <Script
              src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&libraries=places`}
              strategy="beforeInteractive"
            />
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
