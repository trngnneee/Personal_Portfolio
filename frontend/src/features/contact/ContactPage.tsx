import { zodResolver } from "@hookform/resolvers/zod";
import {
  CONTACT_SERVICES,
  contactMessageInputSchema,
  type ContactMessageInput,
} from "@portfolio/shared";
import { Check, Copy, LoaderCircle, Mail, MapPin, Phone, Send } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { useForm, type FieldError } from "react-hook-form";
import { toast } from "sonner";
import { TerminalHeader } from "@/components/terminal/TerminalHeader";
import { TerminalWindow } from "@/components/terminal/TerminalWindow";
import { Button } from "@/components/ui/Button";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { humanize } from "@/lib/format";
import { useSendContact, useSite } from "@/lib/queries";
import { Seo } from "@/lib/seo";

type FormValues = ContactMessageInput;

const SERVICE_LABELS: Record<(typeof CONTACT_SERVICES)[number], string> = {
  frontend_development: "Frontend development",
  backend_development: "Backend development",
  cloud_devops: "Cloud & DevOps",
  consulting: "Consulting",
  other: "Other",
};

const inputClass = (invalid: boolean) =>
  cn(
    "w-full rounded-md border bg-bg-page px-3 py-2 text-neutral-50 placeholder:text-neutral-400 focus:outline-none",
    invalid
      ? "border-danger-500 focus:border-danger-500"
      : "border-neutral-700 focus:border-primary-500",
  );

export function ContactPage() {
  const { data } = useSite();
  const section = data?.sections.find((s) => s.key === "contact");
  const profile = data?.profile;
  const send = useSendContact();
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(contactMessageInputSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      service: "backend_development",
      message: "",
      website: "",
    },
    mode: "onTouched",
  });
  const { register, handleSubmit, formState, reset } = form;
  const errors = formState.errors;

  const onSubmit = handleSubmit(async (values) => {
    setStatus("idle");
    try {
      await send.mutateAsync(values);
      setStatus("sent");
      setStatusMessage("Message sent — I'll get back to you soon.");
      toast.success("Message sent!");
      reset();
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 429
          ? "Too many messages — please try again in a few minutes."
          : err instanceof Error
            ? err.message
            : "Could not send the message.";
      setStatus("error");
      setStatusMessage(message);
      toast.error(message);
    }
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <Seo
        title={section?.heading ?? "Contact"}
        description="Get in touch about backend, cloud or DevOps work."
        path="/contact"
      />
      <TerminalHeader
        command={section?.subheading || "./contact.sh"}
        title={section?.heading ?? "Contact"}
        description="Have a project, a role or a question? Send a message."
      />

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <TerminalWindow title="contact.sh">
          <form
            onSubmit={onSubmit}
            noValidate
            className="space-y-5 p-6"
            aria-describedby="form-status"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" error={errors.name}>
                {(p) => (
                  <input
                    {...p}
                    {...register("name")}
                    autoComplete="name"
                    className={inputClass(!!errors.name)}
                  />
                )}
              </Field>
              <Field label="Email" error={errors.email}>
                {(p) => (
                  <input
                    {...p}
                    {...register("email")}
                    type="email"
                    autoComplete="email"
                    className={inputClass(!!errors.email)}
                  />
                )}
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Subject" error={errors.subject}>
                {(p) => (
                  <input {...p} {...register("subject")} className={inputClass(!!errors.subject)} />
                )}
              </Field>
              <Field label="Service" error={errors.service}>
                {(p) => (
                  <select {...p} {...register("service")} className={inputClass(!!errors.service)}>
                    {CONTACT_SERVICES.map((s) => (
                      <option key={s} value={s}>
                        {SERVICE_LABELS[s] ?? humanize(s)}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
            <Field label="Message" error={errors.message}>
              {(p) => (
                <textarea
                  {...p}
                  {...register("message")}
                  rows={6}
                  className={inputClass(!!errors.message)}
                />
              )}
            </Field>

            {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
            <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
              <label>
                Website
                <input {...register("website")} tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <Button
              type="submit"
              disabled={send.isPending}
              icon={
                send.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )
              }
            >
              {send.isPending ? "Sending…" : "Send message"}
            </Button>

            <p
              id="form-status"
              role="status"
              aria-live="polite"
              className={cn(
                "font-mono text-sm",
                status === "sent" ? "text-primary-400" : "text-danger-300",
                status === "idle" && "sr-only",
              )}
            >
              {status !== "idle" && statusMessage}
            </p>
          </form>
        </TerminalWindow>

        {profile && (
          <aside className="space-y-6" aria-label="Other ways to reach me">
            <ContactRow icon={<Mail className="size-5" aria-hidden="true" />} label="Email">
              <a
                href={`mailto:${profile.email}`}
                className="text-neutral-100 hover:text-primary-400"
              >
                {profile.email}
              </a>
              <CopyButton value={profile.email} />
            </ContactRow>
            {profile.phone && (
              <ContactRow icon={<Phone className="size-5" aria-hidden="true" />} label="Phone">
                <a
                  href={`tel:${profile.phone.replace(/\s+/g, "")}`}
                  className="text-neutral-100 hover:text-primary-400"
                >
                  {profile.phone}
                </a>
              </ContactRow>
            )}
            {profile.location && (
              <ContactRow icon={<MapPin className="size-5" aria-hidden="true" />} label="Location">
                <span className="text-neutral-100">{profile.location}</span>
              </ContactRow>
            )}
            {data.socialLinks.length > 0 && (
              <ul className="flex flex-wrap gap-2 pt-2">
                {data.socialLinks.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-neutral-800 px-3 py-2 font-mono text-sm text-neutral-200 hover:border-primary-600 hover:text-primary-400"
                    >
                      <BrandIcon platform={s.platform} className="size-4" /> {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: FieldError;
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-mono text-sm text-neutral-200">
        {label}
      </label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": error ? errorId : undefined })}
      {error && (
        <p id={errorId} className="mt-1 font-mono text-xs text-danger-300">
          {error.message}
        </p>
      )}
    </div>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-primary-500">{icon}</span>
      <div>
        <p className="font-mono text-xs tracking-wider text-neutral-400 uppercase">{label}</p>
        <div className="mt-0.5 flex items-center gap-2">{children}</div>
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="rounded p-1 text-neutral-400 hover:bg-bg-elevated hover:text-neutral-50"
      aria-label={copied ? "Copied" : "Copy email address"}
    >
      {copied ? (
        <Check className="size-4 text-primary-400" aria-hidden="true" />
      ) : (
        <Copy className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}
