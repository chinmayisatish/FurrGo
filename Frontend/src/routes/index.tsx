import { createFileRoute } from "@tanstack/react-router";
import { FurrGoApp } from "@/components/furrgo/app";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FurrGo — AI Health Companion" },
      {
        name: "description",
        content: "Build healthier habits with a panda companion by your side.",
      },
      { property: "og:title", content: "FurrGo — AI Health Companion" },
      {
        property: "og:description",
        content: "Build healthier habits with a panda companion by your side.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return <FurrGoApp screen="home" />;
}
