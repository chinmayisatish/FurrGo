import { createFileRoute } from "@tanstack/react-router";
import { FurrGoApp } from "@/components/furrgo/app";
export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — FurrGo" },
      { name: "description", content: "Manage goals and your FurrGo experience." },
      { property: "og:title", content: "Profile — FurrGo" },
      { property: "og:description", content: "Manage goals and your FurrGo experience." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <FurrGoApp screen="profile" />,
});
