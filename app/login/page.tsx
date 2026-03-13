"use client";

import { Eye, EyeOff, Github } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AuthOAuthDebugPanel } from "@/components/auth-oauth-debug-panel";
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
import {
  clearOAuthDebugState,
  createOAuthDebugState,
  finalizeOAuthDebugError,
  finalizeOAuthDebugSuccess,
  getSafeOAuthDebugRedirect,
  OAUTH_DEBUG_FINAL_REDIRECT_DELAY_MS,
  OAUTH_DEBUG_QUERY_FLAG,
  OAUTH_DEBUG_QUERY_FLOW,
  OAUTH_DEBUG_QUERY_MESSAGE,
  OAUTH_DEBUG_QUERY_PROVIDER,
  OAUTH_DEBUG_QUERY_STATUS,
  OAUTH_DEBUG_QUERY_STEP,
  OAUTH_DEBUG_REDIRECT_TIMEOUT_MS,
  type OAuthDebugProvider,
  type OAuthDebugState,
  parseOAuthDebugPayload,
  readOAuthDebugState,
  setOAuthDebugProviderUrl,
  setOAuthDebugStatus,
  setOAuthDebugStep,
  writeOAuthDebugState,
} from "@/lib/oauth-debug";
import { buildPostLoginRedirectPath } from "@/lib/post-auth-redirect";
import { getOAuthRedirectUrl } from "@/lib/supabase-auth";
import { getSupabaseErrorMessage } from "@/lib/supabase-error-handler";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [oauthDebugState, setOAuthDebugState] = useState<OAuthDebugState | null>(null);
  const { signIn, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectProbeRef = useRef<number | null>(null);
  const finalRedirectRef = useRef<number | null>(null);
  const oauthDebugPayload = parseOAuthDebugPayload(searchParams);

  const getPostLoginPath = () => {
    const params = new URLSearchParams(searchParams.toString());

    [
      OAUTH_DEBUG_QUERY_FLAG,
      OAUTH_DEBUG_QUERY_FLOW,
      OAUTH_DEBUG_QUERY_PROVIDER,
      OAUTH_DEBUG_QUERY_STATUS,
      OAUTH_DEBUG_QUERY_STEP,
      OAUTH_DEBUG_QUERY_MESSAGE,
    ].forEach((key) => params.delete(key));

    return buildPostLoginRedirectPath(params, "/");
  };

  const persistOAuthDebugState = (nextState: OAuthDebugState | null) => {
    setOAuthDebugState(nextState);

    if (nextState) {
      writeOAuthDebugState(nextState);
      return;
    }

    clearOAuthDebugState();
  };

  const updateOAuthDebugState = (
    updater: (current: OAuthDebugState | null) => OAuthDebugState | null
  ) => {
    setOAuthDebugState((current) => {
      const nextState = updater(current);

      if (nextState) {
        writeOAuthDebugState(nextState);
      } else {
        clearOAuthDebugState();
      }

      return nextState;
    });
  };

  useEffect(() => {
    if (!authLoading && user && !oauthDebugPayload.enabled) {
      router.replace(getPostLoginPath());
    }
  }, [user, authLoading, oauthDebugPayload.enabled, router, searchParams]);

  useEffect(() => {
    const storedState = readOAuthDebugState();

    if (!oauthDebugPayload.enabled) {
      setOAuthDebugState(storedState);
      return;
    }

    let nextState = storedState;

    if (!nextState || nextState.flowId !== oauthDebugPayload.flowId) {
      if (!oauthDebugPayload.flowId || !oauthDebugPayload.provider) {
        persistOAuthDebugState(storedState);
        return;
      }

      nextState = createOAuthDebugState({
        flowId: oauthDebugPayload.flowId,
        provider: oauthDebugPayload.provider,
        redirectTo: oauthDebugPayload.redirectTo,
        callbackUrl: `${window.location.origin}/auth/callback`,
      });
    }

    nextState = setOAuthDebugStep(
      nextState,
      "callback_reached",
      oauthDebugPayload.step === "callback_reached" && oauthDebugPayload.status === "error"
        ? "error"
        : "success",
      oauthDebugPayload.status === "error" && oauthDebugPayload.step === "callback_reached"
        ? oauthDebugPayload.message || "Callback вернулся с ошибкой."
        : "Приложение снова открыло страницу /login после callback."
    );

    if (oauthDebugPayload.status === "success") {
      nextState = setOAuthDebugStep(
        nextState,
        "code_exchanged",
        "success",
        "Supabase обменял OAuth code на сессию."
      );
      nextState = setOAuthDebugStep(
        nextState,
        "profile_checked",
        "success",
        "Профиль пользователя найден или успешно подготовлен."
      );
      nextState = setOAuthDebugStep(
        nextState,
        "final_redirect_ready",
        "success",
        oauthDebugPayload.message || "Последний чек получен, можно делать главный редирект."
      );
      nextState = finalizeOAuthDebugSuccess(
        nextState,
        oauthDebugPayload.message ||
          "Последний чек получен. После отображения панели выполним главный редирект."
      );
    } else if (oauthDebugPayload.status === "error") {
      nextState =
        oauthDebugPayload.step && oauthDebugPayload.step !== "callback_reached"
          ? finalizeOAuthDebugError(
              setOAuthDebugStep(
                nextState,
                "callback_reached",
                "success",
                "Callback достиг приложения, ошибка произошла на следующем шаге."
              ),
              oauthDebugPayload.step,
              oauthDebugPayload.message || "OAuth flow завершился с ошибкой."
            )
          : finalizeOAuthDebugError(
              nextState,
              "callback_reached",
              oauthDebugPayload.message || "OAuth flow завершился с ошибкой."
            );
    }

    persistOAuthDebugState(nextState);
  }, [
    oauthDebugPayload.enabled,
    oauthDebugPayload.flowId,
    oauthDebugPayload.message,
    oauthDebugPayload.provider,
    oauthDebugPayload.redirectTo,
    oauthDebugPayload.status,
    oauthDebugPayload.step,
  ]);

  useEffect(() => {
    if (finalRedirectRef.current) {
      window.clearTimeout(finalRedirectRef.current);
      finalRedirectRef.current = null;
    }

    if (
      !user ||
      authLoading ||
      !oauthDebugPayload.enabled ||
      oauthDebugState?.status !== "success"
    ) {
      return;
    }

    finalRedirectRef.current = window.setTimeout(() => {
      const redirectTarget = getSafeOAuthDebugRedirect(
        oauthDebugState?.redirectTo || oauthDebugPayload.redirectTo
      );
      persistOAuthDebugState(null);
      router.replace(redirectTarget);
    }, OAUTH_DEBUG_FINAL_REDIRECT_DELAY_MS);

    return () => {
      if (finalRedirectRef.current) {
        window.clearTimeout(finalRedirectRef.current);
        finalRedirectRef.current = null;
      }
    };
  }, [
    authLoading,
    oauthDebugPayload.enabled,
    oauthDebugPayload.redirectTo,
    oauthDebugState,
    router,
    user,
  ]);

  useEffect(() => {
    return () => {
      if (redirectProbeRef.current) {
        window.clearTimeout(redirectProbeRef.current);
      }

      if (finalRedirectRef.current) {
        window.clearTimeout(finalRedirectRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    persistOAuthDebugState(null);
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        console.error("Login error:", error);
        const errorMessage = getSupabaseErrorMessage(error);
        setFormError(errorMessage);
        setIsLoading(false);
        return;
      }

      toast.success("Успешный вход", {
        description: "Вы успешно вошли в систему",
      });

      router.replace(getPostLoginPath());
    } catch (error) {
      console.error("Unexpected login error:", error);
      const errorMessage = getSupabaseErrorMessage(error as any);
      setFormError(errorMessage);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: OAuthDebugProvider) => {
    setFormError(null);
    if (redirectProbeRef.current) {
      window.clearTimeout(redirectProbeRef.current);
      redirectProbeRef.current = null;
    }

    if (provider === "google") {
      setIsGoogleLoading(true);
    } else {
      setIsGithubLoading(true);
    }

    const redirectTo = getSafeOAuthDebugRedirect(searchParams.get("redirect"));
    const flowId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${provider}-${Date.now()}`;

    let debugState = setOAuthDebugStatus(
      setOAuthDebugStep(
        createOAuthDebugState({
          flowId,
          provider,
          redirectTo,
          callbackUrl: `${window.location.origin}/auth/callback`,
        }),
        "start_requested",
        "success",
        `Кнопка ${provider === "github" ? "GitHub" : "Google"} нажата, начинаем OAuth flow.`
      ),
      "running",
      "Запрашиваем OAuth URL у Supabase..."
    );

    persistOAuthDebugState(debugState);

    try {
      const { error, url, callbackUrl } = await getOAuthRedirectUrl(provider, redirectTo, {
        flowId,
        debug: true,
      });

      if (error) {
        console.error(`${provider} sign in error:`, error);
        const errorMessage = getSupabaseErrorMessage(error);
        setFormError(errorMessage);
        persistOAuthDebugState(
          finalizeOAuthDebugError(
            {
              ...debugState,
              callbackUrl,
            },
            "provider_url_ready",
            errorMessage
          )
        );
        if (provider === "google") {
          setIsGoogleLoading(false);
        } else {
          setIsGithubLoading(false);
        }
        return;
      }

      if (!url) {
        const errorMessage = "Supabase не вернул URL OAuth провайдера.";
        setFormError(errorMessage);
        persistOAuthDebugState(
          finalizeOAuthDebugError(
            {
              ...debugState,
              callbackUrl,
            },
            "provider_url_ready",
            errorMessage
          )
        );
        if (provider === "google") {
          setIsGoogleLoading(false);
        } else {
          setIsGithubLoading(false);
        }
        return;
      }

      debugState = setOAuthDebugStatus(
        setOAuthDebugStep(
          setOAuthDebugProviderUrl(
            {
              ...debugState,
              callbackUrl,
            },
            url
          ),
          "provider_url_ready",
          "success",
          "Supabase вернул URL GitHub/Google для внешней авторизации."
        ),
        "running",
        "Пробуем передать браузеру переход на провайдера..."
      );
      debugState = setOAuthDebugStep(
        debugState,
        "redirect_triggered",
        "success",
        "Команда перехода отправлена браузеру."
      );
      persistOAuthDebugState(debugState);

      redirectProbeRef.current = window.setTimeout(() => {
        updateOAuthDebugState((current) => {
          if (!current || current.flowId !== flowId || current.status === "success") {
            return current;
          }

          return finalizeOAuthDebugError(
            current,
            "redirect_triggered",
            "Браузер остался на странице. Возможна блокировка перехода на GitHub/Google политикой браузера, расширением или сетевым фильтром."
          );
        });

        if (provider === "google") {
          setIsGoogleLoading(false);
        } else {
          setIsGithubLoading(false);
        }
      }, OAUTH_DEBUG_REDIRECT_TIMEOUT_MS);

      window.location.assign(url);
    } catch (error) {
      console.error(`Unexpected ${provider} sign in error:`, error);
      const errorMessage = getSupabaseErrorMessage(error as any);
      setFormError(errorMessage);
      persistOAuthDebugState(
        finalizeOAuthDebugError(debugState, "provider_url_ready", errorMessage)
      );
      if (provider === "google") {
        setIsGoogleLoading(false);
      } else {
        setIsGithubLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    await handleOAuthSignIn("google");
  };

  const handleGithubSignIn = async () => {
    await handleOAuthSignIn("github");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card className="w-full max-w-md lg:max-w-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Вход в AI News</CardTitle>
              <CardDescription className="text-center">
                Войдите в свой аккаунт для продолжения
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {authLoading ? (
                  <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                    Проверяем текущую сессию и подготавливаем состояние авторизации...
                  </div>
                ) : null}

                {formError && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                    {formError}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email">Email</Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      Забыли пароль?
                    </Link>
                  </div>
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
                  <Label htmlFor="password">Пароль</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Введите пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button className="w-full" type="submit" disabled={isLoading || authLoading}>
                  {isLoading ? "Вход..." : "Войти с Email"}
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
                  disabled={isGithubLoading || authLoading}
                  className="w-full"
                >
                  <Github className="mr-2 h-4 w-4" />
                  {isGithubLoading ? "Подготавливаем GitHub..." : "Продолжить с GitHub"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || authLoading}
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
                  {isGoogleLoading ? "Подготавливаем Google..." : "Продолжить с Google"}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Нет аккаунта?{" "}
                  <Link href="/register" className="text-primary hover:underline">
                    Зарегистрироваться
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>

          <div className="w-full max-w-md lg:max-w-none">
            <AuthOAuthDebugPanel state={oauthDebugState} isAuthenticated={!!user} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
