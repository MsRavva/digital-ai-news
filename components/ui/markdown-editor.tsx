"use client";

import {
  Bold,
  Code2,
  Eye,
  Heading2,
  Italic,
  LayoutPanelTop,
  Link2,
  List,
  ListOrdered,
  PenSquare,
  Quote,
} from "lucide-react";
import { useRef, useState } from "react";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const showEditor = mode === "write" || mode === "split";
  const showPreview = mode === "preview" || mode === "split";

  const updateValue = (nextValue: string, selectionStart?: number, selectionEnd?: number) => {
    onChange(nextValue);

    requestAnimationFrame(() => {
      if (!textareaRef.current) {
        return;
      }

      textareaRef.current.focus();

      if (typeof selectionStart === "number" && typeof selectionEnd === "number") {
        textareaRef.current.setSelectionRange(selectionStart, selectionEnd);
      }
    });
  };

  const wrapSelection = (before: string, after = "", fallback = "") => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.slice(start, end);
    const content = selectedText || fallback;
    const nextValue = `${value.slice(0, start)}${before}${content}${after}${value.slice(end)}`;
    const nextSelectionStart = start + before.length;
    const nextSelectionEnd = nextSelectionStart + content.length;

    updateValue(nextValue, nextSelectionStart, nextSelectionEnd);
  };

  const insertLinePrefix = (prefix: string, fallback: string) => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.slice(start, end);
    const content = selectedText || fallback;
    const lines = content.split("\n");
    const prefixedContent = lines.map((line) => `${prefix}${line}`).join("\n");
    const nextValue = `${value.slice(0, start)}${prefixedContent}${value.slice(end)}`;

    updateValue(nextValue, start, start + prefixedContent.length);
  };

  const handleToolbarAction = (action: string) => {
    switch (action) {
      case "bold":
        wrapSelection("**", "**", "жирный текст");
        break;
      case "italic":
        wrapSelection("*", "*", "курсив");
        break;
      case "heading":
        insertLinePrefix("## ", "Новый подзаголовок");
        break;
      case "quote":
        insertLinePrefix("> ", "Цитата");
        break;
      case "unordered-list":
        insertLinePrefix("- ", "Пункт списка");
        break;
      case "ordered-list":
        insertLinePrefix("1. ", "Пункт списка");
        break;
      case "code":
        wrapSelection("```text\n", "\n```", "код");
        break;
      case "link":
        wrapSelection("[", "](https://example.com)", "текст ссылки");
        break;
      default:
        break;
    }
  };

  const toolbarButtons = [
    { action: "bold", label: "Жирный", icon: Bold },
    { action: "italic", label: "Курсив", icon: Italic },
    { action: "heading", label: "Заголовок", icon: Heading2 },
    { action: "quote", label: "Цитата", icon: Quote },
    { action: "unordered-list", label: "Список", icon: List },
    { action: "ordered-list", label: "Нумерация", icon: ListOrdered },
    { action: "code", label: "Код", icon: Code2 },
    { action: "link", label: "Ссылка", icon: Link2 },
  ] as const;

  return (
    <div className={cn("markdown-editor space-y-3", className)}>
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center gap-2">
          {toolbarButtons.map(({ action, label, icon: Icon }) => (
            <button
              key={action}
              type="button"
              onClick={() => handleToolbarAction(action)}
              disabled={!showEditor}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
                "border-border/70 bg-background/90 text-foreground hover:bg-accent hover:text-accent-foreground",
                "disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
              )}
              aria-label={label}
              title={label}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-lg border bg-muted/30 p-1 dark:border-white/10 dark:bg-white/[0.04]">
            <button
              type="button"
              onClick={() => setMode("write")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                mode === "write"
                  ? "bg-background text-foreground shadow-sm dark:bg-white/[0.08]"
                  : "text-muted-foreground"
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
                mode === "preview"
                  ? "bg-background text-foreground shadow-sm dark:bg-white/[0.08]"
                  : "text-muted-foreground"
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
                mode === "split"
                  ? "bg-background text-foreground shadow-sm dark:bg-white/[0.08]"
                  : "text-muted-foreground"
              )}
            >
              <LayoutPanelTop className="h-4 w-4" />
              Разделить
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Для изображений используйте обычный Markdown-синтаксис со ссылкой на внешний URL.</p>
        </div>
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
              ref={textareaRef}
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
