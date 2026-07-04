"use client";

import {
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  ItalicPlugin,
  StrikethroughPlugin,
  UnderlinePlugin,
} from "@platejs/basic-nodes/react";
import { insertCodeBlock } from "@platejs/code-block";
import { CodeBlockPlugin, CodeLinePlugin } from "@platejs/code-block/react";
import { LinkPlugin } from "@platejs/link/react";
import { ListStyleType, toggleList } from "@platejs/list";
import { ListPlugin } from "@platejs/list/react";
import { MarkdownPlugin, remarkMdx, remarkMention } from "@platejs/markdown";
import {
  Bold,
  Code2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  LayoutPanelTop,
  Link2,
  List,
  ListOrdered,
  PenSquare,
  Quote,
  Strikethrough,
  Underline,
} from "lucide-react";
import { TrailingBlockPlugin, type Value } from "platejs";
import { ParagraphPlugin, Plate, usePlateEditor } from "platejs/react";
import * as React from "react";
import remarkGfm from "remark-gfm";

import { BlockquoteElement } from "@/components/ui/blockquote-node";
import { CodeBlockElement, CodeLineElement } from "@/components/ui/code-block-node";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { FixedToolbar } from "@/components/ui/fixed-toolbar";
import { H1Element, H2Element, H3Element } from "@/components/ui/heading-node";
import { LinkElement } from "@/components/ui/link-node";
import { MarkToolbarButton } from "@/components/ui/mark-toolbar-button";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { ParagraphElement } from "@/components/ui/paragraph-node";
import { Separator } from "@/components/ui/separator";
import { ToolbarButton } from "@/components/ui/toolbar";
import { cn } from "@/lib/utils";

interface PlateEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
}

type EditorMode = "write" | "preview" | "split";

const defaultPlugins = [
  ParagraphPlugin.withComponent(ParagraphElement),
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
  H1Plugin.withComponent(H1Element),
  H2Plugin.withComponent(H2Element),
  H3Plugin.withComponent(H3Element),
  BlockquotePlugin.withComponent(BlockquoteElement),
  CodeBlockPlugin.withComponent(CodeBlockElement),
  CodeLinePlugin.withComponent(CodeLineElement),
  LinkPlugin.configure({ render: { node: LinkElement } }),
  ListPlugin,
  TrailingBlockPlugin,
  MarkdownPlugin.configure({
    options: {
      remarkPlugins: [remarkGfm, remarkMdx as any, remarkMention],
    },
  }),
];

function basicMarkdownToValue(markdown: string): Value {
  if (!markdown) return [{ children: [{ text: "" }], type: "p" }];

  return markdown.split("\n").map((line) => {
    if (line.startsWith("# ")) return { children: [{ text: line.slice(2) }], type: "h1" };
    if (line.startsWith("## ")) return { children: [{ text: line.slice(3) }], type: "h2" };
    if (line.startsWith("### ")) return { children: [{ text: line.slice(4) }], type: "h3" };
    if (line.startsWith("> "))
      return {
        children: [{ children: [{ text: line.slice(2) }], type: "p" }],
        type: "blockquote",
      };
    if (line.startsWith("- "))
      return {
        children: [{ text: line.slice(2) }],
        type: "p",
        listStyleType: "disc",
        indent: 1,
      };
    return { children: [{ text: line }], type: "p" };
  });
}

