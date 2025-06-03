"use client"

import { useState, useEffect, useCallback } from "react"; // Adicionado useCallback
import JSZip from "jszip";
import { saveAs } from "file-saver";

// ... (outros imports como Textarea, Button, Card, Sparkles, Download, Preview)
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Eye, Code, Loader2 } from "lucide-react"; // Ícones para toggle
import { Textarea } from "@/components/ui/textarea";
import Preview from "./Preview";

type Chat = {
  id: string;
  htmlCode: string;
  cssCode: string;
  jsxCode: string;
};

interface SandboxProps {
  initialChat: Chat;
  // initialPrompt é removido daqui, pois o prompt agora vive na SidebarV0
}

export default function Sandbox({ initialChat }: SandboxProps) {
  const [htmlCode, setHtmlCode] = useState<string>(initialChat.htmlCode);
  const [cssCode, setCssCode] = useState<string>(initialChat.cssCode);
  const [jsxCode, setJsxCode] = useState<string>(initialChat.jsxCode);
  
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false); // Renomeado para evitar conflito
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'preview' | 'code'>('code');

  const updateCodeStates = useCallback((chatData: Chat) => {
    setHtmlCode(chatData.htmlCode);
    setCssCode(chatData.cssCode);
    setJsxCode(chatData.jsxCode);
    setErrorApi(null);
  }, []);

  useEffect(() => {
    updateCodeStates(initialChat);
  }, [initialChat, updateCodeStates]);

  // Função que será chamada pela SidebarV0 via evento customizado
  const triggerGenerationFromSidebar = useCallback(async (promptFromSidebar: string) => {
    setIsLoadingApi(true);
    setErrorApi(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: promptFromSidebar, 
          htmlCode, 
          cssCode, 
          jsxCode, 
          chatId: initialChat.id 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "API error.");
      }
      const data = await response.json();
      setHtmlCode(data.html || '');
      setCssCode(data.css || '');
      setJsxCode(data.jsx || '');
      // Notificar a sidebar que a geração terminou (opcional, para isGenerating da sidebar)
      document.dispatchEvent(new CustomEvent('generationComplete'));

    } catch (err) {
      const errorMessage = (err as Error).message;
      setErrorApi(errorMessage);
      document.dispatchEvent(new CustomEvent('generationComplete', { detail: { error: true } }));
    } finally {
      setIsLoadingApi(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlCode, cssCode, jsxCode, initialChat.id]); // Adiciona dependências corretas

  // Escuta o evento customizado disparado pela SidebarV0
  useEffect(() => {
    const handleTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<{ prompt: string }>;
      if (customEvent.detail && customEvent.detail.prompt) {
        triggerGenerationFromSidebar(customEvent.detail.prompt);
      }
    };
    document.addEventListener('triggerGenerateFromSidebar', handleTrigger);
    return () => {
      document.removeEventListener('triggerGenerateFromSidebar', handleTrigger);
    };
  }, [triggerGenerationFromSidebar]);
  

  const handleExportZip = () => {
    const zip = new JSZip();
    const fullHtml = `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>LLM Sandbox Export</title>\n  <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n  ${htmlCode}\n  <script src=\"https://unpkg.com/react@18/umd/react.development.js\"></script>\n  <script src=\"https://unpkg.com/react-dom@18/umd/react-dom.development.js\"></script>\n  <script src=\"https://unpkg.com/@babel/standalone/babel.min.js\"></script>\n  <script type=\"text/babel\" src=\"script.js\"></script>\n</body>\n</html>`;
    zip.file("index.html", fullHtml);
    zip.file("style.css", cssCode);
    zip.file("script.js", jsxCode);
    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "llm-sandbox-export.zip");
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-background p-4">
      {/* Barra de Toggle Preview/Code */}
      <div className="flex items-center justify-start mb-3 border-b border-border pb-2">
        <Button 
          variant={activeView === 'preview' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setActiveView('preview')}
          className="rounded-r-none"
        >
          <Eye className="mr-2 h-4 w-4" /> Preview
        </Button>
        <Button 
          variant={activeView === 'code' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setActiveView('code')}
          className="rounded-l-none border-l-0" // Remove borda esquerda para juntar
        >
          <Code className="mr-2 h-4 w-4" /> Code
        </Button>
        {/* Poderia adicionar o botão de Exportar ZIP aqui também */}
      </div>

      {/* Conteúdo Principal: Preview ou Editores */}
      {isLoadingApi && (
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}
      {!isLoadingApi && errorApi && (
         <div className="flex-grow flex items-center justify-center p-4">
            <p className="text-destructive text-center">{errorApi}</p>
         </div>
      )}

      {!isLoadingApi && !errorApi && (
        <div className="flex-grow overflow-hidden">
          {activeView === 'preview' && (
            <div className="h-full w-full rounded-md border border-border bg-white dark:bg-gray-800">
              <Preview html={htmlCode} css={cssCode} jsx={jsxCode} />
            </div>
          )}
          {activeView === 'code' && (
            <Tabs defaultValue="jsx" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="jsx">JSX</TabsTrigger>
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="css">CSS</TabsTrigger>
              </TabsList>
              <TabsContent value="jsx" className="flex-grow mt-2">
                <Textarea value={jsxCode} onChange={(e) => setJsxCode(e.target.value)} className="h-full font-mono text-sm bg-popover text-popover-foreground rounded-md border-border" placeholder="Código JSX" />
              </TabsContent>
              <TabsContent value="html" className="flex-grow mt-2">
                <Textarea value={htmlCode} onChange={(e) => setHtmlCode(e.target.value)} className="h-full font-mono text-sm bg-popover text-popover-foreground rounded-md border-border" placeholder="Código HTML" />
              </TabsContent>
              <TabsContent value="css" className="flex-grow mt-2">
                 <Textarea value={cssCode} onChange={(e) => setCssCode(e.target.value)} className="h-full font-mono text-sm bg-popover text-popover-foreground rounded-md border-border" placeholder="Código CSS" />
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
      <Button onClick={handleExportZip} className="ml-2">Exportar</Button>
    </div>
  );
}