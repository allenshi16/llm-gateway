import type { Region } from "@gateway/contracts";

export interface ApprovedRoute {
  provider: string;
  providerModel?: string;
  endpoint?: string;
  region: Region;
  status: "APPROVED";
  resaleApproved: boolean;
  dpaApproved: boolean;
  securityApproved: boolean;
  residencyApproved: boolean;
  killSwitch: boolean;
  zeroRetention: boolean;
}

export function selectApprovedRoute(routes: readonly ApprovedRoute[], region: Region, retentionMode: "ZERO" | "STANDARD"): ApprovedRoute {
  const route = routes.find((candidate) =>
    candidate.region === region &&
    candidate.status === "APPROVED" &&
    candidate.resaleApproved &&
    candidate.dpaApproved &&
    candidate.securityApproved &&
    candidate.residencyApproved &&
    !candidate.killSwitch &&
    (retentionMode === "STANDARD" || candidate.zeroRetention)
  );
  if (!route) throw new Error(`No approved provider route for region ${region}`);
  return route;
}
