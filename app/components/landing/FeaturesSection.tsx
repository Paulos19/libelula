"use client"

import { motion } from "framer-motion"
import { Code2, Eye, Download } from "lucide-react"

const features = [
  {
    icon: <Code2 className="h-10 w-10 text-blue-500" />,
    title: "Geração Inteligente de Código",
    description: "Descreva sua necessidade em linguagem natural e veja o Gemini 1.5-flash gerar código limpo e moderno em React, HTML e CSS.",
  },
  {
    icon: <Eye className="h-10 w-10 text-purple-500" />,
    title: "Preview em Tempo Real",
    description: "Visualize instantaneamente o componente renderizado em uma sandbox segura. Altere o código e veja as mudanças na hora.",
  },
  {
    icon: <Download className="h-10 w-10 text-pink-500" />,
    title: "Exporte e Use Onde Quiser",
    description: "Gostou do resultado? Exporte todo o projeto como um arquivo .zip autocontido e pronto para usar em qualquer lugar.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
      <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
            Tudo que Você Precisa para Prototipar
          </h2>
          <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Da ideia ao código funcional em questão de segundos.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 pt-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="p-6 bg-white rounded-xl shadow-md flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {feature.icon}
              <h3 className="mt-4 text-xl font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}