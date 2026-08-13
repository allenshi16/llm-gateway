import { buildControlPlane } from "./app.js";
import { loadConfig } from "@gateway/core";

const config = loadConfig();
const app = buildControlPlane();
await app.listen({ port: config.CONTROL_PLANE_PORT, host: "0.0.0.0" });
