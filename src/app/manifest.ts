import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Golden List",
    short_name: "GoldenList",
    description: "Stay in touch with the people who matter",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#111111",
    theme_color: "#D4AF37",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
