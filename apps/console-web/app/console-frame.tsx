"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { createGatewayApi, GatewayApiError } from "@gateway/api-client";
import { Button, Card, Logo } from "@gateway/ui";

export type WorkspaceMembership = { organization_id: string; workspace_id?: string; organization_name: string; workspace_name: string; role: string };
export type ConsoleContext = { organizationId: string; workspaceId: string; organizationName: string; workspaceName: string; role: string };
const WORKSPACE_STORAGE_KEY = "maridian_selected_workspace";

export function pickWorkspace(memberships: WorkspaceMembership[]): ConsoleContext | undefined {
  const selected = typeof window === "undefined" ? undefined : window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
  const item = memberships.find((membership) => membership.workspace_id === selected) ?? memberships.find((membership) => membership.workspace_id);
  return item?.workspace_id ? { organizationId: item.organization_id, workspaceId: item.workspace_id, organizationName: item.organization_name, workspaceName: item.workspace_name, role: item.role } : undefined;
}

export function ConsoleFrame({ active, children }: { active: string; children: ReactNode }) {
  const [account, setAccount] = useState<string>(); const [context, setContext] = useState<ConsoleContext>(); const [memberships, setMemberships] = useState<WorkspaceMembership[]>([]); const [error, setError] = useState("");
  useEffect(() => { const api = createGatewayApi(); void Promise.all([api.request<{ email: string }>("/v1/auth/me"), api.request<{ memberships: WorkspaceMembership[] }>("/v1/account/context")]).then(([me, result]) => { setAccount(me.email); setMemberships(result.memberships); setContext(pickWorkspace(result.memberships)); }).catch((cause) => { if (cause instanceof GatewayApiError && cause.status === 401) window.location.href = "/login"; else setError("Could not load account context"); }); }, []);
  const nav = [["Overview", "/dashboard"], ["API keys", "/api-keys"], ["Usage", "/usage"], ["Models", "/models"], ["Billing", "/billing"], ["Members", "/members"], ["Audit", "/audit"]] as const;
  return <main className="console-shell"><aside className="console-sidebar"><Logo /><label className="workspace-switcher"><span className="eyebrow">WORKSPACE</span><select value={context?.workspaceId ?? ""} onChange={(event) => { window.localStorage.setItem(WORKSPACE_STORAGE_KEY, event.target.value); window.location.reload(); }}>{memberships.filter((membership) => membership.workspace_id).map((membership) => <option key={membership.workspace_id} value={membership.workspace_id}>{membership.organization_name} / {membership.workspace_name}</option>)}</select><small>{context?.role ?? "Loading access"}</small></label><nav>{nav.map(([label, href]) => <Link className={active === label ? "active" : ""} href={href} key={href}>{label}</Link>)}</nav><div className="sidebar-bottom"><span>{account ?? "Loading account…"}</span><Button variant="quiet" onClick={() => { void createGatewayApi().request("/v1/auth/logout", { method: "POST" }).then(() => { window.location.href = "/login"; }); }}>Sign out</Button></div></aside><section className="console-content">{error ? <p className="form-error">{error}</p> : null}{context ? children : <CardLoading />}</section></main>;
}

function CardLoading() { return <div className="loading-card">Loading workspace context…</div>; }
