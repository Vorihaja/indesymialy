"use client";
import { useCallback, useState } from "react";
import { FightStatisticsService } from "../services/fight-statistics.service";
type StatisticsData = Awaited<ReturnType<FightStatisticsService["getFightStatistics"]>>;
export function useFightStatistics(service: FightStatisticsService) { const [statistics, setStatistics] = useState<StatisticsData>([]); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null); const load = useCallback(async (fightId: string) => { setLoading(true); setError(null); try { const value = await service.getFightStatistics(fightId); setStatistics(value); return value; } catch (reason: unknown) { const message = reason instanceof Error ? reason.message : "Erreur statistiques"; setError(message); throw reason; } finally { setLoading(false); } }, [service]); return { statistics, loading, error, load }; }
