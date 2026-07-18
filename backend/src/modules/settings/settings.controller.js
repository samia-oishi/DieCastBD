import { Settings } from "./settings.model.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadBufferToCloudinary } from "../../utils/cloudinaryUpload.js";

async function getSingleton() {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  return settings;
}

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await getSingleton();
  sendSuccess(res, { data: settings });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.findOneAndUpdate({}, req.body, {
    upsert: true,
    returnDocument: "after",
    runValidators: true,
    setDefaultsOnInsert: true,
  });
  sendSuccess(res, { data: settings, message: "Settings updated" });
});

// Standalone upload: returns a Cloudinary {url, cloudinaryId} for the editor to
// attach to a hero slide, rather than a slide-index-addressed endpoint — the
// whole Settings document is saved as one PATCH, so there's no separate mutation
// to race against.
export const uploadSettingsImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No image file provided");
  const image = await uploadBufferToCloudinary(req.file.buffer, "settings");
  sendSuccess(res, { data: image, message: "Image uploaded" });
});

/** Stable URL for the default social share image.
 *
 * Facebook/WhatsApp crawlers read the static index.html and never run JS, so
 * og:image there must be a fixed URL — but the image itself is merchant-
 * uploaded and lives at a changing Cloudinary URL. This route bridges the two:
 * the static tag points here, and we redirect to wherever the current upload
 * lives. The FB scraper follows redirects. 404 when unset — crawlers treat
 * that as "no image", which is honest.
 */
export const getShareImage = asyncHandler(async (req, res) => {
  const settings = await Settings.findOne().select("seoDefaults.shareImage").lean();
  const url = settings?.seoDefaults?.shareImage?.url;
  if (!url) throw ApiError.notFound("No share image set");
  res.redirect(302, url);
});
