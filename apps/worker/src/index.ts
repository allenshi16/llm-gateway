import { createOutboxWorker } from "./worker.js";
import { loadConfig, releaseExpiredReservations } from "@gateway/core";

const config = loadConfig();
const worker = createOutboxWorker();

if (config.NODE_ENV !== "test") {
  const poll = async (): Promise<void> => {
    await worker.runOnce();
    const sweep = await releaseExpiredReservations(50);
    if (sweep.released > 0 || sweep.failed > 0) {
      console.log(JSON.stringify({ msg: "reservation_expiry_sweep", released: sweep.released, failed: sweep.failed }));
    }
    setTimeout(poll, config.WORKER_POLL_MS);
  };
  await poll();
}
