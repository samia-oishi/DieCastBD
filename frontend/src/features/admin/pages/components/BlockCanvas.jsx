import { useState } from "react";
import { GripVertical, ChevronUp, ChevronDown, Copy, Trash2, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { BLOCK_TYPES, PALETTE, summarizeBlock } from "../blockTypes";
import { BlockEditor } from "./BlockEditor";

function IconBtn({ title, onClick, danger, disabled, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-[30px] items-center justify-center rounded-[8px] text-faint transition-colors disabled:opacity-30",
        danger ? "hover:bg-[#F9E3E1] hover:text-[#B3261E]" : "hover:bg-tile hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

/** The block list: reorder by dragging the handle or with the arrow buttons,
 * one block expanded at a time.
 *
 * Drag & drop is native HTML5 — @dnd-kit isn't in this project and the redesign
 * brief rules out adding libraries. The arrow buttons aren't a nicety either:
 * they're the keyboard-and-touch path, where HTML5 DnD doesn't work at all.
 */
export function BlockCanvas({ blocks, onChange }) {
  const [openIndex, setOpenIndex] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const replace = (next) => onChange(next);

  const move = (from, to) => {
    if (to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    replace(next);
    // Keep the expanded block expanded after it moves, rather than following
    // whatever block slid into its old index.
    setOpenIndex((current) => (current === from ? to : current));
  };

  const add = (type) => {
    replace([...blocks, BLOCK_TYPES[type].create()]);
    setOpenIndex(blocks.length); // open the new block straight away
  };

  const duplicate = (i) => {
    const next = [...blocks];
    next.splice(i + 1, 0, structuredClone(blocks[i]));
    replace(next);
    setOpenIndex(i + 1);
  };

  const remove = (i) => {
    replace(blocks.filter((_, j) => j !== i));
    setOpenIndex((current) => (current === i ? null : current > i ? current - 1 : current));
  };

  const patch = (i, changes) => replace(blocks.map((b, j) => (j === i ? { ...b, ...changes } : b)));

  return (
    <section className="grid gap-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-3 px-0.5">
        <h2 className="font-display text-[15.5px] font-bold tracking-[-0.01em] text-ink">Page blocks</h2>
        <span className="text-[11.5px] text-faint">Drag the handle to reorder · click a block to edit it in place</span>
      </div>

      {blocks.length === 0 && (
        <div className="rounded-[16px] border-[1.5px] border-dashed border-[#DEDFD6] px-5 py-7 text-center text-[13px] leading-[1.6] text-faint">
          An empty page. Add your first block below —<br />a hero heading, an offer banner, or a product grid.
        </div>
      )}

      {blocks.map((block, i) => {
        const meta = BLOCK_TYPES[block.type];
        const Icon = meta.icon;
        const open = openIndex === i;
        return (
          <div
            key={i}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(i);
            }}
            onDragLeave={() => setOverIndex((current) => (current === i ? null : current))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null && dragIndex !== i) move(dragIndex, i);
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={cn(
              "overflow-hidden rounded-[16px] border bg-white transition-colors",
              open ? "border-ink shadow-[0_6px_20px_rgba(16,18,8,0.08)]" : "border-line",
              overIndex === i && dragIndex !== null && dragIndex !== i && "border-brand"
            )}
          >
            <div className="flex items-center gap-2 py-2 pl-2 pr-3">
              <span
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                title="Drag to reorder"
                className="flex size-[34px] shrink-0 cursor-grab items-center justify-center rounded-[9px] text-[#B7BAAD] hover:bg-tile hover:text-ink-soft active:cursor-grabbing"
              >
                <GripVertical size={14} strokeWidth={2} />
              </span>

              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                className="flex min-w-0 flex-1 items-center gap-2.5 py-1 text-left"
              >
                <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-tile text-ink-soft">
                  <Icon size={14} strokeWidth={1.9} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-bold text-ink">
                    {meta.label}
                    {block.width === "Half" && <span className="font-semibold text-faint"> · half width</span>}
                  </span>
                  <span className="block truncate text-[11.5px] text-faint">{summarizeBlock(block)}</span>
                </span>
              </button>

              <span className="flex shrink-0 gap-1">
                <IconBtn title="Move up" onClick={() => move(i, i - 1)} disabled={i === 0}>
                  <ChevronUp size={13} strokeWidth={2.2} />
                </IconBtn>
                <IconBtn title="Move down" onClick={() => move(i, i + 1)} disabled={i === blocks.length - 1}>
                  <ChevronDown size={13} strokeWidth={2.2} />
                </IconBtn>
                <IconBtn title="Duplicate" onClick={() => duplicate(i)}>
                  <Copy size={13} strokeWidth={1.9} />
                </IconBtn>
                <IconBtn title="Delete block" onClick={() => remove(i)} danger>
                  <Trash2 size={13} strokeWidth={1.9} />
                </IconBtn>
              </span>
            </div>

            {open && <BlockEditor block={block} set={(changes) => patch(i, changes)} />}
          </div>
        );
      })}

      <div className="rounded-[16px] border-[1.5px] border-dashed border-[#DEDFD6] p-4">
        <div className="mb-2.5 text-[12px] font-bold text-ink">Add a block</div>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => add(type)}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-[7px] text-[12.5px] font-semibold text-ink-soft transition-colors hover:border-brand hover:bg-brand-glow hover:text-ink"
            >
              <Icon size={13} strokeWidth={1.9} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
