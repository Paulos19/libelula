"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

export default function ParallaxSection() {
  const ref = useRef<HTMLDivElement>(null)
  
  // Hook para monitorar o progresso do scroll DENTRO deste componente
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"], // Começa a animar quando o componente entra na tela e termina quando sai
  })

  // Transforma o progresso do scroll (0 a 1) em um movimento vertical (de -100px a 100px)
  const y = useTransform(scrollYProgress, [0, 1], [-100, 100])

  return (
    <section
      ref={ref}
      className="relative w-full h-[60vh] flex items-center justify-center overflow-hidden bg-gray-900"
    >
      <motion.h2
        style={{ y }} // Aplica o movimento vertical ao estilo do elemento
        className="text-4xl md:text-6xl font-bold text-white z-10 text-center max-w-4xl"
      >
        Construído com as Melhores Tecnologias
      </motion.h2>

      {/* Elementos de fundo para acentuar o efeito parallax */}
      <motion.div 
        className="absolute top-10 left-[5%] h-24 w-24 bg-blue-500/30 rounded-full"
        style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]) }}
      />
      <motion.div 
        className="absolute bottom-10 right-[5%] h-32 w-32 bg-pink-500/30 rounded-full"
        style={{ y: useTransform(scrollYProgress, [0, 1], [50, -50]) }}
      />
    </section>
  )
}