"use client";
import { useEffect, useState } from "react";
import { createGatewayApi } from "@gateway/api-client";
import { Card } from "@gateway/ui";
import { ConsoleFrame, pickWorkspace, type ConsoleContext, type WorkspaceMembership } from "../console-frame";

type AuditEvent = { id: string; action: string; resource_type: string; resource_id: string | null; created_at: string };
export default function AuditPage() { const [context, setContext] = useState<ConsoleContext>(); const [events, setEvents] = useState<AuditEvent[]>([]); useEffect(() => { void createGatewayApi().request<{ memberships: WorkspaceMembership[] }>("/v1/account/context").then(async ({ memberships }) => { const next = pickWorkspace(memberships); if (!next) return; setContext(next); setEvents((await createGatewayApi().request<{ events: AuditEvent[] }>(`/v1/account/organizations/${next.organizationId}/audit`)).events); }); }, []); return <ConsoleFrame active="Audit">{context ? <><header className="console-header"><div><span className="eyebrow">GOVERNANCE / IMMUTABLE EVENTS</span><h1>Audit log</h1></div></header><Card><div className="data-table">{events.map((event) => <div className="data-row" key={event.id}><span><strong>{event.action}</strong><small>{event.resource_type} · {event.resource_id ?? "organization"}</small></span><small>{new Date(event.created_at).toLocaleString()}</small></div>)}{events.length === 0 ? <p className="muted">No audit events found.</p> : null}</div></Card></> : null}</ConsoleFrame>; }
