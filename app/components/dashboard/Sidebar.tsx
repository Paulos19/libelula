"use client"

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  PlusCircle, 
  MessageSquareText, 
  History, 
  ChevronDown, 
  Sparkles,
  AlertTriangle,
  Loader2 
} from "lucide-react";
import { useSession } from "next-auth/react";

type ChatInfo = {
  id: string;
  name: string;
  updatedAt: string;
};

export default function SidebarV0() {
  const [chats, setChats] = useState<ChatInfo[]>([]);
  const [currentChatName, setCurrentChatName] = useState("Carregando chat...");
  const [prompt, setPrompt] = useState("");
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false); 
  const [errorLoadingChats, setErrorLoadingChats] = useState<string | null>(null);
  const [userTokens, setUserTokens] = useState(0);
  
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const chatId = params.chatId as string;

  // URL do Webhook do n8n
  const N8N_WEBHOOK_URL = "https://n8n-n8n.go8xn6.easypanel.host/webhook/gemini";

  // Busca a quantidade de tokens do usuário no backend
  const fetchUserTokens = useCallback(async () => {
    try {
      const res = await fetch('/api/user/tokens');
      if (res.ok) {
        const data = await res.json();
        setUserTokens(data.tokens);
      }
    } catch (e) {
      setUserTokens(0);
    }
  }, []);

  const fetchChatsAndCurrent = useCallback(async () => {
    setIsLoadingChats(true);
    setErrorLoadingChats(null);
    try {
      const resChats = await fetch('/api/chats');
      if (!resChats.ok) {
        const errorData = await resChats.json().catch(() => ({}));
        throw new Error(errorData.message || "Falha ao buscar chats.");
      }
      const dataChats: ChatInfo[] = await resChats.json();
      dataChats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setChats(dataChats);
      if (chatId && dataChats.length > 0) {
        const current = dataChats.find(c => c.id === chatId);
        setCurrentChatName(current?.name || "Chat não encontrado");
      } else if (dataChats.length > 0 && !chatId) {
        // Se não há chatId na URL mas há chats, redireciona para o mais recente
        router.replace(`/dashboard/${dataChats[0].id}`);
      } else {
        setCurrentChatName("Nenhum chat disponível");
      }
    } catch (error) {
      setCurrentChatName("Erro ao carregar chats");
      setErrorLoadingChats((error as Error).message);
    } finally {
      setIsLoadingChats(false);
    }
  }, [chatId, router]);

  useEffect(() => {
    fetchChatsAndCurrent();
  }, [fetchChatsAndCurrent]);

  useEffect(() => {
    fetchUserTokens();
  }, [fetchUserTokens, isGenerating]); // Atualiza tokens após geração

  const handleNewChat = async () => {
    try {
      const res = await fetch('/api/chats', { method: 'POST' });
      if (!res.ok) {
        throw new Error("Falha ao criar novo chat.");
      }
      const newChat: ChatInfo = await res.json();
      setChats(prevChats => [newChat, ...prevChats].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      router.push(`/dashboard/${newChat.id}`);
    } catch (error) {
      console.error("Erro ao criar novo chat:", error);
      // Tratar erro na UI, talvez com um toast ou mensagem
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !chatId || userTokens < 5) {
      setErrorLoadingChats("Prompt vazio, chat não selecionado ou tokens insuficientes.");
      return;
    }

    setIsGenerating(true);
    setErrorLoadingChats(null); // Limpa erros anteriores

    // Notificar o Sandbox que a geração começou (para mostrar loader)
    document.dispatchEvent(new CustomEvent('generationStarted'));

    try {
      // Para o n8n, precisamos enviar o código existente do frontend e backend
      // Se o Sandbox já tem esses estados, você pode passá-los aqui.
      // Para simplificar, vou assumir que o Sandbox passará o código atualizado
      // para o n8n via o evento triggerGenerateFromSidebar se necessário.
      // No entanto, para o fluxo n8n, o código existente deve vir do front-end.
      // Aqui, vamos enviar o prompt e o chatId para o n8n.
      // O n8n precisará buscar o código existente do BD ou recebê-lo de alguma forma.
      // Para este exemplo, vamos assumir que o n8n buscará, ou que o código existente
      // não é estritamente necessário para o primeiro prompt.

      // Se você precisa enviar o código existente, o Sidebar precisaria ter acesso a ele.
      // Isso geralmente é feito levantando o estado para um componente pai (DashboardLayout)
      // ou usando um Context API. Por simplicidade, vamos enviar o que o n8n precisa
      // e assumir que o n8n pode lidar com a ausência do código existente para o primeiro prompt.

      // O Sandbox já tem os estados htmlCode, cssCode, jsxCode.
      // Podemos disparar um evento para o Sandbox obter esses códigos e enviá-los para o n8n.
      // Ou, mais diretamente, o Sidebar pode ter acesso a eles se forem passados como props
      // ou via um contexto global.

      // Para a integração direta com o n8n, o Sidebar precisa do código atual.
      // Como o Sandbox é quem gerencia o código, vamos disparar um evento que o Sandbox
      // irá capturar e, então, o Sandbox fará a chamada para o n8n, passando o código atual.
      // Isso mantém a responsabilidade do código no Sandbox.

      // Dispara o evento que o Sandbox irá capturar para chamar o n8n
      document.dispatchEvent(new CustomEvent('triggerGenerateFromSidebar', { 
        detail: { 
          prompt: prompt,
          // O Sandbox pode pegar o chatId do seu próprio estado/props
          // e o código existente dos seus próprios estados (htmlCode, cssCode, jsxCode)
        } 
      }));

      // O resto da lógica (atualização de tokens, chats) será acionada
      // pelo evento 'generationComplete' disparado pelo Sandbox.

    } catch (error) {
      console.error("Erro ao iniciar geração via n8n:", error);
      setErrorLoadingChats("Falha ao iniciar a geração: " + (error as Error).message);
      setIsGenerating(false);
      document.dispatchEvent(new CustomEvent('generationComplete', { detail: { error: true } }));
    }
  };

  useEffect(() => {
    const handleGenerationStart = () => setIsGenerating(true);
    const handleGenerationComplete = () => {
      setIsGenerating(false);
      setPrompt(""); // Limpa o prompt após a geração
      fetchChatsAndCurrent(); // Atualiza a lista de chats
      fetchUserTokens(); // Atualiza os tokens
    };
    document.addEventListener('generationStarted', handleGenerationStart);
    document.addEventListener('generationComplete', handleGenerationComplete);
    return () => {
      document.removeEventListener('generationStarted', handleGenerationStart);
      document.removeEventListener('generationComplete', handleGenerationComplete);
    };
  }, [fetchChatsAndCurrent, fetchUserTokens]);

  return (
    <aside
      className={cn(
        "w-80 h-full bg-card border-r border-border flex flex-col p-4 space-y-4 transition-all duration-300 ease-in-out rounded-lg"
      )}
    >
      <div className="flex-shrink-0">
        <h2 className="text-lg font-semibold text-foreground truncate" title={currentChatName}>
          {isLoadingChats ? <Loader2 className="h-5 w-5 animate-spin" /> : currentChatName}
        </h2>
        <p className="text-xs text-muted-foreground">Pensou por alguns segundos</p>
      </div>
      <div className="flex-shrink-0 flex items-center justify-between p-2 bg-muted rounded-md">
        <Button variant="ghost" size="sm" className="flex items-center text-sm text-muted-foreground hover:text-foreground rounded-md">
          <History className="mr-2 h-4 w-4" /> Versão 1 <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
        <div className="text-sm bg-accent/50 text-accent-foreground px-2 py-1 rounded-md truncate max-w-[100px]">
          {currentChatName.toLowerCase().replace(/\s+/g, '-').substring(0, 20)}.tsx
          {isGenerating && <span className="ml-2 text-xs text-yellow-400">Gerando...</span>}
        </div>
      </div>
      <div className="flex-grow flex flex-col min-h-0">
        <Textarea
          placeholder="Faça uma pergunta ou descreva um novo componente..."
          className="flex-1 resize-none bg-popover border-input text-sm font-mono text-popover-foreground rounded-md"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)} />
      </div>
      <div className="flex-shrink-0 space-y-3">
        {userTokens < 5 && (
          <div className="flex items-center gap-2 p-3 mb-2 rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-sm">
            <AlertTriangle className="w-4 h-4" />
            Você está sem créditos suficientes (mínimo de 5 tokens necessários). Faça upgrade do plano.
          </div>
        )}
        {errorLoadingChats && (
          <p className="text-xs text-destructive text-center p-1">{errorLoadingChats}</p>
        )}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="text-muted-foreground rounded-md">
            gemini-1.5-flash <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || !chatId || userTokens < 5}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md w-full mt-2"
            type="submit"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Gerar
          </Button>
        </div>
      </div>
      <div className="mt-auto border-t border-border pt-4 flex-shrink-0">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Histórico de Chats</h3>
        <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
          {isLoadingChats && chats.length === 0 && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoadingChats && errorLoadingChats && (
            <p className="text-xs text-destructive text-center p-1">{errorLoadingChats}</p>
          )}
          {!isLoadingChats && !errorLoadingChats && chats.length === 0 && (
            <p className="text-xs text-muted-foreground text-center p-2">Nenhum chat encontrado.</p>
          )}
          {chats.map(chat => (
            <Link key={chat.id} href={`/dashboard/${chat.id}`} passHref>
              <div className={cn(
                "flex items-center p-2 rounded-md text-xs cursor-pointer transition-colors duration-150",
                chatId === chat.id
                  ? "bg-gradient-to-r from-gemini-blue via-gemini-purple to-gemini-pink text-white font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}>
                <MessageSquareText className="mr-2 h-3 w-3 flex-shrink-0" />
                <span className="truncate">{chat.name}</span>
              </div>
            </Link>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full mt-3 rounded-md" onClick={handleNewChat}>
          <PlusCircle className="mr-2 h-4 w-4" /> Novo Chat
        </Button>
      </div>
    </aside>
  );
}
