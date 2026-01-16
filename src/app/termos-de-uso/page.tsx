import Footer from "@/components/common/footer";
import { Header } from "@/components/common/header";

const TermosUsoPage = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#01030d' }}>
      <Header />
      
      <br />
      <br />
      <br />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Termos e Condições de Uso
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
                Termos e Condições
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  São os termos e condições que deverão ser observados pelo USUÁRIO na utilização do SITE e, principalmente de suas funcionalidades e ferramentas. Ao visitar nosso SITE o USUÁRIO declara ter lido e aceitado estes Termos de Uso e das Políticas. O aceite dos Termos e Condições de Uso e das Políticas irá implicar no reconhecimento de que o USUÁRIO é capaz e responsável por seus atos. Caso o USUÁRIO tenha qualquer dúvida sobre os Termos de Uso e das Políticas, recomendamos que esse entre em contato com a DevRocha antes de aceitar, estar sujeito e se vincular aos mesmos.
                </p>
                <p>
                  O USUÁRIO entende que este Termos de Uso e das Políticas tem a natureza jurídica de um contrato e concorda que o Aceite implicará na vinculação da DevRocha e do USUÁRIO aos seus termos e condições. Dessa forma, recomendamos que o USUÁRIO imprima uma cópia destes documentos para futura referência. A DevRocha enviará avisos de atualizações dos Termos de Uso e das Políticas por e-mail, mas será dever do USUÁRIO manter-se atento a possíveis atualizações, que podem ocorrer a qualquer tempo.
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
                Regras de utilização do site
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  O USUÁRIO está obrigado a utilizar o SITE respeitando e observando estes Termos de Uso, bem como a legislação vigente, os costumes e a ordem pública. Desta forma, você concorda que não poderá:
                </p>
                <div className="pl-6 space-y-2">
                  <p>(i) lesar direitos de terceiros, independentemente de sua natureza, em qualquer momento, inclusive no decorrer do uso do SITE;</p>
                  <p>(ii) executar atos que limitem ou impeçam o acesso e a utilização do SITE, em condições adequadas, aos demais USUÁRIOS;</p>
                  <p>(iii) acessar ilicitamente o SITE ou sistemas informáticos de terceiros relacionados ao SITE ou à DevRocha sob qualquer meio ou forma;</p>
                  <p>(iv) difundir programas ou vírus informáticos suscetíveis de causar danos de qualquer natureza, inclusive em equipamentos e sistemas da DevRocha ou de terceiros;</p>
                  <p>(v) utilizar mecanismos que não os expressamente habilitados ou recomendados no SITE para obtenção de informações, conteúdos e serviços;</p>
                  <p>(vi) realizar quaisquer atos que de alguma forma possam implicar qualquer prejuízo ou dano à DevRocha ou a outros USUÁRIOS;</p>
                  <p>(vii) acessar áreas de programação do SITE, bases de dados ou qualquer outro conjunto de informações que escape às áreas públicas ou restritas do SITE;</p>
                  <p>(viii) realizar ou permitir engenharia reversa, traduzir, modificar, alterar a linguagem, compilar, modificar, reproduzir, alugar, sublocar, divulgar, transmitir, distribuir, usar ou, de outra maneira, dispor do SITE ou das ferramentas e funcionalidades nele disponibilizadas sob qualquer meio ou forma, inclusive de modo a violar direitos da DevRocha (inclusive de Propriedade Intelectual da DevRocha) e/ou de terceiros;</p>
                  <p>(ix) praticar ou participar de qualquer ato que constitua uma violação de qualquer direito da DevRocha ou de terceiros ou ainda de qualquer lei aplicável;</p>
                  <p>(x) interferir na segurança ou cometer usos indevidos contra o SITE ou qualquer recurso do sistema;</p>
                  <p>(xi) utilizar o domínio da DevRocha para criar links ou atalhos a serem disponibilizados em e-mails não solicitados ou em websites de terceiros;</p>
                  <p>(xii) utilizar as ferramentas e funcionalidades do SITE para difundir mensagens não relacionadas com o SITE ou com as finalidades do SITE.</p>
                </div>
                <p>
                  Você concorda em indenizar, defender e isentar a DevRocha de qualquer reclamação, notificação, intimação ou ação judicial ou extrajudicial, ou ainda de qualquer responsabilidade, dano, custo ou despesa decorrente de qualquer violação e/ou infração cometida pelos USUÁRIOS.
                </p>
                <p>
                  A DevRocha poderá, a seu exclusivo critério, bloquear, restringir, desabilitar ou impedir o acesso de qualquer USUÁRIO ao SITE, total ou parcialmente, sem qualquer aviso prévio.
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
                Cadastramento de USUÁRIO
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  É de conhecimento do USUÁRIO que os dados cadastrados no SITE serão armazenados e utilizados pela DevRocha, ressaltando-se que o cadastramento e assinatura pressupõem o consentimento expresso do USUÁRIO sobre coleta, uso, armazenamento e tratamento de dados pessoais e profissionais pela DevRocha e/ou por terceiros contratados por ela.
                </p>
                <p>
                  A DevRocha poderá recusar, suspender ou cancelar a assinatura ou cadastro do USUÁRIO sempre que suspeitar que as informações fornecidas são falsas, incompletas, desatualizadas ou imprecisas.
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
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">4</span>
                Dados pessoais, privacidade e segurança
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  A Política de Privacidade e Segurança criada e utilizada pela DevRocha regula a coleta, guarda e utilização de dados pessoais, bem como a sua segurança. Essa Política específica integra inseparavelmente estes Termos e Condições de Uso.
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="flex items-center justify-center my-12">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              <div className="mx-4 text-gray-500 text-2xl">⸻</div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            </div>

            {/* Seção 5 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">5</span>
                Garantias
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  Apesar dos melhores esforços da DevRocha em fornecer informações precisas e atualizadas, o SITE poderá conter erros técnicos, inconsistências ou erros tipográficos. O SITE, seu conteúdo e suas funcionalidades são disponibilizados pela DevRocha tal como se encontram, sem qualquer garantia expressa ou implícita.
                </p>
                <p>
                  A DevRocha se reserva o direito de modificar o SITE, seu design, conteúdo, funcionalidades ou até mesmo cancelá-lo a qualquer momento.
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="flex items-center justify-center my-12">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              <div className="mx-4 text-gray-500 text-2xl">⸻</div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            </div>

            {/* Seção 6 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">6</span>
                Responsabilidades
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  A DevRocha emprega seus melhores esforços para informar, atender e proteger o USUÁRIO, mas não se responsabiliza por danos indiretos, lucros cessantes ou outros prejuízos monetários decorrentes do uso do SITE.
                </p>
                <p>
                  Fica excluída a responsabilidade da DevRocha sobre falhas de sistema, vírus, mau funcionamento de rede ou uso indevido do SITE.
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="flex items-center justify-center my-12">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              <div className="mx-4 text-gray-500 text-2xl">⸻</div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            </div>

            {/* Seção 7 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">7</span>
                Links para outros websites
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  O SITE pode conter links para sites de terceiros. A DevRocha não se responsabiliza por tais sites, seus conteúdos ou práticas. Recomenda-se que o USUÁRIO consulte os Termos e Condições de Uso de cada site acessado.
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="flex items-center justify-center my-12">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              <div className="mx-4 text-gray-500 text-2xl">⸻</div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            </div>

            {/* Seção 8 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">8</span>
                Aplicações de Internet ou vírus de computador
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  A DevRocha não será responsável por vírus, malware ou outros programas danosos que possam afetar o dispositivo do USUÁRIO devido ao acesso ou download de materiais do SITE.
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="flex items-center justify-center my-12">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              <div className="mx-4 text-gray-500 text-2xl">⸻</div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            </div>

            {/* Seção 9 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">9</span>
                Direitos de Propriedade Intelectual
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  Todo o conteúdo do SITE — incluindo o domínio [devrocha.com.br], programas, bases de dados, arquivos, textos, fotos, layouts e demais elementos — é de propriedade da DevRocha ou licenciado a ela, estando protegido por leis de propriedade intelectual.
                </p>
                <p>
                  É proibido copiar, reproduzir ou modificar qualquer conteúdo sem autorização prévia e por escrito da DevRocha.
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="flex items-center justify-center my-12">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              <div className="mx-4 text-gray-500 text-2xl">⸻</div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            </div>

            {/* Seção 10 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">10</span>
                Comunicações
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  A DevRocha disponibiliza o endereço de e-mail contato@devrocha.com.br como canal de atendimento para todas as comunicações que o USUÁRIO desejar fazer.
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="flex items-center justify-center my-12">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              <div className="mx-4 text-gray-500 text-2xl">⸻</div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            </div>

            {/* Seção 11 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">11</span>
                Duração
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  Estes Termos e Condições de Uso têm duração indefinida e permanecerão em vigor enquanto o SITE estiver ativo.
                </p>
                <p>
                  A DevRocha reserva-se o direito de suspender ou cancelar o acesso ao SITE, total ou parcialmente, a qualquer momento e sem aviso prévio.
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="flex items-center justify-center my-12">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              <div className="mx-4 text-gray-500 text-2xl">⸻</div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            </div>

            {/* Seção 12 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">12</span>
                Atualizações destes Termos e Condições
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  A DevRocha poderá revisar e atualizar estes Termos a qualquer momento. A versão atualizada valerá para o uso do SITE e para as compras realizadas a partir de sua divulgação.
                </p>
                <p>
                  Caso o USUÁRIO não concorde com as alterações, poderá solicitar a exclusão de seu cadastro via e-mail.
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="flex items-center justify-center my-12">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              <div className="mx-4 text-gray-500 text-2xl">⸻</div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            </div>

            {/* Seção 13 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">13</span>
                Confidencialidade
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  A DevRocha e o USUÁRIO comprometem-se a manter confidenciais todas as informações recebidas em decorrência da execução destes Termos, mesmo após o término da relação entre as partes.
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="flex items-center justify-center my-12">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              <div className="mx-4 text-gray-500 text-2xl">⸻</div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            </div>

            {/* Seção 14 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-lime-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">14</span>
                Idioma
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  Toda a documentação legal do SITE, incluindo os presentes Termos e Condições de Uso, foi elaborada em língua portuguesa.
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="flex items-center justify-center my-12">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              <div className="mx-4 text-gray-500 text-2xl">⸻</div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            </div>

            {/* Seção 15 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">15</span>
                Diversos
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  Caso a DevRocha não consiga fazer valer qualquer cláusula destes Termos, isso não implicará renúncia a seus direitos.
                </p>
                <p>
                  Se qualquer disposição for considerada inválida, as demais permanecerão em vigor.
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="flex items-center justify-center my-12">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              <div className="mx-4 text-gray-500 text-2xl">⸻</div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            </div>

            {/* Seção 16 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">16</span>
                Lei aplicável e Foro de Eleição
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  O SITE é controlado e administrado pela DevRocha, Estado do Rio de Janeiro, Brasil.
                </p>
                <p>
                  Ao acessar o SITE, o USUÁRIO concorda que a legislação aplicável será a da República Federativa do Brasil, RJ como competente para dirimir quaisquer controvérsias.
                </p>
              </div>
            </div>

            {/* Informações de Contato */}
            {/* <div className="mt-16 p-6 bg-blue-900/20 rounded-xl border border-blue-800/30">
              <h3 className="text-xl font-bold text-white mb-4">Dúvidas sobre nossos Termos de Uso?</h3>
              <p className="text-gray-300 mb-4">
                Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco.
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

export default TermosUsoPage;
