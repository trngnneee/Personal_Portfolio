/** Error message plus its causes (Drizzle wraps connection errors such as ECONNREFUSED / auth failures). */
export function describeError(err: unknown): string {
  const parts: string[] = [];
  for (let e: unknown = err; e; e = (e as { cause?: unknown }).cause) {
    if (e instanceof AggregateError) {
      parts.push(...e.errors.map((x: unknown) => (x instanceof Error ? x.message : String(x))));
    } else {
      parts.push(e instanceof Error ? e.message : String(e));
    }
    if (!(e instanceof Error)) break;
  }
  return [...new Set(parts.filter(Boolean))].join("\n  caused by: ");
}

/** Plain-language hints for the usual hosting misconfigurations. */
export function startupHint(message: string): string | null {
  if (/ENETUNREACH|EHOSTUNREACH|getaddrinfo .*db\.[a-z0-9]+\.supabase\.co/i.test(message)) {
    return "Looks like Supabase's direct (IPv6) host. Use the Session pooler URI (…pooler.supabase.com:5432).";
  }
  if (/password authentication failed|SASL/i.test(message)) {
    return "Wrong database password/user. For the pooler the user is postgres.<project-ref>.";
  }
  if (/Tenant or user not found/i.test(message)) {
    return "Pooler user must be postgres.<project-ref> (copy the URI from Supabase → Connect → Session pooler).";
  }
  if (/self[- ]signed certificate|unable to verify|certificate/i.test(message)) {
    return "TLS verification failed: check DATABASE_CA_CERT, or leave it empty to skip verification.";
  }
  if (/ECONNREFUSED|ETIMEDOUT|timeout/i.test(message)) {
    return "Database not reachable: check host/port in DATABASE_URL and that the Supabase project isn't paused.";
  }
  return null;
}
