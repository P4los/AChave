import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que no requieren estar logueado
const publicRoutes = ['/login', '/registro']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Si estamos en una ruta pública, permitimos el paso libre
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Comprobar si existe nuestra galleta (cookie) del token
  // Nota: En un futuro, el nombre de tu cookie puede cambiar a como la definas en login.
  const token = request.cookies.get('ACHAVE_ACCESS_TOKEN')

  // Si no hay token y estamos intentando entrar al dashboard, patada al /login
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Si hay token, todo bien, que pase a ver sus claves
  return NextResponse.next()
}

// Configuración para que el middleware se aplique a todo excepto a archivos estáticos e imágenes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
