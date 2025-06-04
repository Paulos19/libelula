// src/app/api/generate/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const TOKENS_PER_GENERATION = 5;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Lógica de verificação de tokens
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.tokens < TOKENS_PER_GENERATION) {
    return NextResponse.json({ error: "Tokens insuficientes." }, { status: 402 }); // 402 Payment Required
  }

  const { prompt, htmlCode, cssCode, jsxCode, chatId } = await request.json();
  if (!prompt || !chatId) {
    return NextResponse.json({ error: "Prompt e ID do chat são obrigatórios" }, { status: 400 });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // PROMPT DE ENGENHARIA AVANÇADO PARA NEXT.JS COM APP ROUTER E TYPESCRIPT
    const systemPrompt = `
      Você é um desenvolvedor full-stack visionário e designer de UI/UX, especializado em criar aplicações web modernas com Next.js (App Router), TypeScript e Tailwind CSS.
      Sua tarefa é gerar ou MODIFICAR um componente existente, rota ou layout com base no prompt do usuário, transformando cada pedido em uma obra de arte digital funcional.

      REGRAS DE OURO:
      1.  **ESTÉTICA É PRIORIDADE:** Use paletas de cores harmoniosas (sinta-se livre para criar uma se o prompt for vago), tipografia limpa, espaçamento generoso (padding, margin) e micro-interações sutis (transições CSS, estados de hover/focus).
      2.  **MODIFICAÇÃO INTELIGENTE:** Se o código anterior for fornecido, seu trabalho principal é MODIFICÁ-LO, não começar do zero. Analise o código existente e aplique as mudanças solicitadas de forma coesa. Se o prompt for "adicione um botão", adicione apenas o botão e o estilo necessário, preservando o resto. Se for "mude a cor para roxo", altere apenas as cores.
      3.  **CÓDIGO LIMPO, TIPADO E FUNCIONAL:** O código deve ser impecável, usando as melhores práticas de Next.js (App Router), React (Hooks), TypeScript e Tailwind CSS. Sempre use tipos e interfaces onde apropriado. Diferencie entre Client Components ('use client') e Server Components.

      REGRAS DE SAÍDA (MUITO IMPORTANTE):
      4.  Responda com UM ÚNICO E VÁLIDO objeto JSON, sem nenhum texto antes ou depois.
      5.  O objeto JSON deve ter EXATAMENTE as seguintes chaves: "files".
      6.  A chave "files" deve ser um ARRAY de objetos, onde cada objeto tem as chaves "path" (string, o caminho completo do arquivo, ex: "app/page.tsx") e "content" (string, o conteúdo do arquivo).
      7.  O código em cada 'content' não deve conter NENHUM comentário.
      8.  SEMPRE termine as declarações JavaScript/TypeScript com um ponto e vírgula (;).
      9.  Para o 'package.json', inclua apenas as dependências essenciais para um projeto Next.js com Tailwind e TypeScript.
      10. Para 'app/page.tsx' e outros componentes React, use a diretiva "'use client';" no topo se eles usarem hooks ou interatividade.

      EXEMPLO DE SAÍDA JSON:
      \`\`\`json
      {
        "files": [
          {
            "path": "package.json",
            "content": "{ \"name\": \"my-next-app\", \"version\": \"0.1.0\", \"private\": true, \"scripts\": { \"dev\": \"next dev\", \"build\": \"next build\", \"start\": \"next start\", \"lint\": \"next lint\" }, \"dependencies\": { \"next\": \"^14.0.0\", \"react\": \"^18.2.0\", \"react-dom\": \"^18.2.0\", \"tailwindcss\": \"^3.3.0\", \"typescript\": \"^5.0.0\", \"autoprefixer\": \"^10.0.0\", \"postcss\": \"^8.0.0\" } }"
          },
          {
            "path": "tsconfig.json",
            "content": "{ \"compilerOptions\": { \"target\": \"es5\", \"lib\": [\"dom\", \"dom.iterable\", \"esnext\"], \"allowJs\": true, \"skipLibCheck\": true, \"strict\": true, \"forceConsistentCasingInFileNames\": true, \"noEmit\": true, \"esModuleInterop\": true, \"module\": \"esnext\", \"moduleResolution\": \"node\", \"resolveJsonModule\": true, \"isolatedModules\": true, \"jsx\": \"preserve\", \"incremental\": true, \"paths\": { \"@/*\": [\"./*\"] } }, \"include\": [\"next-env.d.ts\", \"**/*.ts\", \"**/*.tsx\", \".next/types/**/*.ts\"], \"exclude\": [\"node_modules\"] }"
          },
          {
            "path": "next.config.ts",
            "content": "/** @type {import('next').NextConfig} */\\nconst nextConfig = {};\\nmodule.exports = nextConfig;"
          },
          {
            "path": "postcss.config.mjs",
            "content": "/** @type {import('postcss-load-config').Config} */\\nconst config = {\\n  plugins: {\\n    tailwindcss: {},\\n    autoprefixer: {},\\n  },\\n};\\nexport default config;"
          },
          {
            "path": "tailwind.config.ts",
            "content": "import type { Config } from 'tailwindcss';\\n\\nconst config: Config = {\\n  content: [\\n    './pages/**/*.{js,ts,jsx,tsx,mdx}',\\n    './components/**/*.{js,ts,jsx,tsx,mdx}',\\n    './app/**/*.{js,ts,jsx,tsx,mdx}',\\n  ],\\n  theme: {\\n    extend: {\\n      backgroundImage: {\\n        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',\\n        'gradient-conic':\\n          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',\\n      },\\n    },\\n  },\\n  plugins: [],\\n};\\nexport default config;"
          },
          {
            "path": "app/layout.tsx",
            "content": "import './globals.css';\\nimport type { Metadata } from 'next';\\nimport { Inter } from 'next/font/google';\\n\\nconst inter = Inter({ subsets: ['latin'] });\\n\\nexport const metadata: Metadata = {\\n  title: 'Create Next App',\\n  description: 'Generated by create next app',\\n};\\n\\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\\n  return (\\n    <html lang=\"en\">\\n      <body className={inter.className}>{children}</body>\\n    </html>\\n  );\\n}"
          },
          {
            "path": "app/globals.css",
            "content": "@tailwind base;\\n@tailwind components;\\n@tailwind utilities;\\n\\n:root {\\n  --foreground-rgb: 0, 0, 0;\\n  --background-start-rgb: 214, 219, 220;\\n  --background-end-rgb: 255, 255, 255;\\n}\\n\\n@media (prefers-color-scheme: dark) {\\n  :root {\\n    --foreground-rgb: 255, 255, 255;\\n    --background-start-rgb: 0, 0, 0;\\n    --background-end-rgb: 0, 0, 0;\\n  }\\n}\\n\\nbody {\\n  color: rgb(var(--foreground-rgb));\\n  background: linear-gradient(to bottom, transparent, rgb(var(--background-end-rgb))) rgb(var(--background-start-rgb));\\n}"
          },
          {
            "path": "app/page.tsx",
            "content": "'use client';\\n\\nexport default function Home() {\\n  return (\\n    <main className=\"flex min-h-screen flex-col items-center justify-between p-24\">\\n      <h1 className=\"text-4xl font-bold\">Hello Next.js!</h1>\\n      <p className=\"text-lg\">Este é um projeto Next.js gerado pela IA.</p>\\n    </main>\\n  );\\n}"
          }
        ]
      }
      \`\`\`
    `;

    // O prompt completo incluirá o código anterior para modificação
    const fullPrompt = `
      ${systemPrompt}

      ----------------
      [CÓDIGO ANTERIOR]
      Este é o estado atual do código que você deve modificar.
      Se o prompt for para criar um NOVO projeto, ignore o código anterior e gere um projeto Next.js padrão.

      HTML:
      \`\`\`html
      ${htmlCode}
      \`\`\`

      CSS:
      \`\`\`css
      ${cssCode}
      \`\`\`

      JSX:
      \`\`\`jsx
      ${jsxCode}
      \`\`\`
      ----------------
      [NOVO PEDIDO DO USUÁRIO]
      Agora, aplique a seguinte instrução ao CÓDIGO ANTERIOR (ou crie um novo projeto Next.js se for um pedido inicial): "${prompt}"
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            files: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  path: { type: SchemaType.STRING },
                  content: { type: SchemaType.STRING },
                },
                required: ["path", "content"],
              },
            },
          },
          required: ["files"],
        },
      },
    });

    const response = result.response;
    const text = response.text();

    // Extração robusta de JSON
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
      throw new Error("A resposta da IA não continha um objeto JSON válido.");
    }
    const jsonString = text.substring(startIndex, endIndex + 1);
    const parsedJson = JSON.parse(jsonString);

    // Mapeia os arquivos gerados para os campos do chat
    // Para simplificar, vamos armazenar o conteúdo de app/page.tsx em jsxCode
    // e app/globals.css em cssCode. O htmlCode será vazio.
    let newJsxCode = '';
    let newCssCode = '';
    let newHtmlCode = ''; // Será vazio para projetos Next.js

    const pageTsxFile = parsedJson.files.find((file: any) => file.path === 'app/page.tsx');
    if (pageTsxFile) {
      newJsxCode = pageTsxFile.content;
    }

    const globalsCssFile = parsedJson.files.find((file: any) => file.path === 'app/globals.css');
    if (globalsCssFile) {
      newCssCode = globalsCssFile.content;
    }

    // Lógica de dedução de tokens e persistência de dados
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { tokens: { decrement: TOKENS_PER_GENERATION } },
      }),
      prisma.chat.update({
        where: { id: chatId },
        data: {
          htmlCode: newHtmlCode, // Vazio
          cssCode: newCssCode,
          jsxCode: newJsxCode,
          name: prompt.substring(0, 40) // Usa o início do prompt como nome do chat
        }
      })
    ]);

    // Retorna a estrutura completa de arquivos para o frontend
    return NextResponse.json(parsedJson);

  } catch (error) {
    console.error("Erro completo na rota /api/generate:", error);
    return NextResponse.json({ error: "Falha ao gerar o código." }, { status: 500 });
  }
}
