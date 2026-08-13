import { createOutboxWorker } from "./worker.js";
import { loadConfig } from "@gateway/core";

const config = loadConfig();
const worker = createOutboxWorker();

if (config.NODE_ENV !== "test") {
  const poll = async (): Promise<void> => {
    await worker.runOnce();
    setTimeout(poll, config.WORKER_POLL_MS);
  };
  await poll();
}
