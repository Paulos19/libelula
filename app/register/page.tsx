"use client"
// Copie a lógica do Card de Registro para cá

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";


export default function RegisterPage() {
  const router = useRouter();
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage({ type: 'success', text: data.message + " Redirecionando para o login..." });
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else {
      setMessage({ type: 'error', text: data.message });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };
  
  return (
    <main className="flex items-center justify-center min-h-screen bg-gemini-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Registrar</CardTitle>
          <CardDescription>Crie uma nova conta para começar.</CardDescription>
        </CardHeader>
        <CardContent>
          {message && <p className={`mb-4 text-center text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>}
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" placeholder="Seu Nome" onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-email">Email</Label>
              <Input id="register-email" type="email" name="email" placeholder="seu@email.com" onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">Senha</Label>
              <Input id="register-password" type="password" name="password" onChange={handleInputChange} required />
            </div>
            <Button type="submit" className="w-full">Criar Conta</Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Já tem uma conta?{" "}
            <Link href="/login" className="underline">
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}