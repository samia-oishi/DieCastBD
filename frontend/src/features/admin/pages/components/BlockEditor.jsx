import { Image as ImageIcon, Plus, ImageUp, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { adminInputCls, adminTextareaCls } from "@/features/admin/shell/adminFieldCls";
import { OFFER_THEMES, hasWidth } from "../blockTypes";
import { ProductPicker } from "./ProductPicker";
import { adminToast } from "@/features/admin/shell/adminToast";
import { useUploadSettingsImageMutation } from "@/features/admin/settings/api/useAdminSettings";

function Label({ children, hint }) {
  return (
    <span className="mb-1.5 block text-[12px] font-semibold text-ink">
      {children}
      {hint && <span className="font-normal text-faint"> {hint}</span>}
    </span>
  );
}

/** Ink-filled when active — the design's segmented control. */
function Segmented({ options, value, onChange }) {
  return (
    <span className="inline-flex gap-1.5">
      {options.map((opt) => {
        const on = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "h-8 rounded-full border px-3 text-[12px] font-semibold transition-colors",
              on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-soft hover:bg-tile"
            )}
          >
            {opt}
          </button>
        );
      })}
    </span>
  );
}

function ToggleRow({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-2.5 text-[12.5px] font-semibold text-ink">
      <Switch checked={checked} onCheckedChange={onChange} />
      {children}
    </label>
  );
}

function Select({ value, onChange, options, className }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(adminInputCls, "cursor-pointer", className)}>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}


/** Cloudinary upload for image-bearing blocks.
 *
 * Reuses `POST /admin/settings/upload-image` — it is a generic image upload,
 * not settings-specific, and adding a second endpoint that does the same thing
 * is how two upload paths drift apart. Blocks store the URL string, so a hand-
 * typed URL still works for images already hosted elsewhere.
 */
function ImageUpload({ value, onChange, size = 68, label = "Upload image" }) {
  const uploadMutation = useUploadSettingsImageMutation();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploaded = await uploadMutation.mutateAsync(file);
      onChange(uploaded.url);
    } catch {
      adminToast("Upload failed");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-dashed border-[#DEDFD6] bg-white text-faint"
      >
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={20} strokeWidth={1.6} />}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-[12.5px] font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink">
          <ImageUp size={13} strokeWidth={1.9} />
          {uploadMutation.isPending ? "Uploading…" : label}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="hidden" onChange={onFile} />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex h-9 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-semibold text-faint transition-colors hover:text-[#B3261E]"
          >
            <X size={13} strokeWidth={2.2} /> Remove
          </button>
        )}
      </div>
    </div>
  );
}

