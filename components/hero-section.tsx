"use client";

import { Grid2X2, Search, Table, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextEffect } from "@/components/ui/text-effect";
import { useAuth } from "@/context/auth-context-supabase";
import {
  getCategoryFromCookie,
  getCategoryFromProfile,
  getCategoryFromSession,
  getViewModeFromCookie,
  getViewModeFromProfile,
  getViewModeFromSession,
  saveCategoryToCookie,
  saveCategoryToProfile,
  saveCategoryToSession,
  saveViewModeToCookie,
  saveViewModeToProfile,
  saveViewModeToSession,
} from "@/lib/category-storage";
import { HeroHeader } from "./header";
import { PostsBentoGrid } from "./posts-bento-grid";
import { PostsDataTable } from "./posts-data-table";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export default function HeroSection() {
  const [viewMode, setViewMode] = useState<"table" | "bento">("table");
  // Инициализируем категорию синхронно из sessionStorage или localStorage
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const sessionCategory = getCategoryFromSession();
      if (sessionCategory) return sessionCategory;
      const localCategory = localStorage.getItem("selectedCategory");
      if (localCategory) return localCategory;
      const cookieCategory = getCategoryFromCookie();
      if (cookieCategory) return cookieCategory;
    }
    return "all";
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const { user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Редирект на /login если не авторизован
  useEffect(() => {
    if (!authLoading && !user) {
      // Используем replace вместо push, чтобы не добавлять в историю
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Инициализация на клиенте после монтирования
  useEffect(() => {
    setIsMounted(true);

    // Инициализация режима просмотра
    const initializeViewMode = async () => {
      let viewModeToSet: "table" | "bento" = "table";

      // Приоритет: sessionStorage > localStorage > cookie > профиль
      const sessionView = getViewModeFromSession();
      if (sessionView) {
        viewModeToSet = sessionView;
      } else {
        const localView = localStorage.getItem("viewMode") as "table" | "bento" | null;
        if (localView && (localView === "table" || localView === "bento")) {
          viewModeToSet = localView;
        } else {
          const cookieView = getViewModeFromCookie();
          if (cookieView) {
            viewModeToSet = cookieView;
          } else if (user) {
            const profileView = await getViewModeFromProfile(user.id);
            if (profileView) {
              viewModeToSet = profileView;
              saveViewModeToCookie(viewModeToSet);
              localStorage.setItem("viewMode", viewModeToSet);
            }
          }
        }
      }

      setViewMode(viewModeToSet);
      // Сохраняем во все хранилища
      saveViewModeToSession(viewModeToSet);
      localStorage.setItem("viewMode", viewModeToSet);
      saveViewModeToCookie(viewModeToSet);
      if (user) {
        saveViewModeToProfile(user.id, viewModeToSet).catch(console.error);
      }
    };

    // Инициализация категории (обновление из профиля, если нужно)
    const initializeCategory = async () => {
      // Если категория уже установлена из sessionStorage/localStorage/cookie, используем её
      // Иначе пытаемся загрузить из профиля
      if (selectedCategory === "all" && user && profile) {
        const profileCategory = await getCategoryFromProfile(user.id);
        if (profileCategory && profileCategory !== "all") {
          setSelectedCategory(profileCategory);
          // Сохраняем во все хранилища
          saveCategoryToSession(profileCategory);
          localStorage.setItem("selectedCategory", profileCategory);
          saveCategoryToCookie(profileCategory);
        }
      } else {
        // Сохраняем текущую категорию во все хранилища для согласованности
        saveCategoryToSession(selectedCategory);
        localStorage.setItem("selectedCategory", selectedCategory);
        saveCategoryToCookie(selectedCategory);
        if (user) {
          saveCategoryToProfile(user.id, selectedCategory).catch(console.error);
        }
      }
    };

    initializeViewMode();
    initializeCategory();
  }, [user, profile]);

  // Сохранение категории при изменении
  useEffect(() => {
    if (selectedCategory && isMounted && typeof window !== "undefined") {
      // Сохраняем в sessionStorage (приоритет для текущей сессии)
      saveCategoryToSession(selectedCategory);
      // Сохраняем в localStorage
      localStorage.setItem("selectedCategory", selectedCategory);
      // Сохраняем в cookie
      saveCategoryToCookie(selectedCategory);
      // Сохраняем в профиль пользователя (Firestore)
      if (user) {
        saveCategoryToProfile(user.id, selectedCategory).catch((error) => {
          console.error("Error saving category to profile:", error);
        });
      }
    }
  }, [selectedCategory, user, isMounted]);

  // Сохранение режима просмотра при изменении
  useEffect(() => {
    if (isMounted && typeof window !== "undefined") {
      // Сохраняем в sessionStorage (приоритет для текущей сессии)
      saveViewModeToSession(viewMode);
      // Сохраняем в localStorage
      localStorage.setItem("viewMode", viewMode);
      // Сохраняем в cookie
      saveViewModeToCookie(viewMode);
      // Сохраняем в профиль пользователя (Firestore)
      if (user) {
        saveViewModeToProfile(user.id, viewMode).catch((error) => {
          console.error("Error saving viewMode to profile:", error);
        });
      }
    }
  }, [viewMode, user, isMounted]);

  const handleViewChange = (mode: "table" | "bento") => {
    setViewMode(mode);
  };

  // Показываем загрузку пока проверяем авторизацию
  // Защита маршрутов обрабатывается в proxy.ts
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  // Если не авторизован, показываем загрузку (редирект произойдет через useEffect)
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Перенаправление...</div>
      </div>
    );
  }

  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden">
        <section>
          <div className="relative pt-12">
            <div className="relative z-10 mx-auto w-[90%] px-6">
              <div className="sm:mx-auto lg:mr-auto lg:mt-0">
                <div className="mt-8 flex items-center justify-between gap-4 lg:mt-16">
                  <TextEffect
                    preset="fade-in-blur"
                    speedSegment={0.3}
                    as="h1"
                    className="flex-1 text-balance text-5xl font-medium md:text-6xl"
                  >
                    Вайб-кодинг с AI News
                  </TextEffect>
                  <div className="flex-shrink-0">
                    <Button asChild size="lg" className="rounded-xl px-5 text-base">
                      <Link href="/create">
                        <span className="text-nowrap">Создать публикацию</span>
                      </Link>
                    </Button>
                  </div>
                </div>
                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.5}
                  as="p"
                  className="mt-8 max-w-2xl text-pretty text-lg"
                >
                  Актуальные новости, инструкции и идеи для ваших проектов.
                </TextEffect>
              </div>
            </div>
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}
            >
              <div className="relative mt-6 sm:mt-8 md:mt-10">
                <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto w-[90%] overflow-hidden rounded-2xl border p-6 shadow-lg shadow-zinc-950/15 ring-1">
                  <div className="mb-4 flex flex-col gap-4">
                    {viewMode === "table" ? (
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Дропдаун для мобильных и планшетов */}
                        {isMounted ? (
                          <div className="lg:hidden flex-1">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                              <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Выберите категорию" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Все категории</SelectItem>
                                <SelectItem value="news">Новости</SelectItem>
                                <SelectItem value="materials">Учебные материалы</SelectItem>
                                <SelectItem value="project-ideas">Идеи проектов</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="lg:hidden flex-1 h-9 w-full sm:w-[200px] bg-muted animate-pulse rounded-md" />
                        )}
                        {/* Табы для десктопа */}
                        {isMounted ? (
                          <div className="hidden lg:block">
                            <Tabs
                              value={selectedCategory}
                              onValueChange={setSelectedCategory}
                              className="w-auto"
                            >
                              <TabsList className="bg-muted dark:bg-muted rounded-lg p-1 h-10 flex items-center w-auto shadow-sm">
                                <TabsTrigger
                                  value="all"
                                  className="px-4 py-1.5 text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-background rounded-sm transition-all duration-200 hover:text-foreground hover:bg-background/50 hover:scale-105 active:scale-95"
                                >
                                  Все категории
                                </TabsTrigger>
                                <TabsTrigger
                                  value="news"
                                  className="px-4 py-1.5 text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-background rounded-sm transition-all duration-200 hover:text-foreground hover:bg-background/50 hover:scale-105 active:scale-95"
                                >
                                  Новости
                                </TabsTrigger>
                                <TabsTrigger
                                  value="materials"
                                  className="px-4 py-1.5 text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-background rounded-sm transition-all duration-200 hover:text-foreground hover:bg-background/50 hover:scale-105 active:scale-95"
                                >
                                  Учебные материалы
                                </TabsTrigger>
                                <TabsTrigger
                                  value="project-ideas"
                                  className="px-4 py-1.5 text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-background rounded-sm transition-all duration-200 hover:text-foreground hover:bg-background/50 hover:scale-105 active:scale-95"
                                >
                                  Идеи проектов
                                </TabsTrigger>
                              </TabsList>
                            </Tabs>
                          </div>
                        ) : (
                          <div className="hidden lg:block h-10 w-64 bg-muted animate-pulse rounded-lg" />
                        )}
                        <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:justify-end">
                          <div className="relative flex-1 sm:flex-initial sm:w-64">
                            <Input
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-9 pr-9"
                              placeholder=""
                            />
                            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 left-0 flex items-center gap-2 pl-3">
                              <Search size={16} />
                              {!searchQuery && <span className="text-sm">Поиск</span>}
                            </div>
                            {searchQuery && (
                              <button
                                onClick={() => setSearchQuery("")}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Очистить поиск"
                              >
                                <X size={16} className="cursor-pointer" />
                              </button>
                            )}
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleViewChange("table")}
                            className="flex items-center gap-2"
                          >
                            <Table className="h-4 w-4" />
                            <span className="hidden lg:inline">Таблица</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewChange("bento")}
                            className="flex items-center gap-2"
                          >
                            <Grid2X2 className="h-4 w-4" />
                            <span className="hidden lg:inline">Bento Grid</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Дропдаун для мобильных и планшетов */}
                        {isMounted ? (
                          <div className="lg:hidden">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                              <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Выберите категорию" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Все категории</SelectItem>
                                <SelectItem value="news">Новости</SelectItem>
                                <SelectItem value="materials">Учебные материалы</SelectItem>
                                <SelectItem value="project-ideas">Идеи проектов</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="lg:hidden h-9 w-full sm:w-[200px] bg-muted animate-pulse rounded-md" />
                        )}
                        {/* Табы для десктопа */}
                        {isMounted ? (
                          <div className="hidden lg:block">
                            <Tabs
                              value={selectedCategory}
                              onValueChange={setSelectedCategory}
                              className="w-auto"
                            >
                              <TabsList className="bg-muted dark:bg-muted rounded-lg p-1 h-10 flex items-center w-auto shadow-sm">
                                <TabsTrigger
                                  value="all"
                                  className="px-4 py-1.5 text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-background rounded-sm transition-all duration-200 hover:text-foreground hover:bg-background/50 hover:scale-105 active:scale-95"
                                >
                                  Все категории
                                </TabsTrigger>
                                <TabsTrigger
                                  value="news"
                                  className="px-4 py-1.5 text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-background rounded-sm transition-all duration-200 hover:text-foreground hover:bg-background/50 hover:scale-105 active:scale-95"
                                >
                                  Новости
                                </TabsTrigger>
                                <TabsTrigger
                                  value="materials"
                                  className="px-4 py-1.5 text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-background rounded-sm transition-all duration-200 hover:text-foreground hover:bg-background/50 hover:scale-105 active:scale-95"
                                >
                                  Учебные материалы
                                </TabsTrigger>
                                <TabsTrigger
                                  value="project-ideas"
                                  className="px-4 py-1.5 text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-background rounded-sm transition-all duration-200 hover:text-foreground hover:bg-background/50 hover:scale-105 active:scale-95"
                                >
                                  Идеи проектов
                                </TabsTrigger>
                              </TabsList>
                            </Tabs>
                          </div>
                        ) : (
                          <div className="hidden lg:block h-10 w-64 bg-muted animate-pulse rounded-lg" />
                        )}
                        <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:justify-end">
                          <div className="relative flex-1 sm:flex-initial sm:w-64">
                            <Input
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-9 pr-9"
                              placeholder=""
                            />
                            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 left-0 flex items-center gap-2 pl-3">
                              <Search size={16} />
                              {!searchQuery && <span className="text-sm">Поиск</span>}
                            </div>
                            {searchQuery && (
                              <button
                                onClick={() => setSearchQuery("")}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Очистить поиск"
                              >
                                <X size={16} className="cursor-pointer" />
                              </button>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewChange("table")}
                            className="flex items-center gap-2"
                          >
                            <Table className="h-4 w-4" />
                            <span className="hidden lg:inline">Таблица</span>
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleViewChange("bento")}
                            className="flex items-center gap-2"
                          >
                            <Grid2X2 className="h-4 w-4" />
                            <span className="hidden lg:inline">Bento Grid</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  {viewMode === "table" ? (
                    <PostsDataTable
                      category={selectedCategory}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                    />
                  ) : (
                    <div className="w-full">
                      <PostsBentoGrid
                        category={selectedCategory}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                      />
                    </div>
                  )}
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
        <section className="bg-background pb-8 pt-8 md:pb-16">
          <div className="group relative m-auto w-full px-6">
            <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
              <span className="text-sm">Используй сам и посоветуй другу</span>
            </div>
            <div className="group-hover:blur-xs mx-auto mt-12 flex w-full items-center justify-center gap-6 transition-all duration-500 group-hover:opacity-50 sm:gap-8">
              <div className="flex items-center justify-center">
                <img
                  className="h-10 w-fit dark:invert"
                  src="/next-js-icon-seeklogo.svg"
                  alt="Next.js Logo"
                  height="40"
                  width="auto"
                />
              </div>
              <div className="flex items-center justify-center">
                <img
                  className="h-10 w-fit dark:invert"
                  src="/react-seeklogo.svg"
                  alt="React Logo"
                  height="40"
                  width="auto"
                />
              </div>
              <div className="flex items-center justify-center">
                <img
                  className="h-10 w-fit"
                  src="/tailwind-css-seeklogo.svg"
                  alt="Tailwind CSS Logo"
                  height="40"
                  width="auto"
                />
              </div>
              <div className="flex items-center justify-center">
                <img
                  className="h-8 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/github.svg"
                  alt="GitHub Logo"
                  height="32"
                  width="auto"
                />
              </div>
              <div className="flex items-center justify-center">
                <img
                  className="h-10 w-fit dark:invert"
                  src="/shadcn-ui-seeklogo.svg"
                  alt="shadcn/ui Logo"
                  height="40"
                  width="auto"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
