import "@gateway/ui/styles.css";
import "./console.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: { default: "Console", template: "%s · Northstar Console" }, robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
