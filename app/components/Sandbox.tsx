"use client"

import { useState, useEffect, useCallback } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Eye, Code, Loader2, FileText, Folder, FolderOpen } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import Preview from "./Preview";
import { cn } from "@/lib/utils";

// Define a nova estrutura para os dados do chat
type Chat = {
  id: string;
  htmlCode: string; // Pode ser vazio para projetos Next.js
  cssCode: string; // Conterá app/globals.css
  jsxCode: string; // Conterá app/page.tsx
  filesJson?: string; // Novo campo para armazenar o JSON completo dos arquivos
};

// Define a estrutura esperada da resposta da API de geração
type GeneratedFile = {
  path: string;
  content: string;
};

// Nova interface para o nó da árvore de arquivos
interface FileNode {
  name: string;
  path: string; // Caminho completo do arquivo/pasta
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string; // Somente para arquivos
}

interface SandboxProps {
  initialChat: Chat;
}

// Helper para construir a árvore de arquivos a partir de uma lista plana
const buildFileTree = (files: GeneratedFile[]): FileNode[] => {
  const tree: FileNode[] = [];
  const pathMap: { [key: string]: FileNode } = {};

  files.forEach(file => {
    const parts = file.path.split('/');
    let currentLevelNodes: FileNode[] = tree; // Referência ao array de filhos no nível atual
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      let node = pathMap[currentPath];

      if (!node) {
        // Nó não existe, cria ele
        node = {
          name: part,
          path: currentPath,
          type: index === parts.length - 1 ? 'file' : 'folder',
        };
        if (node.type === 'folder') {
          node.children = []; // Inicializa filhos para novas pastas
        } else {
          node.content = file.content; // Atribui conteúdo para novos arquivos
        }
        pathMap[currentPath] = node;

        // Adiciona o novo nó ao array de filhos do nível atual
        currentLevelNodes.push(node);
      } else {
        // Nó já existe
        if (node.type === 'file' && index === parts.length - 1) {
          // Se é um arquivo e estamos na última parte, atualiza seu conteúdo
          node.content = file.content;
        }
        // Se é uma pasta, garante que seu array de filhos esteja inicializado
        if (node.type === 'folder' && !node.children) {
          node.children = [];
        }
      }

      // Se o nó atual é uma pasta, move a referência currentLevelNodes para seus filhos
      if (node.type === 'folder' && node.children) {
        currentLevelNodes = node.children;
      }
    });
  });

  // Função para ordenar nós (pastas antes de arquivos, depois alfabeticamente)
  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(node => {
      if (node.type === 'folder' && node.children) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(tree);
  return tree;
};

// Componente recursivo para renderizar a árvore de arquivos
interface FileTreeItemProps {
  node: FileNode;
  level: number;
  selectedFilePath: string | null;
  onFileSelect: (path: string) => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, level, selectedFilePath, onFileSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const paddingLeft = level * 16; // 16px por nível de indentação

  const handleToggle = () => {
    if (node.type === 'folder') {
      setIsOpen(!isOpen);
    } else {
      onFileSelect(node.path);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center py-1.5 px-2 rounded-md text-sm cursor-pointer transition-colors duration-150",
          selectedFilePath === node.path
            ? "bg-gradient-to-r from-gemini-blue via-gemini-purple to-gemini-pink text-white font-semibold shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={handleToggle}
      >
        {node.type === 'folder' ? (
          isOpen ? <FolderOpen className="mr-2 h-4 w-4 flex-shrink-0" /> : <Folder className="mr-2 h-4 w-4 flex-shrink-0" />
        ) : (
          <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
      </div>
      {isOpen && node.children && (
        <div className="ml-2"> {/* Indentação para filhos */}
          {node.children.map(child => (
            <FileTreeItem
              key={child.path} // A chave está aqui, garantindo unicidade
              node={child}
              level={level + 1}
              selectedFilePath={selectedFilePath}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};


export default function Sandbox({ initialChat }: SandboxProps) {
  // Estados para o preview (ainda necessários, pois o Preview.tsx os usa)
  const [htmlCode, setHtmlCode] = useState<string>(initialChat.htmlCode);
  const [cssCode, setCssCode] = useState<string>(initialChat.cssCode);
  const [jsxCode, setJsxCode] = useState<string>(initialChat.jsxCode);
  
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'preview' | 'code'>('code');
  const [deploying, setDeploying] = useState(false); // Estado para deploy (se você reativar a VPS)
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null); // URL do projeto na VPS

  // Novo estado para armazenar todos os arquivos gerados
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  // Novo estado para o arquivo atualmente selecionado no editor
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string>('');

  // Estado para a árvore de arquivos
  const [fileTree, setFileTree] = useState<FileNode[]>([]);

  // URL do Webhook do n8n
  const N8N_WEBHOOK_URL = "https://n8n-n8n.go8xn6.easypanel.host/webhook/gemini";

  // Função para atualizar os estados principais de código para o preview
  const updatePreviewCodeStates = useCallback((files: GeneratedFile[]) => {
    const newPageTsx = files.find((file: GeneratedFile) => file.path === 'app/page.tsx');
    const newGlobalsCss = files.find((file: GeneratedFile) => file.path === 'app/globals.css');

    setJsxCode(newPageTsx ? newPageTsx.content : '');
    setCssCode(newGlobalsCss ? newGlobalsCss.content : '');
    setHtmlCode(''); // HTML será vazio para Next.js
  }, []);

  // Efeito para inicializar o estado dos arquivos e do editor quando o chat muda
  useEffect(() => {
    // Ao carregar um chat existente, tenta usar filesJson se disponível
    let initialFiles: GeneratedFile[] = [];
    if (initialChat.filesJson) {
      try {
        initialFiles = JSON.parse(initialChat.filesJson);
      } catch (e) {
        console.error("Erro ao parsear filesJson do chat:", e);
        // Fallback para os campos antigos se o JSON for inválido
        if (initialChat.jsxCode) initialFiles.push({ path: 'app/page.tsx', content: initialChat.jsxCode });
        if (initialChat.cssCode) initialFiles.push({ path: 'app/globals.css', content: initialChat.cssCode });
      }
    } else {
      // Fallback para os campos antigos se filesJson não existir
      if (initialChat.jsxCode) initialFiles.push({ path: 'app/page.tsx', content: initialChat.jsxCode });
      if (initialChat.cssCode) initialFiles.push({ path: 'app/globals.css', content: initialChat.cssCode });
    }
    
    // Adiciona arquivos padrão de um projeto Next.js se não foram gerados
    const defaultProjectFiles: GeneratedFile[] = [
      {
        path: 'package.json',
        content: `{
  "name": "my-next-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.0.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.0.0"
  }
}`
      },
      {
        path: 'tsconfig.json',
        content: `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`
      },
      {
        path: 'next.config.ts',
        content: `/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;`
      },
      {
        path: 'postcss.config.mjs',
        content: `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
export default config;`
      },
      {
        path: 'tailwind.config.ts',
        content: `import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
export default config;`
      },
      {
        path: 'app/layout.tsx',
        content: `import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Generated by Libelula',
  description: 'Generated by Libelula AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}`
      },
      {
        path: 'app/globals.css',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(to bottom, transparent, rgb(var(--background-end-rgb))) rgb(var(--background-start-rgb));
}`
      },
      {
        path: 'app/page.tsx',
        content: `'use client';
import React from 'react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold text-center">Hello Next.js!</h1>
      <p className="text-lg text-center mt-4">Este é um projeto Next.js gerado pela IA.</p>
    </main>
  );
}`
      }
    ];

    // Mescla arquivos iniciais (do chat ou padrão) com os do chat, priorizando os do chat
    const mergedFilesMap = new Map<string, GeneratedFile>();
    defaultProjectFiles.forEach(file => mergedFilesMap.set(file.path, file));
    initialFiles.forEach(file => mergedFilesMap.set(file.path, file));

    const finalInitialFiles = Array.from(mergedFilesMap.values());

    setGeneratedFiles(finalInitialFiles);
    setFileTree(buildFileTree(finalInitialFiles)); // Constrói a árvore inicial
    updatePreviewCodeStates(finalInitialFiles); // Atualiza o preview com os arquivos iniciais

    // Seleciona o primeiro arquivo para edição por padrão (app/page.tsx se existir)
    const defaultSelectedFile = finalInitialFiles.find(f => f.path === 'app/page.tsx') || finalInitialFiles[0];
    if (defaultSelectedFile) {
      setSelectedFilePath(defaultSelectedFile.path);
      setSelectedFileContent(defaultSelectedFile.content);
    }
  }, [initialChat, updatePreviewCodeStates]);

  // Função para lidar com a geração de código disparada pela Sidebar
  const triggerGenerationFromSidebar = useCallback(async (promptFromSidebar: string) => {
    setIsLoadingApi(true);
    setErrorApi(null);
    setDeployedUrl(null); // Limpa URL de deploy anterior (se você reativar a VPS)
    
    try {
      // Notificar o Sidebar que a geração começou (para mostrar loader)
      document.dispatchEvent(new CustomEvent('generationStarted'));

      // --- Chamada ao Webhook do n8n ---
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: promptFromSidebar, 
          chatId: initialChat.id,
          // Envia o código atual do frontend e backend para o n8n
          // O n8n usará isso nos prompts dos agentes para modificação
          frontendCode: jsxCode, // app/page.tsx atual
          backendCode: "" // Você precisaria de um estado para o código de backend se quiser passá-lo
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao iniciar fluxo n8n.");
      }

      // O n8n responderá diretamente a este fetch se configurado com "Return Data: Last Node"
      // No entanto, a atualização real do chat virá via o callback /api/n8n-callback
      // Então, após a chamada ao n8n, precisamos esperar o callback e então buscar os dados atualizados.

      // --- Esperar o Callback e Atualizar Dados ---
      // Para prototipagem, vamos usar um setTimeout e um refetch.
      // Em produção, considere WebSockets para notificação em tempo real.
      const intervalId = setInterval(async () => {
        try {
          const updatedChatRes = await fetch(`/api/chats/${initialChat.id}`);
          if (updatedChatRes.ok) {
            const updatedChatData = await updatedChatRes.json();
            // Verifica se o campo filesJson foi atualizado (indicando que o n8n terminou)
            if (updatedChatData.filesJson && updatedChatData.filesJson !== initialChat.filesJson) {
              clearInterval(intervalId); // Para de checar
              const newFiles: GeneratedFile[] = JSON.parse(updatedChatData.filesJson);
              setGeneratedFiles(newFiles);
              setFileTree(buildFileTree(newFiles));
              updatePreviewCodeStates(newFiles);
              
              const defaultSelected = newFiles.find(f => f.path === 'app/page.tsx') || newFiles[0];
              if (defaultSelected) {
                  setSelectedFilePath(defaultSelected.path);
                  setSelectedFileContent(defaultSelected.content);
              }
              
              // Notificar o Sidebar que a geração está completa
              document.dispatchEvent(new CustomEvent('generationComplete'));
              setIsLoadingApi(false);
            }
          }
        } catch (checkError) {
          console.warn("Erro ao checar por atualização do chat:", checkError);
        }
      }, 3000); // Checa a cada 3 segundos

      // Define um timeout máximo para parar de checar se o callback não chegar
      setTimeout(() => {
        clearInterval(intervalId);
        if (isLoadingApi) { // Se ainda estiver carregando, significa que o callback não chegou
          setErrorApi("Timeout: O n8n não respondeu ou o callback não chegou a tempo.");
          document.dispatchEvent(new CustomEvent('generationComplete', { detail: { error: true } }));
          setIsLoadingApi(false);
        }
      }, 60000); // Timeout de 60 segundos

    } catch (err) {
      const errorMessage = (err as Error).message;
      setErrorApi(errorMessage);
      document.dispatchEvent(new CustomEvent('generationComplete', { detail: { error: true } }));
      setIsLoadingApi(false);
    }
  }, [initialChat.id, initialChat.filesJson, jsxCode, cssCode, htmlCode, updatePreviewCodeStates, N8N_WEBHOOK_URL, isLoadingApi]);

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
  
  // Lida com a mudança no conteúdo do arquivo selecionado no editor
  const handleFileContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setSelectedFileContent(newContent);

    // Atualiza o conteúdo do arquivo no array generatedFiles
    setGeneratedFiles(prevFiles => 
      prevFiles.map(file => 
        file.path === selectedFilePath ? { ...file, content: newContent } : file
      )
    );

    // Se o arquivo editado for app/page.tsx ou app/globals.css, atualiza os estados do preview
    if (selectedFilePath === 'app/page.tsx') {
      setJsxCode(newContent);
    } else if (selectedFilePath === 'app/globals.css') {
      setCssCode(newContent);
    }
  };

  // Lida com a seleção de um arquivo na lista lateral
  const handleFileSelect = (filePath: string) => {
    const file = generatedFiles.find(f => f.path === filePath);
    if (file) {
      setSelectedFilePath(file.path);
      setSelectedFileContent(file.content);
    }
  };

  const handleExportZip = async () => {
    const zip = new JSZip();

    // Adiciona todos os arquivos do estado 'generatedFiles' ao zip
    generatedFiles.forEach(file => {
      zip.file(file.path, file.content);
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "libelula-nextjs-project.zip");
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
          className="rounded-l-none border-l-0"
        >
          <Code className="mr-2 h-4 w-4" /> Code
        </Button>
      </div>

      {/* Mensagens de status de deploy (se você reativar a VPS) */}
      {deploying && (
        <div className="flex items-center justify-center p-2 mb-2 bg-blue-100 text-blue-800 rounded-md">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Deployando projeto na VPS... Isso pode levar alguns segundos.
        </div>
      )}
      {deployedUrl && !deploying && (
        <div className="p-2 mb-2 bg-green-100 text-green-800 rounded-md">
          Projeto deployado! Acesse em: <a href={deployedUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">{deployedUrl}</a>
        </div>
      )}

      {/* Conteúdo Principal: Preview ou Editores */}
      {isLoadingApi && ( // Mostra loader da API enquanto espera a resposta do n8n/callback
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
        <ResizablePanelGroup direction="horizontal" className="flex-grow overflow-hidden rounded-lg border border-border">
          {/* Painel Esquerdo: Lista de Arquivos */}
          <ResizablePanel defaultSize={20} minSize={15} className="bg-card">
            <div className="flex flex-col h-full overflow-y-auto p-2">
              <h3 className="text-sm font-semibold text-foreground mb-2">Arquivos do Projeto</h3>
              <div className="space-y-1">
                {fileTree.map(node => (
                  <FileTreeItem
                    key={node.path}
                    node={node}
                    level={0}
                    selectedFilePath={selectedFilePath}
                    onFileSelect={handleFileSelect}
                  />
                ))}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Painel Direito: Editor de Código ou Preview */}
          <ResizablePanel defaultSize={80}>
            <div className="flex flex-col h-full">
              {activeView === 'preview' ? (
                <div className="flex-grow p-4 bg-white dark:bg-gray-800">
                  {/* O preview agora sempre usa o Preview.tsx local,
                      pois o deploy na VPS foi desativado.
                      Se você reativar o deploy na VPS, pode usar o iframe com deployedUrl aqui.
                  */}
                  <Preview html={htmlCode} css={cssCode} jsx={jsxCode} />
                </div>
              ) : (
                <div className="flex-grow">
                  {selectedFilePath ? (
                    <Textarea
                      value={selectedFileContent}
                      onChange={handleFileContentChange}
                      className="h-full w-full font-mono text-sm bg-popover text-popover-foreground rounded-none border-none resize-none"
                      placeholder="Selecione um arquivo para editar..."
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Selecione um arquivo para começar a editar.</div>
                  )}
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
      <Button onClick={handleExportZip} className="mt-4">Exportar Projeto Next.js (.zip)</Button>
    </div>
  );
}
