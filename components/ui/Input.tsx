import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = "", ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label className="block font-medium text-[12px] text-ink-light mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-bg-warm border border-border rounded-input px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors ${className}`}
        {...props}
      />
    </div>
  );
}
