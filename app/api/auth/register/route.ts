import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/nodemailer";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Todos os campos são obrigatórios." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "Usuário já existe." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Gera um token de verificação
    const token = crypto.randomBytes(32).toString("hex");
    const verificationToken = await prisma.verificationToken.create({
      data: {
        identifier: user.email!,
        token: token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expira em 24 horas
      },
    });

    // Envia o e-mail
    await sendVerificationEmail(user.email!, verificationToken.token);

    return NextResponse.json(
      { message: "Usuário registrado com sucesso. Por favor, verifique seu e-mail." },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}