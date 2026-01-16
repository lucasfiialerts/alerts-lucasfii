import Footer from "@/components/common/footer";
import { Header } from "@/components/common/header";

const PoliticaPrivacidadePage = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#01030d' }}>
      <Header />
      
      <br />
      <br />
      <br />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Política de Privacidade
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Editada por: DevRocha e Atualizada em 06 de outubro 2025
          </p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800">
          <div className="prose prose-lg prose-invert max-w-none">
            
            {/* Seção 1 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">1</span>
                Sobre as Políticas de Privacidade
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  Para proteger todos os seus dados, a DevRocha conta com o que há de melhor em sistemas de segurança com o certificado de segurança SSL. Esse certificado garante que todos os seus dados pessoais, como endereço de entrega, dados de cartão de crédito e histórico de pedidos, jamais sejam divulgados.
                </p>
                <p>
                  Utilizamos essa tecnologia para impedir que o trânsito de informações seja acessado por terceiros.
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="flex items-center justify-center my-12">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              <div className="mx-4 text-gray-500 text-2xl">⸻</div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            </div>

            {/* Seção 2 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">2</span>
                Compartilhamento de Informações
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  A DevRocha tem o compromisso de não vender, alugar ou transferir seus dados para terceiros ou para banco de dados. Entretanto, essas informações podem ser agrupadas e utilizadas internamente como estatísticas genéricas. Fazemos isso para, através dessas informações, obter um melhor entendimento do perfil dos nossos usuários para aperfeiçoamento dos produtos e serviços oferecidos pela empresa.
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="flex items-center justify-center my-12">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              <div className="mx-4 text-gray-500 text-2xl">⸻</div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            </div>

            {/* Seção 3 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">3</span>
                E-mails
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  Nós não enviamos e-mails com ofertas e promoções sem o seu consentimento, e caso você não queira mais receber esse tipo de informação, o serviço de e-mail marketing poderá ser desativado a qualquer momento.
                </p>
                <p>
                  A DevRocha é contra o envio de e-mails sem autorização prévia (conhecidos como SPAM). Desde o momento do cadastro, a opção de receber ou não é feita por você, e assim, tudo relacionado a esse tipo de comunicação será decidido pelo cliente.
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="flex items-center justify-center my-12">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              <div className="mx-4 text-gray-500 text-2xl">⸻</div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            </div>

            {/* Seção 4 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">4</span>
                Propriedade das Informações
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  A DevRocha é proprietária de todas as informações contidas nesse site, portanto não poderão ser copiadas, alteradas, extraídas ou utilizadas de qualquer forma sem expressa e escrita autorização prévia. Desta forma, ao acessar este site, www.devrocha.com.br, deixamos nosso usuário ciente de que qualquer utilização indevida das informações aqui presentes poderá acarretar em sanções civis e criminais.
                </p>
              </div>
            </div>

            {/* Informações de Contato */}
            {/* <div className="mt-16 p-6 bg-blue-900/20 rounded-xl border border-blue-800/30">
              <h3 className="text-xl font-bold text-white mb-4">Dúvidas sobre nossa Política de Privacidade?</h3>
              <p className="text-gray-300 mb-4">
                Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="mailto:contato@devrocha.com.br"
                  className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  Enviar E-mail
                </a>
                <a 
                  href="/contato"
                  className="bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors text-center border border-gray-600"
                >
                  Página de Contato
                </a>
              </div>
            </div> */}

            {/* Data de Atualização */}
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm">
                Última atualização: 06/10/2025
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PoliticaPrivacidadePage;
