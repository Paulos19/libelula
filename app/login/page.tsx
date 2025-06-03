"use client"
// Copie todo o conteúdo do componente Card de Login da nossa antiga page.tsx para cá
// A lógica de estado e submissão deve vir junto.

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";


export default function LoginPage() {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await signIn('credentials', {
      redirect: false, // Importante para tratar o erro manualmente
      email: loginData.email,
      password: loginData.password,
    });
    
    if (result?.error) {
      setError("Credenciais inválidas ou e-mail não verificado.");
    } else if (result?.ok) {
      // O redirect padrão do NextAuth cuidará disso se não for `false`,
      // ou podemos redirecionar manualmente com useRouter
      window.location.href = '/dashboard';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gemini-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Acesse sua conta para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-center text-sm text-red-600">{error}</p>}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" name="email" placeholder="seu@email.com" onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Senha</Label>
              <Input id="login-password" type="password" name="password" onChange={handleInputChange} required />
            </div>
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
          <Separator className="my-4" />
          <Button variant="outline" className="w-full" onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>Entrar com Google</Button>
          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{" "}
            <Link href="/register" className="underline">
              Registre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}