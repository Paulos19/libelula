import NextAuth from "next-auth";
import { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  // 1. ADAPTADOR DO PRISMA
  // Conecta o NextAuth ao seu banco de dados PostgreSQL através do Prisma.
  // Usuários, contas, sessões, etc., serão gerenciados automaticamente.
  adapter: PrismaAdapter(prisma),

  // 2. PROVEDORES DE AUTENTICAÇÃO
  // Lista dos métodos de login que você oferece.
  providers: [
    // Provedor de login com conta Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // Provedor de login com Email e Senha
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Esta função é chamada quando o usuário tenta fazer login com credenciais.
        if (!credentials?.email || !credentials.password) {
          // Retorna null se e-mail ou senha não forem fornecidos.
          throw new Error("Credenciais inválidas.");
        }

        // Procura o usuário no banco de dados pelo e-mail fornecido.
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          // Retorna null se o usuário não for encontrado ou não tiver uma senha cadastrada.
          return null;
        }

        // Compara a senha fornecida com o hash da senha armazenado no banco.
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          // Retorna null se as senhas não corresponderem.
          return null;
        }

        // VERIFICAÇÃO DE E-MAIL: Bloqueia o login se o e-mail não foi verificado.
        if (!user.emailVerified) {
          throw new Error("Por favor, verifique seu e-mail antes de fazer login.");
        }

        // Se tudo estiver correto, retorna o objeto do usuário para o NextAuth.
        return user;
      },
    }),
  ],

  // 3. ESTRATÉGIA DE SESSÃO
  // Usamos JWT para que os callbacks funcionem corretamente.
  session: {
    strategy: "jwt",
  },

  // 4. CALLBACKS
  // Funções executadas em certos momentos do fluxo de autenticação.
  callbacks: {
    // O callback `jwt` é chamado sempre que um JWT é criado ou atualizado.
    async jwt({ token, user }) {
      // Se o objeto `user` existir (ocorre no login), adicionamos o ID dele ao token.
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // O callback `session` é chamado sempre que uma sessão é acessada.
    async session({ session, token }) {
      // Adicionamos o ID do usuário do token para o objeto da sessão.
      // Isso garante que `session.user.id` esteja disponível no frontend.
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  
  // 5. PÁGINAS CUSTOMIZADAS (Opcional)
  // Você pode descomentar e criar essas páginas para ter um fluxo mais customizado.
  // pages: {
  //   signIn: '/auth/signin',
  //   error: '/auth/error', // Página para exibir erros (ex: "Email não verificado")
  // },
};

// Exporta o handler do NextAuth
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };