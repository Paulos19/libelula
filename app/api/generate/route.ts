// src/app/api/generate/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

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

    // PROMPT DE ENGENHARIA AVANÇADO
    const systemPrompt = `
      Você é um desenvolvedor front-end visionário e designer de UI/UX, especialista em criar interfaces deslumbrantes e modernas com React e CSS.
      Sua tarefa é gerar ou MODIFICAR um componente existente com base no prompt do usuário, transformando cada pedido em uma obra de arte digital.

      REGRAS DE OURO:
      1.  **ESTÉTICA É PRIORIDADE:** Use paletas de cores harmoniosas (sinta-se livre para criar uma se o prompt for vago), tipografia limpa, espaçamento generoso (padding, margin) e micro-interações sutis (transições CSS, estados de hover/focus).
      2.  **MODIFICAÇÃO INTELIGENTE:** Se o código anterior for fornecido, seu trabalho principal é MODIFICÁ-LO, não começar do zero. Analise o código existente e aplique as mudanças solicitadas de forma coesa. Se o prompt for "adicione um botão", adicione apenas o botão e o estilo necessário, preservando o resto. Se for "mude a cor para roxo", altere apenas as cores.
      3.  **CÓDIGO LIMPO E FUNCIONAL:** O código deve ser impecável, usando as melhores práticas de React (Hooks) e CSS.

      REGRAS DE SAÍDA (MUITO IMPORTANTE):
      4.  Responda com UM ÚNICO E VÁLIDO objeto JSON, sem nenhum texto antes ou depois.
      5.  O objeto JSON deve ter EXATAMENTE as seguintes chaves: "html", "css", "jsx".
      6.  O código em cada chave não deve conter NENHUM comentário.
      7.  SEMPRE termine as declarações JavaScript com um ponto e vírgula (;).
      8.  NÃO inclua 'import' ou 'export'. Assuma que 'React' e 'ReactDOM' estão disponíveis globalmente.
    `;

    const fullPrompt = `
      ${systemPrompt}

      ----------------
      [CÓDIGO ANTERIOR]
      Este é o estado atual do código que você deve modificar.

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
      Agora, aplique a seguinte instrução ao CÓDIGO ANTERIOR: "${prompt}"
    `;

    const result = await model.generateContent(fullPrompt);
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

    // Lógica de dedução de tokens e persistência de dados
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { tokens: { decrement: TOKENS_PER_GENERATION } },
      }),
      prisma.chat.update({
        where: { id: chatId },
        data: {
          htmlCode: parsedJson.html,
          cssCode: parsedJson.css,
          jsxCode: parsedJson.jsx,
          name: prompt.substring(0, 40) // Usa o início do prompt como nome do chat
        }
      })
    ]);

    return NextResponse.json(parsedJson);

  } catch (error) {
    console.error("Erro completo na rota /api/generate:", error);
    return NextResponse.json({ error: "Falha ao gerar o código." }, { status: 500 });
  }
}