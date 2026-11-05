import { createFileRoute } from "@tanstack/react-router";
import { FurrGoApp } from "@/components/furrgo/app";
export const Route = createFileRoute("/medication")({
  head: () => ({
    meta: [
      { title: "Medication — FurrGo" },
      { name: "description", content: "Follow today's mock medication routine." },
      { property: "og:title", content: "Medication — FurrGo" },
      { property: "og:description", content: "Follow today's mock medication routine." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <FurrGoApp screen="medication" />,
});
