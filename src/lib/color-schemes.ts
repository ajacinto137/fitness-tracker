import type { ColorScheme } from "@prisma/client";

export const COLOR_SCHEMES: ColorScheme[] = [
  "VIBRANT",
  "NEON_LIME",
  "ELECTRIC_OCEAN",
  "NEON_SUNSET",
  "ULTRAVIOLET",
];

interface ColorSchemeMeta {
  label: string;
  description: string;
  /** Value written to the app shell's data-scheme attribute. */
  attr: string;
  /** CSS gradient used for the picker swatch preview. */
  preview: string;
}

export const COLOR_SCHEME_META: Record<ColorScheme, ColorSchemeMeta> = {
  VIBRANT: {
    label: "Vibrant",
    description: "Cyan, electric blue & violet",
    attr: "vibrant",
    preview: "linear-gradient(135deg, #00e1ff 0%, #2f8fff 55%, #8b5cf6 100%)",
  },
  NEON_LIME: {
    label: "Neon Lime",
    description: "Lime, aqua & cyan",
    attr: "neon-lime",
    preview: "linear-gradient(135deg, #b8ff3d 0%, #34e4b6 55%, #22d3ee 100%)",
  },
  ELECTRIC_OCEAN: {
    label: "Electric Ocean",
    description: "Cyan, electric blue & indigo",
    attr: "electric-ocean",
    preview: "linear-gradient(135deg, #00c2ff 0%, #4c6fff 55%, #2f4fe0 100%)",
  },
  NEON_SUNSET: {
    label: "Neon Sunset",
    description: "Yellow, orange & hot pink",
    attr: "neon-sunset",
    preview: "linear-gradient(135deg, #ffd60a 0%, #ff7a00 55%, #ff3d77 100%)",
  },
  ULTRAVIOLET: {
    label: "Ultraviolet",
    description: "Electric blue, violet & magenta",
    attr: "ultraviolet",
    preview: "linear-gradient(135deg, #4c6fff 0%, #8b5cf6 55%, #c026d3 100%)",
  },
};
