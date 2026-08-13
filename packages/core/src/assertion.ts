import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { InternalAssertion } from "@gateway/contracts";

export async function signInternalAssertion(assertion: InternalAssertion, secret: string, issuer: string, audience: string, expiresInSeconds: number): Promise<string> {
  const key = new TextEncoder().encode(secret);
  return new SignJWT(assertion as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(key);
}

export async function verifyInternalAssertion(token: string, secret: string, issuer: string, audience: string): Promise<InternalAssertion> {
  const key = new TextEncoder().encode(secret);
  const result = await jwtVerify(token, key, { issuer, audience });
  return result.payload as unknown as InternalAssertion;
}