/** The expanded body of one block. `set(patch)` merges into the block. */
export function BlockEditor({ block, set }) {
  const field = (key) => ({ value: block[key] ?? "", onChange: (e) => set({ [key]: e.target.value }) });

  return (
    <div className="grid gap-3.5 border-t border-line-soft bg-[#FCFCF9] p-4">
      {block.type === "heading" && (
        <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
          <label className="block">
            <Label>Heading text</Label>
            <input {...field("text")} className={cn(adminInputCls, "font-display text-[14px] font-bold")} />
          </label>
          <label className="block">
            <Label>Size</Label>
            <Select value={block.level} onChange={(v) => set({ level: v })} options={["H1", "H2", "H3"]} />
          </label>
        </div>
      )}

      {block.type === "text" && (
        <label className="block">
          <Label hint="(Markdown supported — **bold**, lists, links)">Text</Label>
          <textarea {...field("text")} rows={5} className={adminTextareaCls} />
        </label>
      )}

      {block.type === "image" && (
        <>
          <div>
            <Label>Image</Label>
            <ImageUpload value={block.url} onChange={(url) => set({ url })} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <Label>Alt text</Label>
              <input {...field("alt")} placeholder="Describes the image for screen readers" className={adminInputCls} />
            </label>
            <label className="block">
              <Label>Caption</Label>
              <input {...field("caption")} className={adminInputCls} />
            </label>
          </div>
        </>
      )}

      {block.type === "carousel" && (
        <>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[12px] font-semibold text-ink">Slides from</span>
            <Segmented options={["Images", "Products"]} value={block.source} onChange={(v) => set({ source: v })} />
          </div>
          {block.source === "Products" ? (
            <div>
              <Label>Pick products</Label>
              <ProductPicker picked={block.picked} onChange={(picked) => set({ picked })} />
            </div>
          ) : (
            <div>
              <Label>Slides</Label>
              <div className="flex flex-col gap-2.5">
                {(block.slides ?? []).map((slide, i) => (
                  <ImageUpload
                    key={i}
                    value={slide}
                    size={56}
                    label={slide ? "Replace" : "Upload slide"}
                    onChange={(url) => {
                      // An emptied slide is removed rather than left as a blank
                      // tile the storefront would have to filter out.
                      const slides = url
                        ? block.slides.map((s, j) => (j === i ? url : s))
                        : block.slides.filter((_, j) => j !== i);
                      set({ slides });
                    }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => set({ slides: [...(block.slides ?? []), ""] })}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[#DEDFD6] text-[12.5px] font-semibold text-faint hover:border-brand hover:text-ink"
                >
                  <Plus size={13} strokeWidth={2.2} /> Add slide
                </button>
              </div>
            </div>
          )}
          <ToggleRow checked={!!block.autoplay} onChange={(v) => set({ autoplay: v })}>
            Autoplay slides
          </ToggleRow>
        </>
      )}

      {block.type === "products" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <Label>Products</Label>
            <button
              type="button"
              onClick={() => set({ featured: !block.featured })}
              className={cn(
                "h-8 rounded-full border px-3 text-[12px] font-semibold transition-colors",
                block.featured ? "border-brand bg-brand-glow text-ink" : "border-line bg-white text-ink-soft hover:bg-tile"
              )}
            >
              ★ All featured products
            </button>
          </div>
          {/* Picking specific products is pointless while "all featured" is on,
              so the picker steps aside rather than sitting there ignored. */}
          {!block.featured && <ProductPicker picked={block.picked} onChange={(picked) => set({ picked })} />}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
            <span className="text-[12px] font-semibold text-ink">Columns</span>
            <Segmented options={["2", "3", "4"]} value={block.columns} onChange={(v) => set({ columns: v })} />
            <ToggleRow checked={!!block.showPrice} onChange={(v) => set({ showPrice: v })}>
              Show prices &amp; buy button
            </ToggleRow>
          </div>
        </>
      )}

      {block.type === "button" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <Label>Button text</Label>
            <input {...field("text")} className={adminInputCls} />
          </label>
          <label className="block">
            <Label>Link</Label>
            <input {...field("link")} placeholder="/shop" className={adminInputCls} />
          </label>
          <label className="block">
            <Label>Style</Label>
            <Select value={block.variant} onChange={(v) => set({ variant: v })} options={["Lime pill", "Ink outline"]} />
          </label>
        </div>
      )}

      {block.type === "offer" && (
        <>
          {/* Live preview — the theme choice is meaningless as a dropdown label. */}
          <div
            className="rounded-[14px] px-4 py-3.5"
            style={{
              background: (OFFER_THEMES[block.theme] ?? OFFER_THEMES.Lime)[0],
              color: (OFFER_THEMES[block.theme] ?? OFFER_THEMES.Lime)[1],
            }}
          >
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] opacity-80">{block.kicker || "Kicker"}</div>
            <div className="mt-1 font-display text-[19px] font-extrabold tracking-[-0.02em]">{block.title || "Offer title"}</div>
            <div className="mt-1 text-[12.5px] opacity-90">
              {block.desc || "Subtitle"}
              {block.code && (
                <>
                  {" · code "}
                  <strong className="font-bold">{block.code}</strong>
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <Label>Kicker</Label>
              <input {...field("kicker")} className={adminInputCls} />
            </label>
            <label className="block">
              <Label>Title</Label>
              <input {...field("title")} className={adminInputCls} />
            </label>
            <label className="block">
              <Label>Subtitle</Label>
              <input {...field("desc")} className={adminInputCls} />
            </label>
            <label className="block">
              <Label>Coupon code</Label>
              <input
                value={block.code ?? ""}
                onChange={(e) => set({ code: e.target.value.toUpperCase() })}
                placeholder="SAVE500"
                className={adminInputCls}
              />
            </label>
            <label className="block">
              <Label>Theme</Label>
              <Select value={block.theme} onChange={(v) => set({ theme: v })} options={Object.keys(OFFER_THEMES)} />
            </label>
          </div>
        </>
      )}

      {block.type === "divider" && (
        <p className="text-[12.5px] text-[#6B6E60]">A thin hairline with breathing room above and below. No settings.</p>
      )}

      {hasWidth(block) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line-soft pt-3.5">
          <span className="text-[12px] font-semibold text-ink">Block width</span>
          <Segmented options={["Full", "Half"]} value={block.width ?? "Full"} onChange={(v) => set({ width: v })} />
          <span className="text-[11.5px] text-faint">Two half-width blocks in a row sit side by side on desktop</span>
        </div>
      )}
    </div>
  );
}
