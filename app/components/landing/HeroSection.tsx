"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip } from "lucide-react";

export default function HeroSectionLibelula() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: prompt.substring(0, 50) + "..." }),
      });
      if (!res.ok) throw new Error("Erro ao criar chat.");
      const newChat = await res.json();
      router.push(`/dashboard/${newChat.id}?initialPrompt=${encodeURIComponent(prompt)}`);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full min-h-[90vh] flex items-center justify-center bg-black">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center text-center px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
          Libelula
        </h1>
        <p className="mb-8 text-lg md:text-xl text-gray-300 max-w-2xl">
          Gere, edite e exporte apps <span className="text-white font-semibold">web</span> e <span className="text-white font-semibold">mobile</span> com IA generativa, de forma simples e visual.
        </p>
        <div className="w-full max-w-2xl relative mb-6">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="O que você quer construir hoje?"
            className="min-h-[120px] md:min-h-[160px] p-4 pr-12 text-base bg-[#181824] border-2 border-purple-700 focus:ring-blue-400 focus:border-blue-400 text-white resize-none rounded-lg shadow-lg placeholder:text-gray-400"
          />
          <Paperclip className="absolute bottom-4 left-4 h-5 w-5 text-indigo-400" />
        </div>
        <Button
          size="lg"
          onClick={handleStart}
          disabled={isLoading}
          className="bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 text-white font-bold shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300 border-0 px-8 py-3 rounded-lg text-lg"
        >
          {isLoading ? "Iniciando..." : "Começar com Libelula"}
        </Button>
      </div>
    </section>
  );
}