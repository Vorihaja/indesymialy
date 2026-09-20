'use client';

import {
  CircleAlert,
  CircleCheck,
  Info,
  ShieldAlert,
  TriangleAlert,
  X,
} from 'lucide-react';
import {
  motion,
  useReducedMotion,
} from 'framer-motion';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';

import type {
  IndesyDialogRequest,
  IndesyDialogResolution,
  IndesyDialogTone,
} from './types';

const focusableSelector = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const toneIcons = {
  default: CircleAlert,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: ShieldAlert,
} satisfies Record<
  IndesyDialogTone,
  typeof CircleAlert
>;

function cancelledResolution(
  request: IndesyDialogRequest,
): IndesyDialogResolution {
  switch (request.kind) {
    case 'alert':
      return {
        id: request.id,
        kind: 'alert',
      };
    case 'confirm':
      return {
        id: request.id,
        kind: 'confirm',
        value: false,
      };
    case 'prompt':
      return {
        id: request.id,
        kind: 'prompt',
        value: null,
      };
  }
}

export function IndesyDialog({
  request,
  onResolve,
}: {
  request: IndesyDialogRequest;
  onResolve: (
    resolution: IndesyDialogResolution,
  ) => void;
}) {
  const tone =
    request.options.tone ?? 'default';
  const ToneIcon = toneIcons[tone];
  const reduceMotion = useReducedMotion();
  const dialogRef =
    useRef<HTMLDivElement>(null);
  const primaryButtonRef =
    useRef<HTMLButtonElement>(null);
  const cancelButtonRef =
    useRef<HTMLButtonElement>(null);
  const inputRef =
    useRef<HTMLInputElement>(null);
  const [promptValue, setPromptValue] =
    useState(
      request.kind === 'prompt'
        ? request.options.defaultValue ?? ''
        : '',
    );
  const [validationError, setValidationError] =
    useState<string | null>(null);

  const titleId =
    `indesy-dialog-title-${request.id}`;
  const descriptionId =
    request.options.description
      ? `indesy-dialog-description-${request.id}`
      : undefined;
  const inputLabelId =
    `indesy-dialog-input-label-${request.id}`;

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow =
      document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(
      () => {
        if (request.kind === 'prompt') {
          inputRef.current?.focus();
          inputRef.current?.select();
          return;
        }

        if (
          tone === 'danger' &&
          cancelButtonRef.current
        ) {
          cancelButtonRef.current.focus();
          return;
        }

        primaryButtonRef.current?.focus();
      },
      0,
    );

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onResolve(
          cancelledResolution(request),
        );
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          focusableSelector,
        ) ?? [],
      ).filter(
        (element) =>
          element.getAttribute('aria-hidden') !==
          'true',
      );

      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable.at(-1);

      if (
        !dialogRef.current?.contains(
          document.activeElement,
        )
      ) {
        event.preventDefault();

        if (event.shiftKey) {
          last?.focus();
        } else {
          first.focus();
        }

        return;
      }

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );
      document.body.style.overflow =
        previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onResolve, request, tone]);

  function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (request.kind === 'alert') {
      onResolve({
        id: request.id,
        kind: 'alert',
      });
      return;
    }

    if (request.kind === 'confirm') {
      onResolve({
        id: request.id,
        kind: 'confirm',
        value: true,
      });
      return;
    }

    const error =
      request.options.validate?.(
        promptValue,
      ) ?? null;

    if (error) {
      setValidationError(error);
      inputRef.current?.focus();
      return;
    }

    onResolve({
      id: request.id,
      kind: 'prompt',
      value: promptValue,
    });
  }

  const confirmLabel =
    request.options.confirmLabel ??
    (request.kind === 'alert'
      ? 'Compris'
      : 'Confirmer');
  const cancelLabel =
    request.kind === 'alert'
      ? null
      : request.options.cancelLabel ??
        'Annuler';

  return (
    <motion.div
      className="fixed inset-0 z-[300] grid place-items-center bg-black/70 p-4 backdrop-blur-[2px]"
      initial={
        reduceMotion
          ? false
          : { opacity: 0 }
      }
      animate={{ opacity: 1 }}
      transition={{ duration: 0.14 }}
    >
      <motion.div
        ref={dialogRef}
        data-tone={tone}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="indesy-dialog-frame w-full max-w-md border border-t-2 shadow-[0_24px_80px_rgba(0,0,0,0.38)] outline-none"
        initial={
          reduceMotion
            ? false
            : {
                opacity: 0,
                y: 8,
                scale: 0.985,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.16,
          ease: 'easeOut',
        }}
      >
        <form onSubmit={submit}>
          <header className="flex items-start gap-3 border-b border-zinc-200 px-4 py-4 dark:border-[#30343b]">
            <span
              className="indesy-dialog-icon mt-0.5 grid size-8 flex-none place-items-center border border-current/25"
              aria-hidden="true"
            >
              <ToneIcon size={16} />
            </span>

            <div className="min-w-0 flex-1">
              <h2
                id={titleId}
                className="text-sm font-semibold tracking-[-0.015em]"
              >
                {request.options.title}
              </h2>

              {request.options.description && (
                <p
                  id={descriptionId}
                  className="mt-1.5 text-[11px] leading-5 text-zinc-600 dark:text-zinc-400"
                >
                  {request.options.description}
                </p>
              )}
            </div>

            <button
              type="button"
              aria-label="Fermer"
              onClick={() =>
                onResolve(
                  cancelledResolution(request),
                )
              }
              className="indesy-dialog-close grid size-7 flex-none place-items-center border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <X size={13} />
            </button>
          </header>

          {request.kind === 'prompt' && (
            <div className="grid gap-2 px-4 py-4">
              <label
                id={inputLabelId}
                htmlFor={`indesy-dialog-input-${request.id}`}
                className="text-[9px] font-semibold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400"
              >
                {request.options.label ??
                  'Valeur'}
              </label>

              <input
                ref={inputRef}
                id={`indesy-dialog-input-${request.id}`}
                value={promptValue}
                placeholder={
                  request.options.placeholder
                }
                aria-labelledby={inputLabelId}
                aria-invalid={
                  validationError
                    ? true
                    : undefined
                }
                onChange={(event) => {
                  setPromptValue(
                    event.target.value,
                  );
                  setValidationError(null);
                }}
                className="indesy-dialog-input h-10 w-full border px-3 text-sm outline-none transition-colors"
              />

              {validationError && (
                <p
                  role="alert"
                  className="text-[10px] text-[#ed1b2f]"
                >
                  {validationError}
                </p>
              )}
            </div>
          )}

          <footer className="flex flex-col-reverse gap-2 border-t border-zinc-200 bg-zinc-50 px-4 py-3 sm:flex-row sm:justify-end dark:border-[#30343b] dark:bg-[#0d0f12]">
            {cancelLabel && (
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={() =>
                  onResolve(
                    cancelledResolution(
                      request,
                    ),
                  )
                }
                  className="indesy-dialog-secondary h-9 border px-4 text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {cancelLabel}
              </button>
            )}

            <button
              ref={primaryButtonRef}
              type="submit"
              className="indesy-dialog-primary h-9 border px-4 text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {confirmLabel}
            </button>
          </footer>
        </form>
      </motion.div>
    </motion.div>
  );
}
