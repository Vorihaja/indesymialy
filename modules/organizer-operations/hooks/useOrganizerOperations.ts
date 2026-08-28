"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  organizerOperations,
} from "../factories/organizer-operations.factory";

import type {
  OrganizerDashboardSnapshot,
  OrganizerSection,
  OrganizerSectionSnapshot,
} from "../types";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface OrganizerDashboardState
  extends AsyncState<OrganizerDashboardSnapshot> {
  switchingEvent: boolean;
  actionError: string | null;

  switchActiveEvent: (
    eventId: string,
  ) => Promise<void>;

  refresh:
    () => Promise<void>;
}

function errorMessage(
  reason: unknown,
  fallback: string,
) {
  return reason instanceof Error
    ? reason.message
    : fallback;
}

export function useOrganizerDashboard():
  OrganizerDashboardState {
  const [
    state,
    setState,
  ] =
    useState<
      AsyncState<OrganizerDashboardSnapshot>
    >({
      data: null,
      loading: true,
      error: null,
    });

  const [
    switchingEvent,
    setSwitchingEvent,
  ] =
    useState(false);

  const [
    actionError,
    setActionError,
  ] =
    useState<
      string | null
    >(null);

  const refresh =
    useCallback(
      async () => {
        setState(
          (current) => ({
            ...current,
            loading: true,
            error: null,
          }),
        );

        try {
          const data =
            await organizerOperations.dashboard.execute();

          setState({
            data,
            loading: false,
            error: null,
          });
        } catch (reason) {
          setState({
            data: null,
            loading: false,

            error:
              errorMessage(
                reason,
                "Le centre de contrôle est momentanément indisponible.",
              ),
          });
        }
      },
      [],
    );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const switchActiveEvent =
    useCallback(
      async (
        eventId: string,
      ) => {
        setSwitchingEvent(
          true,
        );

        setActionError(
          null,
        );

        try {
          const data =
            await organizerOperations.activeEvent.execute(
              eventId,
            );

          setState({
            data,
            loading: false,
            error: null,
          });
        } catch (reason) {
          setActionError(
            errorMessage(
              reason,
              "Impossible de changer l’événement actif.",
            ),
          );
        } finally {
          setSwitchingEvent(
            false,
          );
        }
      },
      [],
    );

  return {
    ...state,
    switchingEvent,
    actionError,
    switchActiveEvent,
    refresh,
  };
}

export function useOrganizerSection(
  section: OrganizerSection,
): AsyncState<OrganizerSectionSnapshot> {
  const [
    state,
    setState,
  ] =
    useState<
      AsyncState<OrganizerSectionSnapshot>
    >({
      data: null,
      loading: true,
      error: null,
    });

  useEffect(() => {
    let active = true;

    organizerOperations.section
      .execute(section)
      .then((data) => {
        if (!active) {
          return;
        }

        setState({
          data,
          loading: false,
          error: null,
        });
      })
      .catch(
        (reason: unknown) => {
          if (!active) {
            return;
          }

          setState({
            data: null,
            loading: false,

            error:
              errorMessage(
                reason,
                "Ce poste de contrôle est momentanément indisponible.",
              ),
          });
        },
      );

    return () => {
      active = false;
    };
  }, [section]);

  return state;
}