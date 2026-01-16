"use client";

import Image from "next/image";
import Footer from "@/components/common/footer";
import { Header } from "@/components/common/header";
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";

import { ContactForm } from "./components/contact-form";

const ContatoPage = () => {
  return (
    <>
      <style jsx global>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      <Header />

      <div className="w-full overflow-x-hidden min-h-screen pt-16 relative">
        {/* Background Image */}
        <div className="fixed inset-0 z-0">
          <Image
            src="/fundogra.png"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
          {/* Dark overlay para melhor legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
        </div>

        {/* Hero Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-500/30 text-blue-300 px-6 py-3 rounded-full text-sm font-semibold mb-6">
                <MailIcon className="w-4 h-4" />
                <span>FALE CONOSCO</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black text-white mb-8">
                Entre em
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent block mt-2">
                  contato conosco
                </span>
              </h1>
              
              <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Tem alguma dúvida sobre o Lucas FII Alerts ou precisa de suporte? 
                Nossa equipe está pronta para ajudar.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="relative py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Contact Form */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 hover:border-blue-500/50 transition-all duration-500">
                <h2 className="text-3xl font-bold text-white mb-2 text-center">Envie sua mensagem</h2>
                <p className="text-gray-400 mb-8 text-center">Preencha o formulário abaixo e retornaremos em breve</p>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black,transparent)] pointer-events-none"></div>
        
        <br />
        <br />
        <br />

        <Footer />
      </div>
    </>
  );
};

export default ContatoPage;
