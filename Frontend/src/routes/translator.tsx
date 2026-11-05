import { createFileRoute } from "@tanstack/react-router";
import { FurrGoApp } from "@/components/furrgo/app";
export const Route = createFileRoute("/translator")({
  head: () => ({
    meta: [
      { title: "Medical Translator — FurrGo" },
      {
        name: "description",
        content: "See medical terms explained in clear language using mock data.",
      },
      { property: "og:title", content: "Medical Translator — FurrGo" },
      {
        property: "og:description",
        content: "See medical terms explained in clear language using mock data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <FurrGoApp screen="translator" />,
});
