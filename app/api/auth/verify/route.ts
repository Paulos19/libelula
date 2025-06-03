import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ message: "Token inválido." }, { status: 400 });
  }
  const verificationToken = await prisma.verificationToken.findUnique({ where: { token } });
  if (!verificationToken || verificationToken.expires < new Date()) {
    return NextResponse.json({ message: "Token expirado ou inválido." }, { status: 400 });
  }
  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  });
  await prisma.verificationToken.delete({ where: { token } });
  return NextResponse.json({ message: "E-mail verificado com sucesso." });
}