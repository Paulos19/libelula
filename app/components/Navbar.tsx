'use client';
import UserNav from "./UserNav"; // UserNav mostra "Sign In" ou Avatar/Dropdown
import { Button } from "@/components/ui/button";
import { Zap, Settings, Github, Share2, DownloadCloud } from "lucide-react"; // Usando ícones Lucide
import { useCallback } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Link from "next/link";

interface NavbarProps {
  htmlCode: string;
  cssCode: string;
  jsxCode: string;
}

export default function Navbar({ htmlCode, cssCode, jsxCode }: NavbarProps) {
  // Nome do chat/projeto atual - Isso viria de um estado global ou props no futuro
  const currentChatName = "Uma tela de login"; // Exemplo

  // Função de exportação (adapte conforme sua lógica atual)
  const handleExport = useCallback(async () => {
    // Exemplo: supondo que você tenha acesso ao código/folders a exportar
    const zip = new JSZip();
    // Adicione arquivos ao zip conforme sua lógica
    // zip.file("index.js", "conteúdo do arquivo");
    // ...
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "codigo-exportado.zip";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background h-14 flex items-center">
      <div className="container flex max-w-screen-2xl items-center justify-between px-4">
        {/* Lado Esquerdo da Navbar */}
        <div className="flex items-center space-x-3">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg text-foreground hidden sm:inline-block">
              Libelula {/* Simulação do logo */}
            </span>
          </Link>
          <span className="text-muted-foreground text-sm hidden md:inline">/</span>
          <div className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="px-2">Personal</Button> 
            {/* Poderia ser um DropdownMenu no futuro */}
            <span className="px-1.5 py-0.5 text-xs font-medium bg-green-600/20 text-green-400 rounded-full">Free</span>
          </div>
          <span className="text-muted-foreground text-sm hidden lg:inline">/</span>
          <span className="text-sm text-foreground hidden lg:inline-block truncate max-w-[200px]">{currentChatName}</span>
          <span className="px-1.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground rounded-md hidden lg:inline-block">Private</span>
        </div>

        {/* Lado Direito da Navbar */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" title="Configurações">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" title="Compartilhar">
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </Button>
          <UserNav /> {/* Mantém a lógica de Sign In / Avatar */}
          <Button onClick={handleExportZip} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <DownloadCloud className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>
    </header>
  );
}