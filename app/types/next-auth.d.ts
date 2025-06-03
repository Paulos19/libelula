import { DefaultSession, DefaultUser } from "next-auth";

// Estende a interface do JWT para incluir o nosso 'id'
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}

// Estende a interface da Sessão para que session.user tenha o 'id'
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"]; // Mantém as propriedades padrão (name, email, image)
  }
}