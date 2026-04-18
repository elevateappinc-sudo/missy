"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-up"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[16px] border border-border-light w-full max-w-sm p-6 shadow-xl"
      >
        <div className="flex items-start gap-3 mb-5">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isDanger ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id="confirm-dialog-title" className="text-[15px] font-semibold text-text-primary">
              {title}
            </h3>
            {description && (
              <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">{description}</p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-warm transition-all shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-full text-[13px] font-medium text-text-secondary bg-bg-warm hover:bg-bg-warm/80 transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center justify-center min-w-[100px] px-4 py-2 rounded-full text-[13px] font-semibold text-white transition-all disabled:opacity-50 ${
              isDanger
                ? "bg-error hover:bg-error/90 hover:shadow-[0_4px_16px_rgba(244,63,94,0.25)]"
                : "bg-primary hover:bg-primary-dark hover:shadow-[0_4px_16px_rgba(168,85,247,0.25)]"
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
