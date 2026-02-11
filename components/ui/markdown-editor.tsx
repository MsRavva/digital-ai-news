"use client";

import { Eye, LayoutPanelTop, PenSquare } from "lucide-react";
import { useState } from "react";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
}

type EditorMode = "write" | "preview" | "split";

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Начните писать в формате Markdown...",
  className,
  height = 500,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<EditorMode>("split");
  const showEditor = mode === "write" || mode === "split";
  const showPreview = mode === "preview" || mode === "split";

  return (
    <div className={cn("markdown-editor space-y-3", className)}>
      <div className="inline-flex items-center rounded-lg border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setMode("write")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
            mode === "write" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          <PenSquare className="h-4 w-4" />
          Редактор
        </button>
        <button
          type="button"
          onClick={() => setMode("preview")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
            mode === "preview" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          <Eye className="h-4 w-4" />
          Предпросмотр
        </button>
        <button
          type="button"
          onClick={() => setMode("split")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
            mode === "split" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          <LayoutPanelTop className="h-4 w-4" />
          Разделить
        </button>
      </div>

      <div
        className={cn(
          "grid gap-3",
          mode === "split" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
        )}
        style={{ minHeight: `${height}px` }}
      >
        {showEditor && (
          <div className="overflow-hidden rounded-lg border bg-background">
            <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
              Markdown
            </div>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={cn(
                "h-full min-h-[420px] w-full resize-y border-0 bg-background px-4 py-3 text-sm outline-none",
                "font-['Ubuntu_Mono',ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation_Mono','Courier_New',monospace]"
              )}
              style={{ minHeight: `${Math.max(320, height - 40)}px` }}
            />
          </div>
        )}

        {showPreview && (
          <div className="overflow-hidden rounded-lg border bg-background">
            <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
              Предпросмотр
            </div>
            <div className="h-full min-h-[420px] overflow-auto px-4 py-3">
              <MarkdownContent content={value} disableLinks className="prose-sm md:prose-base" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
