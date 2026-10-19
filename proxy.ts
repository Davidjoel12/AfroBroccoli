import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Rutas públicas: login, registro por QR y la tarjeta del cliente (/c/AB-0042).
const RUTAS_PUBLICAS = ["/login", "/registro", "/c/"];

// Redirige a /login si no hay sesión activa; y de /login a / si ya hay sesión.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims() valida el JWT de la cookie contra las llaves públicas del
  // proyecto: no hace un request a la red en cada navegación (getUser() sí lo
  // hacía, y con eso el rate limit de Supabase terminaba expulsando a la gente
  // a /login al moverse por el menú). Si el token está por vencer, refresca solo.
  const claims = (await supabase.auth.getClaims()).data?.claims ?? null;
  const haySesion = Boolean(claims);

  const ruta = request.nextUrl.pathname;
  const esPublica = RUTAS_PUBLICAS.some((p) => ruta.startsWith(p));

  if (!haySesion && !esPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (haySesion && ruta.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // todo menos archivos estáticos e imágenes
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};