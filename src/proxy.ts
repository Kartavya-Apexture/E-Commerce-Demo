import { NextResponse, type NextRequest } from "next/server";
export function proxy(request: NextRequest) {
  if (process.env.VERCEL === "1" || process.env.BROWSER_DEMO === "1") {
    const target = request.nextUrl.clone();
    target.pathname = "/browser-demo";
    return NextResponse.rewrite(target);
  }
  return NextResponse.next();
}
export const config = {
  matcher: "/((?!_next|images|fonts|icon.svg|favicon.ico|browser-demo).*)",
};
