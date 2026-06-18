import { useEffect, useRef, useState } from "react";

export type TimerMode = "pomodoro" | "deep" | "custom";

const DURATIONS: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  deep: 50 * 60,
  custom: 15 * 60,
};

export function useTimer() {
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [duration, setDuration] = useState(DURATIONS.pomodoro);
  const [remaining, setRemaining] = useState(DURATIONS.pomodoro);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  return {
    mode,
    running,
    remaining,
    duration,
    progress: duration > 0 ? remaining / duration : 0,
    toggle: () => {
      if (remaining === 0) return;
      setRunning(r => !r);
    },
    reset: () => {
      setRunning(false);
      setRemaining(duration);
    },
    changeMode: (m: TimerMode, customDur?: number) => {
      setRunning(false);
      const d = m === "custom" ? (customDur ?? DURATIONS.custom) : DURATIONS[m];
      setMode(m);
      setDuration(d);
      setRemaining(d);
    },
  };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
