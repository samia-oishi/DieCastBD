import sanitizeHtml from "sanitize-html";
import { Page } from "./page.model.js";
import { slugify } from "../../utils/slugify.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Matches the tag set @tiptap/starter-kit actually produces — admin-authored
// rich text is still untrusted input (this renders via dangerouslySetInnerHTML
// on the public page), so this is deliberately not sanitize-html's full default
// allow-list.
const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "s", "code", "pre", "blockquote", "hr",
  "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "a",
];
const ALLOWED_ATTRIBUTES = { a: ["href", "target", "rel"] };

function sanitizePageContent(html) {
  return sanitizeHtml(html ?? "", { allowedTags: ALLOWED_TAGS, allowedAttributes: ALLOWED_ATTRIBUTES });
}

export const getPageBySlug = asyncHandler(async (req, res) => {
  const page = await Page.findOne({ slug: req.params.slug, isPublished: true });
  if (!page) throw ApiError.notFound("Page not found");
  sendSuccess(res, { data: page });
});

export const listPagesAdmin = asyncHandler(async (req, res) => {
  const pages = await Page.find().sort({ title: 1 });
  sendSuccess(res, { data: pages });
});

export const getPageAdmin = asyncHandler(async (req, res) => {
  const page = await Page.findById(req.params.id);
  if (!page) throw ApiError.notFound("Page not found");
  sendSuccess(res, { data: page });
});

export const createPage = asyncHandler(async (req, res) => {
  const { title, content, seo, isPublished } = req.body;
  const slug = slugify(title);

  if (await Page.exists({ slug })) {
    throw ApiError.conflict("A page with this title already exists");
  }

  const page = await Page.create({ title, slug, content: sanitizePageContent(content), seo, isPublished });
  sendSuccess(res, { data: page, status: 201, message: "Page created" });
});

export const updatePage = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.title) updates.slug = slugify(updates.title);
  if (updates.content !== undefined) updates.content = sanitizePageContent(updates.content);

  const page = await Page.findByIdAndUpdate(req.params.id, updates, { returnDocument: "after", runValidators: true });
  if (!page) throw ApiError.notFound("Page not found");
  sendSuccess(res, { data: page, message: "Page updated" });
});
