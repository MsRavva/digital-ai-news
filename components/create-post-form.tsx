"use client";

import { Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context-supabase";
import { createPost } from "@/lib/supabase-posts-api";
import { cn } from "@/lib/utils";

export function CreatePostForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("news");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile } = useAuth();
  const router = useRouter();

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Ошибка", {
        description: "Необходимо авторизоваться для создания публикации.",
      });
      return;
    }

    if (!title || !content || !category) {
      toast.error("Ошибка", {
        description: "Заполните все обязательные поля.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const postData = {
        title,
        content,
        category,
        author_id: user.id,
        tags,
      };

      const postId = await createPost(postData);

      if (!postId) {
        throw new Error("Не удалось создать публикацию.");
      }

      toast.success("Успех", {
        description: "Публикация успешно создана.",
      });

      router.push(`/posts/${postId}`);
      router.refresh();
    } catch (err: any) {
      toast.error("Ошибка", {
        description: err.message || "Произошла ошибка при создании публикации.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className={cn(
        "rounded-3xl border-border/50 dark:border-white/[0.1] transition-all duration-300",
        "shadow-[0_2px_15px_rgba(0,0,0,0.08),0_8px_25px_rgba(0,0,0,0.05)]",
        "dark:shadow-[0_2px_20px_rgba(98,51,255,0.12),0_8px_35px_rgba(98,51,255,0.08),0_0_0_1px_rgba(255,255,255,0.03)]",
        "hover:shadow-[0_4px_25px_rgba(0,0,0,0.12),0_12px_40px_rgba(0,0,0,0.08)]",
        "dark:hover:shadow-[0_4px_30px_rgba(98,51,255,0.18),0_12px_50px_rgba(98,51,255,0.12),0_0_0_1px_rgba(255,255,255,0.05)]"
      )}
    >
      <CardHeader>
        <CardTitle>Создание публикации</CardTitle>
        <CardDescription>Создайте новую публикацию для обмена информацией</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="title">Заголовок</Label>
              <Input
                id="title"
                placeholder="Введите заголовок"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="content">Содержание</Label>
              <MarkdownEditor value={content} onChange={(val) => setContent(val)} height={500} />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="category">Категория</Label>
              <Tabs value={category} onValueChange={setCategory} className="w-auto">
                <TabsList className="bg-muted dark:bg-muted rounded-lg p-1 h-10 flex items-center w-auto shadow-sm">
                  <TabsTrigger
                    value="news"
                    className="px-4 py-1.5 text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-background rounded-sm transition-all duration-200"
                  >
                    Новости
                  </TabsTrigger>
                  <TabsTrigger
                    value="materials"
                    className="px-4 py-1.5 text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-background rounded-sm transition-all duration-200"
                  >
                    Учебные материалы
                  </TabsTrigger>
                  <TabsTrigger
                    value="project-ideas"
                    className="px-4 py-1.5 text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-background rounded-sm transition-all duration-200"
                  >
                    Идеи проектов
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="tags">Теги</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Добавьте тег"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Добавить
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => router.push("/")}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Создать публикацию
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
