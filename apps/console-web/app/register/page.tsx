"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createGatewayApi, GatewayApiError } from "@gateway/api-client";
import { Button, Card, Logo } from "@gateway/ui";

type RegisterPayload = { email: string; password: string; displayName?: string };

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const payload: RegisterPayload = { email, password, ...(displayName.trim() ? { displayName: displayName.trim() } : {}) };
    const api = createGatewayApi();
    try {
      await api.request("/v1/auth/register", { method: "POST", body: JSON.stringify(payload) });
      await api.request("/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      window.location.href = "/dashboard";
    } catch (cause) {
      setError(cause instanceof GatewayApiError ? cause.code : "Unable to create account");
    } finally {
      setBusy(false);
    }
  }
  return <main className="auth-shell"><div className="auth-aside"><Logo /><div><span className="eyebrow">CONTROL PLANE / 01</span><h1>Build on a calmer model layer.</h1><p>Manage access, routing, usage, and spend from one private workspace.</p></div><span className="aside-note">Approved routes · accountable usage · regional control</span></div><Card className="auth-card"><span className="eyebrow">GET STARTED</span><h2>Create your account</h2><p className="muted">Your workspace, keys, and billing live in Console.</p><form onSubmit={submit}><label>Name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} type="text" autoComplete="name" /></label><label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required /></label><label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="new-password" minLength={8} required /></label>{error ? <p className="form-error">{error}</p> : null}<Button disabled={busy}>{busy ? "Creating account…" : "Create account"}</Button></form><div className="auth-links"><span>Already have an account? <Link href="/login">Sign in</Link></span></div></Card></main>;
}