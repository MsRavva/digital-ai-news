"use client";

import MarkdownIt from "markdown-it";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Динамический импорт для SSR
const MdEditor = dynamic(() => import("react-markdown-editor-lite"), { ssr: false });

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
}

// Инициализация markdown парсера
const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true, // Обрабатывать одинарные переносы строк как <br>
});

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Начните писать в формате Markdown...",
  className,
  height = 500,
}: MarkdownEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("rounded-lg border bg-background", className)}>
        <div className="min-h-[400px] px-4 py-3 text-muted-foreground flex items-center justify-center">
          Загрузка редактора...
        </div>
      </div>
    );
  }

  const handleEditorChange = ({ text }: { text: string; html: string }) => {
    onChange(text);
  };

  return (
    <div className={cn("markdown-editor", className)}>
      <MdEditor
        value={value}
        style={{ height: `${height}px` }}
        renderHTML={(text) => mdParser.render(text)}
        onChange={handleEditorChange}
        placeholder={placeholder}
        view={{ menu: true, md: true, html: true }}
        canView={{
          menu: true,
          md: false,
          html: false,
          both: true,
          fullScreen: false,
          hideMenu: false,
        }}
      />
    </div>
  );
}
