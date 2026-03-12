const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"] as const;

export function isSafeRelativePath(path: string | null | undefined): path is string {
  if (!path) return false;

  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.startsWith("/\\") &&
    !/^\/\w+:\/\//i.test(path)
  );
}

export function getSafePostAuthRedirect(path: string | null | undefined): string | null {
  if (!isSafeRelativePath(path)) return null;

  const pathname = path.split(/[?#]/, 1)[0];
  const isAuthRoute = AUTH_ROUTES.some(
    (authRoute) => pathname === authRoute || pathname.startsWith(`${authRoute}/`)
  );

  return isAuthRoute ? null : path;
}

export function resolveClientOAuthReturnPath(next?: string): string {
  if (typeof window === "undefined") return "/";

  const url = new URL(window.location.href);
  const redirectFromQuery = url.searchParams.get("redirect");

  const nextRedirect = getSafePostAuthRedirect(next);
  if (nextRedirect) return nextRedirect;

  const queryRedirect = getSafePostAuthRedirect(redirectFromQuery);
  if (queryRedirect) return queryRedirect;

  const currentPathRedirect = getSafePostAuthRedirect(url.pathname);
  if (currentPathRedirect) return currentPathRedirect;

  return "/";
}
