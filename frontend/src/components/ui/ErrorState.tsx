import { RefreshCw } from "lucide-react";
import { Button } from "./Button";

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="mx-auto my-16 max-w-xl rounded-lg border border-danger-500/40 bg-bg-surface p-6 font-mono"
    >
      <p className="text-danger-300">
        <span aria-hidden="true">✗ </span>error: {message ?? "Something went wrong."}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          className="mt-4"
          icon={<RefreshCw className="size-4" aria-hidden="true" />}
          onClick={onRetry}
        >
          Retry
        </Button>
      )}
    </div>
  );
}
