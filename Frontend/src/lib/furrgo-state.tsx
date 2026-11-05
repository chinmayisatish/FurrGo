import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ExperienceMode = "gamified" | "clean";
export type PandaMood =
  | "neutral"
  | "happy"
  | "energetic"
  | "sleepy"
  | "proud"
  | "excited"
  | "surprised"
  | "thinking"
  | "encouraging"
  | "celebrating";

export type Medication = { id: string; name: string; time: string };
export type DayLog = { steps: number; sleepMinutes: number; workouts: number; medsTaken: string[] };
export type ActivityEntry = { id: string; label: string; detail: string; xp: number; at: number };

export type Goals = { steps: number; sleepMinutes: number; workouts: number };

type FurrGoState = {
  onboarded: boolean;
  mode: ExperienceMode;
  name: string;
  goals: Goals;
  medications: Medication[];
  logs: Record<string, DayLog>;
  activity: ActivityEntry[];
  xp: number;
  mood: PandaMood;
  equipped: Record<string, string>;
  pandaPosition: { x: number; y: number };
  storiesRead: string[];
  companion: boolean;
};

const emptyDay: DayLog = { steps: 0, sleepMinutes: 0, workouts: 0, medsTaken: [] };

const initialState: FurrGoState = {
  onboarded: false,
  mode: "gamified",
  name: "",
  goals: { steps: 10000, sleepMinutes: 480, workouts: 3 },
  medications: [],
  logs: {},
  activity: [],
  xp: 0,
  mood: "neutral",
  equipped: { Outfits: "None", Accessories: "None", Room: "Sunny Room", Emotes: "Wave" },
  pandaPosition: { x: 0, y: 0 },
  storiesRead: [],
  companion: true,
};

type FurrGoContextValue = FurrGoState & {
  hydrated: boolean;
  today: DayLog;
  todayKey: string;
  level: number;
  levelXp: number;
  xpForLevel: number;
  streak: number;
  last7: { key: string; label: string; log: DayLog }[];
  weekly: { steps: number; sleepMinutes: number; workouts: number; adherence: number | null };
  chooseMode: (mode: ExperienceMode) => void;
  finishOnboarding: (input: { name: string; mode: ExperienceMode; goals: Goals }) => void;
  setName: (name: string) => void;
  setGoals: (goals: Goals) => void;
  addSteps: (steps: number) => void;
  logSleep: (minutes: number) => void;
  logWorkout: () => void;
  addMedication: (name: string, time: string) => void;
  removeMedication: (id: string) => void;
  toggleMedication: (id: string) => void;
  equip: (category: string, item: string) => void;
  react: (mood: PandaMood) => void;
  setPandaPosition: (position: { x: number; y: number }) => void;
  markStoryRead: (id: string) => void;
  setCompanion: (on: boolean) => void;
  resetData: () => void;
};

const FurrGoContext = createContext<FurrGoContextValue | null>(null);
const STORAGE_KEY = "furrgo-app-v2";
export const XP_PER_LEVEL = 500;

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const formatSleep = (minutes: number) =>
  minutes <= 0 ? "—" : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

