import Accordion from "./Accordion";

const faqData = [
  {
    question: "Preciso de uma chave de API para usar?",
    answer: "Sim. O LLM Sandbox se conecta à API oficial do Google Gemini. Você precisará de uma chave de API gratuita do Google AI Studio para que a funcionalidade de geração de código funcione.",
  },
  {
    question: "O código gerado é pronto para produção?",
    answer: "O código é um excelente ponto de partida e ótimo para prototipagem rápida. Como toda IA generativa, é recomendado que um desenvolvedor revise e refine o código antes de usá-lo em um ambiente de produção crítico.",
  },
  {
    question: "Quais tecnologias a IA utiliza?",
    answer: "O modelo foi instruído para gerar código usando React (com Hooks), CSS puro e HTML. Ele não usa bibliotecas de UI externas, garantindo que o código seja limpo e fundamental.",
  },
];

export default function FAQSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container max-w-4xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center tracking-tighter sm:text-4xl md:text-5xl mb-8">
          Perguntas Frequentes
        </h2>
        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <Accordion key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}