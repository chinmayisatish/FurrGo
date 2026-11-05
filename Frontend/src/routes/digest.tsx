import { createFileRoute } from "@tanstack/react-router";
import { FurrGoApp } from "@/components/furrgo/app";
export const Route = createFileRoute("/digest")({
  head: () => ({
    meta: [
      { title: "Weekly Health Digest — FurrGo" },
      { name: "description", content: "Review a friendly weekly health summary." },
      { property: "og:title", content: "Weekly Health Digest — FurrGo" },
      { property: "og:description", content: "Review a friendly weekly health summary." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <FurrGoApp screen="digest" />,
});
