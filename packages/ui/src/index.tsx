import type { ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren } from "react";

export function Button({ variant = "solid", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "quiet" | "outline" }) {
  return <button className={`ui-button ui-button-${variant}`} {...props} />;
}

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={`ui-card ${className}`.trim()} {...props} />;
}

export function Badge({ children, tone = "neutral" }: PropsWithChildren<{ tone?: "neutral" | "positive" | "signal" }>) {
  return <span className={`ui-badge ui-badge-${tone}`}>{children}</span>;
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return <span className="ui-logo"><span className="ui-logo-mark">M</span>{compact ? null : <span>Maridian</span>}</span>;
}
