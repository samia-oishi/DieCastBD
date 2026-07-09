import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { firebaseAuth, googleProvider } from "@/lib/firebase";

export async function registerWithEmail({ name, email, password }) {
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  await updateProfile(credential.user, { displayName: name });
  return credential.user;
}

export async function loginWithEmail({ email, password }) {
  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return credential.user;
}

export async function loginWithGoogle() {
  const credential = await signInWithPopup(firebaseAuth, googleProvider);
  return credential.user;
}

export async function requestPasswordReset(email) {
  await sendPasswordResetEmail(firebaseAuth, email);
}

export async function signOutFirebase() {
  await signOut(firebaseAuth);
}

const FIREBASE_ERROR_MESSAGES = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/popup-closed-by-user": "Google sign-in was cancelled.",
  "auth/weak-password": "Password must be at least 6 characters.",
};

export function getAuthErrorMessage(error) {
  return FIREBASE_ERROR_MESSAGES[error?.code] ?? "Something went wrong. Please try again.";
}
