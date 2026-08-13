const digestImagePattern = /^(?:[a-z0-9.-]+(?::[0-9]+)?\/)?[a-z0-9._/-]+@sha256:[a-f0-9]{64}$/;

export function validateReleaseImage(image: string): void {
  if (image.includes("replace-with") || !digestImagePattern.test(image)) {
    throw new Error("LITELLM_IMAGE must be an immutable image reference with a 64-character sha256 digest");
  }
}
