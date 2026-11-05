import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Droplets,
  Dumbbell,
  Leaf,
  Sun,
  FileText,
  Footprints,
  Gift,
  Heart,
  Home,
  Languages,
  LockKeyhole,
  Moon,
  Move,
  Pill,
  Plus,
  RotateCcw,
  Settings,
  ShieldCheck,
  Shirt,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Upload,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { InteractivePanda } from "@/components/furrgo/panda";
import { PandaCompanion } from "@/components/furrgo/companion";
import pandaImage from "@/assets/furrgo-panda.png";
import room from "@/assets/furrgo-room.jpg";
import { formatSleep, useFurrGo, type ExperienceMode, type PandaMood } from "@/lib/furrgo-state";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { sendChatMessage, uploadDocument } from "@/lib/api";

export type Screen =
  | "home"
  | "pet"
  | "fitness"
  | "rewards"
  | "closet"
  | "profile"
  | "medication"
  | "assistant"
  | "translator"
  | "digest"
  | "goals";

const routes: Record<Screen, string> = {
  home: "/",
  pet: "/pet",
  fitness: "/fitness",
  rewards: "/rewards",
  closet: "/closet",
  profile: "/profile",
  medication: "/medication",
  assistant: "/assistant",
  translator: "/translator",
  digest: "/digest",
  goals: "/goals",
};

const moodCopy: Record<PandaMood, string> = {
  neutral: "Log something you did today and I'll grow with you.",
  happy: "That felt good — thank you for taking care of us!",
  energetic: "That movement gave me a boost!",
  sleepy: "A little more rest would help us both.",
  proud: "Look at that streak — I'm proud of you!",
  excited: "Wheee! Drag me anywhere you like!",
  surprised: "Whoa, up I go!",
  thinking: "Let's make health feel simpler together.",
  encouraging: "Small steps still move us forward.",
  celebrating: "Goal reached! We did it together!",
};

const nav = [
  ["home", Home, "Home"],
  ["pet", Heart, "Pet"],
  ["fitness", Activity, "Fitness"],
  ["rewards", Gift, "Rewards"],
  ["profile", CircleUserRound, "Profile"],
] as const;

export function FurrGoApp({ screen }: { screen: Screen }) {
  const state = useFurrGo();
  if (!state.hydrated) return <div className="min-h-dvh game-bg" />;
  if (!state.onboarded && screen === "home") return <Onboarding />;
  return (
    <div className={cn("min-h-dvh", state.mode === "gamified" ? "game-bg" : "clean-bg")}>
      <main
        className={cn(
          "mx-auto min-h-dvh pb-28",
          state.mode === "gamified" ? "max-w-[760px]" : "max-w-5xl",
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${screen}-${state.mode}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {state.mode === "clean" && screen === "home" ? (
              <CleanHome />
            ) : (
              <ScreenContent screen={screen} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      {screen !== "pet" && <PandaCompanion />}
      <BottomNav active={screen} clean={state.mode === "clean"} />
    </div>
  );
}

function Onboarding() {
  const navigate = useNavigate({ from: "/" });
  const { finishOnboarding, goals } = useFurrGo();
  const [mode, setMode] = useState<ExperienceMode>("gamified");
  const [name, setName] = useState("");
  return (
    <main className="onboarding min-h-dvh overflow-hidden px-5 pb-8 pt-7">
      <div className="mx-auto flex min-h-[calc(100dvh-3.75rem)] max-w-lg flex-col">
        <header className="flex items-center gap-2 font-extrabold text-primary">
          <PandaMark /> FurrGo
        </header>
        <section className="flex flex-1 flex-col items-center justify-center py-4 text-center">
          <div className="relative h-52 w-full">
            <motion.div
              className="absolute left-1/2 top-4 h-44 w-44 -translate-x-1/2 rounded-full bg-soft-green/70"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
            />
            <div className="relative mx-auto w-52">
              <InteractivePanda draggable={false} />
            </div>
          </div>
          <h1 className="mt-1 text-3xl font-black text-primary">Welcome to FurrGo</h1>
          <p className="mt-2 max-w-sm text-base text-muted-foreground">
            Your health journey, with a buddy by your side.
          </p>
        </section>
        <section>
          <Label htmlFor="name" className="text-sm font-bold">
            What should we call you?
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            className="mt-2 h-12 rounded-2xl"
          />
          <h2 className="mb-3 mt-5 text-center text-lg font-bold">
            How would you like to experience FurrGo?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <ModeChoice
              active={mode === "gamified"}
              title="Gamified"
              subtitle="Fun & engaging"
              icon={<Trophy />}
              onClick={() => setMode("gamified")}
              bullets={["Earn Bond XP", "Playful panda", "Unlock rewards"]}
            />
            <ModeChoice
              active={mode === "clean"}
              title="Clean"
              subtitle="Simple & focused"
              icon={<Activity />}
              onClick={() => setMode("clean")}
              bullets={["Clear insights", "Calm layout", "Same progress"]}
            />
          </div>
          <Button
            className="mt-5 h-12 w-full rounded-2xl text-base font-bold"
            disabled={!name.trim()}
            onClick={() => {
              finishOnboarding({ name: name.trim(), mode, goals });
              navigate({ to: "/" });
            }}
          >
            Continue <ChevronRight />
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            You start with a clean slate — everything you see comes from what you log.
          </p>
        </section>
      </div>
    </main>
  );
}

function ModeChoice({
  active,
  title,
  subtitle,
  icon,
  onClick,
  bullets,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  bullets: string[];
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("mode-choice min-h-44 text-left", active && "mode-choice-active")}
    >
      <span
        className={cn(
          "mb-3 grid size-10 place-items-center rounded-xl",
          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <strong className="block text-base uppercase">{title}</strong>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
      <ul className="mt-3 space-y-1 text-xs">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-center gap-1.5">
            <Check className="size-3 text-primary" />
            {bullet}
          </li>
        ))}
      </ul>
    </button>
  );
}

function BottomNav({ active, clean }: { active: Screen; clean: boolean }) {
  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-[760px] grid-cols-5 border-t px-2 pb-[max(.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl",
        clean ? "bg-background/95" : "bg-cream/95",
      )}
    >
      {nav.map(([key, Icon, label]) => (
        <Link
          key={key}
          to={routes[key]}
          className={cn(
            "flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold uppercase text-muted-foreground transition-colors",
            active === key && "text-primary",
          )}
        >
          <span
            className={cn(
              "grid size-8 place-items-center rounded-xl",
              active === key && !clean && "bg-mint",
            )}
          >
            <Icon className="size-[19px]" />
          </span>
          {label}
        </Link>
      ))}
    </nav>
  );
}

function ScreenContent({ screen }: { screen: Screen }) {
  if (screen === "home") return <GameHome />;
  if (screen === "pet") return <PetPage />;
  if (screen === "fitness") return <FitnessPage />;
  if (screen === "rewards") return <RewardsPage />;
  if (screen === "profile") return <ProfilePage />;
  if (screen === "closet")
    return (
      <>
        <PageHeader eyebrow="Panda closet" title="Dress your journey" action={<Shirt />} />
        <ClosetContent />
      </>
    );
  if (screen === "medication") return <MedicationPage />;
  if (screen === "assistant") return <AssistantPage />;
  if (screen === "translator") return <TranslatorPage />;
  if (screen === "digest") return <DigestPage />;
  return <GoalsPage />;
}

function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 pb-4 pt-7">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-bold uppercase text-muted-foreground">{eyebrow}</p>}
        <h1 className="truncate text-2xl font-black text-foreground">{title}</h1>
      </div>
      {action}
    </header>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Dialog where the user enters their own steps, sleep and workouts. */
