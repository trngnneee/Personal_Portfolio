import { logger } from "./logger.js";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

export const noopMailer: Mailer = { send: async () => {} };

/** Resend HTTP API. Failures are logged, never surfaced to the visitor. */
export function createResendMailer(apiKey: string, from: string): Mailer {
  return {
    async send(mail) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from,
            to: [mail.to],
            subject: mail.subject,
            text: mail.text,
            reply_to: mail.replyTo,
          }),
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) logger.warn({ status: res.status }, "Resend rejected email");
      } catch (err) {
        logger.warn({ err }, "Resend request failed");
      }
    },
  };
}
