"use client"

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const templates = [
  "Build a mobile app with Expo",
  "Start a blog with Astro",
  "Create a docs site with VitePress",
  "Scaffold UI with shadcn",
  "Draft a presentation with Slidev",
];

export default function TemplatesSectionBolt() {
  return (
    <section className="w-full py-16 px-4 bg-[#181824] text-white">
      <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Templates Prontos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Exemplo de botão estilizado */}
        <button className="bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-400 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:from-purple-700 hover:via-blue-600 hover:to-indigo-500 transition-all">
          Usar Template
        </button>
        {/* Repita para outros botões */}
      </div>
    </section>
  );
}