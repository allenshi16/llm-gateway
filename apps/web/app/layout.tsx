import "@gateway/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { brand } from "@gateway/brand";

export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4300"), title: { default: brand.name, template: `%s · ${brand.name}` }, description: brand.description, openGraph: { type: "website", title: brand.name, description: brand.description } };

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
