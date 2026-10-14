import { useLocation } from "react-router";
import { TerminalWindow } from "@/components/terminal/TerminalWindow";
import { ButtonLink } from "@/components/ui/Button";
import { Seo } from "@/lib/seo";

export function NotFound({ path }: { path?: string }) {
  const location = useLocation();
  const target = path ?? location.pathname;
  return (
    <section className="mx-auto max-w-2xl px-4 py-24">
      <Seo title="404 — Not found" path={target} noindex />
      <TerminalWindow title="bash">
        <div className="p-6 font-mono text-sm">
          <p>
            <span className="text-neutral-400">trngnneee@portfolio:~$ </span>
            <span className="text-neutral-100">cd {target}</span>
          </p>
          <p className="mt-2 text-danger-300">bash: cd: {target}: No such file or directory</p>
          <h1 className="mt-6 text-2xl font-bold text-neutral-50">404 — command not found</h1>
          <p className="mt-2 text-neutral-300">
            The page you're looking for doesn't exist or has been switched off.
          </p>
          <ButtonLink to="/" className="mt-6">
            cd ~
          </ButtonLink>
        </div>
      </TerminalWindow>
    </section>
  );
}
