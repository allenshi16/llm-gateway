"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Sticky section navigation with scroll-spy                          */
/* ------------------------------------------------------------------ */

export function SectionNav({ items, ctaHref }: { items: { id: string; label: string }[]; ctaHref: string }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="alt-subnav" aria-label="Page sections">
      <div className="alt-subnav-inner">
        {items.map((i) => (
          <a key={i.id} href={`#${i.id}`} data-active={active === i.id}>
            {i.label}
          </a>
        ))}
        <a className="alt-subnav-cta" href={ctaHref}>
          Get API Key →
        </a>
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Tabbed code blocks with one-click copy + changed-line highlight    */
/* ------------------------------------------------------------------ */

export interface CodeTab {
  id: string;
  label: string;
  code: string;
  caption?: string;
  highlight?: number[];
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function CodeTabs({ tabs }: { tabs: CodeTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const onCopy = useCallback(async () => {
    if (!current) return;
    const ok = await copyText(current.code);
    if (ok) {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    }
  }, [current]);

  if (!current) return null;
  const lines = current.code.replace(/\n$/, "").split("\n");
  const hl = new Set(current.highlight ?? []);

  return (
    <div className="alt-code-card">
      <div className="alt-tabs" role="tablist" aria-label="Code examples">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === active}
            className="alt-tab"
            data-active={t.id === active}
            onClick={() => { setActive(t.id); setCopied(false); }}
          >
            {t.label}
          </button>
        ))}
        <button type="button" className="alt-copy" data-copied={copied} onClick={onCopy} aria-live="polite">
          {copied ? "✓ Copied" : "Copy code"}
        </button>
      </div>
      <pre className="alt-code-body" role="tabpanel">
        <code>
          {lines.map((ln, i) => (
            <span key={i} className="alt-code-line" data-hl={hl.has(i)}>
              {ln === "" ? " " : ln}
              {"\n"}
            </span>
          ))}
        </code>
      </pre>
      {current.caption && <div className="alt-code-caption">{current.caption}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Live "effective cost" calculator (OpenRouter 5.5% credit fee)      */
/* ------------------------------------------------------------------ */

const MIN = 100;
const MAX = 20000;
const STEP = 100;
const FEE = 0.055;

function usd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function FeeCalculator() {
  const [spend, setSpend] = useState(2000);
  const rangeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = rangeRef.current;
    if (el) {
      const pct = ((spend - MIN) / (MAX - MIN)) * 100;
      el.style.setProperty("--fill", `${pct}%`);
    }
  }, [spend]);

  const openrouter = spend * (1 + FEE);
  const savings = openrouter - spend;

  return (
    <div className="alt-calc">
      <div className="alt-calc-top">
        <label htmlFor="alt-spend">Your monthly token spend</label>
        <span className="alt-calc-value">{usd(spend)}</span>
      </div>
      <input
        id="alt-spend"
        ref={rangeRef}
        className="alt-range"
        type="range"
        min={MIN}
        max={MAX}
        step={STEP}
        value={spend}
        onChange={(e) => setSpend(Number(e.target.value))}
        aria-label="Monthly token spend in US dollars"
      />
      <div className="alt-range-scale">
        <span>{usd(MIN)}</span>
        <span>{usd(MAX)}</span>
      </div>
      <div className="alt-calc-grid">
        <div className="alt-calc-cell alt-or">
          <small>OpenRouter (credits)</small>
          <b>{usd(openrouter)}</b>
          <span>token cost + 5.5% top-up fee</span>
        </div>
        <div className="alt-calc-cell alt-best">
          <small>BestLLM (pass-through)</small>
          <b>{usd(spend)}</b>
          <span>token cost, no top-up fee</span>
        </div>
        <div className="alt-calc-cell alt-save">
          <small>You keep / year</small>
          <b>{usd(savings * 12)}</b>
          <span>{usd(savings)} every month</span>
        </div>
      </div>
      <p className="alt-note">
        Illustrative. OpenRouter passes through provider token prices but charges{" "}
        <strong>5.5% (min $0.80)</strong> when you buy credits, so {usd(spend)} of usage costs about{" "}
        {usd(openrouter)} all-in. BestLLM bills the token cost with no top-up fee. BYOK and enterprise
        terms differ — confirm current rates on each provider&apos;s pricing page.
      </p>
    </div>
  );
}