"use client";

import { useEffect, useState } from "react";

interface FightTimerDisplayProps {
  timerEvent?: {
    status?: string;
    roundNumber?: number;
    remainingSeconds?: number;
    elapsedSeconds?: number;
  } | null;
}

function TimerCountdown({ status, roundNumber, initialRemaining }: { status: string; roundNumber: number; initialRemaining: number }) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemaining);

  useEffect(() => {
    if (status !== "live" || initialRemaining <= 0) return;
    const interval = window.setInterval(() => {
      setRemainingSeconds((value) => Math.max(0, value - 1));
    }, 1_000);
    return () => window.clearInterval(interval);
  }, [initialRemaining, status]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return <section className="fight-timer-display">
    <header><h2>Chronomètre officiel</h2></header>
    <div className="timer-main">
      <div className="round-info"><span>Round</span><strong>{roundNumber || "-"}</strong></div>
      <div className="timer-value"><strong>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</strong></div>
      <div className="timer-status"><span>État</span><strong>{status}</strong></div>
    </div>
  </section>;
}

export default function FightTimerDisplay({ timerEvent }: FightTimerDisplayProps) {
  const status = timerEvent?.status ?? "waiting";
  const roundNumber = timerEvent?.roundNumber ?? 0;
  const initialRemaining = timerEvent?.remainingSeconds ?? 0;
  return <TimerCountdown
    key={`${status}:${roundNumber}:${initialRemaining}`}
    status={status}
    roundNumber={roundNumber}
    initialRemaining={initialRemaining}
  />;
}
