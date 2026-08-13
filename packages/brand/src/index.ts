export const brand = {
  name: "Northstar Gateway",
  tagline: "One calm control plane for every model route.",
  description: "OpenAI-compatible access to approved LLM providers with regional policy, spend controls, and an immutable commercial ledger.",
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
