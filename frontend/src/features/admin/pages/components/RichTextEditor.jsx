import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading2, Heading3, Quote } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ToolbarButton({ active, ...props }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn(active && "bg-accent text-primary")}
      {...props}
    />
  );
}

// Controlled like any other react-hook-form Controller-driven field (value +
// onChange), matching the pattern already used for HeroSlideImage/BkashQrImage
// in SettingsPage.jsx. content is HTML, sanitized again server-side on save —
// this editor only controls what an admin *can* produce, not what's trusted.
export function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "min-h-[240px] rounded-b-lg border border-t-0 border-border p-4 text-sm text-foreground focus:outline-none [&_h2]:font-heading [&_h2]:text-lg [&_h3]:font-heading [&_h3]:text-base [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5",
      },
    },
  });

  // Sync external value changes (e.g. the async page fetch populating the form
  // in edit mode) into the editor — useEditor's `content` option only seeds
  // the initial value, it doesn't react to later prop changes on its own.
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) editor.commands.setContent(value || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-t-lg border border-border bg-muted/40 p-2">
        <ToolbarButton
          aria-label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold />
        </ToolbarButton>
        <ToolbarButton
          aria-label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic />
        </ToolbarButton>
        <ToolbarButton
          aria-label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough />
        </ToolbarButton>
        <ToolbarButton
          aria-label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 />
        </ToolbarButton>
        <ToolbarButton
          aria-label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 />
        </ToolbarButton>
        <ToolbarButton
          aria-label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List />
        </ToolbarButton>
        <ToolbarButton
          aria-label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </ToolbarButton>
        <ToolbarButton
          aria-label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
