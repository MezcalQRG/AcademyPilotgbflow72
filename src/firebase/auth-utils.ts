'use client';

import { 
  Auth, 
  sendSignInLinkToEmail, 
  ActionCodeSettings,
  signInWithEmailLink,
  isSignInWithEmailLink,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';

/**
 * Initiates the Magic Link sign-in protocol.
 * Saves the email in localStorage for cross-tab/same-device verification.
 */
export async function initiateMagicLinkSignIn(auth: Auth, email: string): Promise<void> {
  const actionCodeSettings: ActionCodeSettings = {
    // URL to redirect back to. The email is appended to bypass the manual entry prompt.
    url: `${window.location.origin}/dashboard?email=${encodeURIComponent(email)}`,
    handleCodeInApp: true,
  };

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
  } catch (error: any) {
    console.error('Auth Protocol Failure:', error);
    throw error;
  }
}

/**
 * Validates and completes the sign-in if the URL is a valid magic link.
 */
export async function completeMagicLinkSignIn(auth: Auth): Promise<void> {
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem('emailForSignIn');
    
    if (!email) {
      const urlParams = new URLSearchParams(window.location.search);
      email = urlParams.get('email');
    }

    if (email) {
      try {
        // Sign out any currently signed-in user first to ensure clean tenant switching
        if (auth.currentUser) {
          await signOut(auth);
        }
        await signInWithEmailLink(auth, email, window.location.href);
        window.localStorage.removeItem('emailForSignIn');
      } catch (error: any) {
        console.error('Handshake completion failure:', error);
        throw error;
      }
    }
  }
}

/**
 * Signs in a user with email and password.
 * Awaited — throws on bad credentials so the caller can show an error toast.
 */
export async function signInWithEmailPasswordAsync(auth: Auth, email: string, password: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error('Email/password sign-in failure:', error);
    throw error;
  }
}

/**
 * Signs in a user via Google OAuth popup.
 * Awaited — throws on cancellation or error so the caller can show an error toast.
 */
export async function signInWithGoogle(auth: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error: any) {
    // Ignore popup-closed-by-user — not a real error
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      return;
    }
    console.error('Google sign-in failure:', error);
    throw error;
  }
}
