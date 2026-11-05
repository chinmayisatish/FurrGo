import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import panda from "@/assets/furrgo-panda.png";
import { useFurrGo, type PandaMood } from "@/lib/furrgo-state";
import { cn } from "@/lib/utils";

const reactions: PandaMood[] = ["happy", "excited", "surprised", "energetic", "encouraging"];

const moodMotion: Record<PandaMood, Record<string, number[]>> = {
  neutral: { y: [0, -4, 0], scale: [1, 1.01, 1] },
  happy: { y: [0, -8, 0], rotate: [-2, 2, -2] },
  energetic: { y: [0, -18, 0] },
  sleepy: { y: [0, -2, 0], rotate: [-4, -2, -4] },
  proud: { scale: [1, 1.05, 1], y: [0, -6, 0] },
  excited: { rotate: [-6, 6, -6], y: [0, -12, 0] },
  surprised: { scale: [1, 1.08, 1] },
  thinking: { rotate: [-2, 2, -2] },
  encouraging: { y: [0, -6, 0] },
  celebrating: { y: [0, -26, 0], rotate: [0, -8, 8, 0] },
};

/** A draggable, tappable panda the user can move around its scene. */
export function InteractivePanda({
  className,
  bounds,
  draggable = true,
}: {
  className?: string;
  bounds?: React.RefObject<HTMLDivElement | null>;
  draggable?: boolean;
}) {
  const { mood, react, pandaPosition, setPandaPosition } = useFurrGo();
  const [hearts, setHearts] = useState<number[]>([]);
  const taps = useRef(0);

  const onTap = () => {
    taps.current += 1;
    react(taps.current % 4 === 0 ? "celebrating" : reactions[taps.current % reactions.length]!);
    const id = Date.now();
    setHearts((current) => [...current, id]);
    window.setTimeout(() => setHearts((current) => current.filter((heart) => heart !== id)), 1100);
  };

  return (
    <motion.div
      className={cn("relative touch-none select-none", className)}
      drag={draggable}
      {...(bounds ? { dragConstraints: bounds } : {})}
      dragElastic={0.12}
      dragMomentum={false}
      initial={false}
      {...(draggable ? { style: { x: pandaPosition.x, y: pandaPosition.y } } : {})}
      onDragStart={() => react("surprised")}
      onDragEnd={(_event, info) => {
        setPandaPosition({
          x: pandaPosition.x + info.offset.x,
          y: pandaPosition.y + info.offset.y,
        });
        react("excited");
      }}
      whileDrag={{ scale: 1.06, rotate: 4, cursor: "grabbing" }}
    >
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.span
            key={heart}
            className="pointer-events-none absolute left-1/2 top-2 text-2xl"
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: 1, y: -70, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            💚
          </motion.span>
        ))}
      </AnimatePresence>
      <motion.button
        type="button"
        aria-label="Play with your panda"
        onClick={onTap}
        className="block w-full cursor-grab"
        animate={moodMotion[mood]}
        transition={{ repeat: Infinity, duration: mood === "celebrating" ? 1 : 3 }}
      >
        <motion.img
          src={panda}
          alt={`Your panda looking ${mood}`}
          width={1024}
          height={1024}
          draggable={false}
          className="h-auto w-full object-contain drop-shadow-2xl"
        />
      </motion.button>
    </motion.div>
  );
}
