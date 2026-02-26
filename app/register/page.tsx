"use client";

import { Github } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { getSupabaseErrorMessage } from "@/lib/supabase-error-handler";
import { validateUsername } from "@/lib/validation";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { signUp, signInWithGoogle, signInWithGithub, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Редирект если уже авторизован
  // Редирект если уже авторизован
  useEffect(() => {
    if (!authLoading && user) {
      const redirect = searchParams.get("redirect");
      router.push(redirect && redirect.startsWith("/") ? redirect : "/");
    }
  }, [user, authLoading, router, searchParams]);

  // Проверка имени пользователя при вводе
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);

    // Пропускаем валидацию для пустого значения
    if (!value.trim()) {
      setUsernameError(null);
      return;
    }

    // Проверяем имя пользователя
    const error = validateUsername(value);
    setUsernameError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError("Пароли не совпадают");
      return;
    }

    // Проверка имени пользователя
    const usernameError = validateUsername(username);
    if (usernameError) {
      setFormError(usernameError);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, username, "student");

      if (error) {
        console.error("Registration error:", error);
        const errorMessage = getSupabaseErrorMessage(error);
        setFormError(errorMessage);
        setIsLoading(false);
        return;
      }

      toast.success("Успешная регистрация", {
        description: "Вы успешно зарегистрировались",
      });

      const redirect = searchParams.get("redirect");
      router.push(redirect && redirect.startsWith("/") ? redirect : "/");
    } catch (error) {
      console.error("Unexpected error during registration:", error);
      const errorMessage = getSupabaseErrorMessage(error as any);
      setFormError(errorMessage);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setIsGoogleLoading(true);

    try {
      const { error } = await signInWithGoogle("/");

      if (error) {
        console.error("Google sign in error:", error);
        const errorMessage = getSupabaseErrorMessage(error);
        setFormError(errorMessage);
        setIsGoogleLoading(false);
        return;
      }

      // OAuth редиректит на callback, который обработает вход
    } catch (error) {
      console.error("Unexpected Google sign in error:", error);
      const errorMessage = getSupabaseErrorMessage(error as any);
      setFormError(errorMessage);
      setIsGoogleLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setFormError(null);
    setIsGithubLoading(true);

    try {
      const { error } = await signInWithGithub("/");

      if (error) {
        console.error("GitHub sign in error:", error);
        const errorMessage = getSupabaseErrorMessage(error);
        setFormError(errorMessage);
        setIsGithubLoading(false);
        return;
      }

      // OAuth редиректит на callback, который обработает вход
    } catch (error) {
      console.error("Unexpected GitHub sign in error:", error);
      const errorMessage = getSupabaseErrorMessage(error as any);
      setFormError(errorMessage);
      setIsGithubLoading(false);
    }
  };

  // Показываем загрузку пока проверяем аутентификацию
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  // Не скрываем форму для авторизованных пользователей

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Регистрация в AI News</CardTitle>
            <CardDescription className="text-center">
              Создайте аккаунт для начала работы
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {formError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Имя Фамилия</Label>
                <Input
                  id="username"
                  placeholder="Иван Иванов"
                  value={username}
                  onChange={handleUsernameChange}
                  required
                  className={
                    usernameError
                      ? "border-destructive focus:border-destructive focus:ring-destructive"
                      : ""
                  }
                />
                {usernameError ? (
                  <p className="text-xs text-destructive">{usernameError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Укажите имя и фамилию на русском языке, например: Иван Иванов
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Создайте пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Подтверждение пароля</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Подтвердите пароль"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Регистрация..." : "Зарегистрироваться"}
              </Button>

              <div className="relative my-2 w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    или продолжить через
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGithubSignIn}
                disabled={isGithubLoading}
                className="w-full"
              >
                <Github className="mr-2 h-4 w-4" />
                {isGithubLoading ? "Вход..." : "Продолжить с GitHub"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mr-2"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {isGoogleLoading ? "Вход..." : "Продолжить с Google"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Уже есть аккаунт?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Войти
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
