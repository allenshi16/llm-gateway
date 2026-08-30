import Link from "next/link";
import { Card, Logo } from "@gateway/ui";
import { consoleLogInUrl } from "../lib/console-url";

export async function MarketingPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  const consoleUrl = await consoleLogInUrl();
  return <main className="marketing-shell"><nav className="marketing-nav"><Logo /><div className="marketing-links"><Link href="/platform">Platform</Link><Link href="/models">Models</Link><Link href="/pricing">Pricing</Link><Link href="/resources">Resources</Link></div><Link className="text-link" href={consoleUrl}>Open Console →</Link></nav><section className="content-hero"><span className="feature-number">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></section><section className="content-grid">{children}</section><footer className="marketing-footer"><Logo /><span>Model access without operational noise.</span><span>© 2026 Maridian Gateway</span></footer></main>;
}

export function ContentCard({ title, children }: { title: string; children: React.ReactNode }) { return <Card><h2>{title}</h2><p>{children}</p></Card>; }
