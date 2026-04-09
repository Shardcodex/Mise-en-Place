import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
  /** "inline" fits inside a card/section; "page" is centered and full-height */
  variant?: "inline" | "page";
}

export default function ErrorBanner({
  message = "Something went wrong. Please try again.",
  onRetry,
  variant = "inline",
}: ErrorBannerProps) {
  if (variant === "page") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-danger-bg flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-danger" strokeWidth={1.75} />
        </div>
        <p className="text-[15px] font-semibold text-ink mb-1">Unable to load</p>
        <p className="text-[13px] text-ink-muted mb-5 max-w-[280px]">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 bg-transparent border border-border text-ink-light rounded-pill px-4 py-2.5 text-[12px] font-semibold hover:border-accent hover:text-accent transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-danger-bg border border-danger/20 rounded-[10px] px-4 py-3 text-[12px] text-danger">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 font-semibold hover:underline flex-shrink-0"
        >
          <RefreshCw className="w-3 h-3" strokeWidth={2} />
          Retry
        </button>
      )}
    </div>
  );
}
