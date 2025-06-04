import dynamic from "next/dynamic";
import { Suspense } from "react";

const LoginForm = dynamic(() => import("./LoginForm"), { ssr: false });

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gemini-gray-50">
      <Suspense fallback={<div>Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}