import { loadConfig } from "./config.js";
import { validateReleaseImage } from "./release-config.js";

const image = process.env["LITELLM_IMAGE"];
if (!image) throw new Error("LITELLM_IMAGE is required for a release check");
validateReleaseImage(image);
loadConfig({ ...process.env, NODE_ENV: "production" });
console.log("release-config-ok");
