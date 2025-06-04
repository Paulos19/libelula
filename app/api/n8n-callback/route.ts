// src/app/api/n8n-callback/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Define a estrutura esperada dos arquivos que vêm do n8n
type GeneratedFile = {
  path: string;
  content: string;
};

export async function POST(request: Request) {
  try {
    // Extrai os dados do corpo da requisição JSON enviados pelo n8n
    const { chatId, prompt, files } = await request.json();

    // Validação básica dos dados recebidos
    if (!chatId || !Array.isArray(files)) {
      console.error("Dados inválidos recebidos no n8n-callback:", { chatId, files });
      return NextResponse.json({ message: "Dados inválidos: chatId ou files ausentes/incorretos." }, { status: 400 });
    }

    // Encontra o arquivo principal do frontend (app/page.tsx) e o CSS global (app/globals.css)
    // para atualizar os campos existentes no modelo Chat para o preview
    const pageTsxFile = files.find((file: GeneratedFile) => file.path === 'app/page.tsx');
    const globalsCssFile = files.find((file: GeneratedFile) => file.path === 'app/globals.css');

    const newJsxCode = pageTsxFile ? pageTsxFile.content : '';
    const newCssCode = globalsCssFile ? globalsCssFile.content : '';
    const newHtmlCode = ''; // Para projetos Next.js, o htmlCode é vazio

    // Atualiza o chat no banco de dados com os novos arquivos
    // O campo `filesJson` armazenará o array completo de arquivos como uma string JSON
    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        htmlCode: newHtmlCode,
        cssCode: newCssCode,
        jsxCode: newJsxCode,
        filesJson: JSON.stringify(files), // Armazena o array completo de arquivos
        name: prompt ? prompt.substring(0, 40) : "Projeto Gerado" // Atualiza o nome do chat com o prompt
      },
    });

    console.log(`Chat ${chatId} atualizado com sucesso via n8n-callback.`);
    return NextResponse.json({ 
      message: "Dados do projeto atualizados com sucesso.",
      updatedChatId: updatedChat.id
    }, { status: 200 });

  } catch (error) {
    console.error("Erro no endpoint /api/n8n-callback:", error);
    // Retorna uma resposta de erro genérica para evitar expor detalhes internos
    return NextResponse.json({ message: "Erro interno do servidor ao processar callback do n8n." }, { status: 500 });
  }
}
