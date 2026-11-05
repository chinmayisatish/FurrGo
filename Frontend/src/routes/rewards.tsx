import { createFileRoute } from "@tanstack/react-router";
import { FurrGoApp } from "@/components/furrgo/app";
export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Bond Rewards — FurrGo" },
      { name: "description", content: "Explore health milestones and panda rewards." },
      { property: "og:title", content: "Bond Rewards — FurrGo" },
      { property: "og:description", content: "Explore health milestones and panda rewards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <FurrGoApp screen="rewards" />,
});
