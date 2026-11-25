import type { MetadataRoute } from "next";
import { modelCatalog } from "@gateway/brand/models";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4300";

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/docs/deepseek-chat-api`, lastModified: new Date("2026-11-24"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/blog/openai-compatible-client-errors`, lastModified: new Date("2026-11-24"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/platform`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/models`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/resources`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/alternatives/openrouter`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/docs`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  const modelPages: MetadataRoute.Sitemap = modelCatalog.map((m) => ({
    url: `${base}/models/${m.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: m.supported ? 0.9 : 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = [
    { url: `${base}/blog/what-is-jev-typesafe`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog/jev-vs-laya-alternatives`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog/minimax-h3`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog/best-chinese-models-2026`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog/deepseek-vs-qwen`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog/gpt6-vs-chinese-llms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  ];

  return [...staticPages, ...modelPages, ...blogPages];
}
