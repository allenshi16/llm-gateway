"use client";
import { useEffect, useState } from "react";
import { createGatewayApi } from "@gateway/api-client";
import { Badge, Card } from "@gateway/ui";
import { ConsoleFrame, pickWorkspace, type ConsoleContext, type WorkspaceMembership } from "../console-frame";

type Model = { public_name: string; display_name: string | null; billing_mode: string; route_region: string; provider: string; provider_model: string };

export default function ModelsPage() {
  const [context, setContext] = useState<ConsoleContext>(); const [models, setModels] = useState<Model[]>([]);
  useEffect(() => { void createGatewayApi().request<{ memberships: WorkspaceMembership[] }>("/v1/account/context").then(async ({ memberships }) => { const next = pickWorkspace(memberships); if (!next) return; setContext(next); setModels((await createGatewayApi().request<{ models: Model[] }>(`/v1/account/organizations/${next.organizationId}/workspaces/${next.workspaceId}/models`)).models); }); }, []);
  return <ConsoleFrame active="Models">{context ? <><header className="console-header"><div><span className="eyebrow">ENTITLEMENTS / APPROVED ROUTES</span><h1>Models</h1></div></header><div className="model-grid">{models.map((model) => <Card key={`${model.public_name}-${model.route_region}`}><div className="card-heading"><div><h2>{model.display_name ?? model.public_name}</h2><small className="muted">{model.public_name}</small></div><Badge tone="positive">approved</Badge></div><p className="muted">{model.provider} / {model.provider_model}</p><div className="model-meta"><span><small>Region</small><b>{model.route_region}</b></span><span><small>Billing</small><b>{model.billing_mode}</b></span></div></Card>)}{models.length === 0 ? <Card><p className="muted">No approved models for this workspace.</p></Card> : null}</div></> : null}</ConsoleFrame>;
}
