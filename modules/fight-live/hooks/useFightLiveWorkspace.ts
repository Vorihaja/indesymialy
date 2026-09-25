"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createFightLiveFeatureUseCase, createFightLiveRealtimeService } from "../factories/fight-live.factory";
import type { FightActionKind, FightCorner, FightDecisionMethod, FightLiveSnapshot, FightTimerAction, PublicFightLiveSnapshot } from "../types";

type FightListScope = "public" | "organizer" | "official" | "fighter" | "judge";

export function useFightLiveList(scope: FightListScope) {
  const useCase = useMemo(() => createFightLiveFeatureUseCase(), []);
  const [fights, setFights] = useState<Array<FightLiveSnapshot | PublicFightLiveSnapshot>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const request = scope === "judge" ? useCase.listJudgeAssignments() : useCase.list(scope);
    void request.then((items) => {
      if (active) setFights(items);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Erreur inattendue");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [scope, useCase]);

  return { fights, loading, error };
}

export function useFightLiveWorkspace(fightId: string, publicOnly = false, judgeScorecardOnly = false) {
  const useCase = useMemo(() => createFightLiveFeatureUseCase(), []);
  const realtime = useMemo(() => createFightLiveRealtimeService(), []);
  const [fight, setFight] = useState<FightLiveSnapshot | PublicFightLiveSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const value = publicOnly
        ? await useCase.getPublic(fightId)
        : judgeScorecardOnly
          ? await useCase.getJudgeScorecard(fightId)
          : await useCase.get(fightId);
      setFight(value);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Erreur inattendue");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [fightId, judgeScorecardOnly, publicOnly, useCase]);

  useEffect(() => {
    queueMicrotask(() => { void load(); });
  }, [load]);

  useEffect(() => {
    const refresh = () => { void load(false); };
    const channels = [
      realtime.subscribeToFightEvents(fightId, refresh),
      realtime.subscribeToTimer(fightId, refresh),
      realtime.subscribeToScores(fightId, refresh),
      realtime.subscribeToLiveActions(fightId, refresh),
      realtime.subscribeToStatistics(fightId, refresh),
      realtime.subscribeToJudgeCards(fightId, refresh),
      realtime.subscribeToStatus(fightId, refresh),
      realtime.subscribeToResult(fightId, refresh),
    ];
    return () => { channels.forEach((channel) => { void realtime.unsubscribe(channel); }); };
  }, [fightId, load, realtime]);

  const mutate = useCallback(async (operation: () => Promise<FightLiveSnapshot>) => {
    setSaving(true);
    setError(null);
    try {
      setFight(await operation());
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Erreur inattendue");
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    fight, loading, saving, error, refresh: () => load(),
    timer: (action: FightTimerAction) => mutate(() => useCase.timer(fightId, action)),
    action: (kind: FightActionKind, corner?: FightCorner) => mutate(() => useCase.action(fightId, kind, corner)),
    saveScore: (cardId: string, roundNumber: number, red: number, blue: number) => mutate(() => useCase.saveScore(fightId, cardId, roundNumber, red, blue)),
    submitCard: (cardId: string) => mutate(() => useCase.submitCard(fightId, cardId)),
    decide: (winnerId: string | null, method: FightDecisionMethod) => mutate(() => useCase.decide(fightId, winnerId, method)),
    publish: () => mutate(() => useCase.publish(fightId)),
    recalculateStatistics: () => mutate(() => useCase.recalculateStatistics(fightId)),
  };
}
