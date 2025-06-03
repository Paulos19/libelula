export { default } from "next-auth/middleware";

// Configuração para definir quais rotas serão protegidas
export const config = {
  matcher: [
    /*
     * Corresponde a todas as rotas, exceto as que começam com:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (arquivos de otimização de imagem)
     * - favicon.ico (arquivo do ícone)
     * - / (a página inicial)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|$).*)',
  ],
};