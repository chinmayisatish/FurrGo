import { createFileRoute } from "@tanstack/react-router";
import { FurrGoApp } from "@/components/furrgo/app";
export const Route = createFileRoute("/fitness")({
  head: () => ({
    meta: [
      { title: "Fitness — FurrGo" },
      { name: "description", content: "Track steps, workouts, and weekly movement." },
      { property: "og:title", content: "Fitness — FurrGo" },
      { property: "og:description", content: "Track steps, workouts, and weekly movement." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <FurrGoApp screen="fitness" />,
});
