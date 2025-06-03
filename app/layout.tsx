import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import AuthProvider from "./components/AuthProvider";

export const metadata: Metadata = {
  title: "Libelula",
  description: "Gere apps com IA generativa de forma simples e visual.",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#fff" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-black text-white antialiased">
        <AuthProvider>
          <main className="flex flex-col min-h-screen">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}