import { createFileRoute } from "@tanstack/react-router";
import { FurrGoApp } from "@/components/furrgo/app";
export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "FurrGo AI — Health Companion" },
      {
        name: "description",
        content: "Explore health concepts with a friendly mock AI companion.",
      },
      { property: "og:title", content: "FurrGo AI — Health Companion" },
      {
        property: "og:description",
        content: "Explore health concepts with a friendly mock AI companion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <FurrGoApp screen="assistant" />,
});
