import assert from "node:assert/strict";
import test, { describe } from "node:test";
import {
  buildPostAuthRedirect,
  buildPostLoginRedirectPath,
  resolvePostAuthRedirect,
} from "./post-auth-redirect";

describe("post-auth redirect helpers", () => {
  test("buildPostAuthRedirect preserves query string for protected routes", () => {
    assert.equal(buildPostAuthRedirect("/posts/123", "?tab=seo"), "/posts/123?tab=seo");
  });

  test("buildPostAuthRedirect rejects auth routes", () => {
    assert.equal(buildPostAuthRedirect("/login", "?redirect=/posts/123"), null);
  });

  test("resolvePostAuthRedirect prefers cookie value over query value", () => {
    assert.equal(resolvePostAuthRedirect("/posts/1?tab=full", "/archive"), "/posts/1?tab=full");
  });

  test("resolvePostAuthRedirect falls back to safe query redirect", () => {
    assert.equal(resolvePostAuthRedirect(null, "/archive?filter=ai"), "/archive?filter=ai");
  });

  test("resolvePostAuthRedirect rejects unsafe redirect values", () => {
    assert.equal(resolvePostAuthRedirect("https://evil.example", "//evil.example"), null);
  });

  test("buildPostLoginRedirectPath preserves non-redirect query params", () => {
    const searchParams = new URLSearchParams("redirect=/posts/5?tab=notes&error=oauth");

    assert.equal(
      buildPostLoginRedirectPath(searchParams),
      "/auth/post-login?redirect=%2Fposts%2F5%3Ftab%3Dnotes&error=oauth"
    );
  });

  test("buildPostLoginRedirectPath drops invalid redirect params", () => {
    const searchParams = new URLSearchParams("redirect=https://evil.example&error=oauth");

    assert.equal(buildPostLoginRedirectPath(searchParams), "/auth/post-login?error=oauth");
  });
});