export function PlateEditor({
  value,
  onChange,
  placeholder = "Начните писать...",
  className,
  height = 500,
}: PlateEditorProps) {
  const [mode, setMode] = React.useState<EditorMode>("split");

  const editor = usePlateEditor({
    plugins: defaultPlugins,
    value: basicMarkdownToValue(value),
  });

  const handleEditorChange = React.useCallback(
    ({ value: newValue }: { value: Value }) => {
      try {
        const api = editor.getApi(MarkdownPlugin);
        const markdown = api.markdown.serialize({ value: newValue });
        onChange(markdown);
      } catch {
        const plain = newValue
          .map((node: any) => {
            if (node.children) {
              return node.children.map((child: any) => child.text || "").join("");
            }
            return "";
          })
          .join("\n");
        onChange(plain);
      }
    },
    [editor, onChange]
  );

  const showEditor = mode === "write" || mode === "split";
  const showPreview = mode === "preview" || mode === "split";

  return (
    <div className={cn("plate-editor space-y-3", className)}>
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 dark:border-white/10 dark:bg-white/[0.03]">
        <Plate editor={editor} onChange={handleEditorChange}>
          {showEditor && (
            <FixedToolbar className="flex flex-wrap items-center gap-1 rounded-t-lg border-b border-b-border bg-background/95 p-1 backdrop-blur-sm">
              <div className="flex items-center gap-0.5">
                <MarkToolbarButton nodeType="bold" tooltip="Жирный" aria-label="Жирный">
                  <Bold className="h-4 w-4" />
                </MarkToolbarButton>
                <MarkToolbarButton nodeType="italic" tooltip="Курсив" aria-label="Курсив">
                  <Italic className="h-4 w-4" />
                </MarkToolbarButton>
                <MarkToolbarButton
                  nodeType="underline"
                  tooltip="Подчёркнутый"
                  aria-label="Подчёркнутый"
                >
                  <Underline className="h-4 w-4" />
                </MarkToolbarButton>
                <MarkToolbarButton
                  nodeType="strikethrough"
                  tooltip="Зачёркнутый"
                  aria-label="Зачёркнутый"
                >
                  <Strikethrough className="h-4 w-4" />
                </MarkToolbarButton>
              </div>

              <Separator orientation="vertical" className="mx-1 h-5" />

              <div className="flex items-center gap-0.5">
                <ToolbarButton
                  tooltip="Заголовок 1"
                  aria-label="Заголовок 1"
                  onClick={() => editor.tf.h1.toggle()}
                >
                  <Heading1 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  tooltip="Заголовок 2"
                  aria-label="Заголовок 2"
                  onClick={() => editor.tf.h2.toggle()}
                >
                  <Heading2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  tooltip="Заголовок 3"
                  aria-label="Заголовок 3"
                  onClick={() => editor.tf.h3.toggle()}
                >
                  <Heading3 className="h-4 w-4" />
                </ToolbarButton>
              </div>

              <Separator orientation="vertical" className="mx-1 h-5" />

              <div className="flex items-center gap-0.5">
                <ToolbarButton
                  tooltip="Цитата"
                  aria-label="Цитата"
                  onClick={() => editor.tf.blockquote.toggle()}
                >
                  <Quote className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  tooltip="Маркированный список"
                  aria-label="Маркированный список"
                  onClick={() => toggleList(editor, { listStyleType: ListStyleType.Disc })}
                >
                  <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  tooltip="Нумерованный список"
                  aria-label="Нумерованный список"
                  onClick={() => toggleList(editor, { listStyleType: ListStyleType.Decimal })}
                >
                  <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
              </div>

              <Separator orientation="vertical" className="mx-1 h-5" />

              <div className="flex items-center gap-0.5">
                <ToolbarButton
                  tooltip="Блок кода"
                  aria-label="Блок кода"
                  onClick={() => insertCodeBlock(editor, { select: true })}
                >
                  <Code2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  tooltip="Ссылка"
                  aria-label="Ссылка"
                  onClick={() => {
                    const url = prompt("Введите URL ссылки:");
                    if (url) {
                      editor.tf.insertNodes({
                        type: "a",
                        url,
                        children: [{ text: url }],
                      } as any);
                    }
                  }}
                >
                  <Link2 className="h-4 w-4" />
                </ToolbarButton>
              </div>
            </FixedToolbar>
          )}

          {showEditor && (
            <EditorContainer className="rounded-b-lg border border-t-0 border-border/70 bg-background">
              <Editor
                variant="none"
                placeholder={placeholder}
                className="min-h-[420px] px-4 py-3 text-left text-sm"
                style={{ minHeight: `${Math.max(320, height - 40)}px` }}
              />
            </EditorContainer>
          )}
        </Plate>

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
        <p className="text-xs text-muted-foreground">
          Для изображений используйте обычный Markdown-синтаксис со ссылкой на внешний URL.
        </p>
      </div>
    </div>
  );
}
