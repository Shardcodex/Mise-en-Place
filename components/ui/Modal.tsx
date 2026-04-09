"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({
  open,
  onClose,
  children,
  maxWidth = "max-w-[680px]",
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(45,52,54,0.3)] backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Content */}
      <div
        className={`relative bg-bg-card rounded-card w-full ${maxWidth} max-h-[85vh] overflow-y-auto shadow-modal animate-modal-in`}
      >
        {children}
      </div>
    </div>
  );
}

// Reusable modal header with close button
export function ModalHeader({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="sticky top-0 bg-bg-card z-10 px-8 pt-6 pb-4 border-b border-border flex items-center justify-between">
      <div>{children}</div>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-full bg-bg-warm flex items-center justify-center hover:bg-border transition-colors"
      >
        <X className="w-4 h-4 text-ink-light" strokeWidth={2} />
      </button>
    </div>
  );
}

// Reusable modal footer (sticky at bottom)
export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 bg-bg-card border-t border-border px-8 py-4 flex items-center justify-between">
      {children}
    </div>
  );
}
