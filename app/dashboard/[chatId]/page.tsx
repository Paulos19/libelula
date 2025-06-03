// src/app/dashboard/[chatId]/page.tsx
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"; // Para verificar se o chat pertence ao usuário
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Sandbox from "@/app/components/Sandbox";

interface ChatPageProps {
  params: { chatId: string };
}

async function getChatData(chatId: string, userId: string) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId, userId: userId }, // Garante que o usuário só acesse seus próprios chats
  });
  return chat;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    notFound(); // Ou redirecionar para login
  }

  const chat = await getChatData(params.chatId, session.user.id);

  if (!chat) {
    notFound();
  }

  return (
    // O Sandbox preencherá o espaço dado pelo DashboardLayout
    <Sandbox initialChat={chat} />
  );
}