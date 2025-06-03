import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL('/?error=TokenInvalido', request.url));
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken || verificationToken.expires < new Date()) {
    return NextResponse.redirect(new URL('/?error=TokenExpirado', request.url));
  }

  // Atualiza o usuário para marcar o e-mail como verificado
  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  });

  // Deleta o token para que não possa ser usado novamente
  await prisma.verificationToken.delete({
    where: { token },
  });

  // Redireciona o usuário para a página inicial com uma mensagem de sucesso
  return NextResponse.redirect(new URL('/?verified=true', request.url));
}