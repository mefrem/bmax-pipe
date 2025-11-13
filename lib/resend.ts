import { Resend } from "resend";

// Optional - only used if RESEND_API_KEY is set
export const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

