import { buildEdge } from "./app.js";
import { loadConfig } from "@gateway/core";

const config = loadConfig();
const app = buildEdge();
await app.listen({ port: config.EDGE_PORT, host: "0.0.0.0" });
