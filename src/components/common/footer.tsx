import { ChartBar, InstagramIcon, LinkedinIcon, MailIcon, MapPinIcon, MessageCircleIcon, Phone, PhoneIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="relative bg-[#0d1621] text-white overflow-hidden">
      <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.03\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-30'></div>
      {/* Elemento decorativo de fundo */}
      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Coluna 1 - Logo e Descrição */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Link href="/" className="flex items-center">
                <h1 className="text-white text-2xl font-bold font-boogaloo tracking-wide">Lucas FII <span className="font-space-grotesk text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-bold tracking-wider">Alerts  🚀</span></h1>
              </Link>

              {/* <Image 
            src="/navbar_logo.png" 
            alt="navbar logo" 
            width={150} 
            height={150} 
            style={{ height: 60, width: 250, objectFit: 'cover' }} 
            className="rounded-full"
            priority 
          /> */}
            </div>

            {/* <Link href="/" className="flex items-center">
              <h1 className="text-white text-2xl font-bold">Lucas FII <span className="font-space-grotesk text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-bold tracking-wider">Alerts  🚀</span></h1>
            </Link> */}
            <br />
            <p className="text-gray-300 text-lg leading-relaxed mb-6 max-w-md">
              Plataforma de alertas inteligentes para investidores, fornecendo notificações em tempo real sobre oportunidades e riscos nos seus ativos.
            </p>

            {/* <div className="flex gap-4">
          <Link href="https://www.instagram.com/devrocha.oficial" className="p-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full hover:scale-110 transition-transform duration-200">
            <InstagramIcon className="h-5 w-5 text-white" />
          </Link>
          <Link href="https://www.linkedin.com/company/DevRocha" className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full hover:scale-110 transition-transform duration-200">
            <LinkedinIcon className="h-5 w-5 text-white" />
          </Link>
          <Link href="/contact" className="p-3 bg-gradient-to-r from-green-500 to-teal-600 rounded-full hover:scale-110 transition-transform duration-200">
            <MessageCircleIcon className="h-5 w-5 text-white" />
          </Link>
        </div> */}
          </div>



          {/* Coluna 3 - Contato */}
          <div>
            <h3 className="font-bold text-xl mb-6 text-white">Contato</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                  <MailIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">lucasfiialerts@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/contato" className="flex items-center gap-3 group">
                  <span className="p-2 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <span className="text-gray-300 text-sm font-medium group-hover:text-white transition">FALE CONOSCO</span>
                </Link>
              </div>

              {/* <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
              <PhoneIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-gray-300 text-sm">Telefone</p>
              <p className="text-white font-medium">()</p>
            </div>
          </div> */}

              {/* <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
              <MapPinIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-gray-300 text-sm">Localização</p>
              <p className="text-white font-medium"></p>
            </div>
          </div> */}
            </div>
          </div>



          {/* Coluna 2 - Links Institucionais */}
          <div>
            <h3 className="font-bold text-xl mb-6 text-white">Grupo Lucas FII</h3>

            <ul className="space-y-3">
              <li>
                <Link href="https://www.lucasfiiresearch.com.br" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group" target="blank">
                  <div className="w-1 h-1 rounded-full group-hover:scale-150 transition-transform duration-200"></div>
                  Lucas FII Research
                </Link>
              </li>
            </ul>

            {/* <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                  <div className="w-1 h-1 rounded-full group-hover:scale-150 transition-transform duration-200"></div>
                  Lucas FII Wealth
                </Link>
              </li>
            </ul> */}


            {/* <ul className="space-y-3">
          <li>
            <Link href="/" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
              <div className="w-1 h-1 bg-blue-500 rounded-full group-hover:scale-150 transition-transform duration-200"></div>
              Home
            </Link>
          </li>
          <li>
            <Link href="/servicos" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
              <div className="w-1 h-1 bg-purple-500 rounded-full group-hover:scale-150 transition-transform duration-200"></div>
              Serviços
            </Link>
          </li>
          <li>
            <Link href="/contato" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
              <div className="w-1 h-1 bg-green-500 rounded-full group-hover:scale-150 transition-transform duration-200"></div>
              Contato
            </Link>
          </li>
          <li>
            <Link href="/sobre" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
              <div className="w-1 h-1 bg-orange-500 rounded-full group-hover:scale-150 transition-transform duration-200"></div>
              Quem Somos
            </Link>
          </li>
          <li>
            <Link href="/politica-de-privacidade" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
              <div className="w-1 h-1 bg-red-500 rounded-full group-hover:scale-150 transition-transform duration-200"></div>
              Política de Privacidade
            </Link>
          </li>
          <li>
            <Link href="/termos-de-uso" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
              <div className="w-1 h-1 bg-red-500 rounded-full group-hover:scale-150 transition-transform duration-200"></div>
              Termos de Uso
            </Link>
          </li>
        </ul> */}
          </div>
        </div>


        {/* === Linha divisória === */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © 2025-2026  Lucas FII  <span className="font-space-grotesk text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-bold tracking-wider"> Alerts 🚀</span> – Plataforma de alertas inteligentes para investidores de fundos imobiliários.
            </p>
            {/* <p className="text-gray-400 text-sm">
          CNPJ: 00.000.000/0001-00
        </p> */}

            <div className="flex items-center gap-2">
              <Link href="https://devrocha.com.br" className="text-gray-500 text-xs hover:text-white transition-colors duration-200 flex items-center gap-1" target="blank">
                Desenvolvido por <span className="font-bold hover:underline">DevRocha</span>
              </Link>
            </div>

            <p className="text-gray-500 text-xs">
              Site: v1.0.0-beta
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
