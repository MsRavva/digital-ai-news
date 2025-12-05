"use client";
import { Menu, X } from "lucide-react";
import { useScroll } from "motion/react";
import Link from "next/link";
import { useTheme } from "next-themes";
import React from "react";
import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import { useAuth } from "@/context/auth-context-supabase";
import {
  getThemeFromCookie,
  getThemeFromProfile,
  getThemeFromSession,
  saveThemeToCookie,
  saveThemeToProfile,
  saveThemeToSession,
} from "@/lib/category-storage";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Главная", href: "/" },
  { name: "Архив", href: "/archive" },
];

export const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const { user, profile } = useAuth();

  const { scrollYProgress } = useScroll();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Инициализация темы из всех хранилищ (только один раз при монтировании)
  React.useEffect(() => {
    if (!isMounted || !theme) return;

    const initializeTheme = async () => {
      // next-themes уже использует localStorage с ключом "theme"
      // Приоритет: sessionStorage > localStorage (next-themes) > cookie > профиль
      let themeToSet: "light" | "dark" | "system" | null = null;

      const sessionTheme = getThemeFromSession();
      if (sessionTheme) {
        themeToSet = sessionTheme;
      } else {
        // Проверяем localStorage next-themes
        const localTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
        if (
          localTheme &&
          (localTheme === "light" || localTheme === "dark" || localTheme === "system")
        ) {
          themeToSet = localTheme;
        } else {
          const cookieTheme = getThemeFromCookie();
          if (cookieTheme) {
            themeToSet = cookieTheme;
          } else if (user?.id) {
            const profileTheme = await getThemeFromProfile(user.id);
            if (profileTheme) {
              themeToSet = profileTheme;
            }
          }
        }
      }

      // Устанавливаем тему только если она найдена и отличается от текущей
      if (themeToSet && themeToSet !== theme) {
        setTheme(themeToSet);
      } else if (themeToSet) {
        // Сохраняем во все хранилища даже если тема уже установлена
        saveThemeToSession(themeToSet);
        saveThemeToCookie(themeToSet);
        if (user?.id) {
          saveThemeToProfile(user.id, themeToSet).catch(console.error);
        }
      }
    };

    // Запускаем инициализацию при монтировании и когда пользователь загрузится
    initializeTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, user?.id]);

  // Сохранение темы при изменении
  React.useEffect(() => {
    if (!isMounted || !theme) return;

    const currentTheme = theme as "light" | "dark" | "system";

    // Сохраняем в sessionStorage (приоритет для текущей сессии)
    saveThemeToSession(currentTheme);
    // Сохраняем в cookie
    saveThemeToCookie(currentTheme);
    // Сохраняем в профиль пользователя (Firestore)
    if (user) {
      saveThemeToProfile(user.id, currentTheme).catch((error) => {
        console.error("Error saving theme to profile:", error);
      });
    }
  }, [theme, user, isMounted]);

  React.useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      setScrolled(latest > 0.05);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className={cn(
          "fixed z-50 w-full border-b transition-colors duration-150",
          scrolled && "bg-background/80 backdrop-blur-xl"
        )}
      >
        <div className="mx-auto w-full px-6 transition-all duration-300">
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
              <Link href="/" aria-label="home" className="flex items-center">
                <Logo />
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>

              <div className="hidden lg:block">
                <ul className="flex gap-8 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-accent-foreground block duration-150"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <div className="lg:hidden">
                <ul className="space-y-6 text-lg">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-accent-foreground block duration-150"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full items-center gap-3 sm:gap-3">
                <ThemeSwitcher
                  defaultValue="system"
                  onChange={(theme) => setTheme(theme)}
                  value={theme as "light" | "dark" | "system"}
                />
                <UserNav />
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
