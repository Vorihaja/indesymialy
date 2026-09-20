'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { IndesyDialog } from './IndesyDialog';
import type {
  IndesyAlertOptions,
  IndesyConfirmOptions,
  IndesyDialogApi,
  IndesyDialogRequest,
  IndesyDialogResolution,
  IndesyPromptOptions,
} from './types';

const IndesyDialogContext =
  createContext<IndesyDialogApi | null>(
    null,
  );

function resolveAsCancelled(
  request: IndesyDialogRequest,
) {
  switch (request.kind) {
    case 'alert':
      request.resolve();
      break;
    case 'confirm':
      request.resolve(false);
      break;
    case 'prompt':
      request.resolve(null);
      break;
  }
}

export function IndesyDialogProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [activeRequest, setActiveRequest] =
    useState<IndesyDialogRequest | null>(
      null,
    );
  const activeRequestRef =
    useRef<IndesyDialogRequest | null>(
      null,
    );
  const queueRef =
    useRef<IndesyDialogRequest[]>([]);
  const nextIdRef = useRef(0);
  const mountedRef = useRef(true);

  const enqueue = useCallback(
    (request: IndesyDialogRequest) => {
      if (!mountedRef.current) {
        resolveAsCancelled(request);
        return;
      }

      if (activeRequestRef.current) {
        queueRef.current.push(request);
        return;
      }

      activeRequestRef.current = request;
      setActiveRequest(request);
    },
    [],
  );

  const settle = useCallback(
    (
      resolution: IndesyDialogResolution,
    ) => {
      const request =
        activeRequestRef.current;

      if (
        !request ||
        request.id !== resolution.id
      ) {
        return;
      }

      const nextRequest =
        queueRef.current.shift() ?? null;
      activeRequestRef.current =
        nextRequest;

      if (mountedRef.current) {
        setActiveRequest(nextRequest);
      }

      if (
        request.kind === 'alert' &&
        resolution.kind === 'alert'
      ) {
        request.resolve();
        return;
      }

      if (
        request.kind === 'confirm' &&
        resolution.kind === 'confirm'
      ) {
        request.resolve(resolution.value);
        return;
      }

      if (
        request.kind === 'prompt' &&
        resolution.kind === 'prompt'
      ) {
        request.resolve(resolution.value);
        return;
      }

      resolveAsCancelled(request);
    },
    [],
  );

  const api = useMemo<IndesyDialogApi>(
    () => ({
      alert: (
        options: IndesyAlertOptions,
      ) =>
        new Promise<void>((resolve) => {
          enqueue({
            id: ++nextIdRef.current,
            kind: 'alert',
            options,
            resolve,
          });
        }),
      confirm: (
        options: IndesyConfirmOptions,
      ) =>
        new Promise<boolean>((resolve) => {
          enqueue({
            id: ++nextIdRef.current,
            kind: 'confirm',
            options,
            resolve,
          });
        }),
      prompt: (
        options: IndesyPromptOptions,
      ) =>
        new Promise<string | null>(
          (resolve) => {
            enqueue({
              id: ++nextIdRef.current,
              kind: 'prompt',
              options,
              resolve,
            });
          },
        ),
    }),
    [enqueue],
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      const active =
        activeRequestRef.current;
      activeRequestRef.current = null;

      if (active) {
        resolveAsCancelled(active);
      }

      for (const queued of queueRef.current) {
        resolveAsCancelled(queued);
      }

      queueRef.current = [];
    };
  }, []);

  return (
    <IndesyDialogContext.Provider
      value={api}
    >
      {children}
      {activeRequest && (
        <IndesyDialog
          key={activeRequest.id}
          request={activeRequest}
          onResolve={settle}
        />
      )}
    </IndesyDialogContext.Provider>
  );
}

export function useIndesyDialog() {
  const dialog = useContext(
    IndesyDialogContext,
  );

  if (!dialog) {
    throw new Error(
      'useIndesyDialog doit être utilisé dans IndesyDialogProvider.',
    );
  }

  return dialog;
}
