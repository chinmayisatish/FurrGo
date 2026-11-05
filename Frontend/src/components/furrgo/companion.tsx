import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Compass, X } from "lucide-react";
import panda from "@/assets/furrgo-panda.png";
import { useFurrGo, type PandaMood } from "@/lib/furrgo-state";
import { cn } from "@/lib/utils";

type MotionPermission = "unknown" | "unsupported" | "needs-permission" | "granted" | "denied";

const lines: Partial<Record<PandaMood, string>> = {
  neutral: "I'm right here with you.",
  happy: "Nice and steady!",
  excited: "Whoa, tilt me again!",
  surprised: "Eek — that was a shake!",
  energetic: "Let's keep moving!",
  celebrating: "Look at us go!",
  sleepy: "Shhh… resting here.",
};

type OrientationEventLike = { beta: number | null; gamma: number | null };
type MotionEventLike = {
  accelerationIncludingGravity: { x: number | null; y: number | null; z: number | null } | null;
};

/**
 * A small panda that stays on screen across the whole app and leans, drifts and
 * reacts to how the phone is being held or moved (pointer movement on desktop).
 */
export function PandaCompanion() {
  const { mood, react, companion, setCompanion, hydrated } = useFurrGo();
  const reduceMotion = useReducedMotion();
  const [permission, setPermission] = useState<MotionPermission>("unknown");
  const [bubble, setBubble] = useState<string | null>(null);
  const lastShake = useRef(0);
  const bubbleTimer = useRef<number | null>(null);

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const lean = useMotionValue(0);
  const x = useSpring(tiltX, { stiffness: 90, damping: 14 });
  const y = useSpring(tiltY, { stiffness: 90, damping: 14 });
  const rotate = useSpring(lean, { stiffness: 120, damping: 12 });

  const say = (text: string) => {
    setBubble(text);
    if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setBubble(null), 2200);
  };

  // Work out whether real device motion is available on this device.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const motionEvent = window.DeviceMotionEvent as
      | (typeof DeviceMotionEvent & { requestPermission?: () => Promise<PermissionState> })
      | undefined;
    if (!motionEvent && !window.DeviceOrientationEvent) {
      setPermission("unsupported");
      return;
    }
    setPermission(
      typeof motionEvent?.requestPermission === "function" ? "needs-permission" : "granted",
    );
  }, []);

  // Tilt + shake listeners (or pointer movement when there are no sensors).
  useEffect(() => {
    if (!companion || reduceMotion) return;
    const sensors = permission === "granted";

    const onOrientation = (event: Event) => {
      const { beta, gamma } = event as unknown as OrientationEventLike;
      const side = Math.max(-35, Math.min(35, gamma ?? 0));
      const front = Math.max(-35, Math.min(35, (beta ?? 0) - 40));
      tiltX.set(-side * 1.6);
      tiltY.set(front * 0.7);
      lean.set(side * 0.5);
    };

    const onDeviceMotion = (event: Event) => {
      const acceleration = (event as unknown as MotionEventLike).accelerationIncludingGravity;
      if (!acceleration) return;
      const force =
        Math.abs(acceleration.x ?? 0) +
        Math.abs(acceleration.y ?? 0) +
        Math.abs(acceleration.z ?? 0);
      const now = Date.now();
      if (force > 32 && now - lastShake.current > 1400) {
        lastShake.current = now;
        react("surprised");
        say(lines.surprised!);
      }
    };

    const onPointer = (event: PointerEvent) => {
      const midX = window.innerWidth / 2;
      const offset = Math.max(-1, Math.min(1, (event.clientX - midX) / midX));
      tiltX.set(-offset * 26);
      tiltY.set(Math.max(-16, Math.min(16, (event.clientY / window.innerHeight - 0.5) * -24)));
      lean.set(offset * 8);
    };

    if (sensors) {
      window.addEventListener("deviceorientation", onOrientation);
      window.addEventListener("devicemotion", onDeviceMotion);
      return () => {
        window.removeEventListener("deviceorientation", onOrientation);
        window.removeEventListener("devicemotion", onDeviceMotion);
      };
    }
    window.addEventListener("pointermove", onPointer);
    return () => window.removeEventListener("pointermove", onPointer);
  }, [companion, permission, reduceMotion, react, tiltX, tiltY, lean]);

  useEffect(
    () => () => {
      if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
    },
    [],
  );

  if (!hydrated || !companion) return null;

  const askPermission = async () => {
    const motionEvent = window.DeviceMotionEvent as typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<PermissionState>;
    };
    try {
      const result = await motionEvent.requestPermission?.();
      setPermission(result === "granted" ? "granted" : "denied");
      if (result === "granted") {
        react("excited");
        say("I can feel you moving now!");
      }
    } catch {
      setPermission("denied");
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center">
      <div className="pointer-events-auto relative flex w-full max-w-[760px] items-end justify-start px-4">
        <AnimatePresence>
          {bubble && (
            <motion.p
              key={bubble}
              initial={{ opacity: 0, y: 6, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute bottom-[86px] left-4 max-w-[220px] rounded-2xl bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-lg"
            >
              {bubble}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.div
          className={cn("relative h-20 w-20 touch-none select-none")}
          {...(reduceMotion ? {} : { style: { x, y, rotate }, animate: { scale: [1, 1.03, 1] } })}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <button
            type="button"
            aria-label="Your panda companion"
            onClick={() => {
              react("happy");
              say(lines[mood] ?? lines.neutral!);
            }}
            className="block h-full w-full rounded-full bg-primary/10 p-1 backdrop-blur-sm"
          >
            <img
              src={panda}
              alt={`Your panda companion looking ${mood}`}
              width={256}
              height={256}
              draggable={false}
              className="h-full w-full object-contain drop-shadow-xl"
            />
          </button>
          <button
            type="button"
            aria-label="Hide companion"
            onClick={() => setCompanion(false)}
            className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-card text-muted-foreground shadow"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>

        {permission === "needs-permission" && (
          <button
            type="button"
            onClick={askPermission}
            className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-lg"
          >
            <Compass className="h-3.5 w-3.5" /> Let me feel your moves
          </button>
        )}
      </div>
    </div>
  );
}
