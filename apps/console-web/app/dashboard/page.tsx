"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createGatewayApi, GatewayApiError } from "@gateway/api-client";
import { Badge, Button, Card } from "@gateway/ui";
import { ConsoleFrame, pickWorkspace, type WorkspaceMembership } from "../console-frame";

type Me = { email: string; emailVerified: boolean };
type Usage = { usage: { request_count: number; settled_count: number; charged_usd: string } };
type UsageRow = { id: string; status: string; created_at: string };

export default function DashboardPage() {
  const [me, setMe] = useState<Me>(); const [hasWorkspace, setHasWorkspace] = useState(false); const [usage, setUsage] = useState<Usage>(); const [error, setError] = useState("");
  const [usageRows, setUsageRows] = useState<UsageRow[]>([]);
  useEffect(() => { const api = createGatewayApi(); void Promise.all([api.request<Me>("/v1/auth/me"), api.request<{ memberships: WorkspaceMembership[] }>("/v1/account/context")]).then(async ([account, { memberships }]) => { setMe(account); const selected = pickWorkspace(memberships); if (!selected) return; setHasWorkspace(true); const [summary, details] = await Promise.all([api.request<Usage>(`/v1/account/organizations/${selected.organizationId}/usage`), api.request<{ requests: UsageRow[] }>(`/v1/account/organizations/${selected.organizationId}/usage/details`)]); setUsage(summary); setUsageRows(details.requests); }).catch((cause) => { if (cause instanceof GatewayApiError && cause.status === 401) window.location.href = "/login"; else setError("Could not load workspace data"); }); }, []);
  return <ConsoleFrame active="Overview">{hasWorkspace ? <><header className="console-header"><div><span className="eyebrow">OVERVIEW</span><h1>Good morning{me ? `, ${me.email.split("@")[0]}` : ""}.</h1></div><Button>New API key</Button></header>{error ? <Card><p className="form-error">{error}</p></Card> : null}<div className="stat-grid"><Card><span className="stat-label">Requests this period</span><strong>{usage?.usage.request_count ?? "—"}</strong><small>Across approved routes</small></Card><Card><span className="stat-label">Settled requests</span><strong>{usage?.usage.settled_count ?? "—"}</strong><small>Provider usage reconciled</small></Card><Card><span className="stat-label">Customer charges</span><strong>{usage ? `$${usage.usage.charged_usd}` : "—"}</strong><small>Immutable ledger total</small></Card></div><div className="dashboard-grid"><Card className="wide-card"><div className="card-heading"><div><span className="eyebrow">REQUEST ACTIVITY</span><h2>Recent usage</h2></div><Badge tone="positive">{usageRows.length} loaded</Badge></div><UsageBars rows={usageRows} /></Card><Card><span className="eyebrow">NEXT STEP</span><h2>Connect your first workload.</h2><p className="muted">Create a live key, choose an approved model, and send your first OpenAI-compatible request.</p><Link className="text-link" href="/api-keys">Manage API keys →</Link></Card></div></> : null}</ConsoleFrame>;
}

function UsageBars({ rows }: { rows: UsageRow[] }) { const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (6 - index)); return date; }); const counts = days.map((day) => rows.filter((row) => { const created = new Date(row.created_at); return created >= day && created < new Date(day.getTime() + 86_400_000); }).length); const max = Math.max(...counts, 1); return <div className="usage-bars">{days.map((day, index) => <div className="usage-bar-column" key={day.toISOString()}><div className="usage-bar-track"><i style={{ height: `${Math.max(8, (counts[index] / max) * 100)}%` }} /></div><small>{day.toLocaleDateString(undefined, { weekday: "short" })}</small><b>{counts[index]}</b></div>)}</div>; }