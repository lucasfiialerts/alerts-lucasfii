/**
 * Processador de Relatórios Investidor10
 * Versão adaptada para rodar no Vercel
 */

interface ProcessorOptions {
  limite?: number;
  enviar: boolean;
}

interface ProcessorResult {
  fiis_processados: number;
  mensagens_enviadas: number;
  usuarios_ativos: number;
}

interface Usuario {
  id: string;
  email: string;
  name: string;
  whatsappNumber: string;
  fiisAcompanhados: string[];
}

interface Comunicado {
  tipo: string;
  titulo: string;
  data: string;
  url: string;
}

/**
 * Busca usuários com alertas Investidor10 ativos
 */
async function buscarUsuariosAtivos(): Promise<Usuario[]> {
  try {
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log('🔍 Buscando usuários ativos em:', baseURL);
    
    const response = await fetch(`${baseURL}/api/debug/user-preferences`);
    if (!response.ok) {
      console.error('❌ Erro ao buscar preferências:', response.status);
      return [];
    }
    
    const result = await response.json();
    
    // Filtrar usuários com alertPreferencesFnet (Investidor10) ativo
    const usuariosFNet = result.users.filter((user: any) => user.alertPreferencesFnet === true);
    console.log(`✅ ${usuariosFNet.length} usuários com alertas Investidor10 ativos`);
    
    const usuariosCompletos: Usuario[] = [];
    
    for (const user of usuariosFNet) {
      try {
        const detailsResponse = await fetch(`${baseURL}/api/test-user-details`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        
        if (detailsResponse.ok) {
          const userDetails = await detailsResponse.json();
          
          if (userDetails.whatsappVerified && userDetails.whatsappNumber) {
            usuariosCompletos.push({
              id: userDetails.id,
              email: userDetails.email,
              name: userDetails.name || userDetails.email.split('@')[0],
              whatsappNumber: userDetails.whatsappNumber,
              fiisAcompanhados: userDetails.followedFIIs || []
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao buscar detalhes do usuário ${user.id}`);
      }
    }
    
    console.log(`✅ ${usuariosCompletos.length} usuários com WhatsApp verificado`);
    return usuariosCompletos;
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    return [];
  }
}

/**
 * Busca FIIs acompanhados pelos usuários
 */
function buscarFIIsAcompanhados(usuarios: Usuario[]): string[] {
  const fiisSet = new Set<string>();
  
  for (const usuario of usuarios) {
    for (const fii of usuario.fiisAcompanhados) {
      fiisSet.add(fii);
    }
  }
  
  const fiis = Array.from(fiisSet);
  console.log(`📊 ${fiis.length} FIIs únicos sendo acompanhados`);
  return fiis;
}

/**
 * Busca comunicados no Investidor10
 */
async function buscarComunicados(ticker: string): Promise<Comunicado[]> {
  console.log(`📄 Buscando comunicados de ${ticker}...`);
  
  try {
    const response = await fetch(`https://investidor10.com.br/fiis/${ticker.toLowerCase()}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const comunicados: Comunicado[] = [];
    
    // Nova estratégia: buscar por blocos mais amplos
    // Regex melhorado que captura o card inteiro incluindo quebras de linha
    const cardRegex = /<div class="communication-card">([\s\S]*?)<\/a>/gi;
    const matches = html.matchAll(cardRegex);
    
    for (const match of matches) {
      const cardHtml = match[1];
      
      // Extrair título (conteúdo do card)
      const tituloMatch = cardHtml.match(/communication-card--content[^>]*>\s*([^<\n]+)/i);
      const titulo = tituloMatch ? tituloMatch[1].trim() : '';
      
      // Extrair data (dentro de card-date--content)
      const dataMatch = cardHtml.match(/card-date--content[^>]*>\s*([^<\n]+)/i);
      const data = dataMatch ? dataMatch[1].trim() : '';
      
      // Extrair URL (href com link_comunicado)
      const urlMatch = cardHtml.match(/href="([^"]*link_comunicado[^"]*)"/i);
      const url = urlMatch ? urlMatch[1] : '';
      
      if (titulo && url && data) {
        let tipo = 'Comunicado';
        if (/relatório\s+gerencial/i.test(titulo)) tipo = 'Relatório Gerencial';
        else if (/informe\s+mensal/i.test(titulo)) tipo = 'Informe Mensal';
        else if (/fatos?\s+relevantes?/i.test(titulo)) tipo = 'Fato Relevante';
        
        comunicados.push({
          tipo,
          titulo,
          data,
          url: url.startsWith('http') ? url : `https://investidor10.com.br${url}`
        });
      }
    }
    
    console.log(`✅ ${comunicados.length} comunicados encontrados`);
    return comunicados;
  } catch (error: any) {
    console.error(`❌ Erro ao buscar comunicados:`, error.message);
    return [];
  }
}

/**
 * Tenta obter o link direto do PDF da B3/FNet
 */
async function obterLinkDiretoPDF(urlInvestidor10: string): Promise<string | null> {
  try {
    const htmlResponse = await fetch(urlInvestidor10, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      }
    });
    
    const html = await htmlResponse.text();
    
    // Procurar por link da FNet (B3) - esse é o link real do documento
    const fnetMatch = html.match(/https?:\/\/fnet\.bmfbovespa\.com\.br\/fnet\/publico\/exibirDocumento\?[^"'<>&\s]+/i);
    if (fnetMatch) {
      // Decodificar &amp; para &
      return fnetMatch[0].replace(/&amp;/g, '&');
    }
    
    // Procurar por outros links da B3/CVM
    const b3Match = html.match(/https?:\/\/[^"'<>&\s]*(?:bvmf|b3|cvm)[^"'<>&\s]*(?:\.pdf|exibirDocumento)/i);
    if (b3Match) {
      return b3Match[0].replace(/&amp;/g, '&');
    }
    
    return null;
  } catch (error) {
    console.log(`   ⚠️ Não foi possível obter link direto da FNet`);
    return null;
  }
}

/**
 * Envia mensagem via WhatsApp usando UltraMsg
 */
async function enviarWhatsApp(numero: string, mensagem: string): Promise<void> {
  console.log(`📱 Enviando para WhatsApp: ${numero}`);
  
  const token = process.env.ULTRAMSG_TOKEN;
  const instance = process.env.ULTRAMSG_INSTANCE;
  
  if (!token || !instance) {
    throw new Error('❌ ULTRAMSG_TOKEN ou ULTRAMSG_INSTANCE não configurados');
  }
  
  // Formatar número
  let numeroLimpo = numero.replace(/\D/g, '');
  if (!numeroLimpo.startsWith('55')) {
    numeroLimpo = '55' + numeroLimpo;
  }
  
  const response = await fetch(`https://api.ultramsg.com/${instance}/messages/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: token,
      to: numeroLimpo,
      body: mensagem
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao enviar WhatsApp: ${response.status} - ${error}`);
  }
  
  console.log(`✅ Mensagem enviada com sucesso!`);
}

/**
 * Verifica se documento é recente (últimos 30 dias)
 */
function isDocumentoRecente(dataStr: string): boolean {
  try {
    // Tentar parsear data no formato DD/MM/YYYY
    const partes = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!partes) return false;
    
    const [, dia, mes, ano] = partes;
    const dataDoc = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    const agora = new Date();
    const diffDias = Math.floor((agora.getTime() - dataDoc.getTime()) / (1000 * 60 * 60 * 24));
    
    return diffDias <= 30;
  } catch {
    return false;
  }
}

/**
 * Processa um FII completo
 */
async function processarFII(
  ticker: string,
  usuarios: Usuario[],
  enviar: boolean
): Promise<{ status: string; enviados?: number }> {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📊 Processando: ${ticker}`);
  console.log('═'.repeat(60));
  
  try {
    // 1. Buscar comunicados
    const comunicados = await buscarComunicados(ticker);
    
    console.log(`   📄 Total comunicados encontrados: ${comunicados.length}`);
    if (comunicados.length > 0) {
      comunicados.forEach(c => {
        console.log(`      - ${c.tipo}: ${c.data} - ${c.titulo.substring(0, 50)}...`);
      });
    }
    
    const relatorio = comunicados.find(c => c.tipo === 'Relatório Gerencial');
    
    if (!relatorio) {
      console.log(`   ⚠️ Nenhum Relatório Gerencial encontrado`);
      return { status: 'sem_relatorio' };
    }
    
    console.log(`   📄 Relatório: ${relatorio.data}`);
    
    // Verificar se é recente
    const isRecente = isDocumentoRecente(relatorio.data);
    console.log(`   📅 É recente (últimos 30 dias)? ${isRecente ? 'SIM ✅' : 'NÃO ❌'}`);
    
    if (!isRecente) {
      console.log(`   ⏳ Relatório antigo (${relatorio.data}), pulando...`);
      return { status: 'antigo' };
    }
    
    // 2. Tentar obter link direto do PDF
    console.log(`   🔍 Buscando link direto do PDF...`);
    const linkDireto = await obterLinkDiretoPDF(relatorio.url);
    const urlFinal = linkDireto || relatorio.url;
    
    if (linkDireto) {
      console.log(`   ✅ Link direto encontrado!`);
    } else {
      console.log(`   ℹ️  Usando link do Investidor10`);
    }
    
    // 3. Preparar mensagem
    const mensagemWhatsApp = 
      `*📊 Relatório Gerencial - ${ticker}*\n` +
      `📅 Data: ${relatorio.data}\n` +
      `📌 Título: ${relatorio.titulo}\n\n` +
      `🔗 Acesse o documento: ${urlFinal}`;
    
    // 4. Enviar se solicitado
    if (enviar && usuarios.length > 0) {
      console.log(`   📋 Verificando quais usuários acompanham ${ticker}...`);
      
      let enviados = 0;
      
      for (const usuario of usuarios) {
        // Verificar se acompanha este FII
        const acompanhaFII = usuario.fiisAcompanhados.some(
          fii => fii.toUpperCase() === ticker.toUpperCase()
        );
        
        console.log(`      👤 ${usuario.email}: ${acompanhaFII ? '✅ ACOMPANHA' : '❌ NÃO ACOMPANHA'} (FIIs: [${usuario.fiisAcompanhados.join(', ')}])`);
        
        if (acompanhaFII) {
          try {
            await enviarWhatsApp(usuario.whatsappNumber, mensagemWhatsApp);
            enviados++;
            console.log(`   ✅ Enviado para ${usuario.email}`);
            // Delay entre envios
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (error: any) {
            console.error(`   ❌ Erro ao enviar para ${usuario.email}: ${error.message}`);
          }
        }
      }
      
      console.log(`   📤 Total enviados: ${enviados}`);
      return { status: 'enviado', enviados };
    } else {
      console.log(`   ℹ️ Preview gerado (modo teste ou sem usuários)`);
      return { status: 'preview' };
    }
    
  } catch (error: any) {
    console.error(`   ❌ Erro: ${error.message}`);
    return { status: 'erro' };
  }
}

export async function processarRelatoriosInvestidor10(
  options: ProcessorOptions
): Promise<ProcessorResult> {
  console.log('🔄 Iniciando processamento Investidor10...');
  
  try {
    // 1. Buscar usuários ativos
    const usuarios = await buscarUsuariosAtivos();
    
    if (usuarios.length === 0) {
      console.log('⚠️ Nenhum usuário ativo. Nada para processar.');
      return {
        fiis_processados: 0,
        mensagens_enviadas: 0,
        usuarios_ativos: 0
      };
    }
    
    console.log(`✅ ${usuarios.length} usuários ativos encontrados:`);
    usuarios.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} - ${u.fiisAcompanhados.length} FIIs: [${u.fiisAcompanhados.join(', ')}]`);
    });
    
    // 2. Buscar FIIs acompanhados
    const fiis = buscarFIIsAcompanhados(usuarios);
    
    if (fiis.length === 0) {
      console.log('❌ Nenhum FII sendo acompanhado pelos usuários.');
      return {
        fiis_processados: 0,
        mensagens_enviadas: 0,
        usuarios_ativos: usuarios.length
      };
    }
    
    // 3. Determinar quais FIIs processar
    const fiisProcessar = options.limite ? fiis.slice(0, options.limite) : fiis;
    
    console.log(`📊 FIIs a processar: ${fiisProcessar.length}`);
    console.log(`🔄 Modo: ${options.enviar ? '📤 ENVIAR ALERTAS' : '👁️ PREVIEW (sem enviar)'}`);
    
    // 4. Processar cada FII
    let totalEnviados = 0;
    
    for (let i = 0; i < fiisProcessar.length; i++) {
      const ticker = fiisProcessar[i];
      console.log(`\n[${i + 1}/${fiisProcessar.length}]`);
      
      const resultado = await processarFII(ticker, usuarios, options.enviar);
      
      if (resultado.enviados) {
        totalEnviados += resultado.enviados;
      }
      
      // Delay entre FIIs
      if (i < fiisProcessar.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('\n✅ Processamento concluído!');
    
    return {
      fiis_processados: fiisProcessar.length,
      mensagens_enviadas: totalEnviados,
      usuarios_ativos: usuarios.length
    };
  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    throw error;
  }
}
