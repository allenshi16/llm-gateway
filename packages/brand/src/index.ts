export const brand = {
  name: "BestLLM",
  tagline: "One OpenAI-compatible API for every LLM route.",
  description: "OpenAI-compatible access to DeepSeek, Qwen, Kimi, GLM, and MiniMax through a single LLM API gateway — with regional routing, spend controls, and transparent per-token pricing.",
  colors: {
    ink: "#08111f",
    panel: "#0d1b2d",
    signal: "#f2b84b",
    mint: "#77d8c4",
  },
} as const;

export const publicNavigation = [
  { label: "Platform", href: "/platform" },
  { label: "Models", href: "/models" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/resources" },
] as const;