function LogDialog({ trigger }: { trigger: React.ReactNode }) {
  const { addSteps, logSleep, logWorkout, goals } = useFurrGo();
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm rounded-[24px]">
        <DialogHeader>
          <DialogTitle>Log today's health</DialogTitle>
          <DialogDescription>Only what you enter is stored, on this device.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="steps">Steps to add</Label>
            <Input
              id="steps"
              inputMode="numeric"
              value={steps}
              onChange={(event) => setSteps(event.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 1200"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Sleep last night</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <Input
                inputMode="numeric"
                value={hours}
                onChange={(event) => setHours(event.target.value.replace(/\D/g, ""))}
                placeholder="hours"
                aria-label="Sleep hours"
              />
              <Input
                inputMode="numeric"
                value={minutes}
                onChange={(event) => setMinutes(event.target.value.replace(/\D/g, ""))}
                placeholder="minutes"
                aria-label="Sleep minutes"
              />
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => {
              logWorkout();
              toast.success("Workout recorded · +30 Bond XP");
            }}
          >
            <Dumbbell /> Add a completed workout
          </Button>
        </div>
        <DialogFooter>
          <Button
            className="w-full rounded-xl"
            onClick={() => {
              const stepValue = Number(steps || 0);
              const sleepValue = Number(hours || 0) * 60 + Number(minutes || 0);
              if (!stepValue && !sleepValue) {
                toast("Enter steps or sleep first.");
                return;
              }
              if (stepValue) addSteps(stepValue);
              if (sleepValue) logSleep(sleepValue);
              toast.success(
                stepValue >= goals.steps ? "Step goal reached!" : "Saved to today's log",
              );
              setSteps("");
              setHours("");
              setMinutes("");
              setOpen(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GameHome() {
  const state = useFurrGo();
  const meds = state.medications.length;
  return (
    <>
      <PageHeader
        eyebrow={greeting()}
        title={`${state.name || "Friend"}!`}
        action={
          <span className="streak-pill flex items-center gap-1">
            <Zap className="size-3 fill-current" />{" "}
            {state.streak ? `${state.streak} day streak` : "No streak yet"}
          </span>
        }
      />
      <div className="px-4">
        <PandaStage compact />
        <div className="-mt-3 grid grid-cols-3 gap-2">
          <Metric
            icon={<Footprints />}
            label="Steps"
            value={state.today.steps ? state.today.steps.toLocaleString() : "—"}
            sub={`of ${state.goals.steps.toLocaleString()}`}
            tone="green"
          />
          <Metric
            icon={<Moon />}
            label="Sleep"
            value={formatSleep(state.today.sleepMinutes)}
            sub={`of ${formatSleep(state.goals.sleepMinutes)}`}
            tone="purple"
          />
          <Metric
            icon={<Pill />}
            label="Medication"
            value={meds ? `${state.today.medsTaken.length}/${meds}` : "—"}
            sub={meds ? "today" : "none added"}
            tone="coral"
          />
        </div>
        <LogDialog
          trigger={
            <Button className="mt-4 h-12 w-full rounded-2xl text-base font-bold">
              <Plus /> Log today's health
            </Button>
          }
        />
        <div className="mt-6 flex items-end justify-between">
          <SectionTitle kicker="Your activity" title="Your health → your bond" />
          <Link to="/digest" className="text-xs font-bold text-primary">
            Weekly digest
          </Link>
        </div>
        <ActivityFeed limit={5} />
        <SectionTitle className="mt-7" kicker="Explore" title="Health tools" />
        <div className="mt-3 grid grid-cols-2 gap-3 pb-4">
          <QuickLink to="/medication" icon={<Pill />} title="Medication" tone="coral" />
          <QuickLink to="/assistant" icon={<Bot />} title="FurrGo AI" tone="blue" />
          <QuickLink
            to="/translator"
            icon={<Languages />}
            title="Medical translator"
            tone="purple"
          />
          <QuickLink to="/goals" icon={<Target />} title="Health goals" tone="yellow" />
        </div>
      </div>
    </>
  );
}

function ActivityFeed({ limit = 10 }: { limit?: number }) {
  const { activity } = useFurrGo();
  if (!activity.length)
    return (
      <EmptyState
        icon={<Sparkles />}
        title="Nothing logged yet"
        note="Add steps, sleep, a workout or a medication and it will appear here."
      />
    );
  return (
    <div className="mt-3 space-y-2">
      {activity.slice(0, limit).map((entry) => (
        <div key={entry.id} className="bond-row">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint text-primary">
            <Check />
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate font-bold">{entry.label}</p>
            <p className="text-xs text-muted-foreground">
              {entry.detail} ·{" "}
              {new Date(entry.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <span className="xp-pill">+{entry.xp} XP</span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, note }: { icon: React.ReactNode; title: string; note: string }) {
  return (
    <div className="mt-3 rounded-[20px] border border-dashed bg-card/60 p-6 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-full bg-mint text-primary">
        {icon}
      </span>
      <p className="mt-3 font-bold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

function CleanHome() {
  const state = useFurrGo();
  const meds = state.medications.length;
  const stepPct = Math.min(100, Math.round((state.today.steps / state.goals.steps) * 100));
  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString([], {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        title={`${greeting()}, ${state.name || "there"}`}
        action={
          <Button size="icon" variant="outline" className="rounded-full">
            <Bell />
          </Button>
        }
      />
      <div className="px-5">
        <section className="clean-welcome">
          <div>
            <p className="text-xs font-bold uppercase text-primary">Health overview</p>
            <h2 className="mt-1 text-xl font-bold">
              {state.activity.length ? "Here's your day so far." : "Nothing logged yet today."}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every number below comes from what you record.
            </p>
          </div>
          <div className="w-24 shrink-0">
            <InteractivePanda draggable={false} />
          </div>
        </section>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <CleanMetric
            label="Steps"
            value={state.today.steps ? state.today.steps.toLocaleString() : "—"}
            change={state.today.steps ? `${stepPct}% of goal` : "not logged"}
          />
          <CleanMetric
            label="Sleep"
            value={formatSleep(state.today.sleepMinutes)}
            change={state.today.sleepMinutes ? "logged" : "not logged"}
          />
          <CleanMetric
            label="Medication"
            value={meds ? `${state.today.medsTaken.length}/${meds}` : "—"}
            change={meds ? "today" : "none added"}
          />
        </div>
        <LogDialog
          trigger={
            <Button variant="outline" className="mt-4 h-11 w-full rounded-xl">
              <Plus /> Log health data
            </Button>
          }
        />
        <div className="mt-7 flex items-end justify-between">
          <SectionTitle kicker="Last 7 days" title="Health trends" />
          <Link to="/digest" className="text-xs font-semibold text-primary">
            View details
          </Link>
        </div>
        <TrendChart />
        <SectionTitle className="mt-7" kicker="Today" title="Recent activity" />
        <ActivityFeed limit={4} />
        <div className="mt-5 grid grid-cols-2 gap-3 pb-4">
          <QuickLink to="/assistant" icon={<Bot />} title="Ask FurrGo AI" tone="blue" />
          <QuickLink to="/digest" icon={<FileText />} title="Health summary" tone="green" />
        </div>
      </div>
    </>
  );
}

type RoomSpot = {
  id: string;
  label: string;
  icon: React.ReactNode;
  left: string;
  top: string;
  mood: PandaMood;
  line: string;
  move: { x: number; y: number };
  unlockXp: number;
};

const roomSpots: RoomSpot[] = [
  {
    id: "bed",
    label: "Cosy bed",
    icon: <Moon className="size-4" />,
    left: "6%",
    top: "64%",
    mood: "sleepy",
    line: "Your panda curls up for a nap.",
    move: { x: -70, y: -10 },
    unlockXp: 0,
  },
  {
    id: "window",
    label: "Window",
    icon: <Sun className="size-4" />,
    left: "84%",
    top: "12%",
    mood: "happy",
    line: "Sunlight on the fur — your panda watches the park.",
    move: { x: 60, y: -60 },
    unlockXp: 0,
  },
  {
    id: "plant",
    label: "Little plant",
    icon: <Leaf className="size-4" />,
    left: "6%",
    top: "24%",
    mood: "encouraging",
    line: "The plant gets a drink and stands a bit taller.",
    move: { x: -55, y: -55 },
    unlockXp: 0,
  },
  {
    id: "water",
    label: "Water bottle",
    icon: <Droplets className="size-4" />,
    left: "84%",
    top: "64%",
    mood: "energetic",
    line: "Big gulp of water. Your panda feels refreshed.",
    move: { x: 45, y: 0 },
    unlockXp: 100,
  },
  {
    id: "mat",
    label: "Yoga mat",
    icon: <Dumbbell className="size-4" />,
    left: "6%",
    top: "44%",
    mood: "energetic",
    line: "Stretch time! Your panda copies your workout.",
    move: { x: 0, y: 10 },
    unlockXp: 300,
  },
  {
    id: "shelf",
    label: "Story shelf",
    icon: <BookOpen className="size-4" />,
    left: "84%",
    top: "38%",
    mood: "thinking",
    line: "A story is pulled off the shelf — check the Stories tab.",
    move: { x: 72, y: -30 },
    unlockXp: 500,
  },
  {
    id: "lantern",
    label: "Night lantern",
    icon: <Sparkles className="size-4" />,
    left: "46%",
    top: "36%",
    mood: "proud",
    line: "The lantern glows warm over the whole room.",
    move: { x: -25, y: -70 },
    unlockXp: 900,
  },
  {
    id: "friend",
    label: "Visiting friend",
    icon: <Heart className="size-4" />,
    left: "60%",
    top: "8%",
    mood: "celebrating",
    line: "A friend drops by and the two of them dance.",
    move: { x: 20, y: -40 },
    unlockXp: 1500,
  },
];

function RoomSpots() {
  const { xp, react, setPandaPosition } = useFurrGo();
  return (
    <>
      {roomSpots.map((spot) => {
        const locked = xp < spot.unlockXp;
        return (
          <motion.button
            key={spot.id}
            type="button"
            style={{ left: spot.left, top: spot.top }}
            className={cn(
              "absolute z-20 grid size-9 place-items-center rounded-full shadow-md backdrop-blur",
              locked ? "bg-background/70 text-muted-foreground" : "bg-background/92 text-primary",
            )}
            aria-label={locked ? `${spot.label} (locked)` : spot.label}
            whileTap={{ scale: 0.88 }}
            onClick={() => {
              if (locked) {
                toast.info(`${spot.label} unlocks at ${spot.unlockXp} Bond XP`);
                return;
              }
              setPandaPosition(spot.move);
              react(spot.mood);
              toast.success(spot.line);
            }}
          >
            {locked ? <LockKeyhole className="size-4" /> : spot.icon}
          </motion.button>
        );
      })}
    </>
  );
}

type RoomStory = {
  id: string;
  title: string;
  need: number;
  kind: "xp" | "streak" | "days";
  body: string;
};

const roomStories: RoomStory[] = [
  {
    id: "arrival",
    title: "The day you met",
    need: 1,
    kind: "days",
    body: "The room was almost empty when your panda arrived — one bed, one window, one very small plant. Then you logged your first day of looking after yourself, and the whole place felt a little warmer.",
  },
  {
    id: "morning",
    title: "A morning walk",
    need: 200,
    kind: "xp",
    body: "Your panda now waits by the window every morning. When you move, it moves too — little laps of the room, paws tapping, until you come back with your steps.",
  },
  {
    id: "quiet-night",
    title: "The quiet night",
    need: 3,
    kind: "streak",
    body: "Three nights in a row of rest recorded. Your panda learned to dim the lantern, tuck itself into the bed and wait for morning instead of pacing.",
  },
  {
    id: "garden",
    title: "The plant that grew",
    need: 600,
    kind: "xp",
    body: "That tiny plant is a whole leafy corner now. Your panda swears it grew every time you kept a promise to yourself — water, sleep, a walk, a dose remembered.",
  },
  {
    id: "week",
    title: "Seven days strong",
    need: 7,
    kind: "streak",
    body: "A full week. Your panda made a small paper banner for the wall, spelled slightly wrong, and refuses to take it down.",
  },
  {
    id: "visitor",
    title: "A knock at the door",
    need: 1500,
    kind: "xp",
    body: "Word travelled. Another panda came to visit, saw the banner, the plants and the lantern, and asked how the room got so alive. Yours just pointed at you.",
  },
];

function StoriesTab() {
  const { xp, streak, logs, storiesRead, markStoryRead } = useFurrGo();
  const loggedDays = Object.values(logs).filter(
    (log) => log.steps || log.sleepMinutes || log.workouts || log.medsTaken.length,
  ).length;
  const progressFor = (story: RoomStory) =>
    story.kind === "xp" ? xp : story.kind === "streak" ? streak : loggedDays;
  const unit = (story: RoomStory) =>
    story.kind === "xp" ? "Bond XP" : story.kind === "streak" ? "day streak" : "logged days";

  return (
    <div className="mt-4 space-y-2">
      <SectionTitle kicker="Your panda's world" title="Stories unlock as you look after yourself" />
      {roomStories.map((story) => {
        const unlocked = progressFor(story) >= story.need;
        const isNew = unlocked && !storiesRead.includes(story.id);
        if (!unlocked) {
          return (
            <div
              key={story.id}
              className="bond-row w-full opacity-70"
              aria-label={`${story.title} locked`}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                <LockKeyhole className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">Locked story</p>
                <p className="text-xs text-muted-foreground">
                  Reach {story.need} {unit(story)} · {progressFor(story)} so far
                </p>
              </div>
            </div>
          );
        }
        return (
          <Dialog key={story.id}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="bond-row w-full"
                onClick={() => markStoryRead(story.id)}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint text-primary">
                  <BookOpen className="size-4" />
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-bold">{story.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {story.need} {unit(story)}
                  </p>
                </div>
                {isNew ? <span className="xp-pill">New</span> : <ChevronRight className="size-4" />}
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{story.title}</DialogTitle>
                <DialogDescription>A chapter from your panda's room</DialogDescription>
              </DialogHeader>
              <p className="text-sm leading-relaxed">{story.body}</p>
            </DialogContent>
          </Dialog>
        );
      })}
    </div>
  );
}

function PandaStage({ compact = false }: { compact?: boolean }) {
  const { mood, levelXp, xpForLevel, level, setPandaPosition } = useFurrGo();
  const stage = useRef<HTMLDivElement>(null);
  return (
    <section
      ref={stage}
      className={cn(
        "panda-stage relative overflow-hidden rounded-[24px]",
        compact ? "h-[330px]" : "h-[430px]",
      )}
    >
      <img
        src={room}
        alt="A cozy wellness room"
        width={1024}
        height={1536}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-room-overlay" />
      {!compact && <RoomSpots />}
      <InteractivePanda
        bounds={stage}
        className={cn(
          "absolute bottom-5 left-1/2 z-10 -translate-x-1/2",
          compact ? "w-52" : "w-72",
        )}
      />
      <motion.div
        key={mood}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="speech-bubble absolute left-4 top-4 z-20 max-w-[205px] text-sm font-semibold"
      >
        {moodCopy[mood]}
      </motion.div>
      <button
        type="button"
        onClick={() => setPandaPosition({ x: 0, y: 0 })}
        className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full bg-background/90 px-3 py-1.5 text-[10px] font-bold uppercase shadow"
      >
        <Move className="size-3" /> Drag me · reset
      </button>
      <div className="absolute bottom-4 left-4 z-20 rounded-2xl bg-background/92 p-3 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">
              Bond level {level}
            </p>
            <p className="font-bold text-primary">{levelTitle(level)}</p>
          </div>
          <span className="text-xs font-bold">
            {levelXp}/{xpForLevel} XP
          </span>
        </div>
        <Progress value={(levelXp / xpForLevel) * 100} className="mt-2 h-2" />
      </div>
    </section>
  );
}

function levelTitle(level: number) {
  return ["New Friend", "Health Starter", "Health Explorer", "Health Builder", "Health Champion"][
    Math.min(level - 1, 4)
  ]!;
}

function PetPage() {
  const state = useFurrGo();
  return (
    <>
      <PageHeader
        eyebrow="My Panda"
        title="Growing stronger together"
        action={
          <span className="mood-pill flex items-center gap-1">
            <Heart className="size-3 fill-current" /> {state.mood}
          </span>
        }
      />
      <div className="px-4">
        <PandaStage />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Drag your panda around the room, tap to play, or tap a spot in the room to visit it.
        </p>
        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="no-scrollbar h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-mint p-1.5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bonding">Bonding</TabsTrigger>
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="closet">Closet</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatCard label="Mood" value={state.mood} icon={<Heart />} />
              <StatCard
                label="Bond XP"
                value={`${state.levelXp}/${state.xpForLevel}`}
                icon={<Zap />}
              />
              <StatCard
                label="Health streak"
                value={state.streak ? `${state.streak} days` : "None yet"}
                icon={<Trophy />}
              />
              <StatCard
                label="Steps today"
                value={state.today.steps ? state.today.steps.toLocaleString() : "—"}
                icon={<Footprints />}
              />
            </div>
          </TabsContent>
          <TabsContent value="bonding">
            <SectionTitle
              className="mt-5"
              kicker="Grow together"
              title="Healthy habits strengthen your bond"
            />
            <div className="mt-3 space-y-2">
              <LogDialog
                trigger={
                  <button type="button" className="bond-row w-full">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint text-primary">
                      <Footprints />
                    </span>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="font-bold">Move together</p>
                      <p className="text-xs text-muted-foreground">
                        {state.today.steps
                          ? `${state.today.steps.toLocaleString()} steps today`
                          : "Log your steps"}
                      </p>
                    </div>
                    <span className="xp-pill">+10 XP</span>
                  </button>
                }
              />
              <button
                type="button"
                className="bond-row w-full"
                onClick={() => {
                  state.logWorkout();
                  toast.success("Workout recorded · +30 Bond XP");
                }}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint text-primary">
                  <Dumbbell />
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-bold">Workout together</p>
                  <p className="text-xs text-muted-foreground">
                    {state.today.workouts
                      ? `${state.today.workouts} today`
                      : "Tap when you finish one"}
                  </p>
                </div>
                <span className="xp-pill">+30 XP</span>
              </button>
              <Link to="/medication" className="bond-row">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint text-primary">
                  <Pill />
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-bold">Stay on track</p>
                  <p className="text-xs text-muted-foreground">
                    {state.medications.length
                      ? `${state.today.medsTaken.length}/${state.medications.length} taken today`
                      : "Add your medication"}
                  </p>
                </div>
                <span className="xp-pill">+20 XP</span>
              </Link>
            </div>
          </TabsContent>
          <TabsContent value="stories">
            <StoriesTab />
          </TabsContent>
          <TabsContent value="rewards">
            <Unlockables />
          </TabsContent>
          <TabsContent value="closet">
            <ClosetContent compact />
          </TabsContent>
          <TabsContent value="history">
            <ActivityFeed limit={20} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function FitnessPage() {
  const state = useFurrGo();
  const progress = Math.min(100, Math.round((state.today.steps / state.goals.steps) * 100));
  return (
    <>
      <PageHeader
        eyebrow="Fitness"
        title="Let's move!"
        action={
          <span className="streak-pill flex items-center gap-1">
            <Zap className="size-3 fill-current" /> {state.streak}
          </span>
        }
      />
      <div className="px-5">
        <section className="relative flex flex-col items-center rounded-[24px] bg-card p-5 shadow-soft">
          <div
            className="relative grid size-56 place-items-center rounded-full"
            style={{ background: `conic-gradient(var(--primary) ${progress}%, var(--mint) 0)` }}
          >
            <div className="grid size-44 place-items-center rounded-full bg-card text-center">
              <div>
                <Footprints className="mx-auto mb-2 text-primary" />
                <p className="text-3xl font-black">{state.today.steps.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  of {state.goals.steps.toLocaleString()} steps
                </p>
                <p className="mt-1 text-xs font-bold text-primary">{progress}% complete</p>
              </div>
            </div>
          </div>
          <div className="pointer-events-auto absolute bottom-2 right-1 w-24">
            <InteractivePanda draggable={false} />
          </div>
          <p className="mt-4 self-start text-sm font-semibold">
            {progress >= 100
              ? "Goal complete — your panda is celebrating!"
              : progress >= 50
                ? "Halfway there, your panda is getting energetic!"
                : "Log your movement to get your panda going."}
          </p>
        </section>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <CleanMetric
            label="Steps today"
            value={state.today.steps.toLocaleString()}
            change="logged"
          />
          <CleanMetric
            label="Workouts today"
            value={String(state.today.workouts)}
            change="logged"
          />
          <CleanMetric
            label="Workouts week"
            value={`${state.weekly.workouts}/${state.goals.workouts}`}
            change="goal"
          />
        </div>
        <LogDialog
          trigger={
            <Button className="mt-4 h-12 w-full rounded-2xl">
              <Plus /> Log steps or a workout
            </Button>
          }
        />
        <SectionTitle className="mt-7" kicker="Last 7 days" title="Your step history" />
        <TrendChart />
        <SectionTitle className="mt-7" kicker="Goals" title="This week's targets" />
        <div className="mt-3 space-y-3">
          <GoalBar title="Daily steps" value={progress} />
          <GoalBar
            title="Sleep"
            value={Math.min(
              100,
              Math.round((state.today.sleepMinutes / state.goals.sleepMinutes) * 100),
            )}
          />
          <GoalBar
            title="Weekly workouts"
            value={Math.min(100, Math.round((state.weekly.workouts / state.goals.workouts) * 100))}
          />
        </div>
      </div>
    </>
  );
}

const unlockables: [string, string, number][] = [
  ["Green Hoodie", "🧥", 100],
  ["Forest Room", "🌲", 300],
  ["Panda Backpack", "🎒", 600],
  ["Plant Set", "🪴", 1000],
  ["Celebration", "🎉", 1500],
];

function RewardsPage() {
  const state = useFurrGo();
  const achievements: [string, boolean][] = [
    ["First log", state.activity.length > 0],
    ["7 day streak", state.streak >= 7],
    ["Step goal reached", state.today.steps >= state.goals.steps && state.today.steps > 0],
    [
      "Medication complete",
      state.medications.length > 0 && state.today.medsTaken.length === state.medications.length,
    ],
    ["Sleep goal reached", state.today.sleepMinutes >= state.goals.sleepMinutes],
    ["Weekly workouts done", state.weekly.workouts >= state.goals.workouts],
  ];
  return (
    <>
      <PageHeader
        eyebrow="Bond rewards"
        title="Your journey, collected"
        action={<Trophy className="text-achievement" />}
      />
      <div className="px-5">
        <section className="reward-hero">
          <p className="text-xs font-bold uppercase">Bond level {state.level}</p>
          <h2 className="text-2xl font-black">{levelTitle(state.level)}</h2>
          <Progress
            value={(state.levelXp / state.xpForLevel) * 100}
            className="mt-3 bg-background/25 [&>div]:bg-background"
          />
          <p className="mt-2 text-xs">
            {state.levelXp}/{state.xpForLevel} XP · {state.xpForLevel - state.levelXp} XP to next
            level
          </p>
        </section>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <CleanMetric label="Bond XP" value={String(state.xp)} change="total" />
          <CleanMetric label="Streak" value={String(state.streak)} change="days" />
          <CleanMetric
            label="Logged items"
            value={String(state.activity.length)}
            change="all time"
          />
        </div>
        <Unlockables />
        <SectionTitle className="mt-7" kicker="Milestones" title="Achievements" />
        <div className="mt-3 grid grid-cols-2 gap-3 pb-3">
          {achievements.map(([name, earned]) => (
            <div key={name} className={cn("reward-tile", !earned && "opacity-60")}>
              <Award className="text-achievement" />
              <strong>{name}</strong>
              <small>{earned ? "Earned" : "Not yet"}</small>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Unlockables() {
  const { xp, equip } = useFurrGo();
  const [unlock, setUnlock] = useState<string | null>(null);
  return (
    <>
      <SectionTitle className="mt-7" kicker="Make it yours" title="Unlockables" />
      <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-2">
        {unlockables.map(([name, emoji, needed]) => {
          const open = xp >= needed;
          return (
            <button
              type="button"
              key={name}
              onClick={() =>
                open
                  ? setUnlock(name)
                  : toast(`Earn ${needed - xp} more Bond XP by logging your health.`)
              }
              className="unlock-card"
            >
              <span className="text-4xl">{emoji}</span>
              <strong>{name}</strong>
              <small>{open ? "Unlocked" : `${needed} XP`}</small>
              {!open && <LockKeyhole className="absolute right-2 top-2 size-4" />}
            </button>
          );
        })}
      </div>
      <Dialog open={Boolean(unlock)} onOpenChange={(open) => !open && setUnlock(null)}>
        <DialogContent className="max-w-sm rounded-[24px] text-center">
          <div className="mx-auto text-6xl">🎉</div>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Unlocked!</DialogTitle>
            <DialogDescription className="text-center">
              {unlock} is ready for your panda.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="w-full rounded-xl"
              onClick={() => {
                if (unlock) {
                  const category = unlock.includes("Room") ? "Room" : "Accessories";
                  equip(category, unlock);
                  toast.success(`${unlock} equipped!`);
                }
                setUnlock(null);
              }}
            >
              Equip now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MedicationPage() {
  const state = useFurrGo();
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const adherence = state.weekly.adherence;
  return (
    <>
      <PageHeader
        eyebrow="Health routine"
        title="Your medication"
        action={<Pill className="text-medication" />}
      />
      <div className="px-5">
        <section className="flex items-center gap-4 rounded-[24px] bg-mint p-4">
          <div className="w-24 shrink-0">
            <InteractivePanda draggable={false} />
          </div>
          <div>
            <p className="font-bold text-primary">Stay on track</p>
            <p className="text-sm text-muted-foreground">
              Add the medication you actually take, then tick it off each day.
            </p>
          </div>
        </section>
        <form
          className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) {
              toast("Enter a medication name.");
              return;
            }
            state.addMedication(name, time || "Any time");
            setName("");
            setTime("");
            toast.success("Medication added");
          }}
        >
          <div className="min-w-0">
            <Label htmlFor="med-name">Medication</Label>
            <Input
              id="med-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="med-time">Time</Label>
            <Input
              id="med-time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="mt-1.5 w-[104px]"
            />
          </div>
          <Button type="submit" className="rounded-xl">
            <Plus />
          </Button>
        </form>
        <div className="mt-5 space-y-3">
          {state.medications.length === 0 ? (
            <EmptyState
              icon={<Pill />}
              title="No medication added"
              note="Add the ones you take and they will show up here every day."
            />
          ) : (
            state.medications.map((med) => {
              const done = state.today.medsTaken.includes(med.id);
              return (
                <div key={med.id} className="med-row">
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-xl",
                      done
                        ? "bg-primary text-primary-foreground"
                        : "bg-medication-soft text-medication",
                    )}
                  >
                    {done ? <Check /> : <Pill />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{med.name}</p>
                    <p className="text-xs text-muted-foreground">{med.time}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={done ? "secondary" : "default"}
                    onClick={() => {
                      state.toggleMedication(med.id);
                      toast.success(done ? "Marked as not taken" : "Taken · +20 Bond XP");
                    }}
                  >
                    {done ? "Taken" : "Take now"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ${med.name}`}
                    onClick={() => state.removeMedication(med.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              );
            })
          )}
        </div>
        {adherence !== null && (
          <div className="mt-5 rounded-2xl border border-medication/20 bg-medication-soft p-4">
            <p className="font-bold text-medication">{adherence}% adherence in the last 7 days</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Based only on the doses you have ticked off.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function ProfilePage() {
  const state = useFurrGo();
  const [confirm, setConfirm] = useState(false);
  const [reset, setReset] = useState(false);
  const [name, setName] = useState(state.name);
  const next = state.mode === "gamified" ? "clean" : "gamified";
  return (
    <>
      <PageHeader eyebrow="Your space" title="Profile" action={<Settings />} />
      <div className="px-5">
        <section className="rounded-[24px] bg-card p-4 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="grid size-16 place-items-center rounded-full bg-mint text-xl font-black text-primary">
              {(state.name || "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold">{state.name || "Add your name"}</h2>
              <p className="text-sm text-muted-foreground">
                {levelTitle(state.level)} · Level {state.level}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
            <Button
              variant="outline"
              onClick={() => {
                state.setName(name.trim());
                toast.success("Name updated");
              }}
            >
              Save
            </Button>
          </div>
        </section>
        <div className="mt-5 space-y-2">
          <ProfileLink
            to="/goals"
            icon={<Target />}
            title="Health goals"
            note={`${state.goals.steps.toLocaleString()} steps · ${formatSleep(state.goals.sleepMinutes)} sleep`}
          />
          <ProfileLink
            to="/medication"
            icon={<Pill />}
            title="Medication"
            note={`${state.medications.length} added`}
          />
          <ProfileItem icon={<Bell />} title="Notifications" note="Reminders stay on this device" />
          <button
            type="button"
            onClick={() => {
              state.setCompanion(!state.companion);
              toast.success(state.companion ? "Companion hidden" : "Companion is back");
            }}
            className="flex w-full items-center justify-between rounded-[18px] border bg-card p-4 text-left"
          >
            <span>
              <span className="block text-sm font-bold">Companion panda</span>
              <span className="block text-xs text-muted-foreground">
                Follows you across the app and reacts to how you move your phone
              </span>
            </span>
            <span className="text-xs font-bold text-primary">{state.companion ? "On" : "Off"}</span>
          </button>
          <ProfileItem
            icon={<ShieldCheck />}
            title="Privacy"
            note="Your data is stored only on this device"
          />
        </div>
        <section className="mt-6 rounded-[20px] border bg-card p-4">
          <p className="text-xs font-bold uppercase text-muted-foreground">FurrGo experience</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant={state.mode === "gamified" ? "default" : "outline"}
              onClick={() => state.mode !== "gamified" && setConfirm(true)}
            >
              Gamified
            </Button>
            <Button
              variant={state.mode === "clean" ? "default" : "outline"}
              onClick={() => state.mode !== "clean" && setConfirm(true)}
            >
              Clean
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Your health data and progress stay exactly the same.
          </p>
        </section>
        <Button variant="outline" className="mt-5 w-full rounded-xl" onClick={() => setReset(true)}>
          <RotateCcw /> Clear all my data
        </Button>
      </div>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="max-w-sm rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Switch to {next === "clean" ? "Clean" : "Gamified"} Mode?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your health data and progress stay exactly the same. Only the way FurrGo looks and
              feels will change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep current</AlertDialogCancel>
            <AlertDialogAction onClick={() => state.chooseMode(next)}>
              Switch mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={reset} onOpenChange={setReset}>
        <AlertDialogContent className="max-w-sm rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear everything you logged?</AlertDialogTitle>
            <AlertDialogDescription>
              Your logs, medication, Bond XP and activity will be removed from this device. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my data</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                state.resetData();
                toast.success("All data cleared");
              }}
            >
              Clear data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AssistantPage() {
  const { react, name } = useFurrGo();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    {
      role: "assistant",
      text: `Hi${name ? ` ${name}` : ""} — I explain general health terms in plain language, powered by FurrGo Healthcare API. I can't see your records, and I don't give medical advice.`,
    },
  ]);
  const answer = async (text: string) => {
    if (!text.trim()) return;
    setMessages((current) => [...current, { role: "user", text }]);
    setLoading(true);
    react("thinking");
    try {
      const result = await sendChatMessage(text);
      const reply = result.response || result.disclaimer || "Health information retrieved.";
      setMessages((current) => [...current, { role: "assistant", text: reply }]);
      react("encouraging");
    } catch (err: any) {
      console.warn("Backend unavailable, falling back to local guidance:", err);
      const low = text.toLowerCase();
      const fallback = low.includes("hba1c")
        ? "**HbA1c** estimates average blood sugar over the past 2–3 months, so it shows longer-term patterns rather than one moment in time. A clinician can explain what a specific result means for you."
        : low.includes("sleep")
          ? "A consistent sleep schedule, morning daylight and a calm wind-down routine generally support better sleep. Start with one small change and notice how you feel."
          : low.includes("meal") || low.includes("diet")
            ? "A common general approach is to build meals around vegetables, a protein source, whole grains and a healthy fat. Individual needs differ, so treat this as education rather than advice."
            : "I can explain health terms in plain language and help you prepare questions for a clinician. I only share general educational information — no diagnosis or treatment.";
      setMessages((current) => [
        ...current,
        { role: "assistant", text: fallback },
      ]);
      react("encouraging");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex h-[calc(100dvh-5.5rem)] flex-col">
      <PageHeader
        eyebrow="Your health companion"
        title="FurrGo AI"
        action={
          <div className="w-14">
            <InteractivePanda draggable={false} />
          </div>
        }
      />
      <div className="mx-4 mb-3 flex gap-2 overflow-x-auto pb-1">
        {[
          "What does HbA1c mean?",
          "How can I improve my sleep?",
          "What makes a balanced meal?",
        ].map((question) => (
          <button
            type="button"
            key={question}
            onClick={() => answer(question)}
            className="shrink-0 rounded-full border bg-card px-3 py-2 text-xs font-semibold"
          >
            {question}
          </button>
        ))}
      </div>
      <Conversation className="min-h-0">
        <ConversationContent className="gap-4 px-5">
          {messages.map((message, index) => (
            <Message from={message.role} key={`${message.role}-${index}`}>
              <MessageContent
                className={message.role === "user" ? "bg-primary text-primary-foreground" : ""}
              >
                <MessageResponse>{message.text}</MessageResponse>
              </MessageContent>
            </Message>
          ))}
          {loading && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking with you...</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="px-4 pb-3">
        <PromptInput onSubmit={({ text }) => answer(text)}>
          <PromptInputTextarea placeholder="Ask about a health term..." />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={loading ? "submitted" : "ready"} disabled={loading} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          General information only — not medical advice.
        </p>
      </div>
    </div>
  );
}

const glossary: Record<string, string> = {
  hba1c: "Your average blood sugar level over the previous 2–3 months.",
  "ldl cholesterol":
    "A type of cholesterol that can build up in blood vessels when levels stay high.",
  "hdl cholesterol": "A type of cholesterol that helps remove other cholesterol from your blood.",
  bmi: "A rough comparison of weight to height, used as a general screening number.",
  "blood pressure":
    "The pressure of blood against your artery walls, written as two numbers (systolic over diastolic).",
  cbc: "Complete blood count — a broad look at the different cells in your blood.",
  tsh: "A hormone measured to check how your thyroid gland is working.",
  creatinine: "A waste product measured to estimate how well your kidneys filter blood.",
  "within normal limits": "The measured result falls inside the usual reference range.",
};

function TranslatorPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<{ term: string; explanation: string }[]>([]);
  const explain = async (value: string) => {
    const key = value.trim().toLowerCase();
    if (!key) return;
    try {
      const res = await sendChatMessage(`Explain this medical term in simple plain language: ${value.trim()}`);
      const expl = res.response || res.disclaimer;
      setResults((current) => [{ term: value.trim(), explanation: expl }, ...current]);
    } catch {
      const explanation =
        glossary[key] ??
        "This term isn't in the built-in glossary yet. Write it down and ask your clinician what it means for you.";
      setResults((current) => [{ term: value.trim(), explanation }, ...current]);
    }
    setTerm("");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected.name);
    setUploading(true);
    setUploadStatus("Uploading and indexing in FurrGo RAG backend...");
    try {
      const uploadRes = await uploadDocument(selected);
      setUploadStatus(`Indexed into FurrGo Knowledge Base (${uploadRes.chunks_created || 1} chunks ready for Q&A).`);
      toast.success("Document processed by Healthcare_Backend RAG!");
    } catch (err: any) {
      console.warn("Document upload note:", err);
      setUploadStatus("Attached on device. You can query terms from it above.");
    } finally {
      setUploading(false);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="Medical translator"
        title="Understand your health reports"
        action={<Languages className="text-sleep" />}
      />
      <div className="px-5">
        <p className="max-w-md text-sm text-muted-foreground">
          Type a term from your report and see it in plain language.
        </p>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            explain(term);
          }}
        >
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="e.g. HbA1c"
            aria-label="Medical term"
          />
          <Button type="submit" className="rounded-xl">
            Explain
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.keys(glossary)
            .slice(0, 6)
            .map((key) => (
              <button
                type="button"
                key={key}
                onClick={() => explain(key)}
                className="rounded-full border bg-card px-3 py-1.5 text-xs font-semibold capitalize"
              >
                {key}
              </button>
            ))}
        </div>
        <input
          ref={fileInput}
          type="file"
          className="hidden"
          accept="image/*,.pdf"
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="upload-zone mt-5"
        >
          <Upload className="size-8 text-primary" />
          <strong>Attach a prescription or report</strong>
          <span>Kept on your device · text isn't read automatically</span>
        </button>
        {file && (
          <div className="mt-3 flex items-center gap-3 rounded-[20px] border bg-card p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-muted">
              <FileText />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{file}</p>
              <p className="text-xs text-muted-foreground">
                {uploadStatus || "Attached on device."}
              </p>
            </div>
          </div>
        )}
        {results.length > 0 && (
          <div className="mt-5 space-y-3">
            {results.map((result, index) => (
              <Translation
                key={`${result.term}-${index}`}
                term={result.term}
                explanation={result.explanation}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function DigestPage() {
  const state = useFurrGo();
  const loggedDays = state.last7.filter(
    (day) => day.log.steps || day.log.sleepMinutes || day.log.workouts || day.log.medsTaken.length,
  ).length;
  return (
    <>
      <PageHeader eyebrow="Weekly digest" title="Your Week with FurrGo" action={<CalendarDays />} />
      <div className="px-5">
        {loggedDays === 0 ? (
          <EmptyState
            icon={<CalendarDays />}
            title="No data this week"
            note="Once you log steps, sleep, workouts or medication, your weekly summary appears here."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Weekly steps"
                value={state.weekly.steps.toLocaleString()}
                icon={<Footprints />}
              />
              <StatCard
                label="Weekly sleep"
                value={formatSleep(state.weekly.sleepMinutes)}
                icon={<Moon />}
              />
              <StatCard
                label="Medication"
                value={state.weekly.adherence === null ? "—" : `${state.weekly.adherence}%`}
                icon={<Pill />}
              />
              <StatCard
                label="Health streak"
                value={state.streak ? `${state.streak} days` : "None yet"}
                icon={<Trophy />}
              />
            </div>
            <SectionTitle className="mt-7" kicker="Seven days" title="Your momentum" />
            <TrendChart />
            <section className="mt-6 flex items-center gap-4 rounded-[24px] bg-mint p-4">
              <div className="w-24 shrink-0">
                <InteractivePanda draggable={false} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-primary">Panda's weekly note</p>
                <p className="mt-1 font-semibold">
                  You logged health on {loggedDays} of the last 7 days
                  {state.streak > 1 ? ` and kept a ${state.streak}-day streak` : ""}. Keep going!
                </p>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}

function GoalsPage() {
  const state = useFurrGo();
  const [steps, setSteps] = useState(String(state.goals.steps));
  const [sleepHours, setSleepHours] = useState(String(Math.round(state.goals.sleepMinutes / 60)));
  const [workouts, setWorkouts] = useState(String(state.goals.workouts));
  return (
    <>
      <PageHeader eyebrow="Health goals" title="Set your own targets" action={<Target />} />
      <div className="px-5">
        <section className="space-y-4 rounded-[20px] border bg-card p-4">
          <div>
            <Label htmlFor="goal-steps">Daily steps</Label>
            <Input
              id="goal-steps"
              inputMode="numeric"
              value={steps}
              onChange={(event) => setSteps(event.target.value.replace(/\D/g, ""))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="goal-sleep">Sleep hours</Label>
            <Input
              id="goal-sleep"
              inputMode="numeric"
              value={sleepHours}
              onChange={(event) => setSleepHours(event.target.value.replace(/\D/g, ""))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="goal-workouts">Workouts per week</Label>
            <Input
              id="goal-workouts"
              inputMode="numeric"
              value={workouts}
              onChange={(event) => setWorkouts(event.target.value.replace(/\D/g, ""))}
              className="mt-1.5"
            />
          </div>
          <Button
            className="w-full rounded-xl"
            onClick={() => {
              state.setGoals({
                steps: Number(steps) || state.goals.steps,
                sleepMinutes: (Number(sleepHours) || 8) * 60,
                workouts: Number(workouts) || state.goals.workouts,
              });
              toast.success("Goals updated");
            }}
          >
            Save goals
          </Button>
        </section>
        <SectionTitle className="mt-7" kicker="Progress" title="How today looks" />
        <div className="mt-3 space-y-3">
          <GoalBar
            title={`Steps (${state.today.steps.toLocaleString()} / ${state.goals.steps.toLocaleString()})`}
            value={Math.min(100, Math.round((state.today.steps / state.goals.steps) * 100))}
          />
          <GoalBar
            title={`Sleep (${formatSleep(state.today.sleepMinutes)} / ${formatSleep(state.goals.sleepMinutes)})`}
            value={Math.min(
              100,
              Math.round((state.today.sleepMinutes / state.goals.sleepMinutes) * 100),
            )}
          />
          <GoalBar
            title={`Workouts this week (${state.weekly.workouts} / ${state.goals.workouts})`}
            value={Math.min(100, Math.round((state.weekly.workouts / state.goals.workouts) * 100))}
          />
        </div>
      </div>
    </>
  );
}

const closetItems: Record<string, [string, string, number][]> = {
  Outfits: [
    ["None", "✨", 0],
    ["Green Hoodie", "🧥", 100],
    ["Cozy Tee", "👕", 400],
  ],
  Accessories: [
    ["None", "✨", 0],
    ["Panda Backpack", "🎒", 600],
    ["Sun Cap", "🧢", 900],
  ],
  Room: [
    ["Sunny Room", "☀️", 0],
    ["Forest Room", "🌲", 300],
    ["Night Room", "🌙", 1200],
  ],
  Emotes: [
    ["Wave", "👋", 0],
    ["Happy Dance", "💃", 500],
    ["Confetti Jump", "🎉", 1500],
  ],
};

function ClosetContent({ compact = false }: { compact?: boolean }) {
  const state = useFurrGo();
  const [category, setCategory] = useState("Outfits");
  const items = closetItems[category] ?? [];
  return (
    <div className={cn("mt-4", !compact && "px-5")}>
      <div className="flex items-center justify-center rounded-[22px] bg-mint p-3">
        <div className="w-52">
          <InteractivePanda draggable={false} />
        </div>
      </div>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {Object.keys(closetItems).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={category === key ? "default" : "outline"}
            onClick={() => setCategory(key)}
          >
            {key}
          </Button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {items.map(([name, emoji, needed]) => {
          const open = state.xp >= needed;
          return (
            <button
              type="button"
              key={name}
              onClick={() =>
                open
                  ? state.equip(category, name)
                  : toast(`Earn ${needed - state.xp} more Bond XP to unlock this.`)
              }
              className={cn(
                "closet-item",
                state.equipped[category] === name && "border-primary bg-mint",
                !open && "opacity-55",
              )}
            >
              <span className="text-3xl">{emoji}</span>
              <strong>{name}</strong>
              <small>
                {state.equipped[category] === name
                  ? "Equipped"
                  : open
                    ? "Unlocked"
                    : `${needed} XP`}
              </small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionTitle({
  kicker,
  title,
  className,
}: {
  kicker: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-black uppercase text-primary">{kicker}</p>
      <h2 className="text-lg font-extrabold">{title}</h2>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: string;
}) {
  return (
    <div className={cn("metric-card", `tone-${tone}`)}>
      <span>{icon}</span>
      <p className="mt-2 text-[10px] font-bold uppercase opacity-70">{label}</p>
      <strong className="block text-base">{value}</strong>
      <small>{sub}</small>
    </div>
  );
}

function CleanMetric({ label, value, change }: { label: string; value: string; change: string }) {
  return (
    <div className="min-w-0 rounded-xl border bg-card p-3">
      <p className="truncate text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
      <strong className="mt-1 block truncate text-lg">{value}</strong>
      <span className="truncate text-[10px] text-primary">{change}</span>
    </div>
  );
}

function QuickLink({
  to,
  icon,
  title,
  tone,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  tone: string;
}) {
  return (
    <Link to={to} className={cn("quick-link", `tone-${tone}`)}>
      <span className="grid size-9 place-items-center rounded-xl bg-background/70">{icon}</span>
      <strong>{title}</strong>
      <ChevronRight className="ml-auto size-4" />
    </Link>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-[18px] bg-card p-4 shadow-soft">
      <span className="text-primary">{icon}</span>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <strong className="block capitalize">{value}</strong>
    </div>
  );
}

function ProfileItem({
  icon,
  title,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  note: string;
}) {
  return (
    <div className="profile-row">
      <span className="text-primary">{icon}</span>
      <div className="min-w-0 flex-1 text-left">
        <p className="font-semibold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{note}</p>
      </div>
    </div>
  );
}

function ProfileLink({
  to,
  icon,
  title,
  note,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  note: string;
}) {
  return (
    <Link to={to} className="profile-row">
      <span className="text-primary">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{note}</p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}

function Translation({ term, explanation }: { term: string; explanation: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <p className="text-xs font-bold uppercase text-sleep">Original term · {term}</p>
      <p className="mt-1 text-sm leading-relaxed">{explanation}</p>
    </div>
  );
}

function GoalBar({ title, value }: { title: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between gap-2 text-sm">
        <span className="min-w-0 truncate font-semibold">{title}</span>
        <span>{value}%</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

/** Steps for the last seven days, taken straight from the user's own logs. */
function TrendChart() {
  const { last7, goals } = useFurrGo();
  const max = Math.max(goals.steps, ...last7.map((day) => day.log.steps), 1);
  return (
    <div className="mt-3 rounded-[20px] border bg-card p-4">
      <div className="flex h-28 items-end gap-2">
        {last7.map((day) => (
          <div key={day.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              style={{ height: `${Math.max(2, (day.log.steps / max) * 100)}%` }}
              className="w-full max-w-8 origin-bottom rounded-t-md bg-primary"
            />
            <span className="text-[9px] text-muted-foreground">{day.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        Daily steps you logged · goal {goals.steps.toLocaleString()}
      </p>
    </div>
  );
}

function PandaMark() {
  return (
    <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-primary">
      <img src={pandaImage} alt="" width={1024} height={1024} className="size-9 object-contain" />
    </span>
  );
}
