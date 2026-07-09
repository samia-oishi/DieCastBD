import { Resend } from "resend";
import { env } from "../config/env.js";

// Lazy singleton — only constructed on first actual send, so email isn't
// required to boot the server (RESEND_API_KEY stays optional in env.js
// until this phase, matching the "ask for credentials when needed" pattern).
let client = null;

export function getResendClient() {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  client ??= new Resend(env.RESEND_API_KEY);
  return client;
}
