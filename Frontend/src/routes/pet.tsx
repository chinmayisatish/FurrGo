import { createFileRoute } from "@tanstack/react-router";
import { FurrGoApp } from "@/components/furrgo/app";
export const Route = createFileRoute("/pet")({
  head: () => ({
    meta: [
      { title: "My Panda — FurrGo" },
      { name: "description", content: "Grow your health bond with your FurrGo panda." },
      { property: "og:title", content: "My Panda — FurrGo" },
      { property: "og:description", content: "Grow your health bond with your FurrGo panda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <FurrGoApp screen="pet" />,
});