export function FurrGoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FurrGoState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setState((current) => ({ ...current, ...JSON.parse(stored) }));
    } catch {
      // The app stays usable when local storage is unavailable.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage write failures.
    }
  }, [hydrated, state]);

  const value = useMemo<FurrGoContextValue>(() => {
    const now = new Date();
    const todayKey = dateKey(now);
    const today = state.logs[todayKey] ?? emptyDay;

    const last7 = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      const key = dateKey(date);
      return {
        key,
        label: ["S", "M", "T", "W", "T", "F", "S"][date.getDay()]!,
        log: state.logs[key] ?? emptyDay,
      };
    });

    const weeklySteps = last7.reduce((sum, day) => sum + day.log.steps, 0);
    const weeklySleep = last7.reduce((sum, day) => sum + day.log.sleepMinutes, 0);
    const weeklyWorkouts = last7.reduce((sum, day) => sum + day.log.workouts, 0);
    const expectedDoses = state.medications.length * 7;
    const takenDoses = last7.reduce((sum, day) => sum + day.log.medsTaken.length, 0);

    let streak = 0;
    for (let index = 0; index < 400; index += 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - index);
      const log = state.logs[dateKey(date)];
      const active =
        log && (log.steps > 0 || log.sleepMinutes > 0 || log.workouts > 0 || log.medsTaken.length);
      if (active) streak += 1;
      else if (index > 0) break;
    }

    const level = Math.floor(state.xp / XP_PER_LEVEL) + 1;

    const award = (
      current: FurrGoState,
      patch: Partial<DayLog>,
      entry: Omit<ActivityEntry, "at">,
      mood: PandaMood,
    ): FurrGoState => {
      const day = current.logs[todayKey] ?? emptyDay;
      return {
        ...current,
        logs: { ...current.logs, [todayKey]: { ...day, ...patch } },
        xp: current.xp + entry.xp,
        mood,
        activity: [{ ...entry, at: Date.now() }, ...current.activity].slice(0, 40),
      };
    };

    return {
      ...state,
      hydrated,
      today,
      todayKey,
      level,
      levelXp: state.xp % XP_PER_LEVEL,
      xpForLevel: XP_PER_LEVEL,
      streak,
      last7,
      weekly: {
        steps: weeklySteps,
        sleepMinutes: weeklySleep,
        workouts: weeklyWorkouts,
        adherence: expectedDoses ? Math.round((takenDoses / expectedDoses) * 100) : null,
      },
      chooseMode: (mode) => setState((current) => ({ ...current, mode })),
      finishOnboarding: ({ name, mode, goals }) =>
        setState((current) => ({ ...current, name, mode, goals, onboarded: true })),
      setName: (name) => setState((current) => ({ ...current, name })),
      setGoals: (goals) => setState((current) => ({ ...current, goals })),
      addSteps: (steps) =>
        setState((current) => {
          const day = current.logs[todayKey] ?? emptyDay;
          const total = day.steps + steps;
          return award(
            current,
            { steps: total },
            {
              id: `steps-${Date.now()}`,
              label: `${steps.toLocaleString()} steps logged`,
              detail: `${total.toLocaleString()} steps today`,
              xp: 10,
            },
            total >= current.goals.steps ? "celebrating" : "energetic",
          );
        }),
      logSleep: (minutes) =>
        setState((current) =>
          award(
            current,
            { sleepMinutes: minutes },
            {
              id: `sleep-${Date.now()}`,
              label: `Sleep logged: ${formatSleep(minutes)}`,
              detail: minutes >= current.goals.sleepMinutes ? "Fully rested" : "Some rest recorded",
              xp: 15,
            },
            minutes >= current.goals.sleepMinutes ? "happy" : "sleepy",
          ),
        ),
      logWorkout: () =>
        setState((current) => {
          const day = current.logs[todayKey] ?? emptyDay;
          return award(
            current,
            { workouts: day.workouts + 1 },
            {
              id: `workout-${Date.now()}`,
              label: "Workout completed",
              detail: `${day.workouts + 1} today`,
              xp: 30,
            },
            "celebrating",
          );
        }),
      addMedication: (name, time) =>
        setState((current) => ({
          ...current,
          medications: [
            ...current.medications,
            { id: `med-${Date.now()}`, name: name.trim(), time },
          ],
          mood: "thinking",
        })),
      removeMedication: (id) =>
        setState((current) => ({
          ...current,
          medications: current.medications.filter((med) => med.id !== id),
          logs: Object.fromEntries(
            Object.entries(current.logs).map(([key, log]) => [
              key,
              { ...log, medsTaken: log.medsTaken.filter((med) => med !== id) },
            ]),
          ),
        })),
      toggleMedication: (id) =>
        setState((current) => {
          const day = current.logs[todayKey] ?? emptyDay;
          const taken = day.medsTaken.includes(id);
          const medsTaken = taken
            ? day.medsTaken.filter((med) => med !== id)
            : [...day.medsTaken, id];
          if (taken) {
            return {
              ...current,
              logs: { ...current.logs, [todayKey]: { ...day, medsTaken } },
              mood: "neutral",
            };
          }
          const med = current.medications.find((entry) => entry.id === id);
          return award(
            current,
            { medsTaken },
            {
              id: `med-${id}-${Date.now()}`,
              label: `${med?.name ?? "Medication"} taken`,
              detail: "Recorded for today",
              xp: 20,
            },
            "happy",
          );
        }),
      equip: (category, item) =>
        setState((current) => ({
          ...current,
          equipped: { ...current.equipped, [category]: item },
          mood: "excited",
        })),
      react: (mood) => setState((current) => ({ ...current, mood })),
      setCompanion: (on) => setState((current) => ({ ...current, companion: on })),
      setPandaPosition: ({ x, y }) =>
        setState((current) => ({
          ...current,
          pandaPosition: {
            x: Math.max(-90, Math.min(90, x)),
            y: Math.max(-120, Math.min(40, y)),
          },
        })),
      markStoryRead: (id) =>
        setState((current) =>
          current.storiesRead.includes(id)
            ? current
            : { ...current, storiesRead: [...current.storiesRead, id], mood: "thinking" },
        ),
      resetData: () =>
        setState((current) => ({
          ...initialState,
          onboarded: true,
          mode: current.mode,
          name: current.name,
          goals: current.goals,
        })),
    };
  }, [state, hydrated]);

  return <FurrGoContext.Provider value={value}>{children}</FurrGoContext.Provider>;
}

export function useFurrGo() {
  const context = useContext(FurrGoContext);
  if (!context) throw new Error("useFurrGo must be used inside FurrGoProvider");
  return context;
}
