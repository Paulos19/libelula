// src/app/api/chats/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// FUNÇÃO GET PARA LISTAR OS CHATS DO USUÁRIO
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const chats = await prisma.chat.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(chats);
}

// FUNÇÃO POST PARA CRIAR UM NOVO CHAT
export async function POST(request: Request) { // Modifique para aceitar request
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Tenta pegar o nome do corpo da requisição
  let chatName = "Novo Chat";
  try {
    const body = await request.json();
    if (body.name) {
      chatName = body.name;
    }
  } catch (e) {
    // Ignora se não houver corpo ou não for JSON, continua com o nome padrão
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }
  const newChat = await prisma.chat.create({
    data: {
      userId: session.user.id,
      name: chatName,
    },
  });

  return NextResponse.json(newChat);
}