import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  clearPostAuthRedirectCookie,
  getPostAuthRedirectFromRequest,
} from "@/lib/post-auth-redirect";

export async function GET(request: NextRequest) {
  const redirectTo = getPostAuthRedirectFromRequest(request) || "/";
  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  clearPostAuthRedirectCookie(response);

  return response;
}
