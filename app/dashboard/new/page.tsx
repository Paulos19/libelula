"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react"; // Um ícone de loading

export default function NewChatPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Criando seu novo chat...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createNewChat = async () => {
      try {
        const res = await fetch('/api/chats', { method: 'POST' });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Falha ao criar o chat.");
        }
        const newChat = await res.json();
        
        // Usa replace para não adicionar /dashboard/new ao histórico do navegador
        router.replace(`/dashboard/${newChat.id}`); 
      } catch (err) {
        const errorMessage = (err as Error).message;
        console.error("Erro ao criar novo chat:", errorMessage);
        setError(errorMessage);
        setMessage("Não foi possível criar o chat.");
      }
    };

    createNewChat();
  }, [router]); // Executa apenas uma vez quando o componente é montado

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
      <p className="text-lg text-gray-700">{message}</p>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}