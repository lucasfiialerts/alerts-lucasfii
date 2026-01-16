'use client';

import Link from 'next/link';
import {
  BarChart3,
  Bell,
  DollarSign,
  FileText,
  MessageCircle,
  Plus,
  RefreshCw,
  TrendingUp
} from 'lucide-react';

interface Session {
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
}

interface StepByStepPageProps {
  session: Session;
}

export function StepByStepPage({ session }: StepByStepPageProps) {
  const steps = [
    {
      id: 1,
      icon: Plus,
      title: 'Adicione seus ativos',
      description: 'Inclua Ações, BDRs, FIIs, FIP-IE, FIAGROS, exterior e mais — tudo personalizado para a sua lista de acompanhamento'
    },
    {
      id: 2,
      icon: Bell,
      title: 'Configure seus alertas',
      description: 'Configure os tipos de alertas que deseja receber sobre sua lista de acompanhamento em configurações'
    },
    {
      id: 3,
      icon: MessageCircle,
      title: 'Receba tudo no WhatsApp',
      description: 'Todos os alertas chegam diretamente no WhatsApp — Cadastre seu número e comece a receber agora mesmo'
    },
    {
      id: 4,
      icon: BarChart3,
      title: 'Visualize sua lista',
      description: 'Comandos para o bot, atualização de preços, relatórios e resumo total das movimentações em tempo real'
    }
  ];

  const intelligentAlerts = [
    {
      id: 1,
      icon: FileText,
      title: 'Relatórios',
      description: 'Receba os relatórios em tempo real, sempre que divulgados dos seus ativos. Relatório gerencial, fato relevante, informações divulgadas pelos ativos e mais'
    },
    {
      id: 2,
      icon: DollarSign,
      title: 'Pagamentos de Proventos',
      description: 'Você é avisado em tempo real sempre que um ativo anunciar pagamento de proventos'
    },
    {
      id: 3,
      icon: TrendingUp,
      title: 'Tesouro Direto',
      description: 'Alertas sempre que houver atualização das taxas do tesouro, receba as taxas de todos os títulos'
    },
    {
      id: 4,
      icon: RefreshCw,
      title: 'Atualização Patrimonial',
      description: 'Quando a gestora publica atualização patrimonial do fundo, você recebe na hora, fique à frente mercado'
    }
  ];

  return (
    <main
      className="flex-1 p-3 sm:p-4 md:p-6 pb-24 md:pb-6 min-h-screen overflow-hidden"
      style={{
        backgroundImage: `url('/fundopage.jpg')`,
        backgroundColor: '#0d1117',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'bottom center',
        backgroundSize: 'cover',
      }}
    >
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">

          <h1 className="text-xl sm:text-2xl">Como funciona</h1>

          <br />

          {/* <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 break-words">
            Como funciona a Lucas FII Alerts?
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-400">
            Enviamos informações precisas, alertas inteligentes e tudo o que você precisa sobre seus ativos direto no seu WhatsApp — sem complicação
          </p> */}
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12 md:mb-16">
          {steps.map((step) => (
            <div key={step.id} className="bg-[#1a1a35] border-gray-700/50 shadow-xl rounded-xl p-4 sm:p-6 border hover:shadow-2xl transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-12 sm:w-14 h-12 sm:h-14 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
                <step.icon className="w-6 sm:w-7 h-6 sm:h-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white">{step.title}</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Intelligent Alerts Section */}
        <div className="mb-8 sm:mb-12 md:mb-16">
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 break-words">
              Disparos Inteligentes
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-gray-400">
              A Lucas FII Alerts envia automaticamente uma série de atualizações relevantes sobre seus ativos
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {intelligentAlerts.map((alert) => (
              <div key={alert.id} className="bg-[#1a1a35] border-gray-700/50 shadow-xl rounded-xl p-4 sm:p-6 border hover:shadow-2xl transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-12 sm:w-14 h-12 sm:h-14 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
                  <alert.icon className="w-6 sm:w-7 h-6 sm:h-7 text-white" />
                </div>
                <h4 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white">{alert.title}</h4>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{alert.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Link href="/planos" className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
            Ver planos
          </Link>
        </div>

        <br />
      </div>
    </main>
  );
}
