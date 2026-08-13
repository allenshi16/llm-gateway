"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createGatewayApi, GatewayApiError } from "@gateway/api-client";
import { Button, Card, Logo } from "@gateway/ui";

export default function LoginPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); try { await createGatewayApi().request("/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); window.location.href = "/dashboard"; } catch (cause) { setError(cause instanceof GatewayApiError ? cause.code : "Unable to sign in"); } finally { setBusy(false); } }
  return <main className="auth-shell"><div className="auth-aside"><Logo /><div><span className="eyebrow">CONTROL PLANE / 01</span><h1>Build on a calmer model layer.</h1><p>Manage access, routing, usage, and spend from one private workspace.</p></div><span className="aside-note">Approved routes · accountable usage · regional control</span></div><Card className="auth-card"><span className="eyebrow">WELCOME BACK</span><h2>Sign in to Console</h2><p className="muted">Use your Northstar account to continue.</p><form onSubmit={submit}><label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required /></label><label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required /></label>{error ? <p className="form-error">{error}</p> : null}<Button disabled={busy}>{busy ? "Signing in…" : "Continue"}</Button></form><div className="auth-links"><Link href="/forgot-password">Forgot password?</Link><span>New to Northstar? <Link href="/register">Create account</Link></span></div></Card></main>;
}
