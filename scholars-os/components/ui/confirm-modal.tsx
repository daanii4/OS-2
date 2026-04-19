'use client'

import { useEffect } from 'react'

type Props = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  /** Bento-style panel: subtle grid, olive accent bar, elevated card */
  bento?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'default',
  bento = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const confirmClass =
    variant === 'danger'
      ? 'bg-[#dc2626] text-white hover:bg-[#b91c1c] focus-visible:ring-[#dc2626]'
      : 'bg-[#5C6B46] text-white hover:bg-[#3d4c2c] focus-visible:ring-[#5C6B46]'

  const panelClass = bento
    ? 'relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[rgba(92,107,70,0.14)] bg-[var(--surface-card)] shadow-[0_20px_50px_-12px_rgba(30,37,23,0.25)]'
    : 'relative z-10 w-full max-w-md rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-xl'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className={panelClass}
      >
        {bento ? (
          <>
            <div
              className="h-1 w-full bg-gradient-to-r from-[#5C6B46] via-[#8a9e69] to-[#b8952a]"
              aria-hidden
            />
            <div
              className="bg-[linear-gradient(135deg,rgba(243,247,232,0.65)_0%,rgba(255,255,255,0.92)_45%,rgba(238,240,232,0.5)_100%)] p-6"
            >
              <div className="rounded-xl border border-[rgba(92,107,70,0.1)] bg-white/90 p-5 shadow-sm backdrop-blur-sm">
                <h2 id="confirm-modal-title" className="os-heading text-[var(--text-primary)]">
                  {title}
                </h2>
                <p className="mt-3 os-body text-[var(--text-secondary)] whitespace-pre-line">
                  {description}
                </p>
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className="os-btn-secondary"
                    onClick={onCancel}
                    disabled={loading}
                  >
                    {cancelLabel}
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${confirmClass}`}
                    onClick={onConfirm}
                    disabled={loading}
                  >
                    {loading ? 'Please wait…' : confirmLabel}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 id="confirm-modal-title" className="os-heading text-[var(--text-primary)]">
              {title}
            </h2>
            <p className="mt-3 os-body text-[var(--text-secondary)] whitespace-pre-line">{description}</p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="os-btn-secondary"
                onClick={onCancel}
                disabled={loading}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${confirmClass}`}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? 'Please wait…' : confirmLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
