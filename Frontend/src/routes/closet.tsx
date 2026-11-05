import { createFileRoute } from "@tanstack/react-router";
import { FurrGoApp } from "@/components/furrgo/app";
export const Route = createFileRoute("/closet")({
  head: () => ({
    meta: [
      { title: "Panda Closet — FurrGo" },
      { name: "description", content: "Equip unlocked outfits, rooms, accessories, and emotes." },
      { property: "og:title", content: "Panda Closet — FurrGo" },
      {
        property: "og:description",
        content: "Equip unlocked outfits, rooms, accessories, and emotes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <FurrGoApp screen="closet" />,
});
