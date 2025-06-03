"use client"

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LayoutTemplate, Github } from "lucide-react";

export default function ImportSectionBolt() {
  return (
    <section className="w-full py-12 md:py-16 lg:py-20 bg-gradient-to-r from-[#232946] via-[#2d1a4a] to-[#232946]">
      <motion.div
        className="container px-4 md:px-6 flex flex-col items-center text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <p className="text-indigo-200 mb-6 font-semibold tracking-wide animate-fade-in-delay">ou importe de</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button variant="outline" className="bg-white/10 border border-indigo-400 text-indigo-200 hover:bg-indigo-500/20 hover:text-white shadow rounded-xl transition-all duration-300">
            <LayoutTemplate className="mr-2 h-5 w-5 text-pink-400" />
            Figma
          </Button>
          <Button variant="outline" className="bg-white/10 border border-blue-400 text-blue-200 hover:bg-blue-500/20 hover:text-white shadow rounded-xl transition-all duration-300">
            <Github className="mr-2 h-5 w-5" />
            GitHub
          </Button>
        </div>
      </motion.div>
    </section>
  );
}