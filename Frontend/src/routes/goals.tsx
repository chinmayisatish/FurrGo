import { createFileRoute } from "@tanstack/react-router";
import { FurrGoApp } from "@/components/furrgo/app";
export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Health Goals — FurrGo" },
      { name: "description", content: "Build healthy routines through achievable goals." },
      { property: "og:title", content: "Health Goals — FurrGo" },
      { property: "og:description", content: "Build healthy routines through achievable goals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <FurrGoApp screen="goals" />,
});
