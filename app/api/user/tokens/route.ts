import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import {prisma} from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  return NextResponse.json({ tokens: user?.tokens ?? 0 });
}