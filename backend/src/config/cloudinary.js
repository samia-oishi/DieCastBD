import { env } from "./env.js";

/** Cloudinary, loaded the first time an image is actually uploaded or deleted.
 *
 * ~71ms to import, previously paid on every cold start of the single function
 * this API runs as on Vercel, because four controllers import the upload helper
 * at module load. Only admin image routes ever call it. See getFirebaseAuth()
 * for the same reasoning and the measurement behind it.
 */
let cloudinaryPromise = null;

export function getCloudinary() {
  cloudinaryPromise ??= (async () => {
    const { v2: cloudinary } = await import("cloudinary");

    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    return cloudinary;
  })();

  return cloudinaryPromise;
}
